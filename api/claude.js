import * as Sentry from "@sentry/node";
import { checkRateLimit } from "./lib/rateLimit.js";

Sentry.init({ dsn: process.env.SENTRY_DSN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Auth ---
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  let userId;
  try {
    const authRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!authRes.ok) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    const user = await authRes.json();
    userId = user.id;
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return res.status(500).json({ error: "Service temporarily unavailable." });
  }

  // --- Rate limit ---
  const { allowed, retryAfter } = await checkRateLimit(`claude:${userId}`, 20, 3600);
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: "Rate limit exceeded. Try again in an hour." });
  }

  // --- Proxy to Anthropic ---
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Service temporarily unavailable." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "API error" });
    }

    return res.status(200).json(data);
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return res.status(500).json({ error: "Service temporarily unavailable." });
  }
}
