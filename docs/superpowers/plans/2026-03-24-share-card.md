# Share Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shareable ghost score card to GhostBust — a PNG download (receipt-style) and a shareable URL (`ghostbust.us/score?id=…`) with OG link preview image, both triggered from two new buttons in the VerdictCard.

**Architecture:** The ghost_scans table gains 4 new columns (share_enabled, scores, confidence, summary). After a scan completes, the row ID is captured and passed to VerdictCard. VerdictCard renders two share buttons plus a hidden receipt div for PNG generation. The `/score?id=…` route is a new Vite entry point (ScorePage.jsx) that fetches the public scan row. `/api/og.jsx` is a Vercel edge function using `@vercel/og` that returns a 1200×630 PNG for OG link previews.

**Known limitation — OG meta tags and social crawlers:** The score page is a React SPA. OG meta tags are injected client-side via JavaScript in ScorePage.jsx. Social crawlers (Twitter, Slack, iMessage) do not execute JavaScript and will not see these tags. The `/api/og` image endpoint will work when opened directly, but link unfurling in chat apps will fall back to a generic GhostBust image (set as a static fallback in `score.html`). This is acceptable for the current stage. The PNG download (↓ Download Card) is the primary viral sharing surface and is unaffected. Full SSR for the score page can be addressed as a separate future task when it becomes a retention priority.

**Tech Stack:** React 18, Vite, Supabase (Postgres + anon/service RLS), html2canvas, @vercel/og (Satori, edge runtime), Vercel serverless/edge.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/20260324_ghost_scans_share.sql` | Create | Adds share_enabled, scores, confidence, summary to ghost_scans; public SELECT RLS policy |
| `src/App.jsx` | Modify | Update scan insert (capture ID, save extra fields); add scanId state to VerifyTab; pass scanId to VerdictCard; add hidden receipt card div + html2canvas logic; add share buttons to VerdictCard |
| `score.html` | Create | Vite entry point for score page |
| `src/score-main.jsx` | Create | React root entry for score page |
| `src/ScorePage.jsx` | Create | Fetches scan row, renders score, sets OG meta tags |
| `api/og.jsx` | Create | Vercel edge function — returns 1200×630 OG image |
| `vite.config.js` | Modify | Add score entry point |
| `package.json` | Modify | Add html2canvas and @vercel/og dependencies |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260324_ghost_scans_share.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260324_ghost_scans_share.sql

ALTER TABLE ghost_scans
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scores       jsonb,
  ADD COLUMN IF NOT EXISTS confidence   integer,
  ADD COLUMN IF NOT EXISTS summary      text;

-- Allow anyone to read rows where share_enabled = true
-- (existing RLS enables authenticated user to read own rows;
--  this adds a second policy for public share access)
DROP POLICY IF EXISTS "Public can read shared scans" ON ghost_scans;
CREATE POLICY "Public can read shared scans"
  ON ghost_scans FOR SELECT
  USING (share_enabled = true);
```

- [ ] **Step 2: Run in Supabase SQL editor**

Paste and execute the file contents in the Supabase dashboard SQL editor. Verify no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260324_ghost_scans_share.sql
git commit -m "db: add share_enabled, scores, confidence, summary to ghost_scans"
```

---

## Task 2: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install html2canvas and @vercel/og**

```bash
npm install html2canvas @vercel/og
```

- [ ] **Step 2: Verify installation**

```bash
npm list html2canvas @vercel/og
```

Expected: both listed under `dependencies` with version numbers.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add html2canvas and @vercel/og"
```

---

## Task 3: Update Scan Insert in App.jsx

**Files:**
- Modify: `src/App.jsx` (VerifyTab component, around line 1140)

The current scan insert at line ~1161 uses an anon_id and fires with `.then(function(){})` discarding the result. We need to:
1. Save `scores`, `confidence`, `summary` in the insert
2. Chain `.select('id').single()` to capture the UUID
3. Add `scanId` state to VerifyTab and set it on success

- [ ] **Step 1: Add `scanId` state to VerifyTab**

Find the state declarations in `VerifyTab` (around line 1140–1147):

