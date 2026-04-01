# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## DATA SAFETY — NON-NEGOTIABLE

1. **NEVER run DELETE, DROP, or TRUNCATE** on any Supabase table without first confirming a backup exists or explicitly exporting the data.
2. **NEVER run destructive SQL operations directly** — always show the statement and require explicit user confirmation first.
3. **Before any database migration or bulk update**, always run a `SELECT COUNT(*)` first and show the user how many rows will be affected.
4. **Always suggest Supabase point-in-time recovery or CSV export** before any destructive operation.
5. **When in doubt, do nothing and ask.**

---


## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build — always run before committing
npm run lint       # ESLint check
npm run preview    # preview production build locally
```

Tests: `npm run test` runs Vitest (16 tests covering `api/claude.js` and `api/subscribe.js`). CI runs tests + build on every push via GitHub Actions. Always verify with `npm run build` before pushing — JSX syntax errors will cause Vercel deployment failures that aren't caught by the dev server.

---

## Stack

- **Frontend:** React 18, Vite 8, no TypeScript
- **Backend:** Supabase (Postgres + Auth + Storage + RLS)
- **AI:** Anthropic Claude API called directly from the browser (`claude-sonnet-4-20250514`)
- **Deployment:** Vercel
- **Packages of note:** `mammoth` (DOCX → HTML), `pdfjs-dist` (PDF text extraction + canvas render)

---

## Multi-Page Architecture

Four distinct HTML entry points, each with its own React root:

| HTML file | Entry JSX | Purpose |
|---|---|---|
| `index.html` | (none — static) | Public marketing/landing page |
| `app.html` | `src/main.jsx` → `App.jsx` | Main app (job tracker, scan, search, resume advisor) |
| `profile.html` | `src/profile-main.jsx` → `Profile.jsx` | User profile pages |
| `community.html` | `src/community-main.jsx` → `CommunityPage.jsx` | Community board |

Configured in `vite.config.js` via `rollupOptions.input`. `index.html` is a self-contained static page with no React.

---

## Key Components

- **`App.jsx`** — monolithic main app. All CSS in `const STYLE`. Handles auth session, tab routing (Find Jobs / Ghost Detector / Application Tracker / Career HQ), application tracker, Claude API calls for ghost job scoring, and RegionModal first-login flow. Tab content panels are constrained to `max-width: 1280px; margin: 0 auto`.

- **`ResumeAdvisor.jsx`** — standalone Career HQ tab component (used inside App.jsx). Three inner tabs: My Resume (upload + preview), AI Advisor (four-mode analysis), History. Pro-gated (`founding_member = true`). Four modes: General Review, Job-Specific Analysis, Job Search Advisor, Career Coach. All four are live.

- **`Profile.jsx`** — monolithic profile page. Reads `?user=` query param. Handles own-profile edit vs. read-only view, follow/unfollow, inbox, avatar/banner uploads, ghost avatar customisation, RegionModal.

- **`CommunityPage.jsx`** — community board page with auth modal.

- **`UserSearch.jsx`** — self-contained search dropdown. Queries `profiles` with `ilike`. Used in App.jsx and Profile.jsx navbars.

- **`InboxDrawer.jsx`** — slide-out drawer for conversations/messages. Used only in Profile.jsx.

- **`SearchTab.jsx`** — standalone Find Jobs tab component (used inside App.jsx). Natural language job search powered by JSearch API via `api/jobSearch.js` proxy. Features: search with filters (job type, date posted, industry, job board multi-select), live ghost scoring of results via `api/claude.js`, salary display, save/bookmark jobs to Supabase `saved_jobs` table, Search/Saved view tabs, detail modal with full description and apply link, add-to-tracker integration. Signal flags display as clean rounded pills with human-readable text.

- **`RegionModal.jsx`** — full-screen overlay for first-login job market region setup. Shown when `profiles.region_set = false` and `sessionStorage` doesn't have `gb_region_skipped`.

---

## CSS Pattern

Every component injects its own scoped CSS via `<style>{STYLE}</style>` at the top of the JSX return. No CSS modules, no Tailwind, no external stylesheet. `src/index.css` is minimal resets only.

### Page entrance animation

All four pages use `@keyframes gbFadeIn` applied to the root wrapper with `animation-fill-mode: both`. This gives a flash-free fade-in on load. Profile.jsx wraps in `<div className="profile-root">` (not a Fragment) to receive the class.

### Scroll reveal

`IntersectionObserver` on `.reveal` elements adds `.reveal.visible` when in view. Only used for below-fold content — page-level entrance is handled by `gbFadeIn`.

### Scanlines overlay

`.scanlines { position: fixed; inset: 0; pointer-events: none; z-index: 9000; background: repeating-linear-gradient(...) }` — overlays the entire viewport. The resume preview box uses `z-index: 9001` to render above it.

### Sticky navbar pattern

Profile.jsx uses `<div className="sticky-header">` wrapping both ticker and nav as a single sticky unit. Do not use `position: fixed` on the nav.

---

## Font System

Three fonts only — loaded via `@import url()` inside each component's STYLE string:

| Font | Use |
|---|---|
| **Bebas Neue** | Display headings, logo, large scores, tab labels, section titles |
| **Libre Baskerville** | Body text, prose feedback, metadata (dates, timestamps, counts) |
| **Space Mono** | Ticker, badges, nav buttons, labels/values, monospace UI elements |

---

## Color System (CSS custom properties)

Defined in `:root` on each page:

| Variable | Value | Use |
|---|---|---|
| `--void` | `#070709` | Page background |
| `--surface` | `#0e0e12` | Card/panel backgrounds |
| `--surface2` | `#13131a` | Hover states |
| `--surface3` | `#181820` | Nested surfaces |
| `--paper` | `#eeeae0` | Primary text |
| `--muted` | `rgba(238,234,224,0.45)` | Secondary text |
| `--ghost` | `#4a4a60` | Placeholder / inactive text |
| `--blood` | `#d42200` | Primary accent (red) — CTAs, active states, error |
| `--blood-dim` | `rgba(212,34,0,0.15)` | Red tint backgrounds |
| `--bile` | `#c99a00` | Warning / gold accent |
| `--bile-dim` | `rgba(201,154,0,0.15)` | Gold tint backgrounds |
| `--signal` | `#00e67a` | Success / positive / green |
| `--signal-dim` | `rgba(0,230,122,0.1)` | Green tint backgrounds |
| `--ice` | `#00c8e6` | Info / links / cyan |
| `--ice-dim` | `rgba(0,200,230,0.1)` | Cyan tint backgrounds |
| `--border` | `rgba(255,255,255,0.07)` | Subtle borders |
| `--border-hi` | `rgba(255,255,255,0.14)` | Highlighted borders |

