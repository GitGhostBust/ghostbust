# Career Profile Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 new career fields + 9 visibility toggles to Profile.jsx, restructure the profile page into three tabs (Overview, Career Profile, Activity), surface a privacy disclosure and AI completeness meter, and wire all new fields into all 4 ResumeAdvisor AI prompt contexts.

**Architecture:** The existing `Profile.jsx` monolith is extended in-place — no new files. The `editing` boolean is replaced with an `activeTab` state variable. All 17 new DB columns are added via a single migration. `ResumeAdvisor.jsx` receives 3 select call updates to fix a pre-existing `display_name` bug and add the 8 new fields to AI prompts.

**Tech Stack:** React 18, Supabase (Postgres), Vite. No TypeScript. No test framework — use `npm run build` and browser verification.

**Spec:** `docs/superpowers/specs/2026-03-24-career-profile-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260324_career_profile_expansion.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260324_career_profile_expansion.sql

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

-- 9 new visibility toggle columns
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

- [ ] **Step 2: Run migration in Supabase SQL editor**

Paste the above SQL into the Supabase dashboard → SQL Editor and run it.

Verify: Check the `profiles` table in Table Editor — confirm 17 new columns appear.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260324_career_profile_expansion.sql
git commit -m "feat: add career profile expansion migration (17 new columns)"
```

---

## Task 2: Update Profile.jsx — State Variables + `editing` Removal

**Files:**
- Modify: `src/Profile.jsx`

The existing `editing` boolean (line 313) is replaced with `activeTab`. The Save/Cancel buttons move from inside the edit card to the hero row. Avatar/banner click handlers are re-gated from `editing` to `isOwnProfile`.

- [ ] **Step 1: Replace `editing` state with `activeTab` + add new state variables**

Find the state block starting around line 311. Replace:
```js
const [editing, setEditing] = useState(false);
```
With:
```js
const [activeTab, setActiveTab] = useState("overview");
const [activityLoaded, setActivityLoaded] = useState(false); // MUST be false (not true) — controls lazy-load gate
const [activityScans, setActivityScans] = useState([]);
const [activityApps, setActivityApps] = useState([]);
const [activityLoading, setActivityLoading] = useState(false);
const [openEditRow, setOpenEditRow] = useState(null); // field key of open inline edit, or null
const [privacyOpen, setPrivacyOpen] = useState(false);
const [skillTags, setSkillTags] = useState([]);
const [targetRolesList, setTargetRolesList] = useState([]);
const profileSnapshotRef = React.useRef(null); // stores last-loaded DB values for Cancel
```

`profileSnapshotRef` is a ref (not state) because its value is read imperatively by the Cancel handler, not rendered. It is set in `loadProfile` after building `newForm`.

- [ ] **Step 2: Update the `form` initial state**

Find `const [form, setForm] = useState({` (line 340). Add 8 new field values and 9 new visibility keys:

```js
const [form, setForm] = useState({
  username: "", full_name: "", education: "", current_job: "",
  industry: "", employment_status: "", bio: "",
  show_full_name: false, show_education: false, show_current_job: false,
  show_employment_status: false, show_tracked_jobs: false,
  // 8 new career fields
  experience_years: "", seniority_level: "", work_arrangement: "",
  target_roles: "", target_salary_band: "", search_duration: "",
  career_goal: "", skills: "",
  // 9 new visibility toggles
  show_industry: false, show_experience_years: false, show_seniority_level: false,
  show_work_arrangement: false, show_target_roles: false, show_target_salary_band: false,
  show_search_duration: false, show_career_goal: false, show_skills: false,
});
```

- [ ] **Step 3: Update `loadProfile` to include new fields with null coercion**

Find the `setForm({...})` call inside `loadProfile` (around line 378). Replace it with:

```js
const newForm = {
  username: data.username || "",
  full_name: data.full_name || "",
  education: data.education || "",
  current_job: data.current_job || "",
  industry: data.industry || "",
  employment_status: data.employment_status || "",
  bio: data.bio || "",
  show_full_name: data.show_full_name || false,
  show_education: data.show_education || false,
  show_current_job: data.show_current_job || false,
  show_employment_status: data.show_employment_status || false,
  show_tracked_jobs: data.show_tracked_jobs || false,
  // new fields — null coercion for existing rows
  experience_years: data.experience_years ?? "",
  seniority_level: data.seniority_level ?? "",
  work_arrangement: data.work_arrangement ?? "",
  target_roles: data.target_roles ?? "",
  target_salary_band: data.target_salary_band ?? "",
  search_duration: data.search_duration ?? "",
  career_goal: data.career_goal ?? "",
  skills: data.skills ?? "",
  show_industry: data.show_industry ?? false,
  show_experience_years: data.show_experience_years ?? false,
  show_seniority_level: data.show_seniority_level ?? false,
  show_work_arrangement: data.show_work_arrangement ?? false,
  show_target_roles: data.show_target_roles ?? false,
  show_target_salary_band: data.show_target_salary_band ?? false,
  show_search_duration: data.show_search_duration ?? false,
  show_career_goal: data.show_career_goal ?? false,
  show_skills: data.show_skills ?? false,
};
setForm(newForm);
// derive tag arrays from loaded strings
setSkillTags(data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : []);
setTargetRolesList(data.target_roles ? data.target_roles.split(",").map(s => s.trim()).filter(Boolean) : []);
// store snapshot for Cancel — stored AFTER newForm is built so it holds the same values
profileSnapshotRef.current = { ...newForm };
```

