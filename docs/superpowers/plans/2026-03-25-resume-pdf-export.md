# Resume Advisor PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "↓ Download PDF" button to Resume Advisor that exports any analysis result as a styled, GhostBust-branded PDF — available from the active analysis view, the history detail view, and each history list card.

**Architecture:** All changes are in `src/ResumeAdvisor.jsx` only. A hidden off-screen `<div>` is populated with PDF-page HTML, captured by `html2canvas`, then written to a PDF via `jsPDF`. Both libraries are dynamically imported inside the export function to keep them out of the initial bundle. No new files, no new components.

**Tech Stack:** React 18, html2canvas (already installed), jspdf@^2 (new dependency), Supabase JS v2, Vite

---

## Files Modified

- `src/ResumeAdvisor.jsx` — only file changed
  - Two new state variables (lines ~845)
  - One new `exportAnalysisToPdf` async function (before `// ---- RENDER ----` at line ~1479)
  - Hidden render div added to JSX return (before closing `</div>` at line ~1890)
  - Download button in active analysis results (inside `{result && !analyzing && (...)`)
  - Download button in history detail view (after result components)
  - Download icon button in each history list card (before `ra-history-arrow`)
- `package.json` — `jspdf@^2` added via npm install

---

### Task 1: Install jspdf and add state + export function + hidden render div

**Files:**
- Modify: `src/ResumeAdvisor.jsx:845` (state), `src/ResumeAdvisor.jsx:1477` (function), `src/ResumeAdvisor.jsx:1889` (render div)