---

## Supabase Schema

`src/supabase.js` exports a single client used everywhere. All DB calls are made directly from components — no API layer.

### `profiles`
User profile data. Created automatically on signup via trigger.
- `id` (uuid, FK → auth.users)
- `username`, `display_name`, `bio`, `avatar_url`, `banner_url`
- `avatar_color`, `ghost_color` — hex values for the ghost avatar customiser
- `founding_member` (boolean) — Pro tier gate
- `region_set` (boolean) — whether the user has completed RegionModal
- `job_market_region`, `job_market_state`, `job_market_country`, `job_market_open`

### `ghost_scans`
Scan history per user (ghost job scoring results).
- Original columns: `title`, `company`, `job_board`, `ghost_score`, `signal_flags` (jsonb), `assessment`, `scores`, `confidence`, `summary`, `share_enabled`, `anon_id`, `user_id`
- Batch scan columns (added via migration): `full_description`, `posting_age_days`, `initiated_by` (`system` | `user`), `job_city`, `job_state`, `industry`
- **Important:** The column for job title is `title` (not `job_title`) and for flags is `signal_flags` (not `pattern_flags`). Inserts must use these names.

### `saved_jobs`
Bookmarked job listings from Find Jobs search.
- `id`, `user_id`, `job_id` (JSearch job ID), `title`, `company`, `location`, `job_board`, `posted`, `description`, `apply_url`, `job_type`, `salary`, `min_salary`, `max_salary`, `employer_logo`, `ghost_score`, `signal_flags` (jsonb), `saved_at`
- UNIQUE constraint on `(user_id, job_id)`
- RLS: users manage own rows only

### `ghostletter_subscribers`
Email subscribers for The GhostBust Monthly newsletter, captured via GhostIndex subscribe form.
- `id`, `email` (unique), `subscribed_at`
- RLS: anon INSERT allowed; no public SELECT

