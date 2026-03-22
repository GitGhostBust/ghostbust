import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

/* ================================================================
   STYLES
================================================================ */
const STYLE = `
  .ra-panel { padding: 32px 0; }

  /* Inner tab bar */
  .ra-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 28px; }
  .ra-tab { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 10px 18px 11px; border: none; background: none; color: #72728a; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
  .ra-tab:hover { color: var(--paper); }
  .ra-tab.active { color: var(--paper); border-bottom-color: var(--blood); }

  /* Upload zone */
  .ra-upload-zone { border: 2px dashed var(--border-hi); padding: 48px 32px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
  .ra-upload-zone:hover, .ra-upload-zone.drag-over { border-color: rgba(212,34,0,0.6); background: var(--blood-dim); }
  .ra-upload-icon { font-size: 40px; margin-bottom: 14px; opacity: 0.7; }
  .ra-upload-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 6px; }
  .ra-upload-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.1em; text-transform: uppercase; }

  /* Resume card */
  .ra-resume-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--signal); padding: 18px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  .ra-resume-icon { font-size: 28px; flex-shrink: 0; }
  .ra-resume-name { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--paper); font-weight: 700; }
  .ra-resume-date { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); margin-top: 3px; }
  .ra-resume-actions { margin-left: auto; display: flex; gap: 8px; flex-shrink: 0; }
  .ra-replace-btn { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--border-hi); background: none; color: var(--ghost); cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .ra-replace-btn:hover { color: var(--paper); border-color: var(--paper); }

  /* Extracted text preview */
  .ra-text-preview { background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 16px; margin-top: 16px; max-height: 220px; overflow-y: auto; }
  .ra-text-preview-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-bottom: 10px; }
  .ra-text-preview pre { font-family: 'Libre Baskerville', Georgia, serif; font-size: 12px; color: rgba(238,234,224,0.65); line-height: 1.75; white-space: pre-wrap; word-break: break-word; }

  /* Advisor form */
  .ra-advisor-box { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 26px; }
  .ra-no-resume { text-align: center; padding: 48px 20px; }
  .ra-no-resume-icon { font-size: 36px; margin-bottom: 12px; }
  .ra-no-resume-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 0.04em; color: var(--ghost); margin-bottom: 8px; }
  .ra-no-resume-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.08em; }

  /* Results */
  .ra-results { margin-top: 28px; display: flex; flex-direction: column; gap: 20px; }

  .ra-section { background: var(--surface); border: 1px solid var(--border); padding: 22px 24px; }
  .ra-section-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ghost); margin-bottom: 14px; }

  /* Fit score */
  .ra-fit-score-display { display: flex; align-items: center; gap: 20px; }
  .ra-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 80px; line-height: 1; letter-spacing: -0.01em; }
  .ra-score-green { color: var(--signal); }
  .ra-score-yellow { color: var(--bile); }
  .ra-score-red { color: var(--blood); }
  .ra-score-label { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; color: var(--paper); }
  .ra-score-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); margin-top: 4px; letter-spacing: 0.08em; }
  .ra-score-bar-wrap { flex: 1; max-width: 260px; }
  .ra-score-bar-track { height: 6px; background: rgba(255,255,255,0.07); border-radius: 0; margin-top: 8px; }
  .ra-score-bar-fill { height: 6px; transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }

  /* Gap analysis prose */
  .ra-prose { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.8); line-height: 1.85; }

  /* Bullet rewrites */
  .ra-bullets { display: flex; flex-direction: column; gap: 16px; }
  .ra-bullet-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ra-bullet-side { padding: 12px 14px; }
  .ra-bullet-side.original { background: rgba(212,34,0,0.06); border: 1px solid rgba(212,34,0,0.15); }
  .ra-bullet-side.improved { background: rgba(0,230,122,0.06); border: 1px solid rgba(0,230,122,0.15); }
  .ra-bullet-side-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 7px; }
  .ra-bullet-side.original .ra-bullet-side-label { color: var(--blood); }
  .ra-bullet-side.improved .ra-bullet-side-label { color: var(--signal); }
  .ra-bullet-text { font-family: 'Libre Baskerville', Georgia, serif; font-size: 12px; color: rgba(238,234,224,0.8); line-height: 1.7; }

  /* Keyword gaps */
  .ra-pills { display: flex; flex-wrap: wrap; gap: 8px; }
  .ra-pill { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.06em; padding: 4px 10px; background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.25); color: var(--blood); }

  /* Cover letter */
  .ra-cover-letter { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.8); line-height: 1.85; white-space: pre-wrap; max-height: 400px; overflow-y: auto; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); margin-top: 4px; }
  .ra-copy-btn { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; border: 1px solid var(--border-hi); color: var(--paper); background: none; cursor: pointer; transition: background 0.15s; margin-top: 12px; }
  .ra-copy-btn:hover { background: rgba(255,255,255,0.05); }
  .ra-copy-btn.copied { color: var(--signal); border-color: var(--signal); }

  /* History */
  .ra-history-list { display: flex; flex-direction: column; gap: 10px; }
  .ra-history-card { background: var(--surface); border: 1px solid var(--border); padding: 16px 18px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 16px; }
  .ra-history-card:hover { background: var(--surface2); }
  .ra-history-score { font-family: 'Bebas Neue', sans-serif; font-size: 36px; line-height: 1; flex-shrink: 0; width: 52px; text-align: center; }
  .ra-history-meta { flex: 1; min-width: 0; }
  .ra-history-snippet { font-family: 'Libre Baskerville', Georgia, serif; font-size: 12px; color: rgba(238,234,224,0.7); line-height: 1.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ra-history-date { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--ghost); margin-top: 4px; letter-spacing: 0.06em; }
  .ra-history-arrow { color: var(--ghost); flex-shrink: 0; }
  .ra-history-back { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--border); background: none; color: var(--ghost); cursor: pointer; margin-bottom: 20px; transition: color 0.15s; }
  .ra-history-back:hover { color: var(--paper); }

  /* Loading */
  .ra-loading { text-align: center; padding: 48px 20px; background: var(--surface); border: 1px solid var(--border); }
  .ra-spin { width: 36px; height: 36px; border: 2px solid var(--border); border-top-color: var(--blood); border-radius: 50%; animation: spin 0.75s linear infinite; margin: 0 auto 14px; }
  .ra-load-text { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--ghost); text-transform: uppercase; }

  /* Locked / no session */
  .ra-locked { text-align: center; padding: 60px 20px; }
  .ra-locked-icon { font-size: 52px; margin-bottom: 16px; }
  .ra-locked-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 8px; }
  .ra-locked-sub { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.6); line-height: 1.75; max-width: 400px; margin: 0 auto; }
  .ra-pro-badge { display: inline-block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 12px; background: var(--bile-dim); border: 1px solid rgba(201,154,0,0.35); color: var(--bile); margin-bottom: 20px; }

  /* Section header with divider */
  .ra-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .ra-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); }
  .ra-section-count { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.08em; }

  /* Error */
  .ra-error { padding: 14px 18px; background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.3); font-family: 'Space Mono', monospace; font-size: 11px; color: var(--blood); margin-top: 16px; }

  /* Delete button */
  .ra-delete-btn { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid rgba(212,34,0,0.35); background: none; color: var(--blood); cursor: pointer; transition: background 0.15s, color 0.15s; }
  .ra-delete-btn:hover { background: var(--blood-dim); }

  /* PREVIEW */
  .ra-preview-container { margin-top: 24px; }
  .ra-preview-label { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.06em; color: var(--paper); margin-bottom: 10px; }
  .ra-preview-box { background: #111; border: 1px solid rgba(212,34,0,0.3); overflow: hidden; height: 800px; position: relative; z-index: 9001; }
  .ra-preview-loading { display: flex; align-items: center; justify-content: center; height: 100%; gap: 12px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--ghost); text-transform: uppercase; }
  .ra-preview-docx { padding: 28px 32px; background: #111; border: none; outline: none; overflow-y: auto; height: 100%; box-sizing: border-box; }
  /* Hard reset — kill every possible source of horizontal line artifacts */
  .ra-preview-docx hr { display: none !important; }
  .ra-preview-docx p, .ra-preview-docx li, .ra-preview-docx div, .ra-preview-docx span, .ra-preview-docx blockquote { border: none !important; border-top: none !important; border-bottom: none !important; background: transparent; }
  .ra-preview-docx h1, .ra-preview-docx h2, .ra-preview-docx h3, .ra-preview-docx h4 { font-family: 'Bebas Neue', sans-serif; color: var(--paper); margin: 18px 0 8px; letter-spacing: 0.04em; line-height: 1.1; border: none !important; border-bottom: none !important; }
  .ra-preview-docx h1 { font-size: 28px; } .ra-preview-docx h2 { font-size: 22px; } .ra-preview-docx h3 { font-size: 18px; } .ra-preview-docx h4 { font-size: 15px; }
  .ra-preview-docx p { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.82); line-height: 1.75; margin-bottom: 8px; }
  .ra-preview-docx ul, .ra-preview-docx ol { padding-left: 20px; margin-bottom: 10px; }
  .ra-preview-docx li { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.82); line-height: 1.7; margin-bottom: 3px; }
  .ra-preview-docx strong, .ra-preview-docx b { color: var(--paper); }
  .ra-preview-docx a { color: var(--ice); text-decoration: none; }
  .ra-preview-docx table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .ra-preview-docx td, .ra-preview-docx th { font-family: 'Libre Baskerville', Georgia, serif; font-size: 12px; color: rgba(238,234,224,0.75); padding: 5px 8px; border: 1px solid var(--border); vertical-align: top; }

  @media (max-width: 720px) {
    .ra-bullet-pair { grid-template-columns: 1fr; }
    .ra-fit-score-display { flex-direction: column; align-items: flex-start; gap: 12px; }
    .ra-score-bar-wrap { width: 100%; max-width: 100%; }
  }
`;

