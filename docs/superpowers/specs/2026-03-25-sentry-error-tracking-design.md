# Sentry Error Tracking — Design Spec

**Date:** 2026-03-25
**Feature:** Sentry error tracking, session replay, and source maps across all frontend pages and serverless functions

---

## Goal

Capture unhandled errors, promise rejections, and serverless failures in Sentry — with session replay on error and readable stack traces via source maps — across all four React pages and all four Vercel serverless handlers.

---

## Scope

**In scope:**
- Frontend error capture for all 4 React entry points (app, profile, community, score)
- Session replay (10% of all sessions, 100% of sessions with errors)
- Performance tracing at 20% sample rate
- Source maps uploaded at build time via `@sentry/vite-plugin`, deleted from `dist/` after upload
- Serverless error capture for `api/claude.js`, `api/subscribe.js`, `api/cron/onboarding.js`, `api/cron/application-nudge.js`
- `Sentry.flush(2000)` before all serverless error responses to prevent event loss on cold-stop

**Out of scope:**
- Custom error boundaries in React components (Sentry's default global handler is sufficient)
- Performance tracing on individual React components or routes
- Alerting / notification rules (configured in Sentry dashboard, not in code)
- `api/emails/templates.js` and `api/emails/applicationNudge.js` — plain modules, not handlers

---

## Packages

```bash
npm install @sentry/react @sentry/vite-plugin @sentry/node
```

- `@sentry/react` — frontend SDK with session replay integration
- `@sentry/vite-plugin` — source map upload + deletion at build time
- `@sentry/node` — serverless SDK

---

## Architecture

### Frontend: Shared Init Module

A new `src/sentry.js` module is the single place where `Sentry.init()` is called. All 4 entry points import it as their first import.

```js
// src/sentry.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
```

Each entry point adds one line as its very first import:
```js
import "./sentry.js";
```

Files: `src/main.jsx`, `src/profile-main.jsx`, `src/community-main.jsx`, `src/score-main.jsx`

### Frontend: Source Maps via Vite Plugin

`vite.config.js` adds `sentryVitePlugin` to the plugins array. The plugin runs at build time: uploads source maps to Sentry, then deletes them from `dist/` so they are never publicly served.

```js
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // required for the plugin to have maps to upload
    rollupOptions: { ... } // existing multi-entry config unchanged
  }
});
```

### Serverless: Per-Handler Init + Capture + Flush

Each of the 4 serverless files gets the same pattern:

1. `@sentry/node` imported and `Sentry.init({ dsn: process.env.SENTRY_DSN })` called at the top of the file (module scope, runs once per cold start)
2. Handler body wrapped in try/catch
3. `Sentry.captureException(error)` in the catch block
4. `await Sentry.flush(2000)` before returning the error response — prevents the Vercel process from terminating before the event is sent

```js
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

export default async function handler(req, res) {
  try {
    // existing handler logic
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(2000);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

For the cron handlers (`onboarding.js`, `application-nudge.js`), the same pattern applies — the entire handler body goes inside the try block.

---

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `VITE_SENTRY_DSN` | `.env` + Vercel dashboard | Frontend DSN (public — Sentry DSNs are designed to be exposed in browsers) |
| `SENTRY_DSN` | Vercel dashboard only | Server-side DSN for the 4 API handlers |
| `SENTRY_AUTH_TOKEN` | Vercel dashboard only | Authenticates source map upload during `npm run build` |
| `SENTRY_ORG` | Vercel dashboard only | Sentry organization slug |
| `SENTRY_PROJECT` | Vercel dashboard only | Sentry project slug |

`VITE_SENTRY_DSN` must also be added to `.env` for local development (or source maps won't upload locally). It is safe to commit — Sentry DSNs are public by design.

`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` must NOT be committed. They are build-time variables only, set in the Vercel dashboard.

---

## Files Modified

- **New:** `src/sentry.js`
- `src/main.jsx` — add `import "./sentry.js"` as first line
- `src/profile-main.jsx` — add `import "./sentry.js"` as first line
- `src/community-main.jsx` — add `import "./sentry.js"` as first line
- `src/score-main.jsx` — add `import "./sentry.js"` as first line
- `vite.config.js` — add `sentryVitePlugin`, add `build: { sourcemap: true }`
- `api/claude.js` — add Sentry init + captureException + flush
- `api/subscribe.js` — add Sentry init + captureException + flush
- `api/cron/onboarding.js` — add Sentry init + captureException + flush
- `api/cron/application-nudge.js` — add Sentry init + captureException + flush