**Context for implementer:**
`ResumeAdvisor.jsx` is a 1892-line monolithic React component. All state is declared at lines 819–848. Handler functions end at line 1477. The JSX `return` starts at line 1523. The component already uses `html2canvas` indirectly (via `App.jsx`'s share card pattern). `jspdf` is NOT installed yet.

- [ ] **Step 1: Install jspdf**

```bash
npm install jspdf@^2
```

Expected: `package.json` gets `"jspdf": "^2.x.x"` in dependencies.

- [ ] **Step 2: Add pdfExporting and pdfErrors state**

In `src/ResumeAdvisor.jsx`, find:
```js
  var [copiedCL, setCopiedCL] = useState(false);
```

Replace with:
```js
  var [copiedCL, setCopiedCL] = useState(false);
  var [pdfExporting, setPdfExporting] = useState(null); // analysis id string while exporting, else null
  var [pdfErrors, setPdfErrors] = useState({}); // { [analysisId]: errorMessage }
```

- [ ] **Step 3: Add exportAnalysisToPdf function**

In `src/ResumeAdvisor.jsx`, find:
```js
  // ---- RENDER ----
```

Insert the following BEFORE that line:

```js
  async function exportAnalysisToPdf(analysis, resumeFileName, mode) {
    var analysisId = analysis.id || "active";
    setPdfExporting(analysisId);
    setPdfErrors(function(prev) { var n = Object.assign({}, prev); delete n[analysisId]; return n; });

    try {
      var mods = await Promise.all([import("html2canvas"), import("jspdf")]);
      var html2canvas = mods[0].default || mods[0];
      var jsPDF = mods[1].default || mods[1].jsPDF;

      // Parse array fields — handle both pre-parsed arrays (live result) and JSON strings (history from DB)
      var parsedNextSteps = [];
      try { parsedNextSteps = typeof analysis.next_steps === "string" ? JSON.parse(analysis.next_steps) : (analysis.next_steps || []); if (!Array.isArray(parsedNextSteps)) parsedNextSteps = []; } catch(e) { parsedNextSteps = []; }

      var bullets = [];
      try { bullets = typeof analysis.bullet_rewrites === "string" ? JSON.parse(analysis.bullet_rewrites) : (analysis.bullet_rewrites || []); if (!Array.isArray(bullets)) bullets = []; } catch(e) { bullets = []; }

      var keywords = [];
      try {
        keywords = typeof analysis.keyword_gaps === "string" ? JSON.parse(analysis.keyword_gaps) : (analysis.keyword_gaps || []);
        if (!Array.isArray(keywords)) keywords = [];
      } catch(e) {
        if (typeof analysis.keyword_gaps === "string") keywords = analysis.keyword_gaps.split(",").map(function(k) { return k.trim(); }).filter(Boolean);
        else keywords = [];
      }

      var interviews = [];
      if (mode === "career_coach") {
        try { interviews = typeof analysis.ats_feedback === "string" ? JSON.parse(analysis.ats_feedback) : (Array.isArray(analysis.ats_feedback) ? analysis.ats_feedback : []); } catch(e) { interviews = []; }
      }

      function scoreColor(s) { return s >= 70 ? "#00e67a" : s >= 40 ? "#c99a00" : "#d42200"; }
      function modeLabel(m) { return m === "general" ? "GENERAL REVIEW" : m === "job_specific" ? "JOB-SPECIFIC ANALYSIS" : m === "job_search_advisor" ? "JOB SEARCH ADVISOR" : "CAREER COACH"; }
      function modeSlug(m) { return m === "general" ? "general-review" : m === "job_specific" ? "job-specific" : m === "job_search_advisor" ? "job-search" : "career-coach"; }
      function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

      var stem = (resumeFileName || "resume").replace(/\.[^/.]+$/, "").toLowerCase().replace(/[\s_]+/g, "-");
      var today = new Date().toISOString().slice(0, 10);
      var filename = "ghostbust-" + stem + "-" + modeSlug(mode) + "-" + today + ".pdf";

      var contentHtml = "";

      if (mode === "career_coach") {
        // Sections 1 & 2
        var ccPre = [
          { title: "CAREER STAGE ASSESSMENT", body: analysis.career_trajectory, border: null },
          { title: "SKILLS GAP ANALYSIS", body: analysis.missing_sections, border: null },
        ];
        ccPre.forEach(function(s) {
          if (!s.body) return;
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:16px 20px;margin-bottom:12px' + (s.border ? ";border-left:3px solid " + s.border : "") + '">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:8px;">' + esc(s.title) + '</div>' +
            '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;line-height:1.7;">' + esc(s.body) + '</div></div>';
        });
        // Section 3: Interview Preparation (spec order: after Skills Gap, before Salary Intelligence)
        if (interviews.length > 0) {
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:16px 20px;margin-bottom:12px">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:8px;">INTERVIEW PREPARATION</div>';
          interviews.forEach(function(item, i) {
            contentHtml += '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.07)">' +
              '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.18em;color:#d42200;text-transform:uppercase;margin-bottom:4px;">QUESTION ' + (i+1) + '</div>' +
              '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;margin-bottom:8px;">' + esc(item.question) + '</div>' +
              '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.18em;color:rgba(238,234,224,0.45);text-transform:uppercase;margin-bottom:4px;">HOW TO ANSWER</div>' +
              '<div style="font-family:\'Libre Baskerville\',serif;font-size:11px;color:rgba(238,234,224,0.65);">' + esc(item.coaching) + '</div></div>';
          });
          contentHtml += '</div>';
        }
        // Sections 4-7
        var ccPost = [
          { title: "SALARY INTELLIGENCE", body: analysis.writing_quality, border: null },
          { title: "APPLICATION PATTERN ANALYSIS", body: analysis.industry_alignment, border: null },
          { title: "HONEST ASSESSMENT", body: analysis.red_flags, border: "#d42200" },
        ];
        ccPost.forEach(function(s) {
          if (!s.body) return;
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:16px 20px;margin-bottom:12px' + (s.border ? ";border-left:3px solid " + s.border : "") + '">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:8px;">' + esc(s.title) + '</div>' +
            '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;line-height:1.7;">' + esc(s.body) + '</div></div>';
        });
        if (parsedNextSteps.length > 0) {
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-left:3px solid #00e67a;border-radius:6px;padding:16px 20px;margin-bottom:12px">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:12px;">30-DAY CAREER ACTION PLAN</div>';
          parsedNextSteps.forEach(function(week, i) {
            contentHtml += '<div style="display:flex;gap:12px;margin-bottom:10px;">' +
              '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.18em;color:#00e67a;text-transform:uppercase;white-space:nowrap;padding-top:2px;">WK ' + (i+1) + '</div>' +
              '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;line-height:1.6;">' + esc(week) + '</div></div>';
          });
          contentHtml += '</div>';
        }
      } else if (mode === "job_search_advisor") {
        var jsaScore = analysis.fit_score || 0;
        var jsaColor = scoreColor(jsaScore);
        var jsaLabel = jsaScore >= 70 ? "Ready to Apply" : jsaScore >= 40 ? "Nearly There" : "Build Before Applying";
        contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:20px 24px;margin-bottom:16px;display:flex;align-items:center;gap:24px;">' +
          '<div><div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(238,234,224,0.65);margin-bottom:6px;">SEARCH READINESS SCORE</div>' +
          '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:72px;color:' + jsaColor + ';line-height:1;">' + jsaScore + '</div>' +
          '<div style="background:rgba(255,255,255,0.07);height:4px;width:120px;border-radius:2px;margin-top:8px;">' +
          '<div style="background:' + jsaColor + ';height:4px;width:' + Math.min(100, jsaScore) + '%;border-radius:2px;"></div></div></div>' +
          '<div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:20px;color:#eeeae0;margin-bottom:6px;">' + esc(jsaLabel) + '</div>' +
          (analysis.strength_justification ? '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:rgba(238,234,224,0.65);line-height:1.6;max-width:400px;">' + esc(analysis.strength_justification) + '</div>' : '') +
          '</div></div>';
        var jsaSections = [
          { title: "TARGET ROLE CLARITY", body: analysis.career_trajectory, border: null },
          { title: "REGIONAL MARKET INTELLIGENCE", body: analysis.industry_alignment, border: null },
          { title: "JOB BOARD STRATEGY", body: analysis.formatting_feedback, border: null },
          { title: "APPLICATION CADENCE", body: analysis.writing_quality, border: null },
          { title: "GHOST JOB AVOIDANCE", body: analysis.red_flags, border: "#c99a00" },
        ];
        jsaSections.forEach(function(s) {
          if (!s.body) return;
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:16px 20px;margin-bottom:12px' + (s.border ? ";border-left:3px solid " + s.border : "") + '">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:8px;">' + esc(s.title) + '</div>' +
            '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;line-height:1.7;">' + esc(s.body) + '</div></div>';
        });
        if (parsedNextSteps.length > 0) {
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-left:3px solid #00e67a;border-radius:6px;padding:16px 20px;margin-bottom:12px">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:12px;">IMMEDIATE ACTION PLAN</div>';
          parsedNextSteps.forEach(function(step, i) {
            contentHtml += '<div style="display:flex;gap:12px;margin-bottom:10px;">' +
              '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:16px;color:#00e67a;min-width:20px;">' + (i+1) + '</div>' +
              '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;line-height:1.6;">' + esc(step) + '</div></div>';
          });
          contentHtml += '</div>';
        }
      } else if (mode === "job_specific") {
        var fitScore = analysis.fit_score || 0;
        var strScore = analysis.strength_score || 0;
        contentHtml += '<div style="display:flex;gap:20px;margin-bottom:16px;">' +
          '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:20px 24px;flex:1;text-align:center;">' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(238,234,224,0.65);margin-bottom:6px;">FIT SCORE</div>' +
          '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:72px;color:' + scoreColor(fitScore) + ';line-height:1;">' + fitScore + '</div></div>' +
          '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:20px 24px;flex:1;text-align:center;">' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(238,234,224,0.65);margin-bottom:6px;">STRENGTH SCORE</div>' +
          '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:72px;color:' + scoreColor(strScore) + ';line-height:1;">' + strScore + '</div></div></div>';
        if (keywords.length > 0) {
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:16px 20px;margin-bottom:12px">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:10px;">KEYWORD GAPS</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
          keywords.forEach(function(kw) {
            contentHtml += '<span style="font-family:\'Space Mono\',monospace;font-size:10px;color:#eeeae0;background:rgba(212,34,0,0.12);border:1px solid rgba(212,34,0,0.3);padding:3px 8px;border-radius:3px;">' + esc(kw) + '</span>';
          });
          contentHtml += '</div></div>';
        }
        if (bullets.length > 0) {
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:16px 20px;margin-bottom:12px">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:10px;">BULLET REWRITES</div>';
          bullets.forEach(function(b) {
            contentHtml += '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.07)">' +
              '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(212,34,0,0.8);margin-bottom:4px;">BEFORE</div>' +
              '<div style="font-family:\'Libre Baskerville\',serif;font-size:11px;color:rgba(238,234,224,0.55);margin-bottom:8px;font-style:italic;">' + esc(b.original) + '</div>' +
              '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.14em;color:#00e67a;margin-bottom:4px;">AFTER</div>' +
              '<div style="font-family:\'Libre Baskerville\',serif;font-size:11px;color:#eeeae0;">' + esc(b.rewritten) + '</div></div>';
          });
          contentHtml += '</div>';
        }
        var atsFeedback = analysis.ats_feedback;
        if (atsFeedback && typeof atsFeedback === "string" && !atsFeedback.trim().startsWith("[")) {
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:16px 20px;margin-bottom:12px">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:8px;">ATS FEEDBACK</div>' +
            '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;line-height:1.7;">' + esc(atsFeedback) + '</div></div>';
        }
        if (analysis.cover_letter) {
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.14);border-radius:6px;padding:20px 24px;margin-bottom:12px">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:12px;">COVER LETTER</div>' +
            '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;line-height:1.8;white-space:pre-line;">' + esc(analysis.cover_letter) + '</div></div>';
        }
      } else {
        // general
        var genScore = analysis.strength_score || 0;
        contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:20px 24px;margin-bottom:16px;text-align:center;">' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(238,234,224,0.65);margin-bottom:6px;">RESUME STRENGTH SCORE</div>' +
          '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:96px;color:' + scoreColor(genScore) + ';line-height:1;">' + genScore + '</div></div>';
        var genSections = [
          { title: "FORMATTING FEEDBACK", body: analysis.formatting_feedback },
          { title: "WRITING QUALITY", body: analysis.writing_quality },
          { title: "MISSING SECTIONS", body: analysis.missing_sections },
          { title: "INDUSTRY ALIGNMENT", body: analysis.industry_alignment },
          { title: "CAREER TRAJECTORY", body: analysis.career_trajectory },
          { title: "RED FLAGS", body: analysis.red_flags },
        ];
        contentHtml += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">';
        genSections.forEach(function(s) {
          if (!s.body) return;
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:16px;">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:12px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:8px;">' + esc(s.title) + '</div>' +
            '<div style="font-family:\'Libre Baskerville\',serif;font-size:11px;color:#eeeae0;line-height:1.7;">' + esc(s.body) + '</div></div>';
        });
        contentHtml += '</div>';
        if (parsedNextSteps.length > 0) {
          contentHtml += '<div style="background:#0e0e12;border:1px solid rgba(255,255,255,0.07);border-left:3px solid #00e67a;border-radius:6px;padding:16px 20px;margin-bottom:12px">' +
            '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:0.12em;color:rgba(238,234,224,0.65);margin-bottom:12px;">NEXT STEPS</div>';
          parsedNextSteps.forEach(function(step, i) {
            contentHtml += '<div style="display:flex;gap:12px;margin-bottom:10px;">' +
              '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:18px;color:#00e67a;min-width:20px;">' + (i+1) + '</div>' +
              '<div style="font-family:\'Libre Baskerville\',serif;font-size:12px;color:#eeeae0;line-height:1.6;">' + esc(step) + '</div></div>';
          });
          contentHtml += '</div>';
        }
      }

      var badgeColor = mode === "general" ? "#4a4a60" : mode === "job_specific" ? "#d42200" : mode === "job_search_advisor" ? "#00c8e6" : "#c99a00";
      var pageHtml =
        '<style>@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap");</style>' +
        '<div style="width:794px;background:#070709;padding:0;font-size:0;">' +
          '<div style="background:#070709;border-left:4px solid #d42200;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;">' +
            '<div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;letter-spacing:0.08em;color:#eeeae0;">GHOSTBUST</div>' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.18em;color:rgba(238,234,224,0.45);text-transform:uppercase;">ghostbust.us</div></div>' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:rgba(238,234,224,0.45);">' + today + '</div>' +
          '</div>' +
          '<div style="height:1px;background:rgba(255,255,255,0.07);margin:0 24px;"></div>' +
          '<div style="display:flex;align-items:center;gap:10px;padding:10px 24px;">' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:rgba(238,234,224,0.45);">' + esc(resumeFileName || "resume") + '</div>' +
            '<span style="font-family:\'Space Mono\',monospace;font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#eeeae0;background:' + badgeColor + ';padding:3px 8px;border-radius:3px;">' + modeLabel(mode) + '</span>' +
          '</div>' +
          '<div style="height:1px;background:rgba(255,255,255,0.07);margin:0 24px 16px;"></div>' +
          '<div style="padding:0 24px 24px;">' + contentHtml + '</div>' +
          '<div style="height:1px;background:rgba(255,255,255,0.07);margin:0 24px;"></div>' +
          '<div style="padding:12px 24px;display:flex;justify-content:space-between;align-items:center;">' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(238,234,224,0.25);">ghostbust.us</div>' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.14em;color:rgba(238,234,224,0.25);">AI-GENERATED · NOT PROFESSIONAL ADVICE</div>' +
          '</div>' +
        '</div>';

      var renderDiv = document.getElementById("pdf-render-target");
      renderDiv.innerHTML = pageHtml;
      // Force layout reflow before capture
      await new Promise(function(r) { setTimeout(r, 50); });

      var canvas = await html2canvas(renderDiv.firstChild, { scale: 2, useCORS: true, allowTaint: false });
      var pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(filename);
    } catch(e) {
      console.error("[exportAnalysisToPdf] failed:", e);
      var id = analysisId;
      setPdfErrors(function(prev) { return Object.assign({}, prev, { [id]: "Export failed — try again" }); });
      setTimeout(function() {
        setPdfErrors(function(prev) { var n = Object.assign({}, prev); delete n[id]; return n; });
      }, 3000);
    } finally {
      var renderDiv = document.getElementById("pdf-render-target");
      if (renderDiv) renderDiv.innerHTML = "";
      setPdfExporting(null);
    }
  }

```

- [ ] **Step 4: Add hidden render div to JSX**

In `src/ResumeAdvisor.jsx`, find the very last lines of the component return (the closing tags):
```jsx
      )}
    </div>
  );
```
(This is lines ~1888–1891, right after the history tab closing `</div>`)

Replace with:
```jsx
      )}
      {/* Hidden render target for PDF export — must NOT be display:none */}
      <div id="pdf-render-target" style={{ visibility: "hidden", position: "absolute", left: "-9999px", top: 0 }} />
    </div>
  );
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: `✓ built` with no errors. If there are syntax errors in the `exportAnalysisToPdf` function, fix them before proceeding.

- [ ] **Step 6: Commit**

```bash
git add src/ResumeAdvisor.jsx package.json package-lock.json
git commit -m "feat: add PDF export foundation — jspdf dep, state, exportAnalysisToPdf function, hidden render div"
```

---

### Task 2: Add download button to active analysis results view

**Files:**
- Modify: `src/ResumeAdvisor.jsx:1780-1805` (the `{result && !analyzing && (...)}` block)

**Context for implementer:**
The active analysis results are rendered inside a conditional block at approximately line 1780:
```jsx
{result && !analyzing && (
  <div style={{ marginTop: 28 }}>
    {result.mode === "job_search_advisor" ? (
      <JobSearchAdvisorResults data={result} />
    ) : result.mode === "career_coach" ? (
      <CareerCoachResults data={result} />
    ) : (
      <ComprehensiveResults ... />
    )}
  </div>
)}
```

The download button goes INSIDE this div, after the result component, before the closing `</div>`.

The `resumeFileName` for the active analysis comes from `advisorResume?.file_name` — `advisorResume` is the state variable holding the currently selected resume for analysis.

The `mode` comes from `result.mode`.

- [ ] **Step 1: Add download button after active analysis result components**

The button goes inside the `<div style={{ marginTop: 28 }}>` that wraps result components, after the result component ternary, before the closing `</div>`.

The exact lines to edit are 1803–1804 in the source:
```
line 1803:                  )}        ← closes the result component ternary
line 1804:                </div>      ← closes <div style={{ marginTop: 28 }}>
line 1805:              )}            ← closes {result && !analyzing && (...)}
```

Find in `src/ResumeAdvisor.jsx` (lines 1803–1805, unique in the file):
```jsx
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
```

Replace with:
```jsx
                  )}
                  {/* PDF Download */}
                  <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={function() { exportAnalysisToPdf(result, advisorResume && advisorResume.file_name, result.mode); }}
                      disabled={pdfExporting === (result.id || "active")}
                      style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: pdfExporting === (result.id || "active") ? "rgba(238,234,224,0.25)" : "rgba(238,234,224,0.45)", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", padding: "6px 14px", borderRadius: 3, cursor: pdfExporting === (result.id || "active") ? "default" : "pointer" }}
                    >
                      {pdfExporting === (result.id || "active") ? "Generating…" : "↓ Download PDF"}
                    </button>
                    {pdfErrors[result.id || "active"] && (
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "#d42200", letterSpacing: "0.1em" }}>{pdfErrors[result.id || "active"]}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ResumeAdvisor.jsx
git commit -m "feat: add PDF download button to active analysis results view"
```

---

### Task 3: Add download button to history detail view

**Files:**
- Modify: `src/ResumeAdvisor.jsx:1814-1842` (the `selectedAnalysis` detail view)

**Context for implementer:**
When a user clicks a history card, `selectedAnalysis` is set and the detail view renders at ~line 1814:
```jsx
{selectedAnalysis ? (
  <div className="ra-history-detail">
    <button className="ra-history-back" ...>← Back to History</button>
    <div style={{ ... }}>  {/* mode badge + date meta */}
    </div>
    {selectedAnalysis.mode === "job_search_advisor" ? (
      <JobSearchAdvisorResults data={selectedAnalysis} />
    ) : selectedAnalysis.mode === "career_coach" ? (
      <CareerCoachResults data={selectedAnalysis} />
    ) : (
      <ComprehensiveResults ... />
    )}
    {/* ADD DOWNLOAD BUTTON HERE */}
  </div>
) : ...}
```

The `resumeFileName` for a history analysis requires looking up the resume from the `resumes` state array using `selectedAnalysis.resume_id`. Fall back to `"resume"` if not found.

- [ ] **Step 1: Add download button after history detail result components**

The history detail block closes at lines 1840–1843 of the source:
```
line 1840:                />            ← closes ComprehensiveResults self-closing tag
line 1841:              )}              ← closes the mode ternary
line 1842:            </div>           ← closes <div className="ra-history-detail">
line 1843:          ) : analyses.length === 0 ? (
```

In `src/ResumeAdvisor.jsx`, find (lines 1841–1843):
```jsx
              )}
            </div>
          ) : analyses.length === 0 ? (
```

Replace with:
```jsx
              )}
              {/* PDF Download */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                {(function() {
                  var detailResumeName = (resumes.find(function(r) { return r.id === selectedAnalysis.resume_id; }) || {}).file_name || "resume";
                  var detailId = selectedAnalysis.id;
                  return (
                    <>
                      <button
                        onClick={function() { exportAnalysisToPdf(selectedAnalysis, detailResumeName, selectedAnalysis.mode); }}
                        disabled={pdfExporting === detailId}
                        style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: pdfExporting === detailId ? "rgba(238,234,224,0.25)" : "rgba(238,234,224,0.45)", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", padding: "6px 14px", borderRadius: 3, cursor: pdfExporting === detailId ? "default" : "pointer" }}
                      >
                        {pdfExporting === detailId ? "Generating…" : "↓ Download PDF"}
                      </button>
                      {pdfErrors[detailId] && (
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "#d42200", letterSpacing: "0.1em" }}>{pdfErrors[detailId]}</span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : analyses.length === 0 ? (
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ResumeAdvisor.jsx
git commit -m "feat: add PDF download button to history detail view"
```

---

### Task 4: Add download icon button to history list cards

**Files:**
- Modify: `src/ResumeAdvisor.jsx:1870-1883` (each history list card)

**Context for implementer:**
Each history card is rendered in a `.map()` starting around line 1856. The card JSX at line ~1870:
```jsx
<div key={a.id} className="ra-history-card" onClick={function () { setSelectedAnalysis(a); setCopied(false); }}>
  <div className={"ra-history-score " + cls}>{displayScore || "—"}</div>
  <div className="ra-history-meta">...</div>
  <div className="ra-history-arrow">›</div>
</div>
```

The PDF button goes between `.ra-history-meta` and `.ra-history-arrow`. It must call `e.stopPropagation()` to prevent the card click (which opens the detail view) from also firing.

The `resumeFileName` for each card uses `resumes.find(r => r.id === a.resume_id)?.file_name || "resume"`.

- [ ] **Step 1: Add PDF icon button to each history list card**

Find in `src/ResumeAdvisor.jsx` (inside the `.map()` callback):
```jsx
                      <div className="ra-history-arrow">›</div>
                    </div>
```

Replace with:
```jsx
                      <button
                        onClick={function(e) {
                          e.stopPropagation();
                          var cardResumeName = (resumes.find(function(r) { return r.id === a.resume_id; }) || {}).file_name || "resume";
                          exportAnalysisToPdf(a, cardResumeName, a.mode);
                        }}
                        disabled={pdfExporting === a.id}
                        title="Download PDF"
                        style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: pdfExporting === a.id ? "rgba(238,234,224,0.2)" : "rgba(238,234,224,0.35)", background: "transparent", border: "none", cursor: pdfExporting === a.id ? "default" : "pointer", padding: "4px 6px", flexShrink: 0 }}
                      >
                        {pdfExporting === a.id ? "…" : "↓"}
                      </button>
                      <div className="ra-history-arrow">›</div>
                    </div>
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 3: Manual verification checklist**

Start the dev server: `npm run dev`

Open `http://localhost:5173/app.html`, sign in, go to Career HQ → AI Advisor.

- [ ] Run a General Review analysis. After it completes, verify "↓ Download PDF" button appears below results.
- [ ] Click it. Verify the button shows "Generating…" while processing, then triggers a PDF download.
- [ ] Open the downloaded PDF. Verify: dark background, GhostBust header, resume filename + mode badge, strength score hero, 6 feedback cards, next steps section, footer.
- [ ] Go to History tab. Verify each card shows a small `↓` button on the right.
- [ ] Click the `↓` on a history card. Verify it downloads without opening the detail view.
- [ ] Click a history card to open the detail view. Verify "↓ Download PDF" button appears below the result.
- [ ] Test with a Career Coach analysis: verify no score hero renders in the PDF, all 7 sections appear.
- [ ] Test with a Job-Specific analysis that has a cover letter: verify cover letter section renders in PDF.

- [ ] **Step 4: Commit**

```bash
git add src/ResumeAdvisor.jsx
git commit -m "feat: add PDF download icon button to history list cards"
```

---

## Final Step: Push

```bash
git push origin main
```
