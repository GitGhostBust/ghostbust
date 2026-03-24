# Career Profile Expansion — Design Spec

**Date:** 2026-03-24
**Status:** Approved for implementation

---

## Overview

Expand the user profile to collect richer career context that feeds GhostBust's four AI advisory modes (General Resume Review, Job-Specific Analysis, Job Search Advisor, Career Coach). Add 8 new fields, restructure the profile page into a tabbed layout, and surface a privacy disclosure. All fields are user-controlled — each has a public/private visibility toggle that controls profile display only, not AI usage.

---

## Goals

1. Give the AI enough context to produce specific, personalized advice rather than generic output.
2. Let users share as much or as little as they want publicly — no hard privacy wall.
3. Surface a clear trust commitment (what GhostBust will never ask for) directly in the UI.
4. Make the profile page feel structured and purposeful, not a flat list of inputs.

---

## Profile Page Structure

### Tab Bar

Three tabs added below the hero section on both own-profile and public-profile views.

**Default active tab:** `"overview"` on every page load — own profile and public profile alike. The active tab is local UI state only; it is not reflected in or read from the URL query string. There is no `?tab=` parameter.



| Tab | Own Profile | Public Profile |
|---|---|---|
| **Overview** | Read-only display of public fields | Same |
| **Career Profile** | Edit hub for all career fields + visibility toggles | Read-only display of public career fields |
| **Activity** | Own scan history + tracked applications | Ghost scans hidden; applications shown only if show_tracked_jobs = true |

### Hero Section

Structure unchanged. Visual refresh applied. Avatar and banner photo uploads remain always available on own profile regardless of active tab — they are in the hero, not the Career Profile tab. The click-to-upload affordance on avatar and banner is gated by `isOwnProfile` only, not by any tab or editing state.

The Save and Cancel buttons move from the old edit card into the hero row (top-right corner, own profile only). They are visible at all times on own profile. Clicking Save upserts the full form state. Cancel resets local form state to last-loaded DB values (see State Shape).

---

## Retirement of `editing` Boolean

The `editing` boolean state variable is removed. Replace with tab-based conditional:

- **Own profile + Career Profile tab active** → show edit form (12 toggle rows + skills card)
- **Own profile + Overview or Activity tab active** → show read-only display
- **Public profile (any tab)** → always read-only

**Current places `editing` is used in Profile.jsx:**

| Usage | Replacement |
|---|---|
| Conditional render of edit card vs details card | `activeTab === "career" && isOwnProfile` |
| Save/Cancel button render | Move to hero row, gate with `isOwnProfile` |
| Cancel button inline arrow function resetting form state | Keep as inline arrow function, no rename needed |
| Avatar/banner click-to-upload | Currently gated by `editing` in Profile.jsx — replace with `isOwnProfile`. Specifically: avatar `className` condition, avatar `onClick` condition, banner `className` condition, banner `onClick` condition, and the `editing && showAvatarPicker` render condition for the avatar picker panel — all replace `editing` with `isOwnProfile`. The avatar picker is available on own profile **regardless of which tab is active** — it is a hero-level control, not scoped to the Career Profile tab. |

---

## Canonical 12 Fields

The AI Completeness Meter covers these 12 fields. A field counts as "filled" if its value is a non-empty, non-null string.

| # | Field | DB Column | Type | Existing? |
|---|---|---|---|---|
| 1 | Employment Status | `employment_status` | varchar | ✓ |
| 2 | Current / Recent Role | `current_job` | varchar | ✓ |
| 3 | Industry | `industry` | varchar | ✓ |
| 4 | Education | `education` | varchar | ✓ |
| 5 | Experience (years) | `experience_years` | varchar | New |
| 6 | Seniority Level | `seniority_level` | varchar | New |
| 7 | Work Arrangement | `work_arrangement` | varchar | New |
| 8 | Target Roles | `target_roles` | text | New |
| 9 | Salary Band | `target_salary_band` | varchar | New |
| 10 | Search Duration | `search_duration` | varchar | New |
| 11 | Career Goal | `career_goal` | text | New |
| 12 | Skills | `skills` | text | New |

