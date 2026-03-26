import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase.js";

/* ================================================================
   CONSTANTS (VerifyTab-specific)
================================================================ */
var VERIFY_STEPS = [
  "Parsing listing structure...",
  "Scanning for ghost job patterns...",
  "Scoring language specificity...",
  "Checking hiring intent signals...",
  "Calculating Ghost Score...",
  "Rendering verdict...",
];

/* ================================================================
   HELPERS
================================================================ */
function gsColor(n) {
  if (n > 60) return "sc-red";
  if (n > 35) return "sc-yellow";
  return "sc-green";
}
function scoreColor(n) {
  if (n > 60) return "sc-green";
  if (n > 35) return "sc-yellow";
  return "sc-red";
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
function parseJSON(text) {
  var t = text.trim();
  try { return JSON.parse(t); } catch(e1) { /* continue */ }
  var s = t.indexOf("{"); var e = t.lastIndexOf("}");
  if (s !== -1 && e > s) { try { return JSON.parse(t.slice(s,e+1)); } catch(e2) { /* continue */ } }
  throw new Error("Could not parse response: " + t.slice(0,200));
}
function apiCall(messages, accessToken) {
  return fetch("/api/claude", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer " + (accessToken || ""),
    },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: messages }),
  })
  .then(function(r){
    if (r.status === 429) throw new Error("RATE_LIMIT");
    return r.json();
  })
  .then(function(data){
    if (data.error) throw new Error(data.error.type+": "+data.error.message);
    if (!data.content||!data.content.length) throw new Error("Empty API response");
    return data.content.filter(function(b){return b.type==="text";}).map(function(b){return b.text;}).join("\n").replace(/```json/g,"").replace(/```/g,"").trim();
  });
}

