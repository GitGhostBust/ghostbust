# API Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-user rate limiting (20/hr) to `api/claude.js` and per-IP rate limiting (3/hr) to `api/subscribe.js` using Supabase as the backing store.

**Architecture:** A shared `api/lib/rateLimit.js` utility uses raw fetch (matching the existing cron handler pattern) to call a Postgres RPC function that atomically increments a counter in a `rate_limits` table. `api/claude.js` verifies the Supabase JWT from the `Authorization` header before rate limiting; `api/subscribe.js` limits by IP. Both frontend `apiCall` functions are updated to send the auth token.

**Tech Stack:** Vercel serverless (Node), Supabase REST API (raw fetch, no JS client), PL/pgSQL RPC, React 18.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260325_rate_limits.sql` | Create | Table schema, RLS, atomic RPC function |
| `api/lib/rateLimit.js` | Create | Shared rate limit check utility |
| `api/claude.js` | Modify | Add JWT auth + rate limit check |
| `api/subscribe.js` | Modify | Add IP rate limit check |
| `src/App.jsx` | Modify | Thread session into VerifyTab, pass access token to apiCall, handle 429 |
| `src/ResumeAdvisor.jsx` | Modify | Pass access token to apiCall (5 call sites), handle 429 |
| `index.html` | Modify | Handle 429 in subscribe form |

---

## Task 1: Supabase Migration

**Files:**
- Create: `supabase/migrations/20260325_rate_limits.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260325_rate_limits.sql

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No public RLS policy — service role bypasses RLS by default.
-- Anon key has zero access to this table.

-- Atomic check-and-increment function.
-- Inserts a new row (count=1) or increments the existing row.
-- Resets count to 1 if the current window has expired.
-- Returns the new count and window_start so the caller can decide allowed/blocked.
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_key            TEXT,
  p_limit          INT,
  p_window_seconds INT
)
RETURNS TABLE (count INT, window_start TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO rate_limits AS rl (key, window_start, count)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE
    SET count        = CASE
                         WHEN rl.window_start < now() - (p_window_seconds || ' seconds')::interval
                         THEN 1
                         ELSE rl.count + 1
                       END,
        window_start = CASE
                         WHEN rl.window_start < now() - (p_window_seconds || ' seconds')::interval
                         THEN now()
                         ELSE rl.window_start
                       END;

  RETURN QUERY
    SELECT rl2.count, rl2.window_start
    FROM rate_limits rl2
    WHERE rl2.key = p_key;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit(TEXT, INT, INT) TO service_role;
```

- [ ] **Step 2: Run migration in Supabase SQL editor**

Open Supabase dashboard → SQL Editor → paste the file contents → Run.
Verify: the `rate_limits` table appears in Table Editor, and the function appears under Database → Functions.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260325_rate_limits.sql
git commit -m "feat: add rate_limits table and check_and_increment RPC function"
```

---

## Task 2: Create `api/lib/rateLimit.js`

**Files:**
- Create: `api/lib/rateLimit.js`

This utility uses raw `fetch` + env vars — the same pattern as `api/cron/onboarding.js`. No `@supabase/supabase-js` client. It imports `@sentry/node` for fail-open error logging but does NOT call `Sentry.init()` — it relies on the calling handler (`claude.js` / `subscribe.js`) to have already initialized Sentry at module load.

- [ ] **Step 1: Create the `api/lib/` directory**

```bash
mkdir api/lib
```

- [ ] **Step 2: Create the file**

```js
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
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add api/lib/rateLimit.js
git commit -m "feat: add checkRateLimit utility using Supabase RPC"
```

---

## Task 3: Update `api/claude.js`

**Files:**
- Modify: `api/claude.js`

Adds two things: JWT verification (closes the unauthenticated-access hole) and rate limiting (20 req/hr per user).

- [ ] **Step 1: Replace the file contents**

```js
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
```

- [ ] **Step 2: Add `SUPABASE_URL` to Vercel env vars**

The existing env vars cover `SUPABASE_SERVICE_ROLE_KEY` but `SUPABASE_URL` may not be set (the cron handlers hardcode the URL). Check Vercel dashboard → Settings → Environment Variables. If `SUPABASE_URL` is not present, add it: `https://awhqwqhntgxjvvawzkog.supabase.co`.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add api/claude.js
git commit -m "feat: add JWT auth and rate limiting to api/claude.js"
```

---

## Task 4: Update `api/subscribe.js`

**Files:**
- Modify: `api/subscribe.js`

Adds IP-based rate limiting (3 req/hr).

- [ ] **Step 1: Replace the file contents**

```js
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
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add api/subscribe.js
git commit -m "feat: add IP rate limiting to api/subscribe.js"
```

---

## Task 5: Update `src/App.jsx`

**Files:**
- Modify: `src/App.jsx`

Three changes:
1. Thread `session` into `VerifyTab` (it currently has no access to session)
2. Update `apiCall` to accept and send `accessToken`
3. Handle 429 in both catch blocks

**Note:** `VerifyTab` is defined at line 1240 and rendered at line 2028 as `<VerifyTab addApp={storage.addApp} onSaved={...} />` — `session` is not currently passed.

- [ ] **Step 1: Thread `session` into `VerifyTab`**

At line 1240, `VerifyTab` destructures only `addApp` and `onSaved` from props. Add `session`:

Find:
```js
function VerifyTab(props) {
  var addApp = props.addApp;
  var onSaved = props.onSaved;
```

Replace with:
```js
function VerifyTab(props) {
  var addApp = props.addApp;
  var onSaved = props.onSaved;
  var session = props.session;
```

At line 2028, pass `session` in the render call:

Find:
```js
{tab==="verify"&&<VerifyTab addApp={storage.addApp} onSaved={function(){setTab("tracker");}} />}
```

Replace with:
```js
{tab==="verify"&&<VerifyTab addApp={storage.addApp} onSaved={function(){setTab("tracker");}} session={session} />}
```

- [ ] **Step 2: Update `apiCall` function (line 495)**

Find:
```js
function apiCall(messages) {
  return fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: messages }),
  })