### `follows`
Follower/following relationships.
- RLS: authenticated users can read all; insert/delete own rows only.

### `conversations` + `messages`
Inbox system. RLS: participants only.

### `resumes`
Private resume file storage metadata. One or more per user.
- `id`, `user_id`, `file_name`, `file_url`, `file_path`, `extracted_text`, `uploaded_at`
- Storage bucket: `resumes` (private, 10 MB limit, PDF/DOCX only)
- RLS: users manage own rows; `GhostBustOfficial` admin can delete any

### `resume_analyses`
AI analysis results. Linked to a resume row.
- `id`, `user_id`, `resume_id`, `mode` (`general` | `job_specific`)
- `job_listing_text` (nullable — empty string for general mode)
- `fit_score`, `strength_score`, `strength_justification`
- `formatting_feedback`, `writing_quality`, `missing_sections`
- `industry_alignment`, `career_trajectory`, `red_flags`
- `next_steps` (JSON string — array of 3 strings)
- `keyword_gaps`, `bullet_rewrites`, `ats_feedback`, `cover_letter` (job-specific fields)
- `job_title`, `company_name` (set when cover letter is generated in general mode)
- `gap_analysis` (legacy field from original single-mode implementation)
- `created_at`

### Migrations
All in `supabase/migrations/`. Apply via Supabase SQL editor or `supabase db push`. Key migrations:
- `20260321_resume_advisor.sql` — resumes + resume_analyses tables + storage bucket
- `20260322_resume_admin_delete.sql` — admin RLS for GhostBustOfficial
- `20260322_resume_analyses_extended.sql` — 12 new columns for comprehensive analysis
- `20260322_resume_analyses_nullable_job_listing.sql` — drops NOT NULL on job_listing_text
- `20260327_ghost_scans_batch_columns.sql` — adds batch scan columns + RLS policy
- `20260328_ghost_scans_location.sql` — adds `job_city`, `job_state` columns
- `20260328_saved_jobs.sql` — saved_jobs table for Find Jobs bookmarks
- `20260329_ghost_scans_industry.sql` — adds `industry` text column to ghost_scans
- `20260330_ghostletter_subscribers.sql` — ghostletter_subscribers table with unique email + anon INSERT RLS

---

## Tier Structure

| Tier | Flag | Access |
|---|---|---|
| Standard | `founding_member = false` | Community, job search, verify listing, tracker |
| **Founding Member (Pro)** | `founding_member = true` | All above + Resume Advisor (upload, AI analysis, history) |

Currently all users are Founding Members. The Resume Advisor is Pro-gated in `ResumeAdvisor.jsx` by checking `profiles.founding_member`.

---

## Region System

First login triggers `RegionModal.jsx` when `profiles.region_set = false`. User selects:
- Job market region (e.g. "Northeast US", "London")
- State/province (optional)
- Country
- Whether they are open to remote/relocation

Stored in `profiles`. Used to contextualise AI prompts in `ResumeAdvisor.jsx` and filter community board posts in `CommunityPage.jsx`. Users can skip via `sessionStorage.setItem('gb_region_skipped', '1')`.

---

## Claude API Usage

All Claude API calls are proxied through a Vercel serverless function:

- **`api/claude.js`** — POST proxy. Accepts `{ model, max_tokens, messages }`, injects `ANTHROPIC_API_KEY` server-side, forwards to Anthropic, returns response. Rate limited: 20 req/hr per user.
- **`api/jobSearch.js`** — POST proxy for JSearch API (RapidAPI). Accepts `{ query, location, page, employment_types, date_posted }`, injects `RAPIDAPI_KEY` server-side. Returns normalized listing objects with salary data.
- **`App.jsx`** — ghost job scoring via VerifyTab. Calls `POST /api/claude`.
- **`SearchTab.jsx`** — background ghost scoring of search results. Calls `POST /api/claude` sequentially with 500ms delay, 15s timeout per call. Rate-limit aware: stops scoring remaining listings on 429.
- **`ResumeAdvisor.jsx`** — resume analysis and cover letter generation. Calls `POST /api/claude`.

The API key is **never exposed to the browser**. Set `ANTHROPIC_API_KEY` (not `VITE_ANTHROPIC_API_KEY`) in Vercel dashboard environment variables.