Also find the fallback `setEditing(true)` at the end of `loadProfile` (line 398):
```js
} else {
  setEditing(true);
}
```
Remove it entirely — `editing` is being deleted, and the tab bar defaults to "overview" regardless.

- [ ] **Step 4: Update `saveProfile` to serialize tag arrays before upsert**

Find `saveProfile` (line 497). Replace the upsert payload construction with:

```js
async function saveProfile() {
  if (!form.username.trim()) { setError("Username is required."); return; }
  setSaving(true); setError(null); setSaved(false);
  const payload = {
    id: session.user.id,
    ...form,
    // serialize tag arrays back to comma-sep strings
    skills: skillTags.join(", "),
    target_roles: targetRolesList.join(", "),
    username: form.username.trim(),
    avatar_color: avatarColor,
    ghost_color: ghostColor,
    avatar_url: avatarUrl || null,
    banner_url: bannerUrl || null,
  };
  const res = await supabase.from("profiles").upsert(payload);
  if (res.error) {
    setError(res.error.message.includes("unique") ? "That username is already taken." : res.error.message);
    setSaving(false); return;
  }
  setProfile({ ...payload });
  setSaving(false); setSaved(true);
  setShowAvatarPicker(false);
  setTimeout(() => setSaved(false), 3000);
}
```

Note: Removed `setEditing(false)` from the end of saveProfile. No tab switch is needed after save — the user stays on whichever tab they were on. The Save button is a global "save my profile" action that upserts in place.

- [ ] **Step 5: Update avatar/banner click-handling to use `isOwnProfile && !!session` instead of `editing`**

**Important:** `isOwnProfile` is defined as `!profile || !session || profile.id === session.user.id`. This means it evaluates `true` when `session` is null (unauthenticated visitors). Use `isOwnProfile && !!session` everywhere below so that edit affordances only show to authenticated owners.

Find the banner `<div>` (around line 592). Replace:
```jsx
className={`banner-area${editing ? " editable" : ""}`}
onClick={() => editing && bannerFileRef.current?.click()}
```
With:
```jsx
className={`banner-area${(isOwnProfile && !!session) ? " editable" : ""}`}
onClick={() => (isOwnProfile && !!session) && bannerFileRef.current?.click()}
```

Find the banner hover block (line 600):
```jsx
{editing && (
  <div className="banner-hover">
```
Replace `editing` with `isOwnProfile && !!session`.

Find the avatar `<div>` (line 615):
```jsx
className={`avatar${editing ? " editable" : ""}`}
onClick={() => editing && setShowAvatarPicker(p => !p)}
```
Replace both `editing` with `isOwnProfile && !!session`.

Find the avatar hover block (line 623):
```jsx
{editing && (
  <div className="avatar-hover">
```
Replace `editing` with `isOwnProfile && !!session`.

Find the avatar picker render (line 647):
```jsx
{editing && showAvatarPicker && (
```
Replace `editing` with `isOwnProfile && !!session`.

- [ ] **Step 6: Move Save/Cancel buttons to hero row, remove the old "Edit Profile" button**

Find the `header-actions` div (around line 630). Replace its contents with:

```jsx
<div className="header-actions">
  {saved && <span className="ok-msg">✓ Saved</span>}
  {profile && !isOwnProfile && session && (
    <button
      className={`btn-follow${isFollowing ? " following" : ""}`}
      onClick={toggleFollow}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  )}
  {isOwnProfile && !!session && (
    <>
      <button className="btn-secondary" onClick={() => {
        // Cancel: reset form to the DB snapshot captured at last load
        const snap = profileSnapshotRef.current;
        if (snap) {
          setForm({ ...snap });
          setSkillTags((snap.skills || "").split(",").map(s => s.trim()).filter(Boolean));
          setTargetRolesList((snap.target_roles || "").split(",").map(s => s.trim()).filter(Boolean));
        }
        setError(null);
        setShowAvatarPicker(false);
      }}>Cancel</button>
      <button className="btn-primary" onClick={saveProfile} disabled={saving || !form.username.trim()}>
        {saving ? "Saving..." : "Save"}
      </button>
    </>
  )}
</div>
```

- [ ] **Step 7: Remove the old identity section's Edit Profile button**

Find the block around line 640:
```jsx
{profile && !editing && isOwnProfile && (
  <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
)}
```
Delete it entirely.

**⚠️ DO NOT run `npm run build` yet.** After Task 2, `editing` is removed from useState but is still referenced at line 740 (`{profile && !editing ?`). The build will fail until Task 3 replaces that body section. Continue directly to Task 3, then run the build.

- [ ] **Step 9: Commit (no build yet)**

```bash
git add src/Profile.jsx
git commit -m "wip: replace editing boolean with activeTab, add 17 new form fields"
```

---

## Task 3: Profile.jsx — Add Tab Bar + Hero Identity Section Cleanup

**Files:**
- Modify: `src/Profile.jsx`

- [ ] **Step 1: Add tab bar CSS to the STYLE string**

Add after the `.profile-header` CSS rule:

```css
.tab-bar { display: flex; border-bottom: 1px solid var(--border); background: var(--surface); padding: 0 32px; gap: 0; }
.tab-btn { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 14px 20px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--ghost); cursor: pointer; transition: color 0.15s, border-color 0.15s; margin-bottom: -1px; }
.tab-btn:hover { color: var(--paper); }
.tab-btn.active { color: var(--paper); border-bottom-color: var(--blood); }
.tab-content { padding: 32px 0 0; }
```

- [ ] **Step 2: Clean up the identity section — remove the old `editing` branch**

