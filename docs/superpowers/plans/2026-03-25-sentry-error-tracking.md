# Sentry Error Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sentry error tracking, session replay, and source maps to all four React pages and all four Vercel serverless handlers.

**Architecture:** A shared `src/sentry.js` init module is imported first by all four React entry points. `@sentry/vite-plugin` uploads and deletes source maps on every production build. Each serverless handler gets `@sentry/node` init at module scope, with `captureException` + `flush(2000)` in its outer catch block.

**Tech Stack:** React 18, Vite, @sentry/react, @sentry/vite-plugin, @sentry/node, Vercel serverless

---

## Files Modified

- **New:** `src/sentry.js` — shared frontend Sentry init
- `src/main.jsx` — add sentry import as first line
- `src/profile-main.jsx` — add sentry import as first line
- `src/community-main.jsx` — add sentry import as first line
- `src/score-main.jsx` — add sentry import as first line
- `vite.config.js` — add sentryVitePlugin + sourcemap: true
- `api/claude.js` — add Sentry init + captureException + flush
- `api/subscribe.js` — add Sentry init + captureException + flush
- `api/cron/onboarding.js` — add Sentry init + captureException + flush
- `api/cron/application-nudge.js` — add Sentry init + captureException + flush

---

### Task 1: Install packages and create src/sentry.js

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/sentry.js`

**Context:** There is no test suite. Verification is always `npm run build` — a clean build with no errors means success. The project is a React 18 / Vite app deployed on Vercel. There are no TypeScript files — everything is plain JS.

- [ ] **Step 1: Install Sentry packages**

```bash
cd C:/Users/gabri/ghostbust-app && npm install @sentry/react @sentry/vite-plugin @sentry/node
```

Expected: `package.json` gets three new entries under `dependencies`. No errors.

- [ ] **Step 2: Create src/sentry.js**

Create `src/sentry.js` with exactly this content:

```js
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

- [ ] **Step 3: Add VITE_SENTRY_DSN to .env**

Open `.env` (in the project root) and add this line — using your real DSN from Sentry dashboard → Project → Settings → Client Keys:

```
VITE_SENTRY_DSN=https://your-key@oXXXXXX.ingest.sentry.io/XXXXXXX
```

`VITE_SENTRY_DSN` is safe to commit — Sentry DSNs are public by design. If `.env` doesn't exist yet, create it.

- [ ] **Step 4: Verify build**

```bash
cd C:/Users/gabri/ghostbust-app && npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/sentry.js package.json package-lock.json .env
git commit -m "feat: install Sentry packages and create shared frontend init module"
```

---

### Task 2: Wire sentry.js into all four React entry points

**Files:**
- Modify: `src/main.jsx:1`
- Modify: `src/profile-main.jsx:1`
- Modify: `src/community-main.jsx:1`
- Modify: `src/score-main.jsx:1`

**Context:** All four entry point files are in `src/`. The sentry module (`src/sentry.js`) must be imported as the very first import in each file so Sentry is active before any React code runs. Add `import "./sentry.js";` as line 1 in all four files. Do not modify anything else.

Current content of the four files for reference:

`src/main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
...
```

`src/profile-main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Profile from './Profile.jsx'
...
```

`src/community-main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CommunityPage from './CommunityPage.jsx'
...
```

`src/score-main.jsx`:
```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ScorePage from "./ScorePage.jsx";
...
```

- [ ] **Step 1: Add sentry import to src/main.jsx**

Find:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
```

Replace with:
```jsx
import "./sentry.js";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
```

- [ ] **Step 2: Add sentry import to src/profile-main.jsx**

Find:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Profile from './Profile.jsx'
```

Replace with:
```jsx
import "./sentry.js";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Profile from './Profile.jsx'
```

- [ ] **Step 3: Add sentry import to src/community-main.jsx**

Find:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CommunityPage from './CommunityPage.jsx'
```

Replace with:
```jsx
import "./sentry.js";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CommunityPage from './CommunityPage.jsx'
```

- [ ] **Step 4: Add sentry import to src/score-main.jsx**

Find:
```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ScorePage from "./ScorePage.jsx";
```

Replace with:
```jsx
import "./sentry.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ScorePage from "./ScorePage.jsx";
```

- [ ] **Step 5: Verify build**

```bash
cd C:/Users/gabri/ghostbust-app && npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/main.jsx src/profile-main.jsx src/community-main.jsx src/score-main.jsx
git commit -m "feat: wire Sentry init into all four React entry points"
```

---

### Task 3: Update vite.config.js for source maps

**Files:**
- Modify: `vite.config.js`

**Context:** The current `vite.config.js` is a single line:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], build: { rollupOptions: { input: { main: './index.html', app: './app.html', profile: './profile.html', community: './community.html', tos: './tos.html', privacy: './privacy.html', score: './score.html' } } } })
```

Replace the entire file. The 7-entry `rollupOptions.input` must be preserved exactly. `sentryVitePlugin` must come AFTER `react()` in the plugins array. `sourcemap: true` must be added to the `build` object alongside `rollupOptions`.

The plugin reads `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` from `process.env` at build time. If these vars are absent (e.g., in local dev without them set), the plugin skips source map upload silently — this is acceptable. `sourcemaps.deleteAfterUpload: true` is set explicitly so source maps are always removed from `dist/` after upload — they must not be publicly served.

- [ ] **Step 1: Replace vite.config.js**