Model: `claude-sonnet-4-20250514`, `max_tokens: 4000`.

---

## Resume Advisor — Key Implementation Details

**Upload flow (order matters):**
1. Storage upload to Supabase (`resumes` bucket, path: `{user_id}/resume-{timestamp}.pdf|docx`)
2. DB insert with `extracted_text: null`
3. UI updates immediately (resume card visible)
4. Text extraction runs in background via `.then()` — patches DB row on success, fails silently

**PDF preview:** pdfjs-dist renders page 1 to a `<canvas>` element scaled to container width. Lines on the canvas are PDF content, not CSS artifacts.

**DOCX preview:** mammoth.js converts to HTML. `sanitizeDocxHtml()` strips all `<hr>` tags and border-related inline styles before `dangerouslySetInnerHTML`. `MAMMOTH_OPTIONS.styleMap` suppresses HR conversion at parse time.

**Storage access:** The `resumes` bucket is private. Always use `createSignedUrl(path, 3600)` — never `getPublicUrl`. `storagePathFromUrl()` extracts the storage path from the public-URL-format string stored in `file_url`.

**AI Advisor modes:**
- **General Review** — no job listing required. Produces: strength score, formatting, writing quality, missing sections, industry alignment, career trajectory, red flags, top 3 next steps. Optional cover letter generator (needs job title input).
- **Job-Specific Analysis** — requires pasted job listing. Adds: fit score, keyword gaps, bullet rewrites, ATS feedback, auto cover letter.
- **Job Search Advisor** — search strategy, target role guidance, and market positioning advice.
- **Career Coach** — career trajectory planning, skill gap analysis, and long-term development guidance.

---

## Navbar Standards

Every page has:
1. A red ticker banner (`.ticker-wrap`) with scrolling text — always full width
2. A sticky navbar with: GhostBust logo, nav links (Home / App / Community / Profile), UserSearch, Sign In/Out button

App.jsx uses `.app-nav` (sticky, z-index 200). Profile.jsx uses a `<div className="sticky-header">` that wraps ticker + nav together as one sticky unit. CommunityPage.jsx uses `.cp-nav`.

Do not use `position: fixed` on navbars. Use `position: sticky`.

---

## Application Data Storage

The job tracker stores application data in Supabase (`applications` table). Fully migrated from localStorage.

---

## Additional Pages

| File | Purpose |
|---|---|
| `tos.html` | Terms of Service — static, included in Vite build |
| `privacy.html` | Privacy Policy — static, included in Vite build |
| `public/ghost-index.html` | GhostIndex — standalone static public data dashboard. Live Supabase reads (anon key), bar charts by industry + job title, 5 hardcoded stats, job board cards, posting age breakdown, GhostLetter subscribe form. No React. Clean URL: `/ghost-index` via Vercel rewrite. |
| `api/subscribe.js` | Vercel serverless function — adds email to Resend audience |
| `api/jobSearch.js` | Vercel serverless function — proxies JSearch API (RapidAPI) for Find Jobs |
| `api/cron/onboarding.js` | Vercel cron — sends onboarding email sequence via Resend |
| `api/cron/scan.js` | Vercel cron — daily 3am UTC batch ghost scanner. Fetches from JSearch, scores with Claude, inserts 10 rows into ghost_scans. Auth: CRON_SECRET Bearer token. Requires RAPIDAPI_KEY in Vercel env. |
| `api/emails/templates.js` | HTML email templates for all 5 onboarding emails |
| `scripts/batchScan.js` | Node.js CLI script — batch ghost-scores jobs from JSearch API, inserts to ghost_scans. 207 job titles across 50 US cities. Run with `node scripts/batchScan.js --limit N` |
| `scripts/helpers/mapIndustry.js` | Shared industry mapping helper. `mapIndustry(title)` returns one of 24 industry strings or `"Other"`. Uses substring matching (longest-needle-first). Used by batchScan.js and api/cron/scan.js. |
| `scripts/mapIndustries.js` | One-time backfill script — updates `ghost_scans.industry` for rows currently set to `"Other"` with non-null title. Run with `node scripts/mapIndustries.js`. |

---

## UI Patterns