/* ================================================================
   HELPERS
================================================================ */
function apiCall(messages) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) throw new Error(data.error.type + ": " + data.error.message);
      if (!data.content || !data.content.length) throw new Error("Empty API response");
      return data.content.filter(function (b) { return b.type === "text"; }).map(function (b) { return b.text; }).join("\n").replace(/```json/g, "").replace(/```/g, "").trim();
    });
}

function parseJSON(text) {
  var t = text.trim();
  try { return JSON.parse(t); } catch (e1) { /* continue */ }
  var s = t.indexOf("{"); var e = t.lastIndexOf("}");
  if (s !== -1 && e > s) { try { return JSON.parse(t.slice(s, e + 1)); } catch (e2) { /* continue */ } }
  throw new Error("Could not parse AI response: " + t.slice(0, 200));
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fitScoreClass(n) {
  if (n >= 70) return "ra-score-green";
  if (n >= 40) return "ra-score-yellow";
  return "ra-score-red";
}

function fitScoreLabel(n) {
  if (n >= 70) return "Strong Match";
  if (n >= 40) return "Partial Match";
  return "Weak Match";
}

// Injected into every DOCX preview — overrides all borders/dividers
// that mammoth or the browser may render from DOCX content.
// Uses !important so it beats any inline styles mammoth emits.
var DOCX_RESET_STYLE = '<style>' +
  '* { border: none !important; border-top: none !important; border-bottom: none !important; box-shadow: none !important; outline: none !important; }' +
  'hr { display: none !important; }' +
  'p, li, div, span, blockquote { border: none !important; background: transparent; }' +
  'h1, h2, h3, h4, h5, h6 { border: none !important; border-bottom: none !important; }' +
  'table, td, th { border: 1px solid rgba(255,255,255,0.07) !important; }' + // keep table structure only
  '</style>';

// styleMap tells mammoth not to emit <hr> elements for any DOCX paragraph style
var MAMMOTH_OPTIONS = {
  styleMap: [
    "p[style-name='Horizontal Line'] => ",
    "p[style-name='horizontal line'] => ",
    "p[style-name='HR'] => ",
  ],
  ignoreEmptyParagraphs: false,
};

function storagePathFromUrl(url) {
  if (!url) return null;
  var match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/resumes\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

async function extractTextFromFile(file) {
  var name = file.name.toLowerCase();
  var buf = await file.arrayBuffer();

  if (name.endsWith(".docx")) {
    var mammoth = await import("mammoth");
    var res = await mammoth.default.extractRawText({ arrayBuffer: buf });
    return res.value || "";
  }

  if (name.endsWith(".pdf")) {
    var pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).href;
    var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    var texts = [];
    for (var i = 1; i <= pdf.numPages; i++) {
      var page = await pdf.getPage(i);
      var content = await page.getTextContent();
      texts.push(content.items.map(function (item) { return item.str; }).join(" "));
    }
    return texts.join("\n");
  }

  return "";
}

/* ================================================================
   FIT SCORE SECTION
================================================================ */
function FitScoreSection({ score }) {
  var cls = fitScoreClass(score);
  var label = fitScoreLabel(score);
  var pct = Math.min(100, Math.max(0, score));
  var barColor = score >= 70 ? "var(--signal)" : score >= 40 ? "var(--bile)" : "var(--blood)";

  return (
    <div className="ra-section" style={{ borderTop: "4px solid " + (score >= 70 ? "var(--signal)" : score >= 40 ? "var(--bile)" : "var(--blood)") }}>
      <div className="ra-section-label">Resume Fit Score</div>
      <div className="ra-fit-score-display">
        <div>
          <div className={"ra-score-num " + cls}>{score}</div>
        </div>
        <div className="ra-score-bar-wrap">
          <div className={"ra-score-label"}>{label}</div>
          <div className="ra-score-sub">{score >= 70 ? "You are well-qualified for this role." : score >= 40 ? "You meet some requirements. Gaps exist." : "Significant gaps between your resume and this role."}</div>
          <div className="ra-score-bar-track" style={{ marginTop: 12 }}>
            <div className="ra-score-bar-fill" style={{ width: pct + "%", background: barColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   RESULTS DISPLAY
================================================================ */
function AnalysisResults({ data, onCopy, copied }) {
  var bullets = [];
  try {
    bullets = typeof data.bullet_rewrites === "string" ? JSON.parse(data.bullet_rewrites) : (data.bullet_rewrites || []);
  } catch (e) { bullets = []; }

  var keywords = [];
  try {
    keywords = typeof data.keyword_gaps === "string" ? JSON.parse(data.keyword_gaps) : (data.keyword_gaps || []);
  } catch (e) {
    if (typeof data.keyword_gaps === "string") {
      keywords = data.keyword_gaps.split(",").map(function (k) { return k.trim(); }).filter(Boolean);
    }
  }

  return (
    <div className="ra-results">
      <FitScoreSection score={data.fit_score} />

      {data.gap_analysis && (
        <div className="ra-section">
          <div className="ra-section-label">Gap Analysis</div>
          <div className="ra-prose">{data.gap_analysis}</div>
        </div>
      )}

      {bullets.length > 0 && (
        <div className="ra-section">
          <div className="ra-section-label">Bullet Rewrites — Top {bullets.length} to Improve</div>
          <div className="ra-bullets">
            {bullets.map(function (b, i) {
              return (
                <div key={i} className="ra-bullet-pair">
                  <div className="ra-bullet-side original">
                    <div className="ra-bullet-side-label">Original</div>
                    <div className="ra-bullet-text">{b.original}</div>
                  </div>
                  <div className="ra-bullet-side improved">
                    <div className="ra-bullet-side-label">Improved</div>
                    <div className="ra-bullet-text">{b.improved}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="ra-section">
          <div className="ra-section-label">Missing Keywords — Add These to Your Resume</div>
          <div className="ra-pills">
            {keywords.map(function (k, i) {
              return <span key={i} className="ra-pill">{k}</span>;
            })}
          </div>
        </div>
      )}

      {data.ats_feedback && (
        <div className="ra-section">
          <div className="ra-section-label">ATS Optimization</div>
          <div className="ra-prose">{data.ats_feedback}</div>
        </div>
      )}

      {data.cover_letter && (
        <div className="ra-section">
          <div className="ra-section-label">Generated Cover Letter</div>
          <div className="ra-cover-letter">{data.cover_letter}</div>
          <button className={"ra-copy-btn" + (copied ? " copied" : "")} onClick={onCopy}>
            {copied ? "✓ Copied!" : "Copy Cover Letter"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
export default function ResumeAdvisor({ session, onRequestSignIn }) {
  var [isPro, setIsPro] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);
  var [resumes, setResumes] = useState([]);
  var [resume, setResume] = useState(null); // selected/active resume for advisor
  var [expandedId, setExpandedId] = useState(null); // which card is showing preview
  var [uploading, setUploading] = useState(false);
  var [uploadError, setUploadError] = useState(null);
  var [innerTab, setInnerTab] = useState("manager");
  var [jobText, setJobText] = useState("");
  var [analyzing, setAnalyzing] = useState(false);
  var [result, setResult] = useState(null);
  var [analysisError, setAnalysisError] = useState(null);
  var [analyses, setAnalyses] = useState([]);
  var [selectedAnalysis, setSelectedAnalysis] = useState(null);
  var [copied, setCopied] = useState(false);
  var [dragOver, setDragOver] = useState(false);
  var [previewContent, setPreviewContent] = useState(null); // { type:"pdf", url } | { type:"docx", html }
  var [previewLoading, setPreviewLoading] = useState(false);
  var fileRef = useRef(null);
  var canvasRef = useRef(null);

  // Load Pro status + admin check
  useEffect(function () {
    if (!session) return;
    supabase.from("profiles").select("founding_member, username").eq("id", session.user.id).single()
      .then(function (res) {
        if (res.data) {
          setIsPro(res.data.founding_member === true);
          setIsAdmin(res.data.username === "GhostBustOfficial");
        } else {
          setIsPro(false);
        }
      });
  }, [session]);

  // Reload resumes every time My Resume tab is opened
  useEffect(function () {
    if (!session || innerTab !== "manager") return;
    loadResumes();
  }, [session, innerTab]);

  // Load analyses on session change
  useEffect(function () {
    if (!session) return;
    loadAnalyses();
  }, [session]);

  // Render PDF page 1 to canvas whenever previewContent changes to a PDF.
  // NOTE: Any horizontal lines visible on the canvas are actual PDF content
  // (e.g. resume section dividers drawn by the PDF template). They are
  // rendered faithfully by pdfjs and cannot be removed via CSS — the canvas
  // is a pixel-accurate raster of the PDF page, not HTML.
  useEffect(function () {
    if (!previewContent || previewContent.type !== "pdf") return;
    var cancelled = false;
    (async function () {
      try {
        var pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
        var pdf = await pdfjsLib.getDocument(previewContent.url).promise;
        if (cancelled) return;
        var page = await pdf.getPage(1);
        if (cancelled) return;
        var canvas = canvasRef.current;
        if (!canvas) return;
        var containerWidth = (canvas.parentElement ? canvas.parentElement.clientWidth : 0) || 800;
        var baseViewport = page.getViewport({ scale: 1 });
        var scale = containerWidth / baseViewport.width;
        var viewport = page.getViewport({ scale: scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;
      } catch (e) {
        console.warn("PDF canvas render failed:", e);
      }
    })();
    return function () { cancelled = true; };
  }, [previewContent]);

  async function buildPreviewFromFile(file, storagePath) {
    var name = file.name.toLowerCase();
    setPreviewLoading(true);
    try {
      if (name.endsWith(".pdf")) {
        var { data: sd } = await supabase.storage.from("resumes").createSignedUrl(storagePath, 3600);
        if (sd?.signedUrl) setPreviewContent({ type: "pdf", url: sd.signedUrl });
      } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        var buf = await file.arrayBuffer();
        var mammoth = await import("mammoth");
        var res = await mammoth.default.convertToHtml({ arrayBuffer: buf }, MAMMOTH_OPTIONS);
        setPreviewContent({ type: "docx", html: DOCX_RESET_STYLE + res.value });
      }
    } catch (e) { /* silently fail — preview is non-critical */ }
    finally { setPreviewLoading(false); }
  }

  async function buildPreviewFromDb(resumeRecord) {
    var name = resumeRecord.file_name.toLowerCase();
    var path = storagePathFromUrl(resumeRecord.file_url);
    if (!path) return;
    setPreviewLoading(true);
    try {
      var { data: sd } = await supabase.storage.from("resumes").createSignedUrl(path, 3600);
      var signedUrl = sd?.signedUrl;
      if (!signedUrl) return;
      if (name.endsWith(".pdf")) {
        setPreviewContent({ type: "pdf", url: signedUrl });
      } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        var resp = await fetch(signedUrl);
        var buf2 = await resp.arrayBuffer();
        var mammoth2 = await import("mammoth");
        var res2 = await mammoth2.default.convertToHtml({ arrayBuffer: buf2 }, MAMMOTH_OPTIONS);
        setPreviewContent({ type: "docx", html: DOCX_RESET_STYLE + res2.value });
      }
    } catch (e) { /* silently fail */ }
    finally { setPreviewLoading(false); }
  }

  function loadResumes() {
    supabase.from("resumes").select("*").eq("user_id", session.user.id)
      .order("uploaded_at", { ascending: false })
      .then(function (res) {
        var list = (res.data && res.data.length > 0) ? res.data : [];
        setResumes(list);
        // Keep selected resume in sync; default to most recent
        if (list.length > 0) {
          setResume(function (prev) {
            // If previously selected resume still exists, keep it
            var still = list.find(function (r) { return prev && r.id === prev.id; });
            return still || list[0];
          });
          setExpandedId(function (prev) { return prev || list[0].id; });
        } else {
          setResume(null);
          setExpandedId(null);
          setPreviewContent(null);
        }
      });
  }

  function loadAnalyses() {
    supabase.from("resume_analyses").select("*").eq("user_id", session.user.id)
      .order("created_at", { ascending: false }).limit(30)
      .then(function (res) {
        if (res.data) setAnalyses(res.data);
      });
  }

  async function handleDelete(r) {
    if (!session) return;
    if (session.user.id !== r.user_id && !isAdmin) return;
    try {
      var path = storagePathFromUrl(r.file_url);
      if (path) await supabase.storage.from("resumes").remove([path]);
      await supabase.from("resumes").delete().eq("id", r.id);
      // If this was the expanded/selected resume, clear preview
      if (expandedId === r.id) {
        setExpandedId(null);
        setPreviewContent(null);
      }
      if (resume && resume.id === r.id) setResume(null);
      loadResumes();
    } catch (err) {
      setUploadError("Delete failed: " + err.message);
    }
  }

  async function handleFile(file) {
    if (!file) return;
    var name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx") && !name.endsWith(".doc")) {
      setUploadError("Please upload a PDF or DOCX file.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setPreviewContent(null);
    try {
      // 1. Upload to Supabase Storage first
      var ext = name.endsWith(".pdf") ? ".pdf" : ".docx";
      var path = session.user.id + "/resume-" + Date.now() + ext;
      var { error: storageError } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
      if (storageError) throw storageError;

      var { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
      var fileUrl = urlData ? urlData.publicUrl : path;

      // 2. Insert DB row immediately (extracted_text null until extraction finishes)
      var { data: newResume, error: dbError } = await supabase.from("resumes").insert({
        user_id: session.user.id,
        file_url: fileUrl,
        file_name: file.name,
        extracted_text: null,
      }).select().single();
      if (dbError) throw dbError;

      setResume(newResume);
      setExpandedId(newResume.id);
      loadResumes();
      buildPreviewFromFile(file, path);

      // 3. Best-effort text extraction — runs after upload succeeds, never blocks
      extractTextFromFile(file).then(function (text) {
        if (!text) return;
        supabase.from("resumes").update({ extracted_text: text }).eq("id", newResume.id)
          .then(function (res) {
            if (!res.error) setResume(function (prev) { return prev && prev.id === newResume.id ? Object.assign({}, prev, { extracted_text: text }) : prev; });
          });
      }).catch(function (e) { console.warn("Text extraction failed (non-critical):", e); });

    } catch (err) {
      setUploadError("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e) {
    handleFile(e.target.files[0]);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleAnalyze() {
    if (!resume || !resume.extracted_text || !jobText.trim()) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setResult(null);
    try {
      var systemPrompt = "You are an expert resume advisor and ATS optimization specialist. Analyze the provided resume against the job listing and return a JSON object with these exact fields: fit_score (integer 0-100), gap_analysis (string, 2-3 paragraphs), bullet_rewrites (array of objects with 'original' and 'improved' fields for the top 3-5 bullet points to rewrite), keyword_gaps (array of strings — keywords in job description missing from resume), ats_feedback (string, specific ATS optimization advice), cover_letter (string, complete tailored cover letter). Return only valid JSON, no markdown.";
      var userContent = "RESUME:\n" + resume.extracted_text + "\n\nJOB LISTING:\n" + jobText;
      var raw = await apiCall([
        { role: "user", content: systemPrompt + "\n\n" + userContent }
      ]);
      var parsed = parseJSON(raw);

      // Normalise fields for DB storage
      var bulletStr = typeof parsed.bullet_rewrites === "string" ? parsed.bullet_rewrites : JSON.stringify(parsed.bullet_rewrites || []);
      var kwStr = typeof parsed.keyword_gaps === "string" ? parsed.keyword_gaps : JSON.stringify(parsed.keyword_gaps || []);

      var { data: saved, error: dbErr } = await supabase.from("resume_analyses").insert({
        user_id: session.user.id,
        resume_id: resume.id,
        job_listing_text: jobText.slice(0, 8000),
        fit_score: parsed.fit_score || 0,
        gap_analysis: parsed.gap_analysis || "",
        bullet_rewrites: bulletStr,
        keyword_gaps: kwStr,
        ats_feedback: parsed.ats_feedback || "",
        cover_letter: parsed.cover_letter || "",
      }).select().single();

      if (dbErr) throw dbErr;
      setResult(saved);
      loadAnalyses();
    } catch (err) {
      setAnalysisError("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function copyCoverLetter(data) {
    var text = data.cover_letter || "";
    navigator.clipboard.writeText(text).catch(function () {});
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2500);
  }

  // ---- RENDER ----

  var styleEl = <style key="ra-style">{STYLE}</style>;

  if (!session) {
    return (
      <div className="ra-panel">
        {styleEl}
        <div className="ra-locked">
          <div className="ra-locked-icon">📄</div>
          <div className="ra-locked-title">Resume Advisor</div>
          <p className="ra-locked-sub" style={{ marginTop: 8 }}>Sign in to upload your resume and get AI-powered feedback tailored to every job you apply for.</p>
          <button className="run-btn red" style={{ marginTop: 24, maxWidth: 280, margin: "24px auto 0", display: "block" }} onClick={onRequestSignIn}>Sign In to Access</button>
        </div>
      </div>
    );
  }

  if (isPro === null) {
    return (
      <div className="ra-panel">
        {styleEl}
        <div className="ra-loading"><div className="ra-spin" /><div className="ra-load-text">Loading...</div></div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="ra-panel">
        {styleEl}
        <div className="ra-locked">
          <div className="ra-locked-icon">🔒</div>
          <div className="ra-pro-badge">Pro Feature</div>
          <div className="ra-locked-title">Resume Advisor</div>
          <p className="ra-locked-sub">Resume upload, AI gap analysis, bullet rewrites, keyword matching, ATS optimization, and cover letter generation are available on GhostBust Pro.</p>
          <div style={{ marginTop: 28, fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--ghost)", letterSpacing: "0.1em" }}>PRO PLAN — COMING SOON</div>
        </div>
      </div>
    );
  }

  // ---- PRO UI ----

  return (
    <div className="ra-panel">
      {styleEl}
      <div className="ra-tabs">
        <button className={"ra-tab" + (innerTab === "manager" ? " active" : "")} onClick={function () { setInnerTab("manager"); setResult(null); }}>📄 My Resume</button>
        <button className={"ra-tab" + (innerTab === "advisor" ? " active" : "")} onClick={function () { setInnerTab("advisor"); }}>🤖 AI Advisor</button>
        <button className={"ra-tab" + (innerTab === "history" ? " active" : "")} onClick={function () { setInnerTab("history"); setSelectedAnalysis(null); }}>
          📊 History {analyses.length > 0 && <span style={{ marginLeft: 6, background: "var(--blood)", color: "var(--paper)", fontFamily: "'Space Mono',monospace", fontSize: 8, padding: "1px 5px" }}>{analyses.length}</span>}
        </button>
      </div>

      {/* ── MANAGER TAB ── */}
      {innerTab === "manager" && (
        <div>
          {/* Upload zone — always visible */}
          <div
            className={"ra-upload-zone" + (dragOver ? " drag-over" : "")}
            style={{ marginBottom: 24 }}
            onClick={function () { !uploading && fileRef.current && fileRef.current.click(); }}
            onDragOver={function (e) { e.preventDefault(); setDragOver(true); }}
            onDragLeave={function () { setDragOver(false); }}
            onDrop={handleDrop}
          >
            {uploading ? (
              <>
                <div className="ra-spin" style={{ margin: "0 auto 14px" }} />
                <div className="ra-upload-title">Uploading & Extracting Text...</div>
              </>
            ) : (
              <>
                <div className="ra-upload-icon">📤</div>
                <div className="ra-upload-title">{resumes.length > 0 ? "Upload Another Resume" : "Upload Your Resume"}</div>
                <div className="ra-upload-sub">PDF or DOCX · Click or drag & drop · Max 10 MB</div>
              </>
            )}
          </div>

          {uploadError && <div className="ra-error" style={{ marginBottom: 16 }}>{uploadError}</div>}

          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }} onChange={handleInputChange} />

          {/* Resume list */}
          {resumes.length === 0 && !uploading && (
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "var(--ghost)", lineHeight: 1.8 }}>
              <div style={{ marginBottom: 6 }}>• DOCX files give the most accurate text extraction</div>
              <div>• Your resume is stored privately — only you can access it</div>
            </div>
          )}

          {resumes.map(function (r) {
            var isExpanded = expandedId === r.id;
            var canDelete = session && (session.user.id === r.user_id || isAdmin);
            return (
              <div key={r.id} style={{ marginBottom: 16 }}>
                <div className="ra-resume-card" style={{ cursor: "pointer" }} onClick={function () {
                  if (isExpanded) {
                    setExpandedId(null);
                  } else {
                    setExpandedId(r.id);
                    setResume(r);
                    setPreviewContent(null);
                    buildPreviewFromDb(r);
                  }
                }}>
                  <div className="ra-resume-icon">{r.file_name.toLowerCase().endsWith(".pdf") ? "📕" : "📘"}</div>
                  <div>
                    <div className="ra-resume-name">{r.file_name}</div>
                    <div className="ra-resume-date">Uploaded {formatDate(r.uploaded_at)}</div>
                  </div>
                  <div className="ra-resume-actions">
                    <button className="ra-replace-btn" style={{ pointerEvents: "none" }}>
                      {isExpanded ? "▲ Collapse" : "▼ Preview"}
                    </button>
                    {canDelete && (
                      <button className="ra-delete-btn" onClick={function (e) { e.stopPropagation(); handleDelete(r); }}>
                        ✕ Delete
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ra-preview-container" style={{ marginTop: 0 }}>
                    <div className="ra-preview-box">
                      {previewLoading ? (
                        <div className="ra-preview-loading">
                          <div className="ra-spin" />
                          <span>Loading preview...</span>
                        </div>
                      ) : previewContent?.type === "pdf" ? (
                        <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
                      ) : previewContent?.type === "docx" ? (
                        <div className="ra-preview-docx" dangerouslySetInnerHTML={{ __html: previewContent.html }} />
                      ) : (
                        <div className="ra-preview-loading">No preview available</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADVISOR TAB ── */}
      {innerTab === "advisor" && (
        <div>
          {!resume ? (
            <div className="ra-no-resume">
              <div className="ra-no-resume-icon">📄</div>
              <div className="ra-no-resume-title">Upload Your Resume First</div>
              <div className="ra-no-resume-sub" style={{ marginTop: 6 }}>Go to the My Resume tab to upload your resume before running an analysis.</div>
              <button className="run-btn red" style={{ maxWidth: 240, margin: "20px auto 0", display: "block" }} onClick={function () { setInnerTab("manager"); }}>Go to My Resume →</button>
            </div>
          ) : !resume.extracted_text ? (
            <div className="ra-no-resume">
              <div className="ra-no-resume-icon">⚠️</div>
              <div className="ra-no-resume-title">No Extracted Text</div>
              <div className="ra-no-resume-sub" style={{ marginTop: 6 }}>Re-upload your resume as a DOCX file so the AI can read its content.</div>
            </div>
          ) : (
            <div>
              <div className="ra-advisor-box">
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--blood)", display: "block", marginBottom: 6 }}>AI Resume Advisor</span>
                <label style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(238,234,224,0.6)", display: "block", marginBottom: 6, lineHeight: 1.7 }}>
                  Paste the full job listing below. The AI will score your fit, identify gaps, rewrite weak bullets, flag missing keywords, and generate a tailored cover letter.
                </label>
                <textarea
                  className="paste-area"
                  style={{ minHeight: 200, marginTop: 10 }}
                  placeholder="Paste the full job listing here — title, responsibilities, requirements, company description..."
                  value={jobText}
                  onChange={function (e) { setJobText(e.target.value); setResult(null); }}
                />
                <button
                  className="run-btn red"
                  style={{ marginTop: 14 }}
                  onClick={handleAnalyze}
                  disabled={analyzing || jobText.trim().length < 50}
                >
                  {analyzing ? "Analysing..." : "Analyse My Resume →"}
                </button>
              </div>

              {analyzing && (
                <div className="ra-loading" style={{ marginTop: 20 }}>
                  <div className="ra-spin" />
                  <div className="ra-load-text">Reading your resume against the job listing...</div>
                </div>
              )}

              {analysisError && <div className="ra-error">{analysisError}</div>}

              {result && (
                <AnalysisResults
                  data={result}
                  onCopy={function () { copyCoverLetter(result); }}
                  copied={copied}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {innerTab === "history" && (
        <div>
          {selectedAnalysis ? (
            <div>
              <button className="ra-history-back" onClick={function () { setSelectedAnalysis(null); setCopied(false); }}>← Back to History</button>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--ghost)", letterSpacing: "0.1em", marginBottom: 16 }}>
                {formatDate(selectedAnalysis.created_at)} · Fit Score: {selectedAnalysis.fit_score}
              </div>
              <AnalysisResults
                data={selectedAnalysis}
                onCopy={function () { copyCoverLetter(selectedAnalysis); }}
                copied={copied}
              />
            </div>
          ) : analyses.length === 0 ? (
            <div className="ra-no-resume">
              <div className="ra-no-resume-icon">📊</div>
              <div className="ra-no-resume-title">No Analyses Yet</div>
              <div className="ra-no-resume-sub" style={{ marginTop: 6 }}>Run your first analysis from the AI Advisor tab.</div>
            </div>
          ) : (
            <div>
              <div className="ra-section-head">
                <div className="ra-section-title">Analysis History</div>
                <div className="ra-section-count">{analyses.length} saved</div>
              </div>
              <div className="ra-history-list">
                {analyses.map(function (a) {
                  var cls = fitScoreClass(a.fit_score);
                  return (
                    <div key={a.id} className="ra-history-card" onClick={function () { setSelectedAnalysis(a); setCopied(false); }}>
                      <div className={"ra-history-score " + cls}>{a.fit_score}</div>
                      <div className="ra-history-meta">
                        <div className="ra-history-snippet">{a.job_listing_text ? a.job_listing_text.slice(0, 100) : "No preview"}</div>
                        <div className="ra-history-date">{formatDate(a.created_at)} · {fitScoreLabel(a.fit_score)}</div>
                      </div>
                      <div className="ra-history-arrow">›</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