```js
var [saving,setSaving] = useState(false);
var [saved,setSaved] = useState(false);
var resultRef = useRef(null);
```

Add after `saved` state:

```js
var [scanId,setScanId] = useState(null);
```

- [ ] **Step 2: Update the ghost_scans insert to save extra fields and capture ID**

Find the current insert call (the inline try/catch block inside the `.then(function(raw){...})` callback, line ~1161). Replace the entire inner try block:

Old code (exact match — include the `setResult` prefix on the same line):
```js
setResult(parsed); try { var anonId = localStorage.getItem("gb_anon_id"); if (!anonId) { anonId = Math.random().toString(36).slice(2); localStorage.setItem("gb_anon_id", anonId); } import("./supabase.js").then(function(m){ m.supabase.from("ghost_scans").insert({ anon_id: anonId, company: company||null, title: jobTitle||null, job_board: sourceBoard||null, ghost_score: parsed.ghostScore||0, signal_flags: parsed.flags||[], assessment: parsed.verdict||null }).then(function(){}).catch(function(){}); }); } catch(e) {}
```

New code:
```js
setResult(parsed); try { var anonId = localStorage.getItem("gb_anon_id"); if (!anonId) { anonId = Math.random().toString(36).slice(2); localStorage.setItem("gb_anon_id", anonId); } import("./supabase.js").then(function(m){ m.supabase.from("ghost_scans").insert({ anon_id: anonId, company: company||null, title: jobTitle||null, job_board: sourceBoard||null, ghost_score: parsed.ghostScore||0, signal_flags: parsed.flags||[], assessment: parsed.verdict||null, scores: parsed.scores||null, confidence: parsed.confidence||null, summary: parsed.summary||null }).select("id").single().then(function(res){ if (res.data&&res.data.id) setScanId(res.data.id); }).catch(function(){}); }); } catch(e) {}
```

- [ ] **Step 3: Reset scanId when a new analysis starts**

In the `analyze()` function, find:

```js
function analyze() {
    setLoading(true); setResult(null); setError(null); setSaved(false); setStep(0);
```

Add `setScanId(null)` to the reset line:

```js
function analyze() {
    setLoading(true); setResult(null); setError(null); setSaved(false); setScanId(null); setStep(0);
```

- [ ] **Step 4: Pass scanId, company, and jobTitle to VerdictCard**

Find the VerdictCard render (around line 1246):

```jsx
<VerdictCard result={result} />
```

Change to:

```jsx
<VerdictCard result={result} scanId={scanId} company={company} jobTitle={jobTitle} />
```