### Ghost Score Hero (VerdictCard)
The ghost score is displayed as a large hero number, not a compact box. Structure:
- **`.score-hero`** — flex row; large number left, meta right
- **`.score-hero-num`** — 112px Bebas Neue, colored by severity: `sc-green` (≤35), `sc-yellow` (36–60), `sc-red` (>60)
- **`.severity-bar`** — 3-segment bar: `.sev-seg.low` (green), `.sev-seg.mid` (gold), `.sev-seg.high` (red); only the active segment is `opacity: 1`
- **`.sub-score-row`** — flex row of 28px Bebas Neue sub-scores: Specificity, Transparency, Process, Confidence (colored by `scoreColor()` — inverse of ghost score coloring)
- The old 4-box `.score-row` and `.conf-bar-wrap` are replaced by this pattern. Do not revert to them.

### Skeleton Loading (TrackerTab)
When `!loaded`, render 3 `.skeleton-card` elements instead of a spinner or text. Each card contains three `.skeleton-line` divs with modifier classes `.title`, `.company`, `.chips` controlling width. Shimmer is `@keyframes shimmer` on a `linear-gradient` background with `background-size: 200% 100%`.

### AppCard
- `.app-title` — Bebas Neue 18px (not body font, not bold)
- No emojis in meta chips — status chip is plain text (e.g. "Applied"), source board chip has no 📍 prefix
- Toast label is "GHOSTBUST" (not "SIGNED IN")

### Stat Labels
`.stat-lbl` — `font-size: 9px`, `letter-spacing: 0.18em`. These are the labels under the large stat numbers in the tracker stats row.

### Board Grid
`.board-grid` — `repeat(2, 1fr)` on desktop, `1fr` on mobile (≤720px). Was previously 3-col.

### Profile Avatar
- `.avatar` — 96px × 96px
- `.avatar-wrap` — `margin-top: -48px`
- `.follow-stat-num` — 28px Bebas Neue

---

## Footer Standard

All pages share an identical footer: **GhostBust · TOS · Privacy · ghostbustofficial@gmail.com**

- `index.html` — inline styles in footer element
- `App.jsx` — `.footer` CSS class, centered flex row
- `CommunityPage.jsx` — `.cp-footer` CSS class
- `Profile.jsx` — `.profile-footer` CSS class

---

## index.html — Landing Page Features

- Cinematic intro overlay (6 slides, first-visit only, `gbIntroSeen` localStorage key)
- `window.gbOpenIntro()` — reopens overlay; REPLAY INTRO button in hero CTA row triggers it
- Email capture section ("The GhostBust Monthly") — POSTs to `/api/subscribe` (Resend)
- Profile navbar link — shows auth modal if not logged in (checks `sb-awhqwqhntgxjvvawzkog-auth-token` in localStorage)
- Four-card features grid (2×2), Founding Member section, demo scan section

---

## Onboarding Email Sequence

Implemented via a Vercel daily cron (`vercel.json` → `api/cron/onboarding.js`) that runs at 8 AM UTC.

### How it works
1. Fetches all users from Supabase auth admin API (service role key required)
2. For each of the 5 email types, finds users whose account age falls in the correct 24-hour window
3. Cross-references `email_sends` table to skip anyone already sent that email
4. Sends via Resend, records the send — guarantees no duplicates across cron runs

### Sequence

| Email | Delay | Subject |
|---|---|---|
| `day_0` | 0 days | You're a Founding Member. Here's what that means. |
| `day_2` | 2 days | five things that show up in ghost job listings |
| `day_5` | 5 days | your resume may never reach a human |
| `day_14` | 14 days | 72% of job seekers say the search damaged their mental health |
| `day_30` | 30 days | a month in (active) / no pressure — but the market got harder (dormant) |

Day 30 splits on activity: users with any row in `ghost_scans` or `resumes` get the active variant; everyone else gets the dormant variant.

### Required env vars (Vercel dashboard)
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Settings → API → service_role key
- `CRON_SECRET` — any random string; Vercel injects it as the Bearer token when triggering crons
- `RESEND_FROM_EMAIL` — verified domain sender, e.g. `GhostBust <onboarding@ghostbust.us>`

### Required migration
`supabase/migrations/20260324_email_sends.sql` — creates the `email_sends` deduplication table. Must be run in Supabase SQL editor before the cron fires.

---

## Phase 3 Roadmap

