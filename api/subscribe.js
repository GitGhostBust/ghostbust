import * as Sentry from "@sentry/node";
import { checkRateLimit } from "./lib/rateLimit.js";

Sentry.init({ dsn: process.env.SENTRY_DSN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Rate limit by IP ---
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ip = forwarded.split(',')[0].trim() || 'unknown';

  const { allowed, retryAfter } = await checkRateLimit(`subscribe:${ip}`, 3, 3600);
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // --- Validate email ---
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // --- Add to Resend audience ---
  try {
    const response = await fetch('https://api.resend.com/audiences/' + process.env.RESEND_AUDIENCE_ID + '/contacts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, unsubscribed: false })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.message || 'Failed to subscribe' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return res.status(500).json({ error: 'Server error' });
  }
}
