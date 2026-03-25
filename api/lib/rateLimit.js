// api/lib/rateLimit.js
import * as Sentry from "@sentry/node";

/**
 * Atomically check and increment the rate limit counter for a key.
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from process.env.
 *
 * @param {string} key           - Unique key, e.g. "claude:user-uuid" or "subscribe:1.2.3.4"
 * @param {number} limit         - Max requests allowed in the window
 * @param {number} windowSeconds - Window length in seconds (e.g. 3600 for 1 hour)
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
export async function checkRateLimit(key, limit, windowSeconds) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/check_and_increment_rate_limit`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      }),
    });

    if (!res.ok) {
      // Fail open — don't block users if Supabase is down
      Sentry.captureException(new Error(`Rate limit RPC failed: ${res.status}`));
      return { allowed: true, remaining: limit, retryAfter: 0 };
    }

    // RPC returns an array with one row: [{ count, window_start }]
    const rows = await res.json();
    const row  = Array.isArray(rows) ? rows[0] : rows;
    const count = row.count;
    const windowStart = new Date(row.window_start).getTime();
    const windowEnds  = windowStart + windowSeconds * 1000;
    const retryAfter  = Math.max(0, Math.ceil((windowEnds - Date.now()) / 1000));

    if (count > limit) {
      return { allowed: false, remaining: 0, retryAfter };
    }

    // remaining = requests left after this one is counted (e.g. count=1, limit=20 → 19 remaining)
    return { allowed: true, remaining: limit - count, retryAfter: 0 };
  } catch (err) {
    // Fail open on any unexpected error
    Sentry.captureException(err);
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}