- 🔲 Pro tier ($12/month) via Stripe
- 🔲 The GhostBust Monthly newsletter
- 🔲 Ghost Job Index — public leaderboard by region and company
- 🔲 Chrome extension
- 🔲 Ghost score history and trends on profile
- 🔲 User Showcase — public portfolio/work display on profile for creatives, professionals, and track-record-based careers (designers, writers, marketers, attorneys, advisors, coaches, etc). Enables peer networking and discovery within the GhostBust community. Distinct from Career HQ (which is private/AI-driven). Revisit at 200 MAU alongside Ghost Job Index and profile expansion.
- 🔲 Programmatic SEO
- 🔲 Social auto-posting

---

## Design Decisions Log

- **Hero heading**: "Built For A Broken Market." — "Broken" chosen over "Rigged" for legal defensibility
- **Ghost logo placement**: inline with eyebrow text (Option B) — 14px ghost SVG at 70% opacity, left of eyebrow label on both app and community pages
- **App hero tone**: attitude-oriented (Option C from brainstorming) — compact hero + tab-specific intros
- **Find Jobs**: Rebuilt from URL-redirect model to full in-app job listing display via JSearch API. Natural language search with filters, live ghost scoring, salary display, job saving, detail modals. Intro line: "Describe your ideal role in plain English. AI searches real listings across job boards and ghost-scores every result in real time."
- **Application Tracker cards**: upgraded to modal popup windows with editable fields, Ghost Scan integration, Career HQ integration, and job posting URL field
- **Roadmap is public**: strategic Phase 4 details omitted, User Showcase and Ghost Job Index have fine print asterisks on roadmap.html

---

## Phase 2 Status (as of 2026-04-01)

**Completed:**
- Onboarding email sequence (5 emails: Day 0/2/5/14/30) via Vercel cron + Resend
- Landing page navbar redesigned to match app/community/profile style
- Profile nav link auth modal fixed on all pages (opens inline sign-in/sign-up form)
- Supabase Storage for avatar and banner photos (Profile.jsx)
- Ghost character as default avatar with color picker
- Ghost body color picker
- ROYGBIV + black/grey/white avatar color palette
- Community board (`CommunityPage.jsx`, `CommunityBoard.jsx`)
- User search dropdown (`UserSearch.jsx`)
- Inbox/messaging system (`InboxDrawer.jsx`)
- Career HQ tab (formerly RESUME) — renamed and live
- Resume Advisor (`ResumeAdvisor.jsx`) — Phase 2 flagship feature:
  - Private resume upload (PDF/DOCX) to Supabase Storage
  - PDF canvas preview via pdfjs-dist
  - DOCX HTML preview via mammoth.js
  - General Resume Review mode (8 feedback sections)
  - Job-Specific Analysis mode (fit score + keywords + bullets + ATS + cover letter)
  - Job Search Advisor mode (Mode 3) — live
  - Career Coach mode (Mode 4) — live
  - Analysis history saved to Supabase
  - Admin delete permissions for GhostBustOfficial
- Application Tracker migrated to Supabase (`applications` table)
- Find Jobs tab upgrades: saved searches, search history, AI refinement, one-click save to tracker
- Ghost detector API key reads from `VITE_ANTHROPIC_API_KEY` (no longer user-provided at runtime)
- Cinematic intro overlay on `index.html` (6-slide first-visit experience, scroll-locked)
- Landing page overhaul: hero CTA row, features grid (4 cards 2×2), Founding Member section
- Email capture section — "The GhostBust Monthly" newsletter, `/api/subscribe` serverless endpoint
- Terms of Service (`tos.html`) and Privacy Policy (`privacy.html`) pages
- Standardized footer across all pages (GhostBust · TOS · Privacy · Contact)
- Profile navbar link auth modal on all pages
- Page entrance animations (`gbFadeIn`) on all pages
- Tab content constrained to `max-width: 1280px`
- Full UI overhaul of app.html and profile.html (see UI Patterns below)
- **Profile auto-creation trigger** — `handle_new_user` Postgres function + trigger creates a `profiles` row on every new auth.users insert; fixes missing profile rows for users signed up before trigger existed
- **`username_changed_at` column** added to `profiles` table (`supabase/migrations/20260324_username_changed_at.sql`)
- **Username change feature** in Profile.jsx Career Profile tab: 30-day cooldown enforced client-side, uniqueness check (Postgres error code `23505`), validation (3–20 chars, alphanumeric + underscores only)
- **First-time username modal** in Profile.jsx: auto-shown for users with `user_XXXX` style usernames (Supabase default), prompts for a custom username on first visit
- **Bio editor** in Profile.jsx Career Profile tab: textarea with 300-char counter, saves to `profiles.bio`
- **Focus-loss / page-jump bug fixed** in Profile.jsx: inner tab components (`CareerProfileTab`, `OverviewTab`, `ActivityTab`) were defined as arrow functions inside the parent, causing remount on every keystroke; fixed by calling them as plain functions `{CareerProfileTab()}` instead of `<CareerProfileTab />`
- **Bug audit + fixes** (12 confirmed real bugs fixed across 5 files):
  - `InboxDrawer.jsx`: sendMessage error feedback + input restore, loadConversations try/catch, unread count try/catch
  - `App.jsx`: share link null feedback, clipboard API guard + prompt() fallback, stale board results cleared on industry change, saved searches error logging, search history floating promise caught
  - `CommunityPage.jsx`: region fetch .catch() to prevent unhandled rejection
  - `api/subscribe.js`: email validation tightened to reject malformed addresses