/* ================================================================
   STYLES (VerifyTab-specific)
================================================================ */
var STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');

  /* INNER TABS */
  .inner-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); background: var(--void); margin-bottom: 24px; }
  .inner-tab { padding: 10px 24px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.08em; color: var(--muted); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; }
  .inner-tab:hover { color: var(--paper); }
  .inner-tab.active { color: var(--blood); border-bottom-color: var(--blood); }
  .inner-tab .tab-count { background: var(--blood-dim); padding: 1px 7px; border-radius: 8px; font-size: 12px; margin-left: 6px; }

  .panel { padding: 32px 0; }
  .tab-intro { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.03em; line-height: 1.6; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .tab-intro strong { color: var(--paper); font-weight: 400; }
  .f-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 10px 14px; outline: none; width: 100%; transition: border-color 0.2s; border-radius: 8px; }
  .f-input:focus { border-color: var(--blood); }
  .f-input::placeholder { color: var(--ghost); font-family: 'Space Mono', monospace; font-size: 12px; }
  .err-box { padding: 14px 18px; background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.3); font-family: 'Space Mono', monospace; font-size: 14px; color: var(--blood); margin-top: 18px; word-break: break-all; }

  /* SCAN — COMPACT */
  .scan-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .scan-header-left { display: flex; align-items: center; gap: 10px; }
  .scan-header-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.06em; color: var(--paper); }
  .scan-header-ghost { opacity: 0.2; }
  .scan-header-sub { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); }
  .scan-textarea { width: 100%; min-height: 140px; background: var(--surface); border: none; border-radius: 6px 6px 0 0; color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; line-height: 1.7; padding: 16px; resize: vertical; outline: none; transition: box-shadow 0.2s; }
  .scan-textarea:focus { box-shadow: inset 0 0 0 1px var(--blood); }
  .scan-textarea::placeholder { color: var(--ghost); }
  .scan-context-row { display: flex; gap: 1px; margin-bottom: 2px; }
  .scan-context-cell { flex: 1; background: var(--surface); padding: 12px 16px; }
  .scan-context-cell:first-child { border-radius: 0 0 0 6px; }
  .scan-context-cell:last-child { border-radius: 0 0 6px 0; }
  .scan-context-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .scan-context-input { background: none; border: none; color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 0; outline: none; width: 100%; }
  .scan-context-input::placeholder { color: var(--ghost); }
  .scan-actions { display: flex; gap: 10px; align-items: center; padding: 12px 0; flex-wrap: wrap; }
  .scan-actions-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); }
  .scan-detect-btn { margin-left: auto; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.06em; background: var(--blood); border: none; color: var(--paper); padding: 10px 28px; border-radius: 4px; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .scan-detect-btn:hover:not(:disabled) { background: #e52600; }
  .scan-detect-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .scan-hint { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.03em; margin-top: 4px; opacity: 0.6; }
  .search-row-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .search-row-label.accent { color: var(--blood); }
  .search-filter-pill { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); background: rgba(255,255,255,0.04); border: 1px solid var(--border); padding: 0; border-radius: 3px; cursor: pointer; display: flex; align-items: center; overflow: hidden; }
  .search-filter-pill select { background: none; border: none; color: var(--muted); font-family: 'Space Mono', monospace; font-size: 12px; padding: 5px 12px; outline: none; appearance: none; cursor: pointer; }
  .search-filter-pill select option { background: var(--surface2); color: var(--paper); }
  .search-filter-pill:hover { border-color: var(--border-hi); }

  /* LOADING */
  .loading-card { background: var(--surface); border: 1px solid var(--border); padding: 40px 32px; text-align: center; margin-top: 24px; }
  .spin { width: 42px; height: 42px; border: 2px solid var(--border); border-radius: 50%; animation: spin 0.75s linear infinite; margin: 0 auto 18px; }
  .spin.red { border-top-color: var(--blood); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .load-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 18px; }
  .load-step { font-family: 'Space Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.2); padding: 4px 0; transition: color 0.3s; }
  .load-step.active-r { color: var(--blood); }
  .load-step.done { color: rgba(255,255,255,0.15); text-decoration: line-through; }

  /* VERDICT */
  .verdict-card { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--blood); padding: 26px; margin-top: 24px; position: relative; overflow: hidden; }
  .verdict-card::after { content: ''; position: absolute; right: -10px; top: -10px; width: 180px; height: 180px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z' fill='%23f0ece0'/%3E%3Ccircle cx='13' cy='14' r='2' fill='%23d42200'/%3E%3Ccircle cx='19' cy='14' r='2' fill='%23d42200'/%3E%3C/svg%3E") no-repeat center/contain; opacity: 0.035; pointer-events: none; transform: rotate(8deg); }
  .verdict-card.legit { border-top-color: var(--signal); }
  .verdict-card.suspicious { border-top-color: var(--bile); }
  .v-headline { font-family: 'Bebas Neue', sans-serif; font-size: 30px; letter-spacing: 0.04em; margin-bottom: 18px; }
  .vh-ghost { color: var(--blood); }
  .vh-legit { color: var(--signal); }
  .vh-suspicious { color: var(--bile); }
  .v-summary { font-size: 14px; line-height: 1.75; color: rgba(238,234,224,0.8); margin-bottom: 18px; }
  .flags-list { list-style: none; }
  .flag-row { display: flex; gap: 10px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; line-height: 1.5; color: rgba(238,234,224,0.7); }
  .sev-pill { font-family: 'Space Mono', monospace; font-size: 12px; padding: 3px 9px; flex-shrink: 0; margin-top: 2px; }
  .sev-high { background: var(--blood-dim); color: var(--blood); }
  .sev-med { background: var(--bile-dim); color: var(--bile); }
  .sev-low { background: rgba(255,255,255,0.05); color: var(--ghost); }
  .action-tips { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 16px; margin-top: 18px; }
  .action-tips-title { font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--paper); margin-bottom: 10px; }
  .tip-row { display: flex; gap: 10px; font-size: 13px; color: rgba(238,234,224,0.7); padding: 4px 0; line-height: 1.6; }
  .tip-n { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ghost); flex-shrink: 0; margin-top: 2px; }

  /* SCORE HERO */
  .score-hero { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px; }
  .score-hero-num { font-family: 'Bebas Neue', sans-serif; font-size: 112px; line-height: 0.85; letter-spacing: -0.02em; }
  .score-hero-num.sc-red { color: var(--blood); }
  .score-hero-num.sc-yellow { color: var(--bile); }
  .score-hero-num.sc-green { color: var(--signal); }
  .score-hero-meta { display: flex; flex-direction: column; gap: 6px; padding-bottom: 10px; }
  .score-hero-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); }
  .score-hero-verdict { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; line-height: 1; }
  .severity-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; margin-bottom: 20px; }
  .sev-seg { height: 4px; border-radius: 1px; opacity: 0.25; transition: opacity 0.3s; }
  .sev-seg.active { opacity: 1; }
  .sev-seg.low { background: var(--signal); }
  .sev-seg.mid { background: var(--bile); }
  .sev-seg.high { background: var(--blood); }
  .sev-labels { display: flex; justify-content: space-between; margin-top: 4px; margin-bottom: 18px; }
  .sev-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ghost); }
  .sub-score-row { display: flex; gap: 20px; margin-bottom: 18px; flex-wrap: wrap; }
  .sub-score-item { display: flex; flex-direction: column; gap: 3px; }
  .sub-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 28px; line-height: 1; }
  .sub-score-lbl { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ghost); }

  /* SHARE */
  .share-row { display: flex; gap: 10px; margin-top: 18px; }
  .share-btn { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 16px; border: 1px solid var(--border-hi); color: var(--paper); background: none; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .share-btn:hover { background: rgba(255,255,255,0.06); }
  .share-btn.copied { border-color: var(--signal); color: var(--signal); }
  .share-btn.downloading { opacity: 0.6; cursor: default; }

  /* SAVE TO TRACKER */
  .save-bar { margin-top: 20px; background: var(--surface2); border: 1px solid var(--border-hi); padding: 18px; display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .save-bar-title { font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; width: 100%; }
  .save-bar .f-input { flex: 1; min-width: 160px; }
  .save-btn { background: var(--blood); color: var(--paper); font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 11px 22px; cursor: pointer; white-space: nowrap; transition: background 0.15s; flex-shrink: 0; }
  .save-btn:hover { background: #e52600; }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .save-success { font-family: 'Space Mono', monospace; font-size: 14px; color: var(--paper); padding: 10px 0; width: 100%; }

  /* SCAN HISTORY */
  .scan-history-list { display: flex; flex-direction: column; gap: 8px; }
  .scan-history-item { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; cursor: pointer; transition: border-color 0.15s; }
  .scan-history-item:hover { border-color: var(--border-hi); }
  .scan-history-item.expanded { border-color: var(--border-hi); }
  .scan-history-row { display: flex; justify-content: space-between; align-items: center; }
  .scan-history-left { display: flex; align-items: center; gap: 12px; }
  .scan-history-score { font-family: 'Bebas Neue', sans-serif; font-size: 28px; line-height: 1; }
  .scan-history-info { }
  .scan-history-title { font-family: 'Bebas Neue', sans-serif; font-size: 15px; color: var(--paper); }
  .scan-history-company { font-size: 12px; color: var(--muted); font-family: 'Libre Baskerville', serif; }
  .scan-history-right { display: flex; align-items: center; gap: 8px; }
  .scan-history-date { font-size: 10px; color: var(--muted); font-family: 'Space Mono', monospace; }
  .scan-history-badge { padding: 2px 8px; border-radius: 3px; font-size: 10px; font-family: 'Space Mono', monospace; letter-spacing: 0.06em; }
  .scan-history-badge.ghost { background: var(--blood-dim); color: var(--blood); }
  .scan-history-badge.suspicious { background: var(--bile-dim); color: var(--bile); }
  .scan-history-badge.legit { background: var(--signal-dim); color: var(--signal); }
  .scan-history-detail { border-top: 1px solid var(--border); padding-top: 8px; margin-top: 8px; }
  .scan-history-summary { font-size: 12px; color: var(--muted); font-family: 'Libre Baskerville', serif; line-height: 1.6; margin-bottom: 8px; }
  .scan-history-flags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .scan-history-flag { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-family: 'Space Mono', monospace; }
  .scan-history-view-btn { background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.3); color: var(--blood); padding: 6px 16px; border-radius: 4px; font-family: 'Bebas Neue', sans-serif; font-size: 13px; letter-spacing: 0.06em; text-align: center; cursor: pointer; width: 100%; transition: background 0.15s; }
  .scan-history-view-btn:hover { background: rgba(212,34,0,0.25); }
  .scan-history-empty { text-align: center; padding: 48px 24px; color: var(--ghost); font-family: 'Space Mono', monospace; font-size: 12px; }

  /* SCAN REPORT MODAL */
  .scan-modal-backdrop { position: fixed; inset: 0; background: rgba(7,7,9,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .scan-modal { background: var(--surface); border: 1px solid var(--border-hi); border-radius: 12px; max-width: 640px; width: 100%; max-height: 90vh; overflow-y: auto; }
  .scan-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .scan-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.06em; color: var(--paper); }
  .scan-modal-close { background: none; border: none; color: var(--muted); font-size: 18px; cursor: pointer; line-height: 1; padding: 4px; }
  .scan-modal-close:hover { color: var(--paper); }
  .scan-modal-body { padding: 0 16px 16px; }
  .scan-modal-footer { border-top: 1px solid var(--border); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
  .scan-modal-save-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--muted); padding: 6px 14px; border-radius: 4px; font-family: 'Space Mono', monospace; font-size: 12px; cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .scan-modal-save-btn:hover { color: var(--paper); border-color: var(--border-hi); }

  @media (max-width: 720px) {
    .scan-context-row { flex-direction: column; }
    .scan-context-cell:first-child { border-radius: 0; }
    .scan-context-cell:last-child { border-radius: 0 0 6px 6px; }
    .scan-detect-btn { width: 100%; margin-left: 0; }
  }
  @media (max-width: 480px) {
    .score-hero-num { font-size: 72px; }
    .verdict-card { padding: 20px 16px; }
    .v-headline { font-size: 22px; }
    .sub-score-row { gap: 12px; }
    .sub-score-num { font-size: 22px; }
  }
`;

/* ================================================================
   LOADING BLOCK (VerifyTab sub-component)
================================================================ */
function LoadingBlock(props) {
  return (
    <div className="loading-card">
      <div className="spin red" />
      <div className="load-title">SCANNING FOR BULLSHIT...</div>
      {props.steps.map(function(s,i) {
        var cls = "load-step" + (i===props.current?" active-r":i<props.current?" done":"");
        return <div key={i} className={cls}>{i<props.current?"✓":i===props.current?"▸":"·"} {s}</div>;
      })}
    </div>
  );
}

/* ================================================================
   VERDICT CARD (VerifyTab sub-component)
================================================================ */
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
    if (!scanId) { setShareLabel("Not ready — try again"); setTimeout(function(){ setShareLabel("🔗 Copy Link"); }, 2000); return; }
    import("./supabase.js").then(function(m){
      m.supabase.from("ghost_scans").update({ share_enabled: true }).eq("id", scanId).then(function(){
        var url = "https://ghostbust.us/score?id="+scanId;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function(){
            setShareLabel("✓ Copied!");
            setTimeout(function(){ setShareLabel("🔗 Copy Link"); }, 2500);
          }).catch(function(){
            prompt("Copy this link:", url);
            setShareLabel("🔗 Copy Link");
          });
        } else {
          prompt("Copy this link:", url);
          setShareLabel("🔗 Copy Link");
        }
      }).catch(function(){
        setShareLabel("Share failed");
        setTimeout(function(){ setShareLabel("🔗 Copy Link"); }, 2000);
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
  var cardCls = "verdict-card"+(v==="LEGIT"?" legit":v==="SUSPICIOUS"?" suspicious":"");
  var headText = v==="LEGIT"?"Appears Legitimate":v==="SUSPICIOUS"?"Suspicious — Proceed With Caution":"Ghost Listing Detected";
  var headCls = v==="LEGIT"?"vh-legit":v==="SUSPICIOUS"?"vh-suspicious":"vh-ghost";
  var gs = r.ghostScore||0;
  var heroColorCls = gsColor(gs);
  var sc = r.scores||{};
  var sevLevel = gs>60?"high":gs>35?"mid":"low";
  return (
    <div className={cardCls}>
      <div className="score-hero">
        <div className={"score-hero-num "+heroColorCls}>{gs}</div>
        <div className="score-hero-meta">
          <div className="score-hero-label">Ghost Score</div>
          <div className={"score-hero-verdict "+headCls}>{headText}</div>
        </div>
      </div>
      <div className="severity-bar">
        <div className={"sev-seg low"+(sevLevel==="low"?" active":"")} />
        <div className={"sev-seg mid"+(sevLevel==="mid"?" active":"")} />
        <div className={"sev-seg high"+(sevLevel==="high"?" active":"")} />
      </div>
      <div className="sev-labels">
        <span className="sev-label">Low Risk</span>
        <span className="sev-label">Moderate</span>
        <span className="sev-label">High Risk</span>
      </div>
      <div className="sub-score-row">
        {[["Specificity",sc.specificityScore],["Transparency",sc.transparencyScore],["Process",sc.processScore],["Confidence",r.confidence]].map(function(item){
          var label=item[0]; var val=item[1];
          return (
            <div key={label} className="sub-score-item">
              <div className={"sub-score-num "+scoreColor(val||0)}>{val!=null?val:"—"}</div>
              <div className="sub-score-lbl">{label}</div>
            </div>
          );
        })}
      </div>
      <p className="v-summary">{r.summary}</p>
      {r.flags&&r.flags.length>0&&(
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"0.3em",color:"rgba(255,255,255,0.6)",textTransform:"uppercase",marginBottom:10}}>Signals Detected</div>
          <ul className="flags-list">
            {r.flags.map(function(f,i){
              var sc2=f.severity==="HIGH"?"sev-high":f.severity==="MEDIUM"?"sev-med":"sev-low";
              return (
                <li key={i} className="flag-row">
                  <span style={{flexShrink:0}}>{f.isPositive?"✓":"✗"}</span>
                  <span className={"sev-pill "+sc2}>{f.severity}</span>
                  <div><strong style={{color:"rgba(238,234,224,0.9)",marginRight:6}}>{f.flag}:</strong>{f.explanation}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {r.actionTips&&r.actionTips.length>0&&(
        <div className="action-tips">
          <div className="action-tips-title">What to do next</div>
          {r.actionTips.map(function(t,i){
            return <div key={i} className="tip-row"><span className="tip-n">{String(i+1).padStart(2,"0")}</span><span>{t}</span></div>;
          })}
        </div>
      )}
      <div style={{marginTop:16,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderLeft:"2px solid rgba(255,255,255,0.08)"}}>
        <p style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.7}}>
          DISCLAIMER: GhostBust scores are algorithmic estimates based on patterns in listing language and structure. They are not verified facts about employer intent and should not be the sole basis for any application decision. A low score does not guarantee a role is unfilled, and a high score does not guarantee a hire. Always conduct your own research.
        </p>
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

/* ================================================================
   VERIFY TAB COMPONENT
================================================================ */
function VerifyTab(props) {
  var addApp = props.addApp;
  var onSaved = props.onSaved;
  var session = props.session;
  var initialPrefill = props.prefill;

  var [innerTab, setInnerTab] = useState("scan");
  var [scans, setScans] = useState([]);
  var [scansLoading, setScansLoading] = useState(false);
  var [expandedScan, setExpandedScan] = useState(null);
  var [modalScan, setModalScan] = useState(null);

  var [text,setText] = useState(initialPrefill&&initialPrefill.url?initialPrefill.url:"");
  var [company,setCompany] = useState(initialPrefill&&initialPrefill.company?initialPrefill.company:"");
  var [jobTitle,setJobTitle] = useState(initialPrefill&&initialPrefill.title?initialPrefill.title:"");
  var [age,setAge] = useState("");
  var [sourceBoard,setSourceBoard] = useState("");
  var [loading,setLoading] = useState(false);
  var [step,setStep] = useState(-1);
  var [result,setResult] = useState(null);
  var [error,setError] = useState(null);
  var [saving,setSaving] = useState(false);
  var [saved,setSaved] = useState(false);
  var [scanId,setScanId] = useState(null);
  var resultRef = useRef(null);

  useEffect(function(){
    if (result&&resultRef.current) resultRef.current.scrollIntoView({behavior:"smooth"});
  },[result]);

  useEffect(function(){
    if (!session) { setScans([]); return; }
    setScansLoading(true);
    supabase.from("ghost_scans")
      .select("id, title, company, job_board, ghost_score, signal_flags, assessment, scores, confidence, summary, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(function(res){
        setScans(res.data || []);
        setScansLoading(false);
      })
      .catch(function(){
        setScansLoading(false);
      });
  },[session]);

  useEffect(function(){
    if (!modalScan) return;
    function handleKey(e){ if(e.key==="Escape") setModalScan(null); }
    document.addEventListener("keydown", handleKey);
    return function(){ document.removeEventListener("keydown", handleKey); };
  },[modalScan]);

  function analyze() {
    setLoading(true); setResult(null); setError(null); setSaved(false); setScanId(null); setStep(0);
    var iv = setInterval(function(){setStep(function(s){return Math.min(s+1,VERIFY_STEPS.length-1);});},700);
    var prompt = "You are a ghost job analyst. Analyze this job listing and return ONLY a JSON object.\n\nListing:\n"+text+(company?"\nCompany: "+company:"")+(age?"\nPosted: "+age:"")+"\n\nReturn JSON with: verdict (LEGIT or SUSPICIOUS or GHOST), ghostScore (0-100 where 100=fake), confidence (0-100), summary (2-3 sentences), scores (object: specificityScore, urgencyScore, transparencyScore, processScore each 0-100), flags (array of objects: severity HIGH/MEDIUM/LOW, flag string, explanation string, isPositive boolean), actionTips (array of 3 strings). Only return the JSON object.";
    apiCall([{role:"user",content:prompt}], session?.access_token)
      .then(function(raw){
        clearInterval(iv); setStep(VERIFY_STEPS.length-1);
        var parsed = parseJSON(raw);
        setResult(parsed); try { var anonId = localStorage.getItem("gb_anon_id"); if (!anonId) { anonId = Math.random().toString(36).slice(2); localStorage.setItem("gb_anon_id", anonId); } import("./supabase.js").then(function(m){ m.supabase.from("ghost_scans").insert({ anon_id: anonId, user_id: session?.user?.id||null, company: company||null, title: jobTitle||null, job_board: sourceBoard||null, ghost_score: parsed.ghostScore||0, signal_flags: parsed.flags||[], assessment: parsed.verdict||null, scores: parsed.scores||null, confidence: parsed.confidence||null, summary: parsed.summary||null }).select("id, title, company, job_board, ghost_score, signal_flags, assessment, scores, confidence, summary, created_at").single().then(function(res){ if (res.data&&res.data.id) { setScanId(res.data.id); setScans(function(prev){ return [res.data].concat(prev); }); } }).catch(function(){}); }); } catch(e) {}
        setLoading(false); setStep(-1);
      })
      .catch(function(err){
        clearInterval(iv);
        if (err.message === "RATE_LIMIT") {
          setError("You've reached your limit of 20 analyses per hour. Please try again later.");
        } else {
          setError("Analysis failed: "+err.message);
        }
        setLoading(false); setStep(-1);
      });
  }

  function saveToTracker() {
    if (!result) return;
    setSaving(true);
    var app = {
      id: uid(),
      title: jobTitle||"Untitled Role",
      company: company||"Unknown Company",
      ghostScore: result.ghostScore||0,
      verdict: result.verdict,
      status: "Researching",
      notes: "",
      sourceBoard: sourceBoard||"",
      savedAt: Date.now(),
      listingText: text.slice(0,500),
    };
    addApp(app);
    setSaved(true);
    setSaving(false);
    if (onSaved) onSaved();
  }

  function buildResultFromScan(scan) {
    return {
      verdict: scan.assessment,
      ghostScore: scan.ghost_score,
      scores: scan.scores || {},
      confidence: scan.confidence,
      summary: scan.summary,
      flags: scan.signal_flags || [],
      actionTips: [],
    };
  }

  function formatScanDate(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function verdictBadgeClass(assessment) {
    if (assessment === "GHOST") return "scan-history-badge ghost";
    if (assessment === "SUSPICIOUS") return "scan-history-badge suspicious";
    return "scan-history-badge legit";
  }

  return (
    <div className="panel">
      <style>{STYLE}</style>
      <div className="inner-tabs">
        <button className={"inner-tab"+(innerTab==="scan"?" active":"")} onClick={function(){setInnerTab("scan");}}>Scan</button>
        <button className={"inner-tab"+(innerTab==="history"?" active":"")} onClick={function(){setInnerTab("history");}}>
          History{scans.length>0&&<span className="tab-count">{scans.length}</span>}
        </button>
      </div>

      <div className="tab-intro">Paste a job listing. AI scans for <strong>red flags, vague language, and ghost patterns.</strong></div>

      {innerTab==="scan"&&<>
      <div className="scan-header">
        <div className="scan-header-left">
          <svg className="scan-header-ghost" width="18" height="18" viewBox="0 0 32 32"><path d="M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z" fill="#eeeae0" opacity="0.25"/><circle cx="13" cy="14" r="2" fill="#d42200" opacity="0.4"/><circle cx="19" cy="14" r="2" fill="#d42200" opacity="0.4"/></svg>
          <span className="scan-header-title">GHOST DETECTOR</span>
        </div>
        <span className="scan-header-sub">Full Listing Analysis</span>
      </div>

      <div className="search-row-label accent" style={{marginBottom:8}}>Paste Full Job Listing</div>
      <textarea className="scan-textarea" placeholder="Paste the complete listing here — job title, responsibilities, requirements, and company description. Everything on the page." value={text} onChange={function(e){setText(e.target.value);setSaved(false);setResult(null);}} />

      <div className="scan-context-row">
        <div className="scan-context-cell">
          <div className="scan-context-label">Job Title</div>
          <input className="scan-context-input" placeholder="e.g. Senior Product Designer" value={jobTitle} onChange={function(e){setJobTitle(e.target.value);}} />
        </div>
        <div className="scan-context-cell">
          <div className="scan-context-label">Company</div>
          <input className="scan-context-input" placeholder="e.g. Acme Corp" value={company} onChange={function(e){setCompany(e.target.value);}} />
        </div>
      </div>

      <div className="scan-actions">
        <span className="scan-actions-label">Context:</span>
        <span className="search-filter-pill">
          <select value={age} onChange={function(e){setAge(e.target.value);}}>
            <option value="">Posting Age ▾</option>
            <option value="less than a week">Less than a week</option>
            <option value="1-2 weeks">1-2 weeks</option>
            <option value="2-4 weeks">2-4 weeks</option>
            <option value="1-2 months">1-2 months</option>
            <option value="3+ months">3+ months</option>
          </select>
        </span>
        <span className="search-filter-pill">
          <select value={sourceBoard} onChange={function(e){setSourceBoard(e.target.value);}}>
            <option value="">Source Board ▾</option>
            <option>Indeed</option><option>LinkedIn</option><option>Wellfound</option><option>ZipRecruiter</option><option>Monster</option><option>SimplyHired</option><option>Company Website</option><option>Other</option>
          </select>
        </span>
        <button className="scan-detect-btn" onClick={analyze} disabled={text.trim().length<50||loading}>
          {loading?"ANALYSING...":"DETECT GHOST JOB →"}
        </button>
      </div>
      <div className="scan-hint">Raw listing text — the more complete, the more accurate the analysis.</div>

      {loading&&<LoadingBlock steps={VERIFY_STEPS} current={step} />}
      {error&&<div className="err-box">{"⚠ "+error}</div>}

      {result&&(
        <div ref={resultRef}>
          <VerdictCard result={result} scanId={scanId} company={company} jobTitle={jobTitle} />
          <div className="save-bar">
            <div className="save-bar-title">Save to Tracker — starts as Researching</div>
            {!saved?(
              <>
                <input className="f-input" style={{flex:1,minWidth:160}} placeholder="Job title (e.g. Product Designer)" value={jobTitle} onChange={function(e){setJobTitle(e.target.value);}} />
                <input className="f-input" style={{flex:1,minWidth:140}} placeholder="Company name" value={company} onChange={function(e){setCompany(e.target.value);}} />
                <button className="save-btn" onClick={saveToTracker} disabled={saving}>
                  {saving?"SAVING...":"SAVE TO TRACKER →"}
                </button>
              </>
            ):(
              <div className="save-success">✓ Saved to tracker as <strong>Researching</strong>. Switch to the Application Tracker tab to update status.</div>
            )}
          </div>
        </div>
      )}
      </>}

      {innerTab==="history"&&(
        <div>
          {!session?(
            <div className="scan-history-empty">Sign in to view your scan history.</div>
          ):scansLoading?(
            <div className="scan-history-empty">Loading history...</div>
          ):scans.length===0?(
            <div className="scan-history-empty">No scans yet. Use the Scan tab to analyze a job listing.</div>
          ):(
            <div className="scan-history-list">
              {scans.map(function(scan){
                var isExpanded = expandedScan === scan.id;
                return (
                  <div key={scan.id} className={"scan-history-item"+(isExpanded?" expanded":"")} onClick={function(){ setExpandedScan(isExpanded?null:scan.id); }}>
                    <div className="scan-history-row">
                      <div className="scan-history-left">
                        <span className={"scan-history-score "+gsColor(scan.ghost_score||0)}>{scan.ghost_score||0}</span>
                        <div className="scan-history-info">
                          <div className="scan-history-title">{scan.title||"Untitled"}</div>
                          <div className="scan-history-company">{scan.company||"Unknown company"}</div>
                        </div>
                      </div>
                      <div className="scan-history-right">
                        <span className="scan-history-date">{formatScanDate(scan.created_at)}</span>
                        <span className={verdictBadgeClass(scan.assessment)}>{scan.assessment||"UNKNOWN"}</span>
                      </div>
                    </div>
                    {isExpanded&&(
                      <div className="scan-history-detail">
                        <div className="scan-history-summary">{scan.summary||"No summary available."}</div>
                        {scan.signal_flags&&scan.signal_flags.length>0&&(
                          <div className="scan-history-flags">
                            {scan.signal_flags.map(function(f,i){
                              var bgColor = f.severity==="HIGH"?"var(--blood-dim)":f.severity==="MEDIUM"?"var(--bile-dim)":"var(--signal-dim)";
                              var textColor = f.severity==="HIGH"?"var(--blood)":f.severity==="MEDIUM"?"var(--bile)":"var(--signal)";
                              return <span key={i} className="scan-history-flag" style={{background:bgColor,color:textColor}}>{f.flag}</span>;
                            })}
                          </div>
                        )}
                        <button className="scan-history-view-btn" onClick={function(e){ e.stopPropagation(); setModalScan(scan); }}>VIEW FULL REPORT</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {modalScan&&createPortal(
        <div className="scan-modal-backdrop" onClick={function(){ setModalScan(null); }}>
          <div className="scan-modal" onClick={function(e){ e.stopPropagation(); }}>
            <div className="scan-modal-header">
              <span className="scan-modal-title">GHOST REPORT</span>
              <button className="scan-modal-close" onClick={function(){ setModalScan(null); }}>&times;</button>
            </div>
            <div className="scan-modal-body">
              <VerdictCard result={buildResultFromScan(modalScan)} scanId={modalScan.id} company={modalScan.company||""} jobTitle={modalScan.title||""} />
            </div>
            <div className="scan-modal-footer">
              <button className="scan-modal-save-btn" onClick={function(){ addApp({ id:uid(), title:modalScan.title||"Untitled Role", company:modalScan.company||"Unknown Company", ghostScore:modalScan.ghost_score||0, verdict:modalScan.assessment||"UNKNOWN", status:"Researching", notes:"", sourceBoard:modalScan.job_board||"", savedAt:Date.now(), signalFlags:modalScan.signal_flags||[] }); setModalScan(null); if(onSaved) onSaved(); }}>SAVE TO TRACKER</button>
              <button className="scan-history-view-btn" style={{width:"auto",padding:"6px 20px"}} onClick={function(){ setModalScan(null); }}>CLOSE</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default VerifyTab;