```

Replace with:
```js
function apiCall(messages, accessToken) {
  return fetch("/api/claude", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer " + (accessToken || ""),
    },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: messages }),
  })
```

- [ ] **Step 3: Add 429 check to the `.then()` chain in `apiCall`**

Find (lines 501-503):
```js
  .then(function(r){ return r.json(); })
  .then(function(data){
    if (data.error) throw new Error(data.error.type+": "+data.error.message);
```

Replace with:
```js
  .then(function(r){
    if (r.status === 429) throw new Error("RATE_LIMIT");
    return r.json();
  })
  .then(function(data){
    if (data.error) throw new Error(data.error.type+": "+data.error.message);
```

- [ ] **Step 4: Update call site at line 1002 (inside `handleAiRefine`, `SearchTab`)**

`session` is available in `SearchTab` scope via its `{ session, addApp }` props.

Find:
```js
    apiCall([{ role: "user", content: prompt }])
```
(the call at line 1002, inside `handleAiRefine`)

Replace with:
```js
    apiCall([{ role: "user", content: prompt }], session?.access_token)
```

Also update the catch block at line 1008 to handle the rate limit:

Find:
```js
      .catch(function(err) {
        setAiRefineError(err.message);
        setAiRefining(false);
      });
```

Replace with:
```js
      .catch(function(err) {
        if (err.message === "RATE_LIMIT") {
          setAiRefineError("You've reached your limit of 20 analyses per hour. Please try again later.");
        } else {
          setAiRefineError(err.message);
        }
        setAiRefining(false);
      });
```

- [ ] **Step 5: Update call site at line 1266 (inside `analyze`, `VerifyTab`)**

`session` is now available via `props.session` (added in Step 1).

Find:
```js
    apiCall([{role:"user",content:prompt}])
```
(the call at line 1266, inside `analyze`)

Replace with:
```js
    apiCall([{role:"user",content:prompt}], session?.access_token)
```

Also update the catch block at line 1273 to handle the rate limit:

Find:
```js
      .catch(function(err){
        clearInterval(iv);
        setError("Analysis failed: "+err.message);
        setLoading(false); setStep(-1);
      });
```

Replace with:
```js
      .catch(function(err){
        clearInterval(iv);
        if (err.message === "RATE_LIMIT") {
          setError("You've reached your limit of 20 analyses per hour. Please try again later.");
        } else {
          setError("Analysis failed: "+err.message);
        }
        setLoading(false); setStep(-1);
      });
```

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: pass auth token to apiCall and handle 429 in App.jsx"
```

---

## Task 6: Update `src/ResumeAdvisor.jsx`

**Files:**
- Modify: `src/ResumeAdvisor.jsx`

`session` is already available as a prop (`function ResumeAdvisor({ session, onRequestSignIn })`). There are 5 call sites across 4 functions. Four catch blocks use `setAnalysisError`; the cover letter catch uses `setCLResult`.

- [ ] **Step 1: Update `apiCall` definition (line 259)**

Find:
```js
function apiCall(messages) {
  return fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages }),
  })
```

Replace with:
```js
function apiCall(messages, accessToken) {
  return fetch("/api/claude", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer " + (accessToken || ""),
    },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages }),
  })
```

- [ ] **Step 2: Add 429 check in the `.then()` chain**

Find (the existing error check in the apiCall `.then()` chain):
```js
    .then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) { throw new Error("HTTP " + r.status + ": " + t); });
      }
      return r.json();
    })
```

Replace with:
```js
    .then(function (r) {
      if (r.status === 429) throw new Error("RATE_LIMIT");
      if (!r.ok) {
        return r.text().then(function (t) { throw new Error("HTTP " + r.status + ": " + t); });
      }
      return r.json();
    })
```

- [ ] **Step 3: Update the 4 `setAnalysisError` call sites (lines 1215, 1314, 1372, 1408)**

For each: add `session?.access_token` as second arg and add a rate limit check at the top of its catch block.

**Line 1215** (Career Coach function, catch at line 1243 uses `setAnalysisError`):
```js
// Before:
var raw = await apiCall([{ role: "user", content: ccPrompt + "\n\n" + userMsg }]);
// After:
var raw = await apiCall([{ role: "user", content: ccPrompt + "\n\n" + userMsg }], session?.access_token);
```
Catch at line 1243:
```js
// Before:
    } catch (err) {
      setAnalysisError("Analysis failed: " + err.message);
// After:
    } catch (err) {
      if (err.message === "RATE_LIMIT") {
        setAnalysisError("You've reached your limit of 20 analyses per hour. Please try again later.");
      } else {
        setAnalysisError("Analysis failed: " + err.message);
      }
```

**Line 1314** (Job Search Advisor function, catch at line 1339 uses `setAnalysisError`):
```js
// Before:
var raw = await apiCall([{ role: "user", content: jsaPrompt + "\n\n" + userMsg }]);
// After:
var raw = await apiCall([{ role: "user", content: jsaPrompt + "\n\n" + userMsg }], session?.access_token);
```
Catch at line 1339:
```js
// Before:
    } catch (err) {
      setAnalysisError("Analysis failed: " + err.message);
// After:
    } catch (err) {
      if (err.message === "RATE_LIMIT") {
        setAnalysisError("You've reached your limit of 20 analyses per hour. Please try again later.");
      } else {
        setAnalysisError("Analysis failed: " + err.message);
      }
```

**Line 1372** (General Review function, catch at line 1440 uses `setAnalysisError`):
```js
// Before:
var raw = await apiCall([{ role: "user", content: genPrompt + "\n\n" + genMsg }]);
// After:
var raw = await apiCall([{ role: "user", content: genPrompt + "\n\n" + genMsg }], session?.access_token);
```

**Line 1408** (Job-Specific Analysis function, same catch block at line 1440 as line 1372):
```js
// Before:
var raw2 = await apiCall([{ role: "user", content: jobPrompt + "\n\n" + jobMsg }]);
// After:
var raw2 = await apiCall([{ role: "user", content: jobPrompt + "\n\n" + jobMsg }], session?.access_token);
```

Catch at line 1440 (covers both lines 1372 and 1408):
```js
// Before:
    } catch (err) {
      setAnalysisError("Analysis failed: " + err.message);
// After:
    } catch (err) {
      if (err.message === "RATE_LIMIT") {
        setAnalysisError("You've reached your limit of 20 analyses per hour. Please try again later.");
      } else {
        setAnalysisError("Analysis failed: " + err.message);
      }
```

- [ ] **Step 4: Update the cover letter call site (line 1456) — uses `setCLResult`, not `setAnalysisError`**

```js
// Before:
var raw = await apiCall([{ role: "user", content: clPrompt + "\n\n" + clMsg }]);
// After:
var raw = await apiCall([{ role: "user", content: clPrompt + "\n\n" + clMsg }], session?.access_token);
```

Catch at line 1462 (uses `setCLResult`, not `setAnalysisError`):
```js
// Before:
    } catch (err) {
      setCLResult("Generation failed: " + err.message);
// After:
    } catch (err) {
      if (err.message === "RATE_LIMIT") {
        setCLResult("You've reached your limit of 20 analyses per hour. Please try again later.");
      } else {
        setCLResult("Generation failed: " + err.message);
      }
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/ResumeAdvisor.jsx
git commit -m "feat: pass auth token to apiCall and handle 429 in ResumeAdvisor.jsx"
```

---

## Task 7: Update `index.html` Subscribe Form

**Files:**
- Modify: `index.html` around line 888–899

- [ ] **Step 1: Add 429 branch to the subscribe error handler**

Find (around line 889–898):
```js
      var data = await res.json();
      if (res.ok) {
        msg.style.color = '#00e67a';
        msg.textContent = "YOU'RE IN. CHECK YOUR INBOX.";
        input.value = '';
        btn.textContent = 'SUBSCRIBED';
      } else {
        msg.style.color = '#d42200';
        msg.textContent = (data.error || 'SOMETHING WENT WRONG. TRY AGAIN.').toUpperCase();
        btn.disabled = false;
        btn.textContent = 'SUBSCRIBE';
      }
```

Replace with:
```js
      var data = await res.json();
      if (res.ok) {
        msg.style.color = '#00e67a';
        msg.textContent = "YOU'RE IN. CHECK YOUR INBOX.";
        input.value = '';
        btn.textContent = 'SUBSCRIBED';
      } else if (res.status === 429) {
        msg.style.color = '#d42200';
        msg.textContent = 'TOO MANY ATTEMPTS. PLEASE TRY AGAIN LATER.';
        btn.disabled = false;
        btn.textContent = 'SUBSCRIBE';
      } else {
        msg.style.color = '#d42200';
        msg.textContent = (data.error || 'SOMETHING WENT WRONG. TRY AGAIN.').toUpperCase();
        btn.disabled = false;
        btn.textContent = 'SUBSCRIBE';
      }
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: handle 429 in subscribe form on index.html"
```

---

## Task 8: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Move API rate limiting from Pending to Completed**

In the Phase 2 Status section, remove "API rate limiting — not yet started" from **Pending** and add to **Completed**:

```
- **API rate limiting** — 20 req/hr per user on `api/claude.js` (JWT-verified via Supabase auth), 3 req/hr per IP on `api/subscribe.js`. Backed by Supabase `rate_limits` table + atomic `check_and_increment_rate_limit` RPC. Shared utility at `api/lib/rateLimit.js`. Requires `20260325_rate_limits.sql` migration and `SUPABASE_URL` env var in Vercel.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark API rate limiting as complete in CLAUDE.md"
```
