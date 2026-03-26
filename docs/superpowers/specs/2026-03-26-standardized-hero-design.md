# Standardized Page Hero — Design Spec

## Goal

Replace the app page's redundant logo header and the community page's bespoke hero with a shared compact hero structure. Improve visual hierarchy on the app page by promoting tab-specific intro lines.

## Architecture

Both `App.jsx` and `CommunityBoard.jsx` adopt the same hero layout:

```
┌──────────────────────────────────────────────────┐
│  [ghost-icon] eyebrow (9px Space Mono, --blood)   │
│  heading (Bebas Neue clamp, --paper + --blood em) │  [optional right column]
│                                                    │
└──────────────────────────────────────────────────┘
```

Grid: `grid-template-columns: 1fr auto; align-items: end`. Falls to single column on mobile (≤600px).

### Ghost Logo Mark

The favicon ghost SVG (`public/favicon.svg`) is inlined in the eyebrow as a 14px icon at 70% opacity, sitting left of the eyebrow text. This gives both pages a consistent brand mark without competing with the heading.

```html
<div class="page-hero-eyebrow">
  <svg class="page-hero-ghost" width="14" height="14" viewBox="0 0 32 32">
    <path d="M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z" fill="#eeeae0" opacity="0.9"/>
    <circle cx="13" cy="14" r="2" fill="#d42200"/>
    <circle cx="19" cy="14" r="2" fill="#d42200"/>
  </svg>
  // GHOSTBUST APP
</div>
```

The SVG is inlined (not an `<img>`) so it renders without a network request and respects the page's color context.

## Page-Specific Content

### App Page (`App.jsx`)

**Hero (above tabs):**
- Eyebrow: `// GHOSTBUST APP`
- Heading: `Built For A <em>Broken Market.</em>`
- Right column: subtle "← GHOSTBUST.US" link (monospace, muted, bordered) linking to `/`

**Removals:**
- Delete the old `.header` section (logo-eyebrow, logo-title, logo-sub, ghost-float, back button)
- Delete associated CSS: `.header`, `.logo-eyebrow`, `.logo-title`, `.logo-sub`, `.ghost-float`, `@keyframes float`

**Tab-specific intro lines (below inner tabs in each tab panel):**

| Tab | Intro line |
|-----|-----------|
| Find Jobs | `Indeed, LinkedIn, ZipRecruiter, Wellfound, Monster, SimplyHired — <strong>searched and saved all at once.</strong>` |
| Ghost Detector | `Paste a job listing. AI scans for <strong>red flags, vague language, and ghost patterns.</strong>` |
| Application Tracker | `Every application, <strong>from saved to offer</strong> — tracked in one place.` |
| Career HQ | `Upload your resume. Get <strong>AI-powered analysis, coaching, and career strategy.</strong>` |

Intro lines use the existing `.search-intro` class (11px Space Mono, `--muted`, with `<strong>` in `--paper`). The Find Jobs intro already exists and stays as-is. Ghost Detector, Tracker, and Career HQ each get a new intro div at the top of their panel.

### Community Page (`CommunityBoard.jsx`)

**Hero (existing location, restyled):**
- Eyebrow: `// COMMUNITY BOARD`
- Heading: `Real People. <em>Real Experiences.</em>`
- Right column: keeps existing NEW POST button + region badge

**Removals:**
- Delete the old `.cb-hero-desc` italic subtitle line ("Share ghost job encounters...")
- The hero sizing shrinks from `clamp(36px, 6vw, 60px)` to match the standardized compact size

## Shared CSS

New class names prefixed with `.page-hero-`:

```css
.page-hero {
  padding: 24px 0 20px;
  border-bottom: 1px solid var(--border);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 16px;
}

.page-hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--blood);
  margin-bottom: 6px;
}

.page-hero-ghost {
  flex-shrink: 0;
  opacity: 0.7;
}

.page-hero-heading {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(28px, 5vw, 42px);
  line-height: 0.94;
  letter-spacing: 0.03em;
  color: var(--paper);
}

.page-hero-heading em {
  color: var(--blood);
  font-style: normal;
}

@media (max-width: 600px) {
  .page-hero { grid-template-columns: 1fr; }
}
```

These classes are defined in each component's own STYLE string (per codebase convention — no shared CSS file). Both components define the identical block.

## Tab Intro Pattern

All four app tabs use the same intro pattern:

```css
.tab-intro {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.03em;
  line-height: 1.6;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.tab-intro strong {
  color: var(--paper);
  font-weight: 400;
}
```

This replaces the existing `.search-intro` class (rename for generality). The Find Jobs tab already has this; the other three tabs each get one `<div className="tab-intro">` at the top of their panel content.

## Scope

**Files modified:**
- `src/App.jsx` — replace header, add tab intros, update CSS
- `src/CommunityBoard.jsx` — replace hero with standardized version, update CSS

**No new files.** No database changes. No new dependencies.

## What This Does NOT Change

- Ticker and nav remain untouched on both pages
- Tab bar structure and behavior unchanged
- All existing tab content (search form, ghost detector, tracker, career HQ) unchanged
- Community board filters, posts, and all content below the hero unchanged
- Profile page not affected (different layout pattern)
