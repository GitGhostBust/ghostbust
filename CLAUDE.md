# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build — always run before committing
npm run lint       # ESLint check
npm run preview    # preview production build locally
```

There are no tests. Always verify with `npm run build` before pushing — JSX syntax errors will cause Vercel deployment failures that aren't caught by the dev server.

## Architecture

### Multi-page Vite app

Three distinct HTML entry points, each with its own React root:

| HTML file | Entry JSX | Purpose |
|---|---|---|
| `index.html` | (none — static) | Public marketing/landing page |
| `app.html` | `src/main.jsx` → `App.jsx` | Main application (job tracker, scan, search) |
| `profile.html` | `src/profile-main.jsx` → `Profile.jsx` | User profile pages |

Configured in `vite.config.js` via `rollupOptions.input`. `index.html` is a self-contained static page with no React.

### Supabase backend

`src/supabase.js` exports a single `supabase` client instance used everywhere. All DB calls go through it directly from components — no API layer.

**Key tables:**
- `profiles` — user profile data including `avatar_url`, `avatar_color`, `ghost_color`, `founding_member`, `region_set`, `job_market_region/state/country/open`
- `ghost_scans` — scan history per user
- `follows` — follower/following relationships (RLS: authenticated users can read all, insert/delete own only)
- `conversations` + `messages` — inbox system (RLS: participants only)

Migrations live in `supabase/migrations/`. Apply them via the Supabase SQL editor or `supabase db push`.

### Component structure

- **`App.jsx`** — the entire app page in one large component. Contains all CSS in a `const STYLE` template literal injected via `<style>{STYLE}</style>`. Handles auth session, tab routing (Scan / Track / Search / Help), application tracker with localStorage persistence, Claude API calls for ghost job scoring, and RegionModal first-login flow.

- **`Profile.jsx`** — similar monolithic structure. Reads `?user=` from URL query string to determine whose profile to show. Handles own-profile edit mode vs. read-only view, follow/unfollow, inbox, and RegionModal first-login flow.

- **`UserSearch.jsx`** — self-contained search dropdown component. Queries `profiles` table with `ilike`. Used in both App.jsx and Profile.jsx navbars.

- **`InboxDrawer.jsx`** — slide-out drawer for conversations/messages. Used only in Profile.jsx.

- **`RegionModal.jsx`** — full-screen overlay for first-login job market region setup. Shown when `profiles.region_set` is false and `sessionStorage` doesn't have `gb_region_skipped`.

### CSS pattern

Every component injects its own scoped CSS via `<style>{STYLE}</style>` at the top of the JSX return. There is no CSS modules, Tailwind, or external stylesheet system. The `src/index.css` file is minimal (resets only).

### Font system

Three fonts only — loaded via `@import url()` inside each component's STYLE string:
- **Bebas Neue** — display headings, logo, large UI labels
- **Libre Baskerville** — body text, prose, metadata (emails, dates, timestamps, counts)
- **Space Mono** — ticker banner, badges, username subtext, profile card labels/values

### Application data storage

The job tracker (`App.jsx`) stores application data in **localStorage** under key `ghostbust-applications`. This is client-only — not synced to Supabase. The `useApplications()` hook manages reads/writes.

### Claude API usage

`App.jsx` calls the Anthropic Messages API directly from the browser via `apiCall()`. The API key is expected to be provided by the user at runtime (stored in component state, not hardcoded). Model: `claude-sonnet-4-20250514`.

### Sticky navbar pattern

Profile.jsx uses a single `<div className="sticky-header">` wrapper containing both the ticker bar and nav — this is the correct approach for stacking two elements as a single sticky unit. Do not use `position: fixed` on the nav.
