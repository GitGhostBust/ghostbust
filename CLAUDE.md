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

- **`App.jsx`** — monolithic main app. All CSS in `const STYLE`. Handles auth session, tab routing (Find Jobs / Verify Listing / Tracker / Resume), application tracker, Claude API calls for ghost job scoring, and RegionModal first-login flow. Tab content panels are constrained to `max-width: 1280px; margin: 0 auto`.

- **`ResumeAdvisor.jsx`** — standalone Career HQ tab component (used inside App.jsx). Three inner tabs: My Resume (upload + preview), AI Advisor (four-mode analysis), History. Pro-gated (`founding_member = true`). Four modes: General Review, Job-Specific Analysis, Job Search Advisor, Career Coach. All four are live.

- **`Profile.jsx`** — monolithic profile page. Reads `?user=` query param. Handles own-profile edit vs. read-only view, follow/unfollow, inbox, avatar/banner uploads, ghost avatar customisation, RegionModal.

- **`CommunityPage.jsx`** — community board page with auth modal.

- **`UserSearch.jsx`** — self-contained search dropdown. Queries `profiles` with `ilike`. Used in App.jsx and Profile.jsx navbars.

- **`InboxDrawer.jsx`** — slide-out drawer for conversations/messages. Used only in Profile.jsx.

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

Two places call the Anthropic API directly from the browser:

1. **`App.jsx`** — ghost job scoring. API key read from `import.meta.env.VITE_ANTHROPIC_API_KEY`.
2. **`ResumeAdvisor.jsx`** — resume analysis and cover letter generation. API key read from `import.meta.env.VITE_ANTHROPIC_API_KEY`.

Required headers for direct browser calls:
```
x-api-key: <key>
anthropic-version: 2023-06-01
anthropic-dangerous-direct-browser-access: true
content-type: application/json
```

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

## Phase 2 Status (as of 2026-03-23)

**Completed:**
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
- Cinematic intro overlay added to `index.html` (6-slide first-visit experience)
- Page entrance animations (`gbFadeIn`) on all four pages
- Tab content constrained to `max-width: 1280px`

**Pending / known issues:**
- Resume Advisor requires `VITE_ANTHROPIC_API_KEY` env var set in `.env` and Vercel dashboard
- Migrations `20260322_*.sql` and `20260323_*.sql` must be run manually in Supabase SQL editor
- Intro overlay: scroll drift fix, final slide single EXPLORE GHOSTBUST button, HOW IT WORKS footer button → REPLAY INTRO
- Email capture on landing page not yet built
- Onboarding email sequence (Resend) not yet built
- Terms of Service and Privacy Policy pages not yet built
- UI overhaul for app.html and profile.html pending (after landing page work)
- Landing page update (accounts CTA, founding member pitch, new features) pending