- **Sentry error tracking** — fully integrated. `src/sentry.js` init module wired into all 4 React entry points, error capture added to `api/claude.js` and `api/subscribe.js`, `sentryVitePlugin` + `sourcemap: true` in `vite.config.js`. Requires `VITE_SENTRY_DSN` env var.

- **API rate limiting** — 20 req/hr per user on `api/claude.js` (JWT-verified via Supabase auth), 3 req/hr per IP on `api/subscribe.js`. Backed by Supabase `rate_limits` table + atomic `check_and_increment_rate_limit` RPC. Shared utility at `api/lib/rateLimit.js`. Requires `20260325_rate_limits.sql` migration and `SUPABASE_URL` env var in Vercel.

- **Resume Advisor PDF export** — fully built and live. All four analysis modes have PDF download buttons: active analysis view, history detail view, and history list cards. Client-side html2canvas + jsPDF, GhostBust-branded dark PDF, per-mode content layout. Full implementation reviewed and approved, pushed to origin main. Spec at `docs/superpowers/specs/2026-03-25-resume-pdf-export-design.md`, plan at `docs/superpowers/plans/2026-03-25-resume-pdf-export.md`.

- **Inner tabs for Find Jobs** — Search / Saved Searches sub-tabs within the Find Jobs tab; saved searches promoted from inline section to dedicated tab
- **Inner tabs for Ghost Detector** — Scan / History sub-tabs; history shows chronological scan list with expand/collapse and full-report modal reusing VerdictCard; "Save to Tracker" from modal
- **Application Tracker restructured** — Prospects (Researching/Saved) and Applications (Applied+) sub-tabs with count badges; status change auto-migrates cards between tabs; tab-specific filters and empty states
- **`user_id` column on `ghost_scans`** — migration at `20260325_ghost_scans_user_id.sql`; scan insert now includes user_id for authenticated users
- **Application Tracker modal cards** — full editable modal popup with all fields, ghost score badge, "RUN GHOST SCAN" cross-tab navigation to Ghost Detector with prefill, "ANALYZE IN CAREER HQ" cross-tab navigation to Resume Advisor with prefill
- **Ghost Detector history tab** — chronological scan list with expand/collapse and full-report modal reusing VerdictCard; "Save to Tracker" from modal
- **Find Jobs improvements** — saved searches inner tab, search streak counter, saved searches nudge, last search pre-fill from localStorage, visual polish (border-radius, focus colors, hover shadows), intro line with board names
- **Profile toggle fixes** — `e.preventDefault()` on toggle `<label>` click to prevent native checkbox double-fire
- **Public roadmap page** (`roadmap.html`) — 4 phases, status badges, fine print asterisks on Ghost Job Index and User Showcase; added to all page footers (index.html, app.html, profile.html, community.html, tos.html, privacy.html) and landing page "BUILT IN PUBLIC" section
- **Tracker card polish** — dynamic left accent by ghost score, per-status color pills, UNSCANNED chip, enhanced typography and hover effects
- **Standardized hero section** (in progress) — shared compact hero for app.html and community.html with ghost logo in eyebrow, "Built For A Broken Market." heading, tab-specific intro lines for all four app tabs