Note: `company` and `jobTitle` are already in VerifyTab state (declared at the top of the component). The receipt card in the PNG download needs them so the card shows the job title and company name. They are not part of the Claude API response object (`result`).

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: capture scan ID after ghost_scans insert, save scores/confidence/summary"
```

---

## Task 4: Share Buttons + PNG Download in VerdictCard

**Files:**
- Modify: `src/App.jsx` (VerdictCard component, lines 709–782; STYLE string)

Add two share buttons below the disclaimer box. Add a hidden receipt `<div>` for html2canvas. Add CSS for the share row and receipt card.

- [ ] **Step 1: Add share CSS to the STYLE string**

Find the `.copy-btn` rule (around line 352) and add after it:

```css
  .share-row { display: flex; gap: 10px; margin-top: 18px; }
  .share-btn { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 16px; border: 1px solid var(--border-hi); color: var(--paper); background: none; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .share-btn:hover { background: rgba(255,255,255,0.06); }
  .share-btn.copied { border-color: var(--signal); color: var(--signal); }
  .share-btn.downloading { opacity: 0.6; cursor: default; }
```

- [ ] **Step 2: Add share state and handler logic to VerdictCard**

VerdictCard is currently a plain function with no state. Convert it to use `useState` and `useRef` (both already imported at the top of the file).

Find:
```js
function VerdictCard(props) {
  var r = props.result;
  var v = r.verdict;
```

Replace the opening of VerdictCard with:
```js
function VerdictCard(props) {
  var r = props.result;
  var scanId = props.scanId;
  var jobCompany = props.company || "";
  var jobTitle = props.jobTitle || "";
  var v = r.verdict;
  var [shareLabel, setShareLabel] = useState("🔗 Copy Link");
  var [downloading, setDownloading] = useState(false);
  var receiptRef = useRef(null);

  function handleCopyLink() {
    if (!scanId) { setShareLabel("Saving…"); setTimeout(function(){ setShareLabel("🔗 Copy Link"); }, 1500); return; }
    import("./supabase.js").then(function(m){
      m.supabase.from("ghost_scans").update({ share_enabled: true }).eq("id", scanId).then(function(){
        var url = "https://ghostbust.us/score?id="+scanId;
        navigator.clipboard.writeText(url).then(function(){
          setShareLabel("✓ Copied!");
          setTimeout(function(){ setShareLabel("🔗 Copy Link"); }, 2500);
        });
      });
    });
  }

  function handleDownload() {
    if (downloading || !receiptRef.current) return;
    setDownloading(true);
    document.fonts.ready.then(function(){
      import("html2canvas").then(function(mod){
        var html2canvas = mod.default;
        html2canvas(receiptRef.current, { scale: 2, backgroundColor: "#070709", useCORS: true, logging: false }).then(function(canvas){
          var link = document.createElement("a");
          link.download = "ghostbust-score.png";
          link.href = canvas.toDataURL("image/png");
          link.click();
          setDownloading(false);
        }).catch(function(){ setDownloading(false); });
      });
    });
  }
```

- [ ] **Step 3: Add share buttons and hidden receipt card to VerdictCard JSX**

Find the closing `</div>` of VerdictCard using the disclaimer paragraph as anchor context (use this larger block to ensure uniqueness):

```jsx
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   SEARCH TAB
```

Replace the `</div>\n    </div>\n  );\n}` portion (the last two closing divs before `);`) with the new content — keep the `</p>\n      </div>` and replace from `\n    </div>\n  );\n}` onward:

```jsx
      </div>

      {/* Share row */}
      <div className="share-row">
        <button className={"share-btn"+(downloading?" downloading":"")} onClick={handleDownload} disabled={downloading}>
          {downloading ? "Generating…" : "↓ Download Card"}
        </button>
        <button className={"share-btn"+(shareLabel==="✓ Copied!"?" copied":"")} onClick={handleCopyLink}>
          {shareLabel}
        </button>
      </div>

      {/* Hidden receipt card for html2canvas */}
      <div ref={receiptRef} style={{
        position:"absolute", left:"-9999px", top:0, width:480,
        background:"#070709", fontFamily:"'Space Mono',monospace", overflow:"hidden"
      }}>
        {/* Ticker strip */}
        <div style={{background:"#d42200",padding:"7px 0",overflow:"hidden",whiteSpace:"nowrap"}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.22em",color:"#fff",textTransform:"uppercase",paddingLeft:16}}>
            GHOSTBUST &nbsp;·&nbsp; GHOST JOB ANALYSIS &nbsp;·&nbsp; GHOSTBUST &nbsp;·&nbsp; GHOST JOB ANALYSIS &nbsp;·&nbsp; GHOSTBUST &nbsp;·&nbsp; GHOST JOB ANALYSIS
          </span>
        </div>
        {/* Job info */}
        <div style={{padding:"24px 28px 0"}}>
          {jobCompany&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"0.18em",color:"rgba(238,234,224,0.45)",textTransform:"uppercase",marginBottom:4}}>{jobCompany}</div>}
          {jobTitle&&<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.04em",color:"#eeeae0",marginBottom:20}}>{jobTitle}</div>}
          {/* Score */}
          <div style={{display:"flex",alignItems:"flex-end",gap:14,marginBottom:20}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:96,lineHeight:0.85,color:gs>60?"#d42200":gs>35?"#c99a00":"#00e67a"}}>{gs}</div>
            <div style={{paddingBottom:10}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.25em",textTransform:"uppercase",color:"#4a4a60",marginBottom:5}}>Ghost Score</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.04em",color:v==="LEGIT"?"#00e67a":v==="SUSPICIOUS"?"#c99a00":"#d42200"}}>
                {v==="LEGIT"?"Appears Legitimate":v==="SUSPICIOUS"?"Suspicious":"Ghost Listing Detected"}
              </div>
            </div>
          </div>
          {/* Sub-score rows */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:16,marginBottom:16}}>
            {[["Specificity",sc.specificityScore],["Transparency",sc.transparencyScore],["Process",sc.processScore],["Confidence",r.confidence]].map(function(item){
              return (
                <div key={item[0]} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(238,234,224,0.45)"}}>{item[0]}</span>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#eeeae0"}}>{item[1]!=null?item[1]:"—"}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Footer */}
        <div style={{padding:"14px 28px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:"0.04em",color:"#eeeae0"}}>Ghost<span style={{color:"#d42200"}}>Bust</span></span>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#4a4a60",letterSpacing:"0.12em"}}>ghostbust.us</span>
        </div>
      </div>
    </div>
  );
}
```

Note: `gs`, `sc`, and `r` are already defined earlier in VerdictCard from the original code (`var gs = r.ghostScore||0`, `var sc = r.scores||{}`).

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 5: Smoke test in browser**

```bash
npm run dev
```

Run a scan. Verify the "↓ Download Card" and "🔗 Copy Link" buttons appear below the disclaimer. Click Download — browser should trigger a PNG download of the receipt card.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add share buttons and receipt PNG download to VerdictCard"
```

---

## Task 5: Score Page — HTML Entry + Vite Config

**Files:**
- Create: `score.html`
- Create: `src/score-main.jsx`
- Modify: `vite.config.js`

- [ ] **Step 1: Create score.html**

Include static fallback OG tags. These are seen by crawlers that don't execute JS. The ScorePage.jsx will override `og:title` and `og:description` with scan-specific text in the browser, but the fallback ensures social sharing never shows a blank preview.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ghost Job Score — GhostBust</title>
  <meta name="description" content="See the ghost job score for this listing, analyzed by GhostBust." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="GhostBust" />
  <meta property="og:title" content="Ghost Job Score — GhostBust" />
  <meta property="og:description" content="GhostBust detects ghost job listings before you waste time applying. See the score for this listing." />
  <meta property="og:image" content="https://ghostbust.us/og-default.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://ghostbust.us/og-default.png" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/score-main.jsx"></script>
</body>
</html>
```

Note: `og-default.png` is the existing landing page OG image. If it doesn't exist yet, this can be any image already deployed at ghostbust.us — the fallback just needs to be a real URL.

- [ ] **Step 2: Create src/score-main.jsx**

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ScorePage from "./ScorePage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ScorePage />
  </StrictMode>
);
```

- [ ] **Step 3: Update vite.config.js**

Current content:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], build: { rollupOptions: { input: { main: './index.html', app: './app.html', profile: './profile.html', community: './community.html', tos: './tos.html', privacy: './privacy.html' } } } })
```

New content (add `score` entry):
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], build: { rollupOptions: { input: { main: './index.html', app: './app.html', profile: './profile.html', community: './community.html', tos: './tos.html', privacy: './privacy.html', score: './score.html' } } } })
```

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: `dist/score.html` and associated JS/CSS chunks exist in the output.

