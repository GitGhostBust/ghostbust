# Resume Advisor PDF Export — Design Spec

**Date:** 2026-03-25
**Feature:** Downloadable branded PDF of AI analysis results from Resume Advisor

---

## Goal

Users can download a styled, GhostBust-branded PDF of any analysis result — from both the active analysis view and the history tab — covering all four modes.

---

## Scope

**In scope:**
- PDF export for all four analysis modes: General Review, Job-Specific Analysis, Job Search Advisor, Career Coach
- Export trigger from two places: active analysis view (after analysis completes) and history tab (per history entry + history detail view)
- Tall single-page PDF (non-standard height, portrait width = A4 794px, height computed from content)
- Fully client-side (no server involvement)
- GhostBust visual identity: dark background, blood red accents, Bebas Neue / Libre Baskerville / Space Mono fonts

**Out of scope:**
- Multi-page PDFs
- Server-side rendering or PDF generation
- Email delivery of PDF
- Print CSS / `window.print()`
- Export of resume file itself (only the analysis results)

---

## New Dependency

**`jspdf@^2`** must be installed before implementation:

```bash
npm install jspdf@^2
```

Pinning to v2.x is required — v3 may change the import shape. `html2canvas` is already in `package.json` (`^1.4.1`). `jsPDF` is a separate package and is NOT currently installed.

---

## Technical Approach

Use **html2canvas + jsPDF**. `html2canvas` is already used for the share card receipt in `App.jsx`. Pattern:

1. A hidden `<div id="pdf-render-target">` lives in `ResumeAdvisor.jsx`, off-screen with `visibility: hidden; position: absolute; left: -9999px; top: 0` (NOT `display: none` — html2canvas requires the element to be in the layout)
2. When export is triggered, populate the div with the PDF page HTML for the analysis
3. **Force a reflow** before calling html2canvas: `await new Promise(r => setTimeout(r, 50))` — without this, the off-screen div may not have completed layout, causing html2canvas to capture zero height
4. Call `html2canvas(div, { scale: 2, useCORS: true, allowTaint: false })`
5. Pass canvas to `jsPDF` to create a tall single-page PDF matching content height
6. Call `pdf.save(filename)` to trigger browser download
7. Clear render div contents after download (memory cleanup)

The resulting PDF is portrait-oriented with A4 width and variable height. It is not A4-constrained — content that extends beyond A4 height renders correctly as a longer page.

All logic lives in `exportAnalysisToPdf(analysis, resumeFileName, mode)` inside `ResumeAdvisor.jsx`.

### Import pattern

Use **dynamic imports** for both `html2canvas` and `jspdf` — consistent with how `html2canvas` is already used in `App.jsx`. This keeps both heavy libraries out of the initial bundle:

```js
async function exportAnalysisToPdf(analysis, resumeFileName, mode) {
  const [html2canvasMod, jspdfMod] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  var html2canvas = html2canvasMod.default || html2canvasMod;
  var jsPDF = jspdfMod.default || jspdfMod.jsPDF; // jsPDF v2 ships as named export { jsPDF } in some bundler configs
  // ... rest of export logic
}
```

### jsPDF constructor

Always specify `unit: "px"` to avoid unit mismatch with canvas pixel dimensions:

```js
const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
pdf.save(filename);
```

The `/ 2` accounts for `scale: 2` in the html2canvas call. Without `unit: "px"`, jsPDF defaults to `"mm"` and the format array would be interpreted as millimeters, producing a vastly incorrect page size.

---

## Font Rendering Note

Fonts are loaded via `@import url(https://fonts.googleapis.com/...)` in component STYLE strings. When html2canvas captures the hidden render div, Google Fonts may be blocked by CORS. Mitigations:
- Use `useCORS: true` in the html2canvas call (same as the share card in `App.jsx`)
- The hidden div must NOT be `display: none` (visibility: hidden is required)
- If fonts still fail to render, the PDF will fall back to system sans-serif — this is acceptable behavior, not an error

---

## JSON Field Parsing

Several analysis fields are stored in Supabase as **JSON strings** (not parsed arrays/objects). The export function must parse them with try/catch before use, exactly as the result components do:

| Field | Type when stored | Used in |
|---|---|---|
| `data.next_steps` | JSON string → array | General Review, Job Search Advisor, Career Coach |
| `data.bullet_rewrites` | JSON string → array of `{original, rewritten}` | Job-Specific |
| `data.keyword_gaps` | JSON string → array of strings | Job-Specific |
| `data.ats_feedback` | JSON string → array of `{question, coaching}` | Career Coach only |