Find the identity section starting at line 685:
```jsx
{/* IDENTITY */}
{profile && !editing ? (
  <>
    ...
  </>
) : (
  <div style={{ paddingTop: 4 }}>
    <div className="profile-email">{session?.user?.email}</div>
  </div>
)}
```

Replace with a single always-shown read-only block (no more `editing` branch). The identity info (name, bio, tags) now always shows in the hero — editing happens in the Career Profile tab:

```jsx
{/* IDENTITY */}
{profile && (
  <>
    <div className="profile-name-row">
      {displayName && <span className="profile-displayname">{displayName}</span>}
      <span className="profile-username">@{profile.username}</span>
    </div>
    {profile.founding_member && (
      <div className="founding-badge">
        <span className="founding-badge-icon">👻</span>
        Founding Member
      </div>
    )}
    <div className="follow-row">
      <button className="follow-stat" onClick={() => openFollowModal("followers")}>
        <span className="follow-stat-num">{followerCount}</span>
        <span className="follow-stat-lbl">Followers</span>
      </button>
      <button className="follow-stat" onClick={() => openFollowModal("following")}>
        <span className="follow-stat-num">{followingCount}</span>
        <span className="follow-stat-lbl">Following</span>
      </button>
    </div>
    {isOwnProfile && <div className="profile-email">{session?.user?.email}</div>}
    {profile.bio
      ? <p className="profile-bio">{profile.bio}</p>
      : isOwnProfile
        ? <p className="profile-bio empty">No bio yet — edit in Career Profile.</p>
        : null
    }
    {((profile.show_employment_status && profile.employment_status) ||
      (profile.show_current_job && profile.current_job) ||
      (profile.show_education && profile.education)) && (
      <div className="tag-row">
        {profile.show_employment_status && profile.employment_status &&
          <span className="tag green">{profile.employment_status}</span>}
        {profile.show_current_job && profile.current_job &&
          <span className="tag blue">{profile.current_job}{profile.industry ? " · " + profile.industry : ""}</span>}
        {profile.show_education && profile.education &&
          <span className="tag yellow">{profile.education}</span>}
      </div>
    )}
    {isOwnProfile && <div className="member-since">
      Member since {session && new Date(session.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
    </div>}
  </>
)}
```

- [ ] **Step 3: Replace the entire body section with the tab bar + tab content**

Find the `{/* BODY */}` section starting at line 735. Delete everything from there to the follow modal (around line 882), replacing with:

```jsx
{/* TAB BAR */}
<div className="tab-bar">
  {["overview", "career", "activity"].map(tab => (
    <button
      key={tab}
      className={`tab-btn${activeTab === tab ? " active" : ""}`}
      onClick={() => setActiveTab(tab)}
    >
      {tab === "overview" ? "Overview" : tab === "career" ? "Career Profile" : "Activity"}
    </button>
  ))}
</div>

{/* TAB CONTENT */}
<div className="tab-content">
  {activeTab === "overview" && <OverviewTab />}
  {activeTab === "career" && <CareerProfileTab />}
  {activeTab === "activity" && <ActivityTab />}
</div>
```