Completeness = count of non-empty fields / 12. Skills count as filled if parsed tag list has ≥ 1 entry. Target roles count as filled if parsed list has ≥ 1 entry. Completeness is unaffected by visibility toggle state.

---

## Visibility Toggle Columns

### Existing (unchanged behaviour in hero)

- `show_employment_status` — controls employment_status tag in hero row
- `show_current_job` — controls current_job display in hero row (hero tag shows `current_job · industry` as one tag when this is true)
- `show_education` — controls education tag in hero row
- `show_tracked_jobs` — controls applications section in Activity tab for visitors

### New: `show_industry` (added)

`industry` gets its own visibility toggle in the Career Profile tab. Precise behaviour by location:

- **Hero row tag** (`current_job · industry`): gated by `show_current_job` only. The industry value appends to the hero tag whenever `show_current_job = true`, regardless of `show_industry`. **This is an intentional product decision** — the hero tag is a combined "role at company" signal; industry is treated as part of that context, not a standalone field. The existing code (`{profile.current_job}{profile.industry ? " · " + profile.industry : ""}`) is not modified on either the own-profile or public-profile render path. A visitor sees the same hero tag logic as the owner — industry in the hero tag whenever `show_current_job = true`.
- **Career Details card (Overview tab)**: industry row shown/hidden by `show_industry` independently.

This means a user who sets `show_industry = false` will hide industry from the Career Details card, but it may still appear in the hero tag if `show_current_job = true`. The help text on the `show_industry` toggle should read: *"Hides industry from the Career Details card. Industry may still appear in your role tag above."* to make this explicit to the user.

### New Fields (all default false)

- `show_industry` (boolean, default false) — new
- `show_experience_years` (boolean, default false)
- `show_seniority_level` (boolean, default false)
- `show_work_arrangement` (boolean, default false)
- `show_target_roles` (boolean, default false)
- `show_target_salary_band` (boolean, default false)
- `show_search_duration` (boolean, default false)
- `show_career_goal` (boolean, default false)
- `show_skills` (boolean, default false)

**What visibility controls:** profile display only. All field values are always included in the AI prompt context regardless of toggle state. The privacy disclosure text states this explicitly.

---

## State Shape

All career field values and all visibility booleans live in a single `form` state object, consistent with the existing pattern. The upsert spreads `...form` as today.