**Important:** the `result` object for the active analysis view has already-parsed arrays for these fields (set via `setResult(Object.assign({}, saved, { next_steps: parsed.array, ... }))`), while history entries loaded from Supabase carry raw JSON strings. The parse-or-passthrough pattern below handles both:

```js
var nextSteps = [];
try { nextSteps = typeof data.next_steps === "string" ? JSON.parse(data.next_steps) : (data.next_steps || []); if (!Array.isArray(nextSteps)) nextSteps = []; } catch(e) { nextSteps = []; }
```

This applies to every field in the table above. Never assume the field is always a string or always an array — always use the `typeof === "string" ? JSON.parse : value` guard.

For `keyword_gaps`, if parse fails, fall back to splitting on commas (same as `ComprehensiveResults`).

---

## PDF Page Structure

Fixed width: **794px** in the render div. Height: auto (content-driven).

```
┌──────────────────────────────────────────────┐
│  [4px left bar: --blood]                      │
│  GhostBust logo (Bebas Neue 22px, --paper)   │  ← Header band
│  ghostbust.us                  2026-03-25    │     bg: #070709, padding 16px 24px
├──────────────────────────────────────────────┤
│  gabriel-resume.pdf    [GENERAL REVIEW]       │  ← Filename + mode badge row
├──────────────────────────────────────────────┤
│  [Score hero — if applicable, see per-mode]  │
│  [Mode-specific content — see below]         │
├──────────────────────────────────────────────┤
│  ghostbust.us · AI-generated · Not advice    │  ← Footer
└──────────────────────────────────────────────┘
```

---

## Per-Mode Content

Content maps directly to what the existing result components render. The PDF render function reads the same `analysis` object fields.

### General Review (`mode === "general"`)

- Strength score hero (large Bebas Neue number, colored by score threshold, `data.strength_score`)
- 2-column grid of 6 cards:
  - Formatting Feedback (`data.formatting_feedback`)
  - Writing Quality (`data.writing_quality`)
  - Missing Sections (`data.missing_sections`)
  - Industry Alignment (`data.industry_alignment`)
  - Career Trajectory (`data.career_trajectory`)
  - Red Flags (`data.red_flags`)
- Next Steps: numbered list of 3 items (`data.next_steps` — parse as JSON string first)

### Job-Specific Analysis (`mode === "job_specific"`)

- Two score heroes side by side: Fit Score (`data.fit_score`) + Strength Score (`data.strength_score`), colored by threshold
- Keyword Gaps: pill tags (`data.keyword_gaps` — parse as JSON string first)
- Bullet Rewrites: before/after pairs (`data.bullet_rewrites` — parse as JSON string first, array of `{original, rewritten}`)
- ATS Feedback: paragraph (`data.ats_feedback` — plain string for this mode, NOT parsed as JSON)
- Cover Letter: full text in bordered box (`data.cover_letter`) — omit entire section if null/empty

### Job Search Advisor (`mode === "job_search_advisor"`)

Data is mapped to shared `resume_analyses` columns during save (see `handleJobSearchAdvisor` in `ResumeAdvisor.jsx`):

| Section title | Source field | Notes |
|---|---|---|
| Search Readiness Score | `data.fit_score` | Score hero with bar + readiness label: "Ready to Apply" (≥70) / "Nearly There" (≥40) / "Build Before Applying" (<40) |
| Search Readiness Summary | `data.strength_justification` | Subtitle paragraph below the score hero |
| Target Role Clarity | `data.career_trajectory` | paragraph |
| Regional Market Intelligence | `data.industry_alignment` | paragraph |
| Job Board Strategy | `data.formatting_feedback` | paragraph |
| Application Cadence | `data.writing_quality` | paragraph |
| Immediate Action Plan | `data.next_steps` | Parse as JSON string → array of 5 strings, render as numbered list |
| Ghost Job Avoidance | `data.red_flags` | paragraph, gold left border accent |

### Career Coach (`mode === "career_coach"`)

**No score hero.** `fit_score` and `strength_score` are saved as `0` for career coach — do not render any score section.

Data is similarly mapped to shared columns (see `handleCareerCoach` in `ResumeAdvisor.jsx`):