- **Career Profile completion prompts** — nudge banner in App.jsx (below tabs, <60% complete), nudge in ResumeAdvisor AI Advisor tab (<5/8 fields), completeness card in Profile.jsx sidebar
- **Mobile responsiveness** — breakpoints added/fixed across all pages for 375px+ screens (nav scroll, padding, font scaling, preview height)
- **CI pipeline** — GitHub Actions runs `npm test` + `npm run build` on every push/PR to main
- **All 21 migrations confirmed applied** in Supabase (verified 2026-03-26)

- **Find Jobs rebuilt with JSearch API** — `SearchTab.jsx` completely rewritten. Natural language search via `api/jobSearch.js` (proxies JSearch/RapidAPI). Filter controls: Job Type, Date Posted, Industry dropdown, Job Board multi-select chips (Indeed, LinkedIn, ZipRecruiter, Glassdoor, Monster, SimplyHired — client-side filter). Live ghost scoring of results with 15s timeout, rate-limit detection. Salary display on cards and modal. Signal flags as clean rounded pills with human-readable text. Load More pagination. Detail modal with full description + "View on board" fallback link.
- **Save Job / Bookmarks** — star icon on each job card saves to `saved_jobs` Supabase table. Search/Saved view tabs with badge count. Migration: `20260328_saved_jobs.sql`
- **Batch ghost scanning script** — `scripts/batchScan.js` fetches from JSearch API, scores with Claude API directly, inserts into `ghost_scans`. 207 job titles across 22 categories, 50 US cities. Uses correct column names (`title`, `signal_flags`).
- **ghost_scans location columns** — `job_city`, `job_state` added via `20260328_ghost_scans_location.sql`
- **Landing page stat updates** — replaced duplicate hero stats with fresh data: 53% ghosting rate (Criteria Corp/Fortune), 3x less likely to hear back (Interview Guys), 100-200+ applications per offer (Zippia/BLS)
- **Public roadmap rewritten** — clean 4-phase structure (removed Phase 2.5)
- **GhostIndex public dashboard** (`public/ghost-index.html`) — standalone static page, no React. Live Supabase reads via anon key (paginated 1000-row batches, client-side aggregation). Bar charts: industry ghost rates + top 20 job titles, color-coded by score threshold (≤35 green, ≤60 gold, >60 red, CSS animated width). 5 hardcoded stats row. Job board cards grid. Posting age 5-bucket breakdown. GhostLetter subscribe form inserts to `ghostletter_subscribers`. Ghost SVG matches index.html design. All Space Mono text ≥10px, color #eeeae0. Clean URL via Vercel rewrite `/ghost-index` → `/ghost-index.html`. GHOSTINDEX nav link added to all pages (index.html, app.html, profile.html, community.html, tos.html, privacy.html, roadmap.html).
- **Industry classification** — `scripts/helpers/mapIndustry.js` shared helper with 24 industry buckets, substring matching longest-needle-first. Used by `scripts/batchScan.js` and `api/cron/scan.js`. `scripts/mapIndustries.js` backfill script updates existing rows. `ghost_scans.industry` column added via `20260329_ghost_scans_industry.sql`.
- **Daily scan cron** (`api/cron/scan.js`) — Vercel cron at 3am UTC, inserts 10 ghost-scored listings per day from JSearch + Claude. Added to `vercel.json`. Requires `RAPIDAPI_KEY` in Vercel env vars.
- **DATA SAFETY rules** added to CLAUDE.md — non-negotiable guardrails for destructive DB operations.
- **.env gitignored** — `git rm --cached .env` run to untrack; `.env`, `.env.*` added to `.gitignore`.

**Required env vars (Vercel dashboard):**
- `ANTHROPIC_API_KEY` — for `api/claude.js` proxy
- `RAPIDAPI_KEY` — for `api/jobSearch.js` (JSearch API) and `api/cron/scan.js`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for rate limiting + onboarding cron
- `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` — for error tracking
- `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` — for email capture
- `CRON_SECRET`, `RESEND_FROM_EMAIL` — for onboarding email cron
- Sending domain must be verified in Resend before `RESEND_FROM_EMAIL` will work