The existing 4 career fields (`employment_status`, `current_job`, `industry`, `education`) and their 4 existing visibility toggles (`show_employment_status`, `show_current_job`, `show_education`, `show_tracked_jobs`) are already in the `form` object — do not add or remove them, just leave them as they are. `show_industry` is **new** and must be added to `form` (it does not currently exist in Profile.jsx's form object or in the DB).

**Null coercion on load:** When loading profile data from DB into `form`, existing rows (created before the migration) will return `null` for all 9 new boolean columns and all 8 new text/varchar columns. Coerce on load:
- New boolean columns (`show_industry`, `show_experience_years`, etc.) → `data.show_industry ?? false`
- New text/varchar columns (`experience_years`, `career_goal`, `skills`, etc.) → `data.experience_years ?? ""`

This ensures the completeness meter (checks for non-empty strings) and toggle state work correctly for all users, not just those who save after the migration.

New keys added to the `form` object:

```js
// Field values (8 new)
experience_years: "",
seniority_level: "",
work_arrangement: "",
target_roles: "",        // stored as comma-separated string
target_salary_band: "",
search_duration: "",
career_goal: "",
skills: "",              // stored as comma-separated string

// Visibility toggles (9 new: 1 for industry + 8 for new fields)
show_industry: false,
show_experience_years: false,
show_seniority_level: false,
show_work_arrangement: false,
show_target_roles: false,
show_target_salary_band: false,
show_search_duration: false,
show_career_goal: false,
show_skills: false,
```

Local derived state (not in form, not saved to DB):
- `skillTags` — string array, derived from `form.skills` by splitting on comma and trimming
- `targetRolesList` — string array, derived from `form.target_roles` by splitting on comma and trimming

**Sync rule:** `skillTags` and `targetRolesList` are React state managed with their own `useState` setters (`setSkillTags`, `setTargetRolesList`). User interactions call these setters (add tag → `setSkillTags([...skillTags, newTag])`; remove tag → `setSkillTags(skillTags.filter(...))`), which trigger re-renders. They are NOT synced back to `form.skills` / `form.target_roles` mid-session — `form.skills` and `form.target_roles` retain their last-loaded string values throughout the session.

On save, construct the upsert payload as a new object — do NOT mutate `form`:
```js
const payload = {
  ...form,
  skills: skillTags.join(", "),
  target_roles: targetRolesList.join(", "),
};
// upsert payload, not form
```

**Cancel behavior:** Clicking Cancel: (1) reset `form` to the last-loaded DB snapshot via its setter, (2) re-derive `skillTags` = parse the snapshot's `skills` field (split on comma, trim, filter empty), (3) re-derive `targetRolesList` the same way from `target_roles`. No separate snapshot of the arrays is needed.

---

## Select Field Option Lists

**Employment Status** (existing): Actively Looking / Open to Opportunities / Employed — Not Looking / Freelancing / Student / On a Career Break

**Experience (years)**:
Under 1 year / 1–2 years / 3–5 years / 6–10 years / 10+ years

**Seniority Level**:
Intern / Entry-level / Mid-level / Senior / Lead / Principal / Executive

**Work Arrangement**:
Remote only / Remote or Hybrid / Hybrid / In-office / Flexible / No preference

**Target Salary Band**:
Under $40k / $40k–$60k / $60k–$80k / $80k–$100k / $100k–$130k / $130k–$160k / $160k–$200k / $200k+ / Prefer not to say

**Search Duration**:
Just started (< 1 month) / 1–3 months / 3–6 months / 6–12 months / Over a year / Not actively searching

---

## Field Validation

**Target Roles** (tag-chip UI, max 3):
- Uses the same tag-chip pattern as Skills. Text input → press Enter or comma to add → appended to `targetRolesList` array as a tag chip with ✕ to remove.
- Stored as plain text comma-separated string in `target_roles` column
- Client parses by splitting on comma and trimming whitespace → `targetRolesList` array on load
- Max 3 enforced: once 3 tags present, text input is disabled with inline message "Maximum 3 roles"
- The inline edit row for `target_roles` in the Career Profile tab shows this tag input, NOT a plain `<input>`. (The "Text fields → `<input>`" row in the edit interaction table applies to `current_job`, `industry`, and `education` only — not `target_roles`.)
- No server-side constraint

**Career Goal** (text, max 200 chars):
- DB column: `text` (no DB-level constraint)
- Client enforces 200-char max; `<textarea maxLength={200}>`
- Live character counter below field: "143 / 200"

**Skills** (text, comma-separated tags, max 10):
- DB column: `text`; stored as comma-separated trimmed values
- On load: split on comma, trim each, filter empty strings → `skillTags` array
- On save: `skillTags.join(", ")` → written to `form.skills`
- Commas within a skill name are not supported
- Max 10: "+ Add skill" input disabled with tooltip "Maximum 10 skills" once 10 tags present

---

## Overview Tab

Read-only on both own-profile and public views.

**Career Details card** — label/value rows for each of the 12 fields where:
- The field's visibility toggle is true, AND
- The field value is non-empty

Fields that are off or empty are omitted entirely. Card is hidden if no fields qualify.

**Skills card** — tag display (read-only) if `show_skills = true` and skills non-empty.

**Own-profile footnote:** *"[N] field(s) set to private — edit in Career Profile tab"* where N = count of filled fields with toggle off. Hidden if N = 0.

**Own-profile, all fields private or empty:** Overview tab always visible (never hidden for owner). Shows: *"Nothing public yet — go to Career Profile to add details and choose what to show."*

**Public profile, no public fields:** Career Details card and Skills card both hidden. No message shown to visitors.

---

## Career Profile Tab

### Own Profile (Edit Mode)

#### 1. AI Completeness Meter

Blood-red top-border card. Percentage = filled fields / 12, live-updated as fields change.

```
AI CONTEXT COMPLETENESS                          62%
More context = sharper advice across all four AI modes.
Each field you fill in improves your results.
```

#### 2. Privacy Disclosure (expandable)

Collapsed by default. Trigger:
> *"GhostBust will never ask for certain information ▾"*

Expanded content — "We will never ask for:":
- Salary history *(target range is fine — history is not)*
- Bank account, routing, or financial account numbers
- Social Security or government ID numbers
- Passwords or security credentials
- Health, disability, or medical information
- Immigration status
- Home address

Footer:
> *"GhostBust is built for job seekers, not recruiters. All fields you fill in are used by GhostBust AI on your behalf — never sold or shared with employers. Visibility toggles control what appears on your public profile only; the AI always has access to everything you enter here to give you the best advice possible."*

#### 3. Public Info Card — 12 Toggle Rows

One row per field (12 rows total). Each row:
- **Left:** field label + current value (italic "not set" in ghost colour if empty)
- **Right:** visibility toggle (`show_*` boolean). Toggle click updates the relevant key in `form` immediately (local state only — not auto-saved to DB).

**Edit interaction:** Clicking anywhere on the label/value area of a row (not the toggle switch) expands an inline edit control directly below the row:
- Select fields → `<select>`
- Text fields (current_job, industry, education) → `<input>`
- target_roles → tag-chip input (see Field Validation section)
- career_goal → `<textarea>` with character counter
- Only one row open at a time; opening a new row closes the previous one

Inline edit closes on blur or Escape. Changes update `form` state immediately but are not saved to DB until Save is clicked.

**No dirty state tracking required.** The Save button is always enabled on own profile — clicking it always upserts the current `form` state (plus serialized tag arrays). There is no "unsaved changes" indicator or prompt-on-navigate. This is consistent with the existing Profile.jsx save behaviour.

**Save button location:** In the hero row (top-right corner of the hero section), always visible on own profile regardless of active tab. A user can click Save from Overview or Activity tab — the upsert fires with whatever is currently in `form` (including any tag array values serialized as described above). This is intentional: the Save button is a global "save my profile" action, not scoped to any tab.

#### 4. Skills Card

Separate card below the Public Info card. Card header has a visibility toggle (toggles `show_skills`).

- Current skills displayed as removable tags (✕ button on each)
- Text input below: Enter skill name → press Enter or comma to add → appended to `skillTags`
- Helper: *"Up to 10 · used by AI to identify keyword gaps and bullet improvements"*
- Input disabled with tooltip once 10 tags present

### Public Profile (Career Profile Tab, Read-Only)

Career Details card showing all public fields. Skills card if show_skills = true. No edit controls.

---

## Activity Tab

**Own profile:** Lazy-loaded when tab first becomes active. Use a `activityLoaded` boolean state (initialized `false`). In a `useEffect` that watches `activeTab`: when `activeTab === "activity"` and `activityLoaded === false`, run the fetch and set `activityLoaded = true` on completion. Subsequent tab switches back to Activity skip the fetch. No skeleton required — show a simple "Loading..." text while fetching.
- **Recent Ghost Scans** — `.from("ghost_scans").select("company, title, ghost_score, created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(5)`. If empty: "No scans yet."
- **Recent Applications** — `.from("applications").select("title, company, status, saved_at").eq("user_id", profile.id).order("saved_at", { ascending: false }).limit(5)`. If empty: "No applications tracked yet."

**Public profile:** The Activity tab is visible as a clickable tab but its content is governed by `isOwnProfile` at render time — not by whether the tab was reached via click. Ghost scan section: render only if `isOwnProfile`. Applications section: render only if `show_tracked_jobs = true` (regardless of `isOwnProfile`). A public visitor who navigates to the Activity tab should never see ghost scan data even if they construct a direct URL or interact with the tab before data loads.

Both sections read-only. No links out to app tracker or scan tool.

---

## Database Migration

File: `supabase/migrations/20260324_career_profile_expansion.sql`

Note: `20260324_email_sends.sql` also uses this date prefix. Supabase applies migrations alphabetically — `_career_profile_expansion` sorts after `_email_sends`, so order is correct.

Adds **17 columns** to `profiles`:

```sql
-- 8 new career field columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS experience_years    varchar,
  ADD COLUMN IF NOT EXISTS seniority_level     varchar,
  ADD COLUMN IF NOT EXISTS work_arrangement    varchar,
  ADD COLUMN IF NOT EXISTS target_roles        text,
  ADD COLUMN IF NOT EXISTS target_salary_band  varchar,
  ADD COLUMN IF NOT EXISTS search_duration     varchar,
  ADD COLUMN IF NOT EXISTS career_goal         text,
  ADD COLUMN IF NOT EXISTS skills              text;

-- 9 new visibility toggle columns (show_industry + 8 new fields)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_industry             boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_experience_years     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_seniority_level      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_work_arrangement     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_target_roles         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_target_salary_band   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_search_duration      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_career_goal          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_skills               boolean DEFAULT false;
```

No changes to existing columns. No RLS changes needed.

---

## AI Prompt Integration

**Pre-existing bug to fix at the same time:** The existing `.select()` calls in all 4 ResumeAdvisor modes include `display_name` in the column list, but the actual column name is `full_name`. This causes a silent null — no crash, but the user's name is missing from the AI prompt. Fix in two steps: (1) In the `.select()` string for each of the 4 modes, replace the literal text `display_name` with `full_name`. (2) In the prompt-building code for each mode, audit any reference to `profile.display_name` or `data.display_name` and rename it to `profile.full_name` / `data.full_name` respectively. Both steps are needed — fixing only the select will return the right data under the `full_name` key, but the prompt will still send null until the downstream reference is also updated.

Each of the 4 ResumeAdvisor modes makes its own independent Supabase `.select()` call to fetch profile data — there are 4 separate call sites, one per mode. Add the new columns to each of these 4 calls independently.

Add new columns to the `.select()` call in all 4 ResumeAdvisor modes:

```
experience_years, seniority_level, work_arrangement, target_roles,
target_salary_band, search_duration, career_goal, skills
```

Append non-empty values to the `PROFILE:` context line:

```
Experience: 6 years | Seniority: Senior | Target roles: Head of Design, Design Lead |
Salary target: $120k–$160k | Search: 1–3 months | Work preference: Remote or Hybrid |
Goal: Move into design leadership at Series B–D startup |
Skills: Figma, User Research, Design Systems, Prototyping
```

All fields sent to AI regardless of visibility toggle. Skills stored as comma-separated string — pass as-is to the prompt (no need to split/rejoin).

---

## What Is Not In Scope

- Searching or filtering users by career fields
- Recruiter-facing features
- Profile completeness email/push notifications
- Resume parsing to auto-fill fields
- Changes to RegionModal flow
- Server-side validation on text field lengths

---

## Acceptance Criteria

- [ ] Migration runs without error; 17 new columns present in `profiles`
- [ ] All 12 field values + 9 new visibility toggles load from DB on profile load
- [ ] All values save in a single upsert on Save click; Cancel resets to loaded values
- [ ] Avatar/banner uploads still work on own profile regardless of active tab
- [ ] Inline row edit and toggle click work independently (toggle does not open edit)
- [ ] Only one inline edit row open at a time
- [ ] Overview tab: only toggled-on non-empty fields shown; always visible on own profile
- [ ] Skills tag input: add on Enter or comma, remove with ✕, max 10 enforced
- [ ] Target roles: max 3 enforced client-side
- [ ] Career goal: 200-char counter visible, enforced via maxLength
- [ ] Completeness meter live-updates as fields change
- [ ] Privacy disclosure expands/collapses; states visibility = display only not AI
- [ ] Activity tab: ghost scans visible to owner only; applications gated by show_tracked_jobs for visitors
- [ ] All 4 ResumeAdvisor modes include new fields in prompt context
- [ ] `npm run build` passes with no errors