| Section title | Source field | Notes |
|---|---|---|
| Career Stage Assessment | `data.career_trajectory` | paragraph |
| Skills Gap Analysis | `data.missing_sections` | paragraph |
| Interview Preparation | `data.ats_feedback` | Parse as JSON string → array of `{question, coaching}` objects — render as Q&A pairs (Question label + text, then "How to Answer" label + coaching text) |
| Salary Intelligence | `data.writing_quality` | paragraph |
| Application Pattern Analysis | `data.industry_alignment` | paragraph |
| 30-Day Career Action Plan | `data.next_steps` | Parse as JSON string → array of 4 strings — render as WK 1 / WK 2 / WK 3 / WK 4 labeled blocks (each string is one week's content) |
| Honest Assessment | `data.red_flags` | paragraph, red (`#d42200`) left border accent |

---

## Visual Specification

Matches the GhostBust design system exactly:

| Element | Value |
|---|---|
| Page background | `#070709` |
| Header band bg | `#070709` with `4px solid #d42200` left border |
| Card bg | `#0e0e12` |
| Card border | `rgba(255,255,255,0.07)` |
| Primary text | `#eeeae0` |
| Secondary text | `rgba(238,234,224,0.45)` |
| Red accent | `#d42200` |
| Green accent | `#00e67a` |
| Gold accent | `#c99a00` |
| Display font | Bebas Neue — headings, score numbers, section titles |
| Body font | Libre Baskerville — feedback prose |
| Mono font | Space Mono — labels, badges, metadata |

Score coloring thresholds (matches existing `ResumeAdvisor.jsx` logic — `>= 70` green, `>= 40` gold, `< 40` red):
- Score ≥ 70: green (`#00e67a`)
- Score ≥ 40 and < 70: gold (`#c99a00`)
- Score < 40: red (`#d42200`)

---

## Export Entry Points

### 1. Active Analysis View

After analysis completes, a **"↓ Download PDF"** button appears **in the parent `AIAdvisorTab` component, below all result components** — not inside any individual result component (`ComprehensiveResults`, `CareerCoachResults`, etc.). This is because `exportAnalysisToPdf` and the `pdfExporting`/`pdfErrors` state live at the `AIAdvisorTab` level. The button is only visible when `result` is non-null (i.e., an analysis has completed).

- Style: ghost button (border: `1px solid rgba(255,255,255,0.07)`, bg: transparent, text: `rgba(238,234,224,0.45)`, hover: `#eeeae0`)
- Label: `↓ Download PDF`
- While generating: label `Generating…`, button disabled
- On error: show inline `Export failed — try again` text below button for 3 seconds, then clear

### 2. History Tab — List Cards

Each history card gets a small `↓` icon button on the right side, visible on hover.

- Same loading/error states as above
- `pdfExporting` holds the `id` of the entry currently being exported, so only that card's button shows "Generating…"

### 3. History Tab — Detail View

When `selectedAnalysis` is set (user has clicked into a history entry detail view), a **"↓ Download PDF"** button also appears below the detail result components. Same behavior as the active analysis view button.

---

## State

```js
const [pdfExporting, setPdfExporting] = useState(null); // analysis id string, or null
const [pdfErrors, setPdfErrors] = useState({});         // { [analysisId]: errorMessage }
```

`pdfExporting` is a string (analysis `id`) rather than a boolean so that only the specific button being exported shows the loading state.

`pdfErrors` is keyed by analysis id so error messages appear adjacent to the correct button, even when multiple history cards are visible simultaneously.

Clear a specific error after timeout: `setPdfErrors(prev => { const n = {...prev}; delete n[id]; return n; })`

---

## Resume Filename for History Exports

The `resume_analyses` table has a `resume_id` FK but does not store the resume filename directly. For history exports (list cards and detail view):

1. Look up `data.resume_id` on the analysis object
2. Find the matching resume in the `resumes` state array (already loaded in the component): `resumes.find(r => r.id === analysis.resume_id)?.file_name`
3. If not found (e.g., resume was deleted), fall back to `"resume"`

The `resumes` state is already available in the component's scope — no additional fetch needed.

---

## File Naming

```
ghostbust-[resume-stem]-[mode-slug]-[YYYY-MM-DD].pdf
```

Mode slugs:
- `"general"` → `general-review`
- `"job_specific"` → `job-specific`
- `"job_search_advisor"` → `job-search`
- `"career_coach"` → `career-coach`

Resume stem: `file_name` without extension, lowercased, spaces and underscores replaced with hyphens.

Example: `ghostbust-gabriel-resume-general-review-2026-03-25.pdf`

---

## Files Modified

- **`src/ResumeAdvisor.jsx`** only — no other files touched
  - Add hidden render div to JSX (off-screen, visibility: hidden)
  - Add `exportAnalysisToPdf(analysis, resumeFileName, mode)` async function (dynamic imports inside)
  - Add `pdfExporting` state (`string | null`)
  - Add `pdfErrors` state (`object`)
  - Add download button to active analysis results section (in `AIAdvisorTab`, below result components)
  - Add download button to history detail view (below `selectedAnalysis` result components)
  - Add download icon button to each history list card

- **`package.json`** — `npm install jspdf@^2` adds it as a dependency