Write `vite.config.js` with this exact content:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        deleteAfterUpload: true,
      },
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        app: './app.html',
        profile: './profile.html',
        community: './community.html',
        tos: './tos.html',
        privacy: './privacy.html',
        score: './score.html',
      }
    }
  }
})
```

- [ ] **Step 2: Verify build**

```bash
cd C:/Users/gabri/ghostbust-app && npm run build
```

Expected: `✓ built` with no errors. The plugin may log "no auth token" or skip upload — that's expected in local dev without the env vars set.

- [ ] **Step 3: Commit**

```bash
git add vite.config.js
git commit -m "feat: add sentryVitePlugin and sourcemap: true to vite.config.js"
```

---

### Task 4: Add Sentry to api/claude.js and api/subscribe.js

**Files:**
- Modify: `api/claude.js`
- Modify: `api/subscribe.js`

**Context:** Both files already have a try/catch. Use targeted find/replace — do NOT rewrite the whole file. Two edits per file: (1) add the Sentry import + init before the handler function, (2) add captureException + flush inside the catch block. Do not change anything else in either file.

- [ ] **Step 1: Add Sentry import + init to api/claude.js**

Find in `api/claude.js`:
```js
export default async function handler(req, res) {
  if (req.method !== "POST") {
```

Replace with:
```js
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
```

- [ ] **Step 2: Add captureException + flush to api/claude.js catch block**

Find in `api/claude.js`:
```js
  } catch (err) {
    return res.status(500).json({ error: "Service temporarily unavailable." });
  }
}
```

Replace with:
```js
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return res.status(500).json({ error: "Service temporarily unavailable." });
  }
}
```

- [ ] **Step 3: Add Sentry import + init to api/subscribe.js**

Find in `api/subscribe.js`:
```js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
```

Replace with:
```js
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
```

- [ ] **Step 4: Add captureException + flush to api/subscribe.js catch block**

Find in `api/subscribe.js`:
```js
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
```

Replace with:
```js
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return res.status(500).json({ error: 'Server error' });
  }
}
```

- [ ] **Step 5: Verify build**

```bash
cd C:/Users/gabri/ghostbust-app && npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 6: Commit**

```bash
git add api/claude.js api/subscribe.js
git commit -m "feat: add Sentry error capture to api/claude.js and api/subscribe.js"
```

---

### Task 5: Add Sentry to cron handlers

**Files:**
- Modify: `api/cron/onboarding.js`
- Modify: `api/cron/application-nudge.js`

**Context:** Both cron handlers have an **outer** try/catch wrapping the entire handler body, and an **inner** per-item try/catch for individual email send failures. Sentry goes only in the **outer** catch — the inner catch handles expected per-item failures gracefully and should not be reported to Sentry.

Add `import * as Sentry from "@sentry/node"` and `Sentry.init({ dsn: process.env.SENTRY_DSN })` at the very top of each file (before all existing imports). In the **outer** catch block only, add `Sentry.captureException(err)` and `await Sentry.flush(2000)` before the `return res.status(500)` call.

- [ ] **Step 1: Add Sentry to api/cron/onboarding.js**

Find the top of the file:
```js
import { day0, day2, day5, day14, day30Active, day30Dormant } from '../emails/templates.js';
```

Replace with:
```js
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

import { day0, day2, day5, day14, day30Active, day30Dormant } from '../emails/templates.js';
```

Then find the outer catch block at the bottom of the handler function:
```js
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ─── Supabase helpers ────────────────────────────────────────────────────────
```

Replace with:
```js
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return res.status(500).json({ error: err.message });
  }
}

// ─── Supabase helpers ────────────────────────────────────────────────────────
```

- [ ] **Step 2: Add Sentry to api/cron/application-nudge.js**

Find the top of the file:
```js
import { applicationNudgeEmail } from '../emails/applicationNudge.js';
```

Replace with:
```js
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

import { applicationNudgeEmail } from '../emails/applicationNudge.js';
```

Then find the outer catch block at the bottom of the handler function:
```js
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ─── Supabase helpers ────────────────────────────────────────────────────────
```

Replace with:
```js
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    return res.status(500).json({ error: err.message });
  }
}

// ─── Supabase helpers ────────────────────────────────────────────────────────
```

- [ ] **Step 3: Verify build**

```bash
cd C:/Users/gabri/ghostbust-app && npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 4: Commit**

```bash
git add api/cron/onboarding.js api/cron/application-nudge.js
git commit -m "feat: add Sentry error capture to cron handlers"
```

---

## Environment Variables to Set After Implementation

Before deploying, set these in the Vercel dashboard (Settings → Environment Variables):

| Variable | Value source |
|---|---|
| `VITE_SENTRY_DSN` | Sentry dashboard → Project → Settings → Client Keys (DSN) |
| `SENTRY_DSN` | Same DSN value as above |
| `SENTRY_AUTH_TOKEN` | Sentry dashboard → Settings → Auth Tokens → Create New Token (scope: `project:releases`, `org:read`) |
| `SENTRY_ORG` | Your Sentry organization slug (visible in the Sentry URL: `sentry.io/organizations/<slug>/`) |
| `SENTRY_PROJECT` | Your Sentry project slug (visible in Sentry → Settings → Projects) |

Also add `VITE_SENTRY_DSN` to your local `.env` file for dev (safe to commit — DSNs are public by design).