Note: `OverviewTab`, `CareerProfileTab`, and `ActivityTab` are inline render functions (not components — they're defined inside the `Profile` function as `const OverviewTab = () => (...)` immediately before the return statement).

- [ ] **Step 4: Verify build passes** — this is the first safe build point after Tasks 2+3

```bash
npm run build
```
Expected: no errors. This also clears the `editing` reference in the old body section (now replaced).

- [ ] **Step 5: Commit**

```bash
git add src/Profile.jsx
git commit -m "feat: add tab bar structure to Profile.jsx"
```

---

## Task 4: Profile.jsx — Overview Tab

**Files:**
- Modify: `src/Profile.jsx`

The Overview tab is read-only. It shows a "Career Details" card with all toggled-on non-empty fields, and a Skills card if show_skills is on.

- [ ] **Step 1: Add constants for the 12 field display definitions**

Add this just before the `Profile()` component definition (after the GhostIcon component, before `export default function Profile()`):

```js
const CAREER_FIELD_LABELS = [
  ["employment_status", "Employment Status"],
  ["current_job", "Current / Recent Role"],
  ["industry", "Industry"],
  ["education", "Education"],
  ["experience_years", "Experience"],
  ["seniority_level", "Seniority Level"],
  ["work_arrangement", "Work Arrangement"],
  ["target_roles", "Target Roles"],
  ["target_salary_band", "Salary Target"],
  ["search_duration", "Search Duration"],
  ["career_goal", "Career Goal"],
  ["skills", "Skills"],
];

const VISIBILITY_KEY = {
  employment_status: "show_employment_status",
  current_job: "show_current_job",
  industry: "show_industry",
  education: "show_education",
  experience_years: "show_experience_years",
  seniority_level: "show_seniority_level",
  work_arrangement: "show_work_arrangement",
  target_roles: "show_target_roles",
  target_salary_band: "show_target_salary_band",
  search_duration: "show_search_duration",
  career_goal: "show_career_goal",
  skills: "show_skills",
};
```

- [ ] **Step 2: Add Overview tab CSS**

Add to STYLE string:

```css
.overview-card { background: var(--surface); border: 1px solid var(--border); padding: 24px; margin-bottom: 16px; }
.overview-card-title { font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.06em; color: var(--paper); margin-bottom: 16px; }
.career-detail-row { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.career-detail-row:last-child { border-bottom: none; }
.career-detail-label { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); min-width: 160px; padding-top: 2px; }
.career-detail-value { font-size: 13px; color: var(--paper); flex: 1; line-height: 1.5; }
.skills-tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag-ro { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.08em; padding: 4px 10px; background: var(--surface3); border: 1px solid var(--border); color: var(--muted); }
.overview-private-note { font-family: "Space Mono", monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.08em; margin-top: 16px; }
.overview-empty-state { font-size: 13px; color: var(--muted); font-style: italic; padding: 24px 0; }
```

- [ ] **Step 3: Implement `OverviewTab` render function**

Add just before the `return` statement in the `Profile` function:

```jsx
const OverviewTab = () => {
  const src = isOwnProfile ? form : profile;
  if (!src) return null;

  // Fields that are public and non-empty
  const publicFields = CAREER_FIELD_LABELS.filter(([key]) => {
    const visKey = VISIBILITY_KEY[key];
    const value = src[visKey !== undefined ? key : key];
    return src[visKey] && src[key] && String(src[key]).trim();
  });

  // For own profile: count filled fields that are private
  const filledPrivateCount = isOwnProfile ? CAREER_FIELD_LABELS.filter(([key]) => {
    const visKey = VISIBILITY_KEY[key];
    return !src[visKey] && src[key] && String(src[key]).trim();
  }).length : 0;

  // skills are handled via show_skills + skills value
  const showSkillsCard = src.show_skills && src.skills && src.skills.trim();
  const skillsForDisplay = showSkillsCard
    ? src.skills.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  // career details excludes skills (skills has its own card)
  const detailFields = publicFields.filter(([key]) => key !== "skills");

  const hasAnything = detailFields.length > 0 || showSkillsCard;

  if (!hasAnything) {
    if (isOwnProfile) {
      return (
        <div className="overview-card">
          <div className="overview-empty-state">
            Nothing public yet — go to Career Profile to add details and choose what to show.
          </div>
        </div>
      );
    }
    return null; // public visitor: show nothing
  }

  return (
    <>
      {detailFields.length > 0 && (
        <div className="overview-card">
          <div className="overview-card-title">Career Details</div>
          {detailFields.map(([key, label]) => (
            <div key={key} className="career-detail-row">
              <span className="career-detail-label">{label}</span>
              <span className="career-detail-value">{src[key]}</span>
            </div>
          ))}
        </div>
      )}

      {showSkillsCard && (
        <div className="overview-card">
          <div className="overview-card-title">Skills</div>
          <div className="skills-tag-list">
            {skillsForDisplay.map(tag => (
              <span key={tag} className="skill-tag-ro">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {isOwnProfile && filledPrivateCount > 0 && (
        <div className="overview-private-note">
          {filledPrivateCount} field{filledPrivateCount !== 1 ? "s" : ""} set to private — edit in Career Profile tab
        </div>
      )}
    </>
  );
};
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/Profile.jsx
git commit -m "feat: add Overview tab to Profile.jsx"
```

---

## Task 5: Profile.jsx — Career Profile Tab (Completeness + Disclosure + Toggle Rows)

**Files:**
- Modify: `src/Profile.jsx`

This is the largest tab. It contains: AI Completeness Meter, Privacy Disclosure (expandable), 12 toggle rows with inline editing, and the Skills card.

- [ ] **Step 1: Add select option constants**

Add after `VISIBILITY_KEY` (before the Profile function):

```js
const SELECT_OPTIONS = {
  employment_status: ["Actively Looking", "Open to Opportunities", "Employed — Not Looking", "Freelancing", "Student", "On a Career Break"],
  experience_years: ["Under 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"],
  seniority_level: ["Intern", "Entry-level", "Mid-level", "Senior", "Lead", "Principal", "Executive"],
  work_arrangement: ["Remote only", "Remote or Hybrid", "Hybrid", "In-office", "Flexible", "No preference"],
  target_salary_band: ["Under $40k", "$40k–$60k", "$60k–$80k", "$80k–$100k", "$100k–$130k", "$130k–$160k", "$160k–$200k", "$200k+", "Prefer not to say"],
  search_duration: ["Just started (< 1 month)", "1–3 months", "3–6 months", "6–12 months", "Over a year", "Not actively searching"],
};

// Which fields use <select> vs <input> vs special
const FIELD_TYPE = {
  employment_status: "select",
  current_job: "input",
  industry: "input",
  education: "input",
  experience_years: "select",
  seniority_level: "select",
  work_arrangement: "select",
  target_roles: "tags", // tag-chip input
  target_salary_band: "select",
  search_duration: "select",
  career_goal: "textarea",
  skills: "skills-card", // rendered separately
};
```

- [ ] **Step 2: Add Career Profile tab CSS**

Add to STYLE string:

```css
/* Completeness meter */
.completeness-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 20px 24px; margin-bottom: 16px; }
.completeness-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.completeness-title { font-family: "Bebas Neue", sans-serif; font-size: 16px; letter-spacing: 0.1em; color: var(--paper); }
.completeness-pct { font-family: "Bebas Neue", sans-serif; font-size: 28px; color: var(--blood); }
.completeness-sub { font-family: "Space Mono", monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.08em; line-height: 1.6; }
.completeness-bar-track { height: 4px; background: var(--surface3); margin-top: 12px; }
.completeness-bar-fill { height: 100%; background: var(--blood); transition: width 0.3s; }

/* Privacy disclosure */
.privacy-card { background: var(--surface); border: 1px solid var(--border); padding: 16px 24px; margin-bottom: 16px; }
.privacy-trigger { display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-family: "Space Mono", monospace; font-size: 11px; color: var(--muted); letter-spacing: 0.08em; background: none; border: none; width: 100%; text-align: left; padding: 0; }
.privacy-trigger:hover { color: var(--paper); }
.privacy-content { margin-top: 16px; }
.privacy-list { list-style: none; padding: 0; margin: 0 0 12px 0; }
.privacy-list li { font-size: 12px; color: var(--muted); padding: 5px 0; border-bottom: 1px solid var(--border); display: flex; gap: 8px; line-height: 1.5; }
.privacy-list li::before { content: "✕"; color: var(--blood); font-size: 10px; flex-shrink: 0; padding-top: 2px; }
.privacy-footer { font-size: 11px; color: var(--ghost); line-height: 1.7; font-style: italic; }

/* Public info card / toggle rows */
.public-info-card { background: var(--surface); border: 1px solid var(--border); padding: 0; margin-bottom: 16px; overflow: hidden; }
.public-info-title { font-family: "Bebas Neue", sans-serif; font-size: 16px; letter-spacing: 0.06em; padding: 18px 24px 14px; border-bottom: 1px solid var(--border); }
.toggle-field-row { border-bottom: 1px solid var(--border); }
.toggle-field-row:last-child { border-bottom: none; }
.toggle-field-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; cursor: pointer; transition: background 0.1s; }
.toggle-field-header:hover { background: var(--surface2); }
.toggle-field-left { flex: 1; min-width: 0; }
.toggle-field-label { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ghost); margin-bottom: 2px; }
.toggle-field-value { font-size: 13px; color: var(--paper); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toggle-field-value.empty { color: var(--ghost); font-style: italic; }
.toggle-field-help { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.06em; margin-top: 2px; line-height: 1.4; }
.inline-edit-area { padding: 12px 24px 16px; background: var(--surface2); border-top: 1px solid var(--border); }
.inline-edit-area .f-input { background: var(--surface3); border: 1px solid var(--border-md); color: var(--paper); font-size: 13px; padding: 8px 12px; width: 100%; font-family: "Libre Baskerville", serif; }
.inline-edit-area .f-input:focus { outline: none; border-color: var(--blood); }
.inline-char-counter { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); text-align: right; margin-top: 4px; letter-spacing: 0.06em; }

/* Toggle switch (reuse existing .toggle class if present, else add) */
.toggle { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; margin-left: 12px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--surface3); border: 1px solid var(--border-md); transition: 0.2s; border-radius: 10px; }
.toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 2px; bottom: 2px; background: var(--ghost); transition: 0.2s; border-radius: 50%; }
input:checked + .toggle-slider { background: var(--blood); border-color: var(--blood); }
input:checked + .toggle-slider::before { transform: translateX(16px); background: var(--paper); }

/* Tag chip input (shared by Target Roles and Skills) */
.tag-chip-area { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.tag-chip { display: inline-flex; align-items: center; gap: 6px; font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.06em; padding: 4px 10px; background: var(--surface3); border: 1px solid var(--border-md); color: var(--paper); }
.tag-chip-remove { background: none; border: none; color: var(--ghost); cursor: pointer; font-size: 11px; padding: 0; line-height: 1; }
.tag-chip-remove:hover { color: var(--blood); }
.tag-chip-helper { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.06em; }
.tag-chip-input { background: var(--surface3); border: 1px solid var(--border-md); color: var(--paper); font-size: 13px; padding: 6px 10px; font-family: "Libre Baskerville", serif; width: 100%; }
.tag-chip-input:focus { outline: none; border-color: var(--blood); }
.tag-chip-input:disabled { opacity: 0.4; cursor: not-allowed; }
.tag-max-msg { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.06em; margin-top: 4px; }

/* Skills card */
.skills-card { background: var(--surface); border: 1px solid var(--border); padding: 0; margin-bottom: 16px; overflow: hidden; }
.skills-card-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 14px; border-bottom: 1px solid var(--border); }
.skills-card-title { font-family: "Bebas Neue", sans-serif; font-size: 16px; letter-spacing: 0.06em; }
.skills-card-body { padding: 16px 24px; }
```

- [ ] **Step 3: Implement `CareerProfileTab` render function**

Add just before the `return` statement (after `OverviewTab`):

```jsx
const CareerProfileTab = () => {
  // Completeness meter: count filled fields out of 12
  const filledCount = CAREER_FIELD_LABELS.filter(([key]) => {
    if (key === "skills") return skillTags.length > 0;
    if (key === "target_roles") return targetRolesList.length > 0;
    return form[key] && String(form[key]).trim();
  }).length;
  const completenessPercent = Math.round((filledCount / 12) * 100);

  // Tag input state for inline edit row (target_roles)
  const [roleInput, setRoleInput] = React.useState("");

  function addRole(val) {
    const trimmed = val.trim();
    if (!trimmed || targetRolesList.includes(trimmed) || targetRolesList.length >= 3) return;
    setTargetRolesList([...targetRolesList, trimmed]);
    setRoleInput("");
  }

  function handleRoleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRole(roleInput);
    }
  }

  // Skill input state
  const [skillInput, setSkillInput] = React.useState("");

  function addSkill(val) {
    const trimmed = val.trim();
    if (!trimmed || skillTags.includes(trimmed) || skillTags.length >= 10) return;
    setSkillTags([...skillTags, trimmed]);
    setSkillInput("");
  }

  function handleSkillKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  }

  if (!isOwnProfile) {
    // Public read-only Career Profile tab
    const src = profile;
    if (!src) return null;
    const pubFields = CAREER_FIELD_LABELS.filter(([key]) => {
      return key !== "skills" && src[VISIBILITY_KEY[key]] && src[key] && String(src[key]).trim();
    });
    const showSkills = src.show_skills && src.skills && src.skills.trim();
    const pubSkills = showSkills ? src.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    return (
      <>
        {pubFields.length > 0 && (
          <div className="overview-card">
            <div className="overview-card-title">Career Details</div>
            {pubFields.map(([key, label]) => (
              <div key={key} className="career-detail-row">
                <span className="career-detail-label">{label}</span>
                <span className="career-detail-value">{src[key]}</span>
              </div>
            ))}
          </div>
        )}
        {showSkills && (
          <div className="overview-card">
            <div className="overview-card-title">Skills</div>
            <div className="skills-tag-list">
              {pubSkills.map(tag => <span key={tag} className="skill-tag-ro">{tag}</span>)}
            </div>
          </div>
        )}
      </>
    );
  }

  // Own profile — full edit mode
  return (
    <>
      {/* 1. Completeness meter */}
      <div className="completeness-card">
        <div className="completeness-header">
          <span className="completeness-title">AI Context Completeness</span>
          <span className="completeness-pct">{completenessPercent}%</span>
        </div>
        <div className="completeness-sub">
          More context = sharper advice across all four AI modes.<br />
          Each field you fill in improves your results.
        </div>
        <div className="completeness-bar-track">
          <div className="completeness-bar-fill" style={{ width: completenessPercent + "%" }} />
        </div>
      </div>

      {/* 2. Privacy disclosure */}
      <div className="privacy-card">
        <button className="privacy-trigger" onClick={() => setPrivacyOpen(v => !v)}>
          <span>GhostBust will never ask for certain information</span>
          <span>{privacyOpen ? "▲" : "▾"}</span>
        </button>
        {privacyOpen && (
          <div className="privacy-content">
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--ghost)", marginBottom: 10, textTransform: "uppercase" }}>We will never ask for:</div>
            <ul className="privacy-list">
              <li>Salary history <em style={{ color: "var(--ghost)", fontSize: 11 }}>(target range is fine — history is not)</em></li>
              <li>Bank account, routing, or financial account numbers</li>
              <li>Social Security or government ID numbers</li>
              <li>Passwords or security credentials</li>
              <li>Health, disability, or medical information</li>
              <li>Immigration status</li>
              <li>Home address</li>
            </ul>
            <div className="privacy-footer">
              GhostBust is built for job seekers, not recruiters. All fields you fill in are used by GhostBust AI on your behalf — never sold or shared with employers. Visibility toggles control what appears on your public profile only; the AI always has access to everything you enter here to give you the best advice possible.
            </div>
          </div>
        )}
      </div>

      {/* 3. Public info card — 12 toggle rows (skills excluded, has its own card) */}
      <div className="public-info-card">
        <div className="public-info-title">Public Info</div>
        {CAREER_FIELD_LABELS.filter(([key]) => key !== "skills").map(([key, label]) => {
          const visKey = VISIBILITY_KEY[key];
          const isOpen = openEditRow === key;
          const value = key === "target_roles"
            ? (targetRolesList.length ? targetRolesList.join(", ") : "")
            : form[key];
          const fieldType = FIELD_TYPE[key];
          const helpText = key === "show_industry" ? "Hides industry from Career Details. Industry may still appear in your role tag above." : null;

          return (
            <div key={key} className="toggle-field-row">
              <div
                className="toggle-field-header"
                onClick={() => setOpenEditRow(isOpen ? null : key)}
              >
                <div className="toggle-field-left">
                  <div className="toggle-field-label">{label}</div>
                  <div className={`toggle-field-value${!value ? " empty" : ""}`}>
                    {value || "not set"}
                  </div>
                  {key === "industry" && helpText && (
                    <div className="toggle-field-help">{helpText}</div>
                  )}
                </div>
                <label className="toggle" onClick={e => {
                  e.stopPropagation();
                  setField(visKey, !form[visKey]);
                }}>
                  <input type="checkbox" checked={form[visKey]} readOnly />
                  <span className="toggle-slider" />
                </label>
              </div>

              {isOpen && (
                <div className="inline-edit-area">
                  {fieldType === "select" && (
                    <select
                      className="f-input"
                      value={form[key]}
                      onChange={e => setField(key, e.target.value)}
                      autoFocus
                    >
                      <option value="">Select...</option>
                      {SELECT_OPTIONS[key].map(o => <option key={o}>{o}</option>)}
                    </select>
                  )}
                  {fieldType === "input" && (
                    <input
                      className="f-input"
                      value={form[key]}
                      onChange={e => setField(key, e.target.value)}
                      autoFocus
                      onKeyDown={e => e.key === "Escape" && setOpenEditRow(null)}
                    />
                  )}
                  {fieldType === "tags" && (
                    <>
                      <div className="tag-chip-area">
                        {targetRolesList.map(tag => (
                          <span key={tag} className="tag-chip">
                            {tag}
                            <button className="tag-chip-remove" onClick={() => setTargetRolesList(targetRolesList.filter(t => t !== tag))}>✕</button>
                          </span>
                        ))}
                      </div>
                      {targetRolesList.length < 3 ? (
                        <input
                          className="tag-chip-input"
                          placeholder="Add role, press Enter or comma"
                          value={roleInput}
                          onChange={e => setRoleInput(e.target.value)}
                          onKeyDown={handleRoleKeyDown}
                          onBlur={() => { if (roleInput.trim()) addRole(roleInput); }}
                          autoFocus
                        />
                      ) : (
                        <div className="tag-max-msg">Maximum 3 roles</div>
                      )}
                    </>
                  )}
                  {fieldType === "textarea" && (
                    <>
                      <textarea
                        className="f-input"
                        value={form[key]}
                        onChange={e => setField(key, e.target.value)}
                        maxLength={200}
                        rows={3}
                        autoFocus
                        onKeyDown={e => e.key === "Escape" && setOpenEditRow(null)}
                        style={{ resize: "vertical" }}
                      />
                      <div className="inline-char-counter">{form[key].length} / 200</div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Skills card */}
      <div className="skills-card">
        <div className="skills-card-header">
          <span className="skills-card-title">Skills</span>
          <label className="toggle" onClick={e => { e.stopPropagation(); setField("show_skills", !form.show_skills); }}>
            <input type="checkbox" checked={form.show_skills} readOnly />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="skills-card-body">
          <div className="tag-chip-area">
            {skillTags.map(tag => (
              <span key={tag} className="tag-chip">
                {tag}
                <button className="tag-chip-remove" onClick={() => setSkillTags(skillTags.filter(t => t !== tag))}>✕</button>
              </span>
            ))}
          </div>
          {skillTags.length < 10 ? (
            <input
              className="tag-chip-input"
              placeholder="Add skill, press Enter or comma"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              onBlur={() => { if (skillInput.trim()) addSkill(skillInput); }}
            />
          ) : (
            <div className="tag-max-msg">Maximum 10 skills</div>
          )}
          <div className="tag-chip-helper" style={{ marginTop: 8 }}>
            Up to 10 · used by AI to identify keyword gaps and bullet improvements
          </div>
        </div>
      </div>
    </>
  );
};
```

**Note on `React.useState` inside render function:** Since `CareerProfileTab` is defined inside the `Profile` function body, it cannot use hooks directly (hooks can't be called inside nested functions conditionally). Move `roleInput`/`skillInput` state to the top-level `Profile` component state block. Add these next to the other `useState` declarations at the top:

```js
const [roleInput, setRoleInput] = useState("");
const [skillInput, setSkillInput] = useState("");
```

Then remove the `React.useState` calls from inside `CareerProfileTab` and use the outer `roleInput`/`skillInput` directly.

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no errors. Fix any JSX syntax issues.

- [ ] **Step 5: Commit**

```bash
git add src/Profile.jsx
git commit -m "feat: add Career Profile tab with completeness meter, privacy disclosure, and toggle rows"
```

---

## Task 6: Profile.jsx — Activity Tab

**Files:**
- Modify: `src/Profile.jsx`

- [ ] **Step 1: Add Activity tab CSS**

Add to STYLE string:

```css
.activity-section { margin-bottom: 32px; }
.activity-section-title { font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.06em; margin-bottom: 12px; }
.activity-table { width: 100%; border-collapse: collapse; }
.activity-table th { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); padding: 8px 12px; border-bottom: 1px solid var(--border); text-align: left; }
.activity-table td { font-size: 12px; color: var(--muted); padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
.activity-empty { font-size: 13px; color: var(--ghost); font-style: italic; padding: 16px 0; }
```

- [ ] **Step 2: Add `useEffect` for Activity tab lazy loading**

Add this useEffect inside the `Profile` function body (after the existing useEffects):

```js
useEffect(() => {
  if (activeTab !== "activity") return;
  if (activityLoaded) return;
  if (!profile) return;
  setActivityLoading(true);
  Promise.all([
    isOwnProfile
      ? supabase.from("ghost_scans")
          .select("company, title, ghost_score, created_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    (isOwnProfile || profile.show_tracked_jobs)
      ? supabase.from("applications")
          .select("title, company, status, saved_at")
          .eq("user_id", profile.id)
          .order("saved_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]).then(([scansRes, appsRes]) => {
    setActivityScans(scansRes.data || []);
    setActivityApps(appsRes.data || []);
    setActivityLoaded(true);
    setActivityLoading(false);
  });
}, [activeTab, profile]);
```

- [ ] **Step 3: Implement `ActivityTab` render function**

Add just before the `return` statement (after `CareerProfileTab`):

```jsx
const ActivityTab = () => {
  if (activityLoading) return <div style={{ padding: "32px 0", color: "var(--muted)", fontFamily: "Space Mono, monospace", fontSize: 12 }}>Loading...</div>;

  const showScans = isOwnProfile;
  const showApps = isOwnProfile || profile?.show_tracked_jobs;

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <>
      {showScans && (
        <div className="activity-section">
          <div className="activity-section-title">Recent Ghost Scans</div>
          {activityScans.length === 0 ? (
            <div className="activity-empty">No scans yet.</div>
          ) : (
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Title</th>
                  <th>Ghost Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activityScans.map((s, i) => (
                  <tr key={i}>
                    <td>{s.company || "—"}</td>
                    <td>{s.title || "—"}</td>
                    <td>{s.ghost_score != null ? s.ghost_score : "—"}</td>
                    <td>{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showApps && (
        <div className="activity-section">
          <div className="activity-section-title">Recent Applications</div>
          {activityApps.length === 0 ? (
            <div className="activity-empty">No applications tracked yet.</div>
          ) : (
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activityApps.map((a, i) => (
                  <tr key={i}>
                    <td>{a.title || "—"}</td>
                    <td>{a.company || "—"}</td>
                    <td>{a.status || "—"}</td>
                    <td>{formatDate(a.saved_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!showScans && !showApps && (
        <div className="activity-empty">No activity to show.</div>
      )}
    </>
  );
};
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/Profile.jsx
git commit -m "feat: add Activity tab with lazy-loaded scan and application history"
```

---

## Task 7: ResumeAdvisor.jsx — Fix `display_name` Bug + Add New Fields to AI Prompts

**Files:**
- Modify: `src/ResumeAdvisor.jsx`

There are **3 profile select call sites** in ResumeAdvisor.jsx (the spec says 4, but Modes 1 and 2 share a single `buildUserContext` function — updating it covers both):

| Step | Function | Covers modes |
|---|---|---|
| Step 1 | `buildUserContext` | Mode 1 (General Review) + Mode 2 (Job-Specific Analysis) |
| Step 2 | `handleCareerCoach` | Mode 3 |
| Step 3 | `handleJobSearchAdvisor` | Mode 4 |

Each needs `display_name` → `full_name` and the 8 new fields added. There is no 4th call site to find — do NOT add a redundant direct select inside `handleAnalyze`.

- [ ] **Step 1: Update `buildUserContext` (Mode 1 + 2 — General Review + Job-Specific Analysis)**

Find line 1081:
```js
.select("display_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country")
```
Replace with:
```js
.select("full_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country, experience_years, seniority_level, work_arrangement, target_roles, target_salary_band, search_duration, career_goal, skills")
```

Then find the profile context building block (lines 1083–1090) and add the new fields after the existing lines:
```js
if (profile.experience_years) p.push("Experience: " + profile.experience_years);
if (profile.seniority_level) p.push("Seniority: " + profile.seniority_level);
if (profile.target_roles) p.push("Target roles: " + profile.target_roles);
if (profile.target_salary_band) p.push("Salary target: " + profile.target_salary_band);
if (profile.search_duration) p.push("Search duration: " + profile.search_duration);
if (profile.work_arrangement) p.push("Work preference: " + profile.work_arrangement);
if (profile.career_goal) p.push("Career goal: " + profile.career_goal);
if (profile.skills) p.push("Skills: " + profile.skills);
```

Also find any reference to `profile.display_name` in the same function and rename to `profile.full_name`. Search the surrounding code for `display_name` usage.

- [ ] **Step 2: Update `handleCareerCoach` (Mode 3)**

Find line 1159:
```js
.select("display_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country, education")
```
Replace with:
```js
.select("full_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country, education, experience_years, seniority_level, work_arrangement, target_roles, target_salary_band, search_duration, career_goal, skills")
```

Then in the `ctxLines` building block (lines 1173–1179), add after the existing fields:
```js
if (profile.experience_years) ctxLines.push("Experience: " + profile.experience_years);
if (profile.seniority_level) ctxLines.push("Seniority: " + profile.seniority_level);
if (profile.target_roles) ctxLines.push("Target roles: " + profile.target_roles);
if (profile.target_salary_band) ctxLines.push("Salary target: " + profile.target_salary_band);
if (profile.search_duration) ctxLines.push("Search duration: " + profile.search_duration);
if (profile.work_arrangement) ctxLines.push("Work preference: " + profile.work_arrangement);
if (profile.career_goal) ctxLines.push("Career goal: " + profile.career_goal);
if (profile.skills) ctxLines.push("Skills: " + profile.skills);
```

Also search for `profile.display_name` in this function and rename to `profile.full_name`.

- [ ] **Step 3: Update `handleJobSearchAdvisor` (Mode 4)**

Find line 1250:
```js
.select("display_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country")
```
Replace with:
```js
.select("full_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country, experience_years, seniority_level, work_arrangement, target_roles, target_salary_band, search_duration, career_goal, skills")
```

Then in the `ctxLines` building block (lines 1264–1269), add after the existing fields:
```js
if (profile.experience_years) ctxLines.push("Experience: " + profile.experience_years);
if (profile.seniority_level) ctxLines.push("Seniority: " + profile.seniority_level);
if (profile.target_roles) ctxLines.push("Target roles: " + profile.target_roles);
if (profile.target_salary_band) ctxLines.push("Salary target: " + profile.target_salary_band);
if (profile.search_duration) ctxLines.push("Search duration: " + profile.search_duration);
if (profile.work_arrangement) ctxLines.push("Work preference: " + profile.work_arrangement);
if (profile.career_goal) ctxLines.push("Career goal: " + profile.career_goal);
if (profile.skills) ctxLines.push("Skills: " + profile.skills);
```

Also search for `profile.display_name` in this function and rename to `profile.full_name`.

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/ResumeAdvisor.jsx
git commit -m "fix: use full_name instead of display_name in AI prompts; add 8 career fields to all 4 ResumeAdvisor modes"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: no errors or warnings about undefined variables.

- [ ] **Step 2: Browser verification checklist**

Start dev server: `npm run dev`

**Profile.jsx checks:**
- [ ] Tab bar appears with Overview / Career Profile / Activity tabs; Overview is active by default
- [ ] Career Profile tab shows Completeness Meter (0% if no fields filled), Privacy Disclosure (collapses/expands), 12 toggle rows, Skills card
- [ ] Clicking a row label area opens inline edit; another click closes it; only one open at a time
- [ ] Toggle click does NOT open inline edit
- [ ] Career Goal textarea shows character counter; maxLength=200 enforced
- [ ] Target Roles: adding 3 roles disables input and shows "Maximum 3 roles"
- [ ] Skills: adding 10 tags disables input
- [ ] Save button in hero saves all fields; browser refresh shows saved values
- [ ] Cancel button resets form and re-derives skill/role tags
- [ ] Avatar and banner uploads work regardless of active tab
- [ ] Overview tab shows only toggled-on non-empty fields
- [ ] Activity tab shows "Loading..." on first click, then scans/applications
- [ ] Public profile view: Career Profile tab is read-only, Activity tab hides scans

**ResumeAdvisor.jsx checks:**
- [ ] Running any of the 4 AI modes includes career fields in prompt context (check browser network tab → Anthropic API request body)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: career profile expansion complete"
```
