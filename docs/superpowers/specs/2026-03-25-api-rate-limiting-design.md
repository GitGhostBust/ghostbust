# API Rate Limiting — Design Spec

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

Add rate limiting to GhostBust's two public-facing Vercel serverless API endpoints to prevent cost abuse (`api/claude.js`) and spam (`api/subscribe.js`). Uses Supabase as the backing store — no new infrastructure required.

---

## Limits

| Endpoint | Key | Limit | Window |
|---|---|---|---|
| `api/claude.js` | `claude:{user_id}` | 20 requests | 1 hour |
| `api/subscribe.js` | `subscribe:{ip}` | 3 requests | 1 hour |

---

## Architecture

Three pieces:

1. **Migration** — `supabase/migrations/20260325_rate_limits.sql`
   Creates the `rate_limits` table used as the shared counter store.

2. **Utility** — `api/lib/rateLimit.js`
   Shared helper imported by both handlers. Encapsulates all rate limit logic. Uses raw `fetch` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars — matching the existing API layer pattern (no `@supabase/supabase-js` client; the cron handlers use the same raw fetch pattern).

3. **Handler updates** — `api/claude.js` and `api/subscribe.js`
   Each calls `checkRateLimit()` early in the handler and returns 429 if blocked.

---

## Database Schema

```sql
CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No public RLS policy — service role key bypasses RLS by default.
-- Anon key has no access to this table.
```

- `key` — composite string identifying the subject and endpoint (e.g. `claude:abc123`, `subscribe:1.2.3.4`)
- `window_start` — timestamp when the current window began
- `count` — number of requests in the current window

No cleanup cron needed. Rows are overwritten in-place when their window expires on the next request.

---

## Utility: `api/lib/rateLimit.js`

Signature:
```js
checkRateLimit(key, limit, windowSeconds)
// returns: { allowed: boolean, remaining: number, retryAfter: number }
```

Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `process.env` directly (same pattern as `api/cron/onboarding.js`). No client argument — the function constructs its own fetch headers internally.

### Atomic upsert logic

To avoid race conditions (two concurrent requests reading the same count before either write completes), the increment must be atomic. Use a single Postgres upsert via the REST API:

```sql
INSERT INTO rate_limits (key, window_start, count)
VALUES (:key, now(), 1)
ON CONFLICT (key) DO UPDATE
  SET count        = CASE
                       WHEN rate_limits.window_start < now() - (:windowSeconds || ' seconds')::interval
                       THEN 1
                       ELSE rate_limits.count + 1
                     END,
      window_start = CASE
                       WHEN rate_limits.window_start < now() - (:windowSeconds || ' seconds')::interval
                       THEN now()
                       ELSE rate_limits.window_start
                     END
RETURNING count, window_start;
```

Since the Supabase REST API doesn't support raw SQL upserts with `RETURNING` directly, implement this as a Postgres RPC function (`check_and_increment_rate_limit`) called via `POST /rest/v1/rpc/check_and_increment_rate_limit`. The function returns `{ count, window_start }`. Add this function to the migration.

After the upsert returns:
- If `count > limit` → `allowed: false, remaining: 0, retryAfter: seconds until window_start + windowSeconds`
- Otherwise → `allowed: true, remaining: limit - count` (remaining reflects requests left *after* this one is counted; at count=1 on a limit of 20 that's 19 remaining)

---

## Migration: `supabase/migrations/20260325_rate_limits.sql`

Must include:
1. `CREATE TABLE rate_limits` with schema above
2. `ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY`
3. The `check_and_increment_rate_limit(p_key TEXT, p_limit INT, p_window_seconds INT)` PL/pgSQL function that performs the atomic upsert and returns `{ count INT, window_start TIMESTAMPTZ }`
4. `GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit TO service_role`

---

## Handler Changes

### `api/claude.js`

1. Read `Authorization: Bearer <token>` header
2. Call Supabase Auth REST API to verify the token and get `user_id` — return 401 if missing or invalid
3. Call `checkRateLimit('claude:' + userId, 20, 3600)`
4. If not allowed → return 429 with `Retry-After: <retryAfter>` header and `{ error: "Rate limit exceeded" }`
5. Otherwise proceed to Anthropic proxy as today

### `api/subscribe.js`

1. Read IP from `req.headers['x-forwarded-for']` (first entry, split on `,`) or fall back to `'unknown'`
2. Call `checkRateLimit('subscribe:' + ip, 3, 3600)`
3. If not allowed → return 429 with `Retry-After: <retryAfter>` header and `{ error: "Too many requests" }`
4. Otherwise proceed as today

---

## Frontend Changes

### `App.jsx` and `ResumeAdvisor.jsx` — `apiCall` refactor

Both files have a module-level `apiCall(messages)` function with no access to the `session` state (which lives inside the component). The implementer must update each `apiCall` to accept the token as a second parameter:

```js
function apiCall(messages, accessToken) {
  return fetch("/api/claude", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer " + accessToken,
    },
    body: JSON.stringify({ ... }),
  })
  ...
}
```

Then update all call sites to pass `session.access_token`. In `App.jsx` there are two call sites; in `ResumeAdvisor.jsx` there is one call site within the component where `session` is available.

### 429 error handling

- **`App.jsx` / `ResumeAdvisor.jsx`:** On HTTP 429 from `/api/claude`, surface: *"You've reached your limit of 20 analyses per hour. Please try again later."*
- **`index.html` subscribe form:** The form's inline JS currently shows a generic error on failure. On 429, update the error message to: *"Too many attempts. Please try again later."*

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| No auth token on `claude.js` | 401 — rejects unauthenticated callers |
| Invalid / expired token | 401 — Supabase auth verification returns error |
| Rate limit DB call fails | Fail open — allow request, log to Sentry |
| IP missing on `subscribe.js` | Use `'unknown'` as key fallback |
| Stale rows | Overwritten atomically on next request — no cleanup needed |

Fail-open on DB error ensures a Supabase hiccup doesn't lock out all users.

---

## Environment Variables

No new env vars required. `api/lib/rateLimit.js` uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, both already set in Vercel for the cron handlers.

---

## Migration Required

`supabase/migrations/20260325_rate_limits.sql` must be run in Supabase SQL editor before deploying.