- [ ] **Step 5: Commit**

```bash
git add score.html src/score-main.jsx vite.config.js
git commit -m "feat: add score page entry point"
```

---

## Task 6: ScorePage Component

**Files:**
- Create: `src/ScorePage.jsx`

The score page fetches the scan row (ghost_scans WHERE id=? AND share_enabled=true), renders the score hero + verdict, and sets OG meta tags including a pointer to `/api/og?id=…`.

Use only CSS defined inline in a STYLE constant (following the app's pattern exactly). Include all fonts, CSS vars, and the same Score Hero visual as VerdictCard.

- [ ] **Step 1: Create src/ScorePage.jsx**

```jsx
import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #070709; --surface: #0e0e12; --paper: #eeeae0; --muted: rgba(238,234,224,0.45);
    --ghost: #4a4a60; --blood: #d42200; --bile: #c99a00; --signal: #00e67a;
    --border: rgba(255,255,255,0.07); --border-hi: rgba(255,255,255,0.14);
  }
  html, body { background: var(--void); color: var(--paper); font-family: 'Libre Baskerville', serif; min-height: 100vh; }
  @keyframes gbFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .sp-root { width: 100%; max-width: 680px; margin: 0 auto; padding: 48px 24px 80px; animation: gbFadeIn 0.5s ease both; }
  .sp-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 48px; }
  .sp-logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.02em; color: var(--paper); text-decoration: none; }
  .sp-logo em { color: var(--blood); font-style: normal; }
  .sp-cta-nav { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--paper); background: var(--blood); border: none; padding: 8px 16px; cursor: pointer; text-decoration: none; }
  .sp-card { background: var(--surface); border: 1px solid var(--border); padding: 32px; margin-bottom: 24px; }
  .sp-job { margin-bottom: 24px; }
  .sp-company { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .sp-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); }
  .sp-score-hero { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 16px; }
  .sp-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 96px; line-height: 0.85; }
  .sp-score-num.red { color: var(--blood); }
  .sp-score-num.yellow { color: var(--bile); }
  .sp-score-num.green { color: var(--signal); }
  .sp-score-meta { display: flex; flex-direction: column; gap: 6px; padding-bottom: 10px; }
  .sp-score-lbl { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); }
  .sp-verdict { font-family: 'Bebas Neue', sans-serif; font-size: 22px; }
  .sp-verdict.red { color: var(--blood); }
  .sp-verdict.yellow { color: var(--bile); }
  .sp-verdict.green { color: var(--signal); }
  .sp-sev-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; margin-bottom: 24px; }
  .sp-sev-seg { height: 4px; border-radius: 1px; opacity: 0.2; }
  .sp-sev-seg.active { opacity: 1; }
  .sp-subscores { display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 24px; }
  .sp-subscore-num { font-family: 'Bebas Neue', sans-serif; font-size: 28px; }
  .sp-subscore-lbl { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ghost); margin-top: 2px; }
  .sp-summary { font-size: 13px; color: var(--muted); line-height: 1.8; }
  .sp-footer-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 28px 32px; text-align: center; }
  .sp-footer-headline { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; margin-bottom: 10px; }
  .sp-footer-body { font-size: 13px; color: var(--muted); line-height: 1.8; margin-bottom: 20px; }
  .sp-footer-cta { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; background: var(--blood); color: #fff; text-decoration: none; padding: 12px 28px; display: inline-block; }
  .sp-error { text-align: center; padding: 80px 24px; color: var(--muted); font-family: 'Space Mono', monospace; font-size: 13px; }
  .sp-loading { text-align: center; padding: 80px 24px; color: var(--ghost); font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; }
`;

function scoreColor(gs) {
  return gs > 60 ? "red" : gs > 35 ? "yellow" : "green";
}

function verdictText(v) {
  return v === "LEGIT" ? "Appears Legitimate" : v === "SUSPICIOUS" ? "Suspicious — Proceed With Caution" : "Ghost Listing Detected";
}

export default function ScorePage() {
  var [scan, setScan] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  useEffect(function () {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    if (!id) { setError("No scan ID provided."); setLoading(false); return; }

    supabase
      .from("ghost_scans")
      .select("ghost_score, assessment, title, company, confidence, scores, summary")
      .eq("id", id)
      .eq("share_enabled", true)
      .single()
      .then(function (res) {
        if (res.error || !res.data) { setError("This score card is not available."); }
        else {
          setScan(res.data);
          // Set OG meta tags
          var gs = res.data.ghost_score || 0;
          var v = res.data.assessment || "UNKNOWN";
          var title = (res.data.title ? res.data.title + " — " : "") + "Ghost Score: " + gs + "/100 · GhostBust";
          var desc = verdictText(v) + ". Analyzed by GhostBust — the ghost job detector.";
          document.title = title;
          var setMeta = function(prop, val, attr) {
            attr = attr || "name";
            var el = document.querySelector('meta[' + attr + '="' + prop + '"]');
            if (!el) { el = document.createElement("meta"); el.setAttribute(attr, prop); document.head.appendChild(el); }
            el.setAttribute("content", val);
          };
          setMeta("description", desc);
          setMeta("og:title", title, "property");
          setMeta("og:description", desc, "property");
          setMeta("og:image", "https://ghostbust.us/api/og?id=" + id, "property");
          setMeta("og:url", "https://ghostbust.us/score?id=" + id, "property");
          setMeta("og:type", "website", "property");
          setMeta("twitter:card", "summary_large_image");
          setMeta("twitter:image", "https://ghostbust.us/api/og?id=" + id);
        }
        setLoading(false);
      });
  }, []);

  var gs = scan ? (scan.ghost_score || 0) : 0;
  var sc = scan ? (scan.scores || {}) : {};
  var colorCls = scoreColor(gs);
  var sevLevel = gs > 60 ? "high" : gs > 35 ? "mid" : "low";

  return (
    <>
      <style>{STYLE}</style>
      <div className="sp-root">
        <div className="sp-nav">
          <a href="/" className="sp-logo">Ghost<em>Bust</em></a>
          <a href="/app.html" className="sp-cta-nav">Verify a Listing →</a>
        </div>

        {loading && <div className="sp-loading">Loading score…</div>}
        {error && <div className="sp-error">{error}</div>}

        {scan && (
          <>
            <div className="sp-card">
              {(scan.company || scan.title) && (
                <div className="sp-job">
                  {scan.company && <div className="sp-company">{scan.company}</div>}
                  {scan.title && <div className="sp-title">{scan.title}</div>}
                </div>
              )}
              <div className="sp-score-hero">
                <div className={"sp-score-num " + colorCls}>{gs}</div>
                <div className="sp-score-meta">
                  <div className="sp-score-lbl">Ghost Score</div>
                  <div className={"sp-verdict " + colorCls}>{verdictText(scan.assessment)}</div>
                </div>
              </div>
              <div className="sp-sev-bar">
                <div className={"sp-sev-seg low" + (sevLevel === "low" ? " active" : "")} style={{ background: "#00e67a" }} />
                <div className={"sp-sev-seg mid" + (sevLevel === "mid" ? " active" : "")} style={{ background: "#c99a00" }} />
                <div className={"sp-sev-seg high" + (sevLevel === "high" ? " active" : "")} style={{ background: "#d42200" }} />
              </div>
              <div className="sp-subscores">
                {[["Specificity", sc.specificityScore], ["Transparency", sc.transparencyScore], ["Process", sc.processScore], ["Confidence", scan.confidence]].map(function (item) {
                  return (
                    <div key={item[0]}>
                      <div className={"sp-subscore-num " + scoreColor(item[1] || 0)}>{item[1] != null ? item[1] : "—"}</div>
                      <div className="sp-subscore-lbl">{item[0]}</div>
                    </div>
                  );
                })}
              </div>
              {scan.summary && <p className="sp-summary">{scan.summary}</p>}
            </div>

            <div className="sp-footer-card">
              <div className="sp-footer-headline">Verify your own listings</div>
              <p className="sp-footer-body">GhostBust detects ghost job listings before you apply. Paste any listing — get a ghost score, signal breakdown, and concrete next steps in under a minute.</p>
              <a href="/app.html" className="sp-footer-cta">Open Ghost Detector →</a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: clean build. `dist/score.html` exists.

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

Navigate to `http://localhost:5173/score.html?id=FAKE_ID`. Should see the "This score card is not available." error state. Good — the page loads.

- [ ] **Step 4: Commit**

```bash
git add src/ScorePage.jsx score.html src/score-main.jsx vite.config.js
git commit -m "feat: add ScorePage for shareable score URLs"
```

---

## Task 7: OG Image Edge Function

**Files:**
- Create: `api/og.jsx`

This is a Vercel edge function using `@vercel/og` (Satori). It reads the scan row from Supabase via the REST API (service role key) and returns a 1200×630 PNG image.

Note: This file uses `.jsx` extension so Vercel's bundler processes JSX syntax. The edge runtime is declared via `export const config`.

- [ ] **Step 1: Create api/og.jsx**

```jsx
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://awhqwqhntgxjvvawzkog.supabase.co";

function colorFor(gs) {
  return gs > 60 ? "#d42200" : gs > 35 ? "#c99a00" : "#00e67a";
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return new Response("Misconfigured", { status: 500 });

  let scan;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ghost_scans?id=eq.${id}&share_enabled=eq.true&select=ghost_score,assessment,title,company,confidence,scores`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const rows = await res.json();
    if (!rows || !rows.length) return new Response("Not found", { status: 404 });
    scan = rows[0];
  } catch {
    return new Response("Error fetching scan", { status: 500 });
  }

  const gs = scan.ghost_score || 0;
  const color = colorFor(gs);
  const sc = scan.scores || {};
  const v = scan.assessment || "UNKNOWN";
  const verdictLabel = v === "LEGIT" ? "Appears Legitimate" : v === "SUSPICIOUS" ? "Suspicious" : "Ghost Listing Detected";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#070709",
        padding: "56px 72px",
        fontFamily: "monospace",
      }}
    >
      {/* Score hero */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 28, marginBottom: 36 }}>
        <span style={{ fontSize: 168, fontWeight: 900, color, lineHeight: 0.82 }}>{gs}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: 6, color: "#4a4a60", textTransform: "uppercase" }}>
            Ghost Score
          </span>
          <span style={{ fontSize: 38, fontWeight: 700, color, lineHeight: 1 }}>{verdictLabel}</span>
          {(scan.title || scan.company) && (
            <span style={{ fontSize: 16, color: "rgba(238,234,224,0.55)", marginTop: 6 }}>
              {[scan.title, scan.company].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </div>

      {/* Sub-scores */}
      <div style={{ display: "flex", gap: 48, marginBottom: "auto" }}>
        {[
          ["Specificity", sc.specificityScore],
          ["Transparency", sc.transparencyScore],
          ["Process", sc.processScore],
          ["Confidence", scan.confidence],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#eeeae0" }}>{val ?? "—"}</span>
            <span style={{ fontSize: 10, color: "#4a4a60", letterSpacing: 4, textTransform: "uppercase" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: 24,
          marginTop: 24,
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 700, color: "#eeeae0", letterSpacing: 2 }}>
          Ghost<span style={{ color: "#d42200" }}>Bust</span>
        </span>
        <span style={{ fontSize: 13, color: "#4a4a60", letterSpacing: 3 }}>ghostbust.us · verify before you apply</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: clean build. The `api/` directory is not bundled by Vite — no Vite errors expected. Vercel processes it separately.

- [ ] **Step 3: Commit**

```bash
git add api/og.jsx
git commit -m "feat: add OG image edge function for share cards"
```

---

## Task 8: End-to-End Smoke Test + Push

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 2: Manual smoke test (dev server)**

```bash
npm run dev
```

1. Open `http://localhost:5173/app.html`
2. Paste any real job listing into the Ghost Detector
3. Run the scan
4. Verify VerdictCard renders with two new buttons: "↓ Download Card" and "🔗 Copy Link"
5. Click "↓ Download Card" — should download a `ghostbust-score.png` file with the receipt layout
6. Click "🔗 Copy Link" — should briefly show "Saving…" or copy a URL to clipboard
7. Open `http://localhost:5173/score.html?id=FAKE` — should show "This score card is not available."
8. If you have a real scan ID from the DB, test `http://localhost:5173/score.html?id={real_id}` — should render the score card (only if share_enabled=true)

- [ ] **Step 3: Push**

```bash
git push
```

- [ ] **Step 4: Verify Vercel env vars**

Confirm in the Vercel dashboard that `SUPABASE_SERVICE_ROLE_KEY` is set (required for `/api/og`). It should already be set from the onboarding cron setup.

---

## Required Manual Actions (before going live)

1. **Run migration in Supabase SQL editor:** `supabase/migrations/20260324_ghost_scans_share.sql`
2. **Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel dashboard** (needed by `/api/og`)
3. **Test the OG image:** After deploying, open `https://ghostbust.us/api/og?id={a_real_shared_scan_id}` in a browser — should return a PNG
4. **Test link unfurl:** Share a `https://ghostbust.us/score?id=…` URL in Slack or iMessage — the preview should show the OG card image
