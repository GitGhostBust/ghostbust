import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/* ================================================================
   CONSTANTS (TrackerTab-specific)
================================================================ */
var STATUSES = ["Researching","Saved","Applied","Interviewing","Ghosted","Rejected","Offer"];
var PROSPECT_STATUSES = ["Researching","Saved"];
var APPLICATION_STATUSES = ["Applied","Interviewing","Ghosted","Rejected","Offer"];
var STATUS_EMOJI = {
  Researching: "🔎", Saved: "📌", Applied: "📤", Interviewing: "🎯", Ghosted: "👻", Rejected: "✗", Offer: "🏆"
};

/* ================================================================
   HELPERS
================================================================ */
function gsChipClass(n) {
  if (n > 60) return "gs-chip gs-high";
  if (n > 35) return "gs-chip gs-mid";
  return "gs-chip gs-low";
}
function formatDate(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

/* ================================================================
   STYLES (TrackerTab-specific)
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
  .form-label { font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 18px; display: block; }
  .form-label.ice { color: var(--muted); }
  .field-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; display: block; }

  /* TRACKER */
  .tracker-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 28px; }
  .stat-box { background: var(--surface); border: 1px solid var(--border); padding: 14px 10px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
  .stat-box:hover { background: var(--surface2); }
  .stat-box.active-filter { border-color: var(--border-hi); background: var(--surface2); }
  .stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 34px; line-height: 1; }
  .stat-lbl { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.85); margin-top: 3px; }
  .stat-saved { color: var(--paper); }
  .stat-researching { color: var(--bile); }
  .stat-applied { color: var(--ice); }
  .stat-interviewing { color: var(--signal); }
  .stat-ghosted { color: var(--ghost); }
  .stat-rejected { color: var(--blood); }
  .stat-offer { color: var(--bile); }
  .status-select.status-researching { color: var(--ice); }

  .tracker-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .tracker-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); }
  .tracker-actions { display: flex; gap: 8px; }
  .small-btn { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--border); background: none; color: var(--ghost); cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .small-btn:hover { color: var(--paper); border-color: var(--border-hi); }
  .small-btn.danger:hover { color: var(--blood); border-color: var(--blood); }

  .app-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--border-hi); margin-bottom: 12px; padding: 20px 22px; display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; transition: background 0.18s, border-color 0.18s, box-shadow 0.18s; border-radius: 4px; }
  .app-card:hover { background: var(--surface2); border-color: var(--border-hi); box-shadow: 0 2px 12px rgba(0,0,0,0.25); }
  .app-card:hover .app-title { color: #fff; }
  .app-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.03em; color: var(--paper); margin-bottom: 2px; line-height: 1.2; transition: color 0.18s; }
  .app-company { font-family: 'Libre Baskerville', serif; font-size: 12px; color: rgba(238,234,224,0.7); letter-spacing: 0.02em; margin-bottom: 10px; }
  .app-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .app-chip { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 3px; }
  .status-pill-researching { background: var(--ice-dim); color: var(--ice); }
  .status-pill-saved { background: rgba(255,255,255,0.05); color: var(--muted); }
  .status-pill-applied { background: var(--bile-dim); color: var(--bile); }
  .status-pill-interviewing { background: var(--signal-dim); color: var(--signal); }
  .status-pill-ghosted { background: var(--blood-dim); color: var(--blood); }
  .status-pill-rejected { background: rgba(212,34,0,0.08); color: rgba(212,34,0,0.5); }
  .status-pill-offer { background: var(--signal-dim); color: var(--signal); font-weight: 700; }
  .unscanned-chip { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--muted); padding: 3px 10px; border: 1px dashed var(--border-hi); border-radius: 3px; }
  .gs-chip { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.05em; padding: 3px 10px; border-radius: 3px; }
  .gs-low { background: var(--signal-dim); border: 1px solid rgba(0,230,122,0.2); color: var(--signal); }
  .gs-mid { background: var(--bile-dim); border: 1px solid rgba(201,154,0,0.2); color: var(--bile); }
  .gs-high { background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.2); color: var(--blood); }
  .app-notes { font-family: 'Libre Baskerville', serif; font-size: 12px; color: var(--muted); margin-top: 10px; font-style: italic; line-height: 1.6; }
  .app-date { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.04em; }

  .app-controls { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
  .status-select { background: var(--surface2); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; padding: 5px 8px; outline: none; cursor: pointer; appearance: none; text-align: center; }
  .status-select option { background: #13131a; color: var(--paper); }
  .status-select.status-saved { color: var(--muted); }
  .status-select.status-applied { color: var(--bile); }
  .status-select.status-interviewing { color: var(--signal); }
  .status-select.status-ghosted { color: var(--blood); }
  .status-select.status-rejected { color: rgba(212,34,0,0.5); }
  .status-select.status-offer { color: var(--signal); font-weight: 700; }

  .followup-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .followup-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .followup-due { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--bile); }
  .followup-overdue { color: var(--blood); }

  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 0.04em; color: var(--ghost); margin-bottom: 8px; }
  .empty-sub { font-size: 13px; color: var(--ghost); line-height: 1.6; max-width: 340px; margin: 0 auto; }

  /* SKELETON LOADING */
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  .skeleton-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--surface2); margin-bottom: 10px; padding: 16px 18px; }
  .skeleton-line { background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: 2px; }
  .skeleton-line.title { height: 14px; width: 55%; margin-bottom: 10px; }
  .skeleton-line.company { height: 10px; width: 35%; margin-bottom: 12px; }
  .skeleton-line.chips { height: 10px; width: 75%; }

  /* MANUAL ADD */
  .add-form { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 22px; margin-bottom: 28px; }
  .add-form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .add-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .add-submit { background: var(--blood); color: var(--paper); font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 11px 22px; cursor: pointer; transition: background 0.15s; width: 100%; margin-top: 6px; }
  .add-submit:hover:not(:disabled) { background: #e52600; }
  .add-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .toggle-add-btn { background: none; border: 1px solid var(--border-hi); color: var(--muted); font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .toggle-add-btn:hover { background: rgba(255,255,255,0.05); color: var(--paper); }

  /* EXPORT */
  .export-btn { background: none; border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; cursor: pointer; transition: background 0.15s; }
  .export-btn:hover { background: rgba(255,255,255,0.05); }

  /* GHOST REPORT CARD */
  .report-btn { background: none; border: 1px solid var(--bile); color: var(--bile); font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; cursor: pointer; transition: background 0.15s; }
  .report-btn:hover { background: var(--bile-dim); }
  .report-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .report-card { background: var(--void); border: 1px solid var(--border-hi); max-width: 500px; width: 100%; position: relative; }
  .report-top { background: var(--blood); padding: 22px 24px 18px; }
  .report-eyebrow { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(238,234,224,0.65); margin-bottom: 6px; }
  .report-title { font-family: 'Bebas Neue', sans-serif; font-size: 40px; line-height: 0.9; letter-spacing: 0.02em; color: var(--paper); }
  .report-date { font-family: 'Space Mono', monospace; font-size: 12px; color: rgba(238,234,224,0.6); margin-top: 8px; }
  .report-body { padding: 22px 24px; }
  .report-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
  .report-stat { text-align: center; padding: 14px 8px; background: var(--surface); border: 1px solid var(--border); }
  .report-stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 36px; line-height: 1; color: var(--paper); }
  .report-stat-lbl { font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.85); margin-top: 3px; }
  .report-insight { font-size: 13px; color: var(--muted); line-height: 1.75; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); margin-bottom: 18px; }
  .report-share-row { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 10px; }
  .report-brand { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: var(--ghost); letter-spacing: 0.05em; }
  .report-brand em { color: var(--blood); font-style: normal; }
  .copy-btn { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; padding: 7px 14px; border: 1px solid var(--border-hi); color: var(--paper); background: none; cursor: pointer; transition: background 0.15s; }
  .copy-btn:hover { background: rgba(255,255,255,0.05); }
  .copy-btn.copied { color: var(--paper); border-color: var(--border-hi); }
  .report-close { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: rgba(238,234,224,0.6); width: 28px; height: 28px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.15s; }
  .report-close:hover { color: var(--paper); }

  /* APP DETAIL MODAL */
  .adm-backdrop { position: fixed; inset: 0; background: rgba(7,7,9,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .adm { background: var(--surface); border: 1px solid var(--border-hi); border-radius: 12px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; }
  .adm-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .adm-header-title { font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.06em; color: var(--paper); }
  .adm-close { background: none; border: none; color: var(--muted); font-size: 18px; cursor: pointer; line-height: 1; padding: 4px; }
  .adm-close:hover { color: var(--paper); }
  .adm-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .adm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .adm-field { display: flex; flex-direction: column; gap: 4px; }
  .adm-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .adm-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 8px 10px; outline: none; transition: border-color 0.2s; border-radius: 2px; }
  .adm-input:focus { border-color: var(--blood); }
  .adm-input::placeholder { color: var(--ghost); }
  .adm-select { background: var(--surface2); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 8px 10px; outline: none; cursor: pointer; appearance: none; border-radius: 2px; }
  .adm-select option { background: #13131a; color: var(--paper); }
  .adm-textarea { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 8px 10px; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; transition: border-color 0.2s; border-radius: 2px; }
  .adm-textarea:focus { border-color: var(--blood); }
  .adm-textarea::placeholder { color: var(--ghost); }
  .adm-ghost-badge { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 4px; }
  .adm-ghost-score { font-family: 'Bebas Neue', sans-serif; font-size: 32px; line-height: 1; }
  .adm-ghost-meta { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.06em; }
  .adm-ghost-verdict { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 3px; display: inline-block; margin-top: 3px; }
  .adm-action-btn { font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.06em; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: background 0.15s; text-align: center; border: none; }
  .adm-scan-btn { background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.3); color: var(--blood); }
  .adm-scan-btn:hover { background: rgba(212,34,0,0.25); }
  .adm-career-btn { background: var(--ice-dim); border: 1px solid rgba(0,200,230,0.2); color: var(--ice); }
  .adm-career-btn:hover { background: rgba(0,200,230,0.18); }
  .adm-footer { border-top: 1px solid var(--border); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .adm-save-btn { background: var(--blood); color: var(--paper); font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.06em; padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; transition: background 0.15s; }
  .adm-save-btn:hover { background: #e82800; }
  .adm-delete-btn { background: none; border: 1px solid var(--border); color: var(--ghost); font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; padding: 8px 14px; border-radius: 4px; cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .adm-delete-btn:hover { color: var(--blood); border-color: var(--blood); }
  .adm-actions-row { display: flex; gap: 8px; }
  @media (max-width: 600px) { .adm-row { grid-template-columns: 1fr; } }

  @media (max-width: 720px) {
    .tracker-stats { grid-template-columns: repeat(3, 1fr); }
    .app-card { grid-template-columns: 1fr; }
    .app-controls { flex-direction: row; align-items: center; }
  }
  @media (max-width: 480px) {
    .tracker-stats { grid-template-columns: repeat(3,1fr); }
    .stat-num { font-size: 22px; }
  }
`;

/* ================================================================
   APPLICATION CARD (TrackerTab sub-component)
================================================================ */
function AppCard(props) {
  var app = props.app;
  var onClick = props.onClick;

  var today = new Date().toISOString().slice(0,10);
  var isOverdue = app.followupDate && app.followupDate < today;
  var isDueToday = app.followupDate && app.followupDate === today;

  // Dynamic left accent based on ghost score
  var accentColor = "var(--border-hi)";
  if (app.ghostScore > 0) {
    accentColor = app.ghostScore > 60 ? "var(--blood)" : app.ghostScore > 30 ? "var(--bile)" : "var(--signal)";
  }

  var statusSlug = app.status.toLowerCase();

  return (
    <div className="app-card" onClick={function(){onClick(app);}} style={{cursor:"pointer",borderLeftColor:accentColor}}>
      <div>
        <div className="app-title">{app.title}</div>
        <div className="app-company">{app.company}</div>
        <div className="app-meta">
          {app.ghostScore>0?(
            <span className={gsChipClass(app.ghostScore)}>Ghost: {app.ghostScore}</span>
          ):(
            <span className="unscanned-chip">UNSCANNED</span>
          )}
          <span className={"app-chip status-pill-"+statusSlug}>{app.status}</span>
          {app.sourceBoard&&<span className="app-chip" style={{background:"rgba(255,255,255,0.04)",color:"var(--muted)"}}>{app.sourceBoard}</span>}
          <span className="app-date">{formatDate(app.savedAt)}</span>
        </div>
        {app.followupDate&&(
          <div className="followup-row">
            <span className="followup-label">Follow-up:</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--paper)"}}>{app.followupDate}</span>
            <span className={"followup-due"+(isOverdue?" followup-overdue":"")}>
              {isOverdue?"Overdue":isDueToday?"Today!":""}
            </span>
          </div>
        )}
        {app.notes&&<div className="app-notes">"{app.notes}"</div>}
      </div>
      <div className="app-controls" onClick={function(e){e.stopPropagation();}}>
        <span className={"status-select status-"+statusSlug} style={{textAlign:"center",padding:"5px 10px",borderRadius:3}}>{app.status}</span>
      </div>
    </div>
  );
}

/* ================================================================
   APP DETAIL MODAL (TrackerTab sub-component)
================================================================ */
function AppDetailModal(props) {
  var app = props.app;
  var onUpdate = props.onUpdate;
  var onDelete = props.onDelete;
  var onClose = props.onClose;
  var onNavigate = props.onNavigate;

  var [title, setTitle] = useState(app.title||"");
  var [company, setCompany] = useState(app.company||"");
  var [status, setStatus] = useState(app.status||"Researching");
  var [sourceBoard, setSourceBoard] = useState(app.sourceBoard||"");
  var [url, setUrl] = useState(app.url||"");
  var [notes, setNotes] = useState(app.notes||"");
  var [followupDate, setFollowupDate] = useState(app.followupDate||"");
  var [appliedDate, setAppliedDate] = useState(app.appliedDate||"");
  var [dirty, setDirty] = useState(false);

  useEffect(function(){
    function handleKey(e){ if(e.key==="Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return function(){ document.removeEventListener("keydown", handleKey); };
  },[onClose]);

  function markDirty(setter) {
    return function(e) { setter(e.target.value); setDirty(true); };
  }

  function handleSave() {
    onUpdate(app.id, {
      title: title||"Untitled Role",
      company: company||"Unknown",
      status: status,
      sourceBoard: sourceBoard,
      url: url,
      notes: notes,
      followupDate: followupDate||null,
      appliedDate: appliedDate||null,
      updatedAt: Date.now(),
    });
    setDirty(false);
    onClose();
  }

  function handleDelete() {
    onDelete(app.id);
    onClose();
  }

  function handleGhostScan() {
    var prefill = { title: title, company: company };
    if (url) prefill.url = url;
    onNavigate("verify", prefill);
    onClose();
  }

  function handleCareerHQ() {
    var prefill = { title: title, company: company };
    if (url) prefill.url = url;
    onNavigate("resume", prefill);
    onClose();
  }

  var ghostScoreColor = app.ghostScore > 60 ? "var(--blood)" : app.ghostScore > 35 ? "var(--bile)" : "var(--signal)";
  var verdictColor = (app.verdict||"").toUpperCase() === "GHOST" ? "var(--blood)" : (app.verdict||"").toUpperCase() === "SUSPICIOUS" ? "var(--bile)" : "var(--signal)";
  var verdictBg = (app.verdict||"").toUpperCase() === "GHOST" ? "var(--blood-dim)" : (app.verdict||"").toUpperCase() === "SUSPICIOUS" ? "var(--bile-dim)" : "var(--signal-dim)";

  return createPortal(
    <div className="adm-backdrop" onClick={onClose}>
      <div className="adm" onClick={function(e){e.stopPropagation();}}>
        <div className="adm-header">
          <span className="adm-header-title">APPLICATION DETAILS</span>
          <button className="adm-close" onClick={onClose}>&times;</button>
        </div>
        <div className="adm-body">
          <div className="adm-row">
            <div className="adm-field">
              <label className="adm-label">Job Title</label>
              <input className="adm-input" value={title} onChange={markDirty(setTitle)} placeholder="Job title" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Company</label>
              <input className="adm-input" value={company} onChange={markDirty(setCompany)} placeholder="Company name" />
            </div>
          </div>
          <div className="adm-row">
            <div className="adm-field">
              <label className="adm-label">Status</label>
              <select className="adm-select" value={status} onChange={markDirty(setStatus)}>
                {STATUSES.map(function(s){return <option key={s}>{s}</option>;})}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">Source</label>
              <select className="adm-select" value={sourceBoard} onChange={markDirty(setSourceBoard)}>
                <option value="">Select board...</option>
                <option>Indeed</option>
                <option>LinkedIn</option>
                <option>Wellfound</option>
                <option>ZipRecruiter</option>
                <option>Monster</option>
                <option>SimplyHired</option>
                <option>Company Website</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="adm-row">
            <div className="adm-field">
              <label className="adm-label">Date Added</label>
              <input type="date" className="adm-input" value={appliedDate} onChange={markDirty(setAppliedDate)} />
            </div>
            <div className="adm-field">
              <label className="adm-label">Follow-up Date</label>
              <input type="date" className="adm-input" value={followupDate} onChange={markDirty(setFollowupDate)} />
            </div>
          </div>
          <div className="adm-field">
            <label className="adm-label">Job Posting URL</label>
            <input className="adm-input" value={url} onChange={markDirty(setUrl)} placeholder="https://..." />
          </div>
          <div className="adm-field">
            <label className="adm-label">Notes</label>
            <textarea className="adm-textarea" value={notes} onChange={markDirty(setNotes)} placeholder="Recruiter name, salary discussed, anything relevant..." />
          </div>

          {app.ghostScore>0?(
            <div className="adm-ghost-badge">
              <div className="adm-ghost-score" style={{color:ghostScoreColor}}>{app.ghostScore}</div>
              <div>
                <div className="adm-ghost-meta">GHOST SCORE</div>
                {app.verdict&&app.verdict!=="UNKNOWN"&&(
                  <span className="adm-ghost-verdict" style={{color:verdictColor,background:verdictBg}}>{app.verdict}</span>
                )}
              </div>
            </div>
          ):(
            <button className="adm-action-btn adm-scan-btn" onClick={handleGhostScan}>RUN GHOST SCAN</button>
          )}

          <div className="adm-actions-row">
            {app.ghostScore>0&&<button className="adm-action-btn adm-scan-btn" onClick={handleGhostScan} style={{flex:1}}>RE-SCAN</button>}
            <button className="adm-action-btn adm-career-btn" onClick={handleCareerHQ} style={{flex:1}}>ANALYZE IN CAREER HQ</button>
          </div>
        </div>
        <div className="adm-footer">
          <button className="adm-delete-btn" onClick={handleDelete}>DELETE</button>
          <button className="adm-save-btn" onClick={handleSave}>{dirty?"SAVE CHANGES":"CLOSE"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ================================================================
   GHOST REPORT (TrackerTab sub-component)
================================================================ */
function GhostReport(props) {
  var apps = props.apps;
  var onClose = props.onClose;
  var [copied,setCopied] = useState(false);

  var total = apps.length;
  var applied = apps.filter(function(a){return a.status!=="Saved";}).length;
  var ghosted = apps.filter(function(a){return a.status==="Ghosted";}).length;
  var interviewing = apps.filter(function(a){return a.status==="Interviewing";}).length;
  var offers = apps.filter(function(a){return a.status==="Offer";}).length;
  var ghostRate = applied>0?Math.round(ghosted/applied*100):0;
  var avgScore = total>0?Math.round(apps.reduce(function(s,a){return s+(a.ghostScore||0);},0)/total):0;

  var insight = "";
  if (total===0) insight="Start tracking your applications to generate your personal report.";
  else if (applied===0) insight="You have "+total+" saved listing"+(total===1?"":"s")+" — start applying and tracking responses to build your report.";
  else if (ghostRate>60) insight="A high share of your applications haven't received responses. This is consistent with industry-wide data on ghost job listings — the market is genuinely difficult right now, and it's not a reflection of your candidacy.";
  else if (ghostRate>30) insight="Your response rate is mixed. Ghost job rates vary significantly by industry and role level. The Verify tab can help you prioritize listings that show stronger hiring intent before you apply.";
  else if (interviewing>0||offers>0) insight="You have active applications in progress — that's meaningful signal. Keep following up on open threads and use the tracker to stay on top of follow-up dates.";
  else insight="Your search is in early stages. Use the Ghost Detector on every listing before applying — it takes 30 seconds and helps you focus your energy where it counts.";

  var shareText = "My job search stats via GhostBust:\n\n"+applied+" applications sent\n"+ghostRate+"% no-response rate\n"+(interviewing>0?interviewing+" currently interviewing\n":"")+(offers>0?offers+" offer"+(offers>1?"s":"")+"\n":"")+"Ghost job listings are a real problem — I'm tracking mine at ghostbust.app";

  function copyShare() {
    navigator.clipboard.writeText(shareText).then(function(){
      setCopied(true);
      setTimeout(function(){setCopied(false);},2000);
    });
  }

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-card" onClick={function(e){e.stopPropagation();}}>
        <button className="report-close" onClick={onClose}>✕</button>
        <div className="report-top">
          <div className="report-eyebrow">GhostBust · Personal Report</div>
          <div className="report-title">Your Job<br/>Search Stats</div>
          <div className="report-date">{new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
        </div>
        <div className="report-body">
          <div className="report-stat-grid">
            <div className="report-stat">
              <div className="report-stat-num">{total}</div>
              <div className="report-stat-lbl">Tracked</div>
            </div>
            <div className="report-stat">
              <div className="report-stat-num" style={{color:ghostRate>50?"var(--blood)":ghostRate>25?"var(--bile)":"var(--signal)"}}>{applied>0?ghostRate+"%":"—"}</div>
              <div className="report-stat-lbl">No Response</div>
            </div>
            <div className="report-stat">
              <div className="report-stat-num" style={{color:"var(--signal)"}}>{interviewing+offers}</div>
              <div className="report-stat-lbl">Active</div>
            </div>
            <div className="report-stat">
              <div className="report-stat-num" style={{color:"var(--ice)"}}>{applied}</div>
              <div className="report-stat-lbl">Applied</div>
            </div>
            <div className="report-stat">
              <div className="report-stat-num" style={{color:"var(--bile)"}}>{offers}</div>
              <div className="report-stat-lbl">Offers</div>
            </div>
            <div className="report-stat">
              <div className="report-stat-num" style={{color:avgScore>60?"var(--blood)":avgScore>35?"var(--bile)":"var(--signal)"}}>{total>0?avgScore:"—"}</div>
              <div className="report-stat-lbl">Avg Ghost Score</div>
            </div>
          </div>
          <div className="report-insight">{insight}</div>
          <div className="report-share-row">
            <div className="report-brand">Ghost<em>Bust</em></div>
            <button className={"copy-btn"+(copied?" copied":"")} onClick={copyShare}>
              {copied?"✓ Copied!":"Copy & Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   TRACKER TAB COMPONENT
================================================================ */
function TrackerTab(props) {
  var apps = props.apps;
  var loaded = props.loaded;
  var onUpdate = props.onUpdate;
  var onDelete = props.onDelete;
  var onClear = props.onClear;
  var addApp = props.addApp;
  var onNavigate = props.onNavigate;
  var [subTab,setSubTab] = useState("prospects");
  var [modalApp,setModalApp] = useState(null);
  var [filter,setFilter] = useState("All");
  var [showAdd,setShowAdd] = useState(false);
  var [showReport,setShowReport] = useState(false);
  var [addTitle,setAddTitle] = useState("");
  var [addCompany,setAddCompany] = useState("");
  var [addStatus,setAddStatus] = useState("Researching");
  var [addNotes,setAddNotes] = useState("");
  var [addUrl,setAddUrl] = useState("");
  var [addFollowup,setAddFollowup] = useState("");
  var [addSourceBoard,setAddSourceBoard] = useState("");

  var prospects = apps.filter(function(a){ return PROSPECT_STATUSES.indexOf(a.status)!==-1; });
  var applications = apps.filter(function(a){ return APPLICATION_STATUSES.indexOf(a.status)!==-1; });
  var tabApps = subTab==="prospects"?prospects:applications;
  var tabStatuses = subTab==="prospects"?PROSPECT_STATUSES:APPLICATION_STATUSES;

  var counts = {};
  tabStatuses.forEach(function(s){ counts[s]=tabApps.filter(function(a){return a.status===s;}).length; });
  counts["All"]=tabApps.length;

  var filtered = filter==="All"?tabApps:tabApps.filter(function(a){return a.status===filter;});
  var rate = apps.length>0?Math.round((apps.filter(function(a){return a.status==="Ghosted";}).length)/apps.length*100):0;

  function handleManualAdd() {
    if (!addTitle.trim()) return;
    addApp({
      id:uid(), title:addTitle.trim(), company:addCompany.trim()||"Unknown",
      ghostScore:0, verdict:"UNKNOWN", status:addStatus,
      notes:addNotes.trim(), url:addUrl.trim(), followupDate:addFollowup,
      sourceBoard:addSourceBoard, savedAt:Date.now(), manual:true,
    });
    setAddTitle(""); setAddCompany(""); setAddNotes(""); setAddUrl(""); setAddFollowup(""); setAddStatus(subTab==="prospects"?"Researching":"Applied"); setAddSourceBoard("");
    setShowAdd(false);
  }

  function handleSubTabChange(newTab) {
    setSubTab(newTab);
    setFilter("All");
    setShowAdd(false);
    setAddStatus(newTab==="prospects"?"Researching":"Applied");
  }

  function exportCSV() {
    var headers = ["Title","Company","Status","Source Board","Ghost Score","Verdict","Notes","Follow-up Date","Saved Date","URL"];
    var rows = apps.map(function(a){
      return [
        '"'+(a.title||"").replace(/"/g,'""')+'"',
        '"'+(a.company||"").replace(/"/g,'""')+'"',
        a.status||"",
        a.sourceBoard||"",
        a.ghostScore||0,
        a.verdict||"",
        '"'+(a.notes||"").replace(/"/g,'""')+'"',
        a.followupDate||"",
        formatDate(a.savedAt),
        '"'+(a.url||"").replace(/"/g,'""')+'"',
      ].join(",");
    });
    var csv = [headers.join(",")].concat(rows).join("\n");
    var blob = new Blob([csv], {type:"text/csv"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href=url; a.download="ghostbust-applications.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return (
      <div className="panel">
        <style>{STYLE}</style>
        {[1,2,3].map(function(i){
          return (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line title" />
              <div className="skeleton-line company" />
              <div className="skeleton-line chips" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="panel">
      <style>{STYLE}</style>
      <div className="inner-tabs">
        <button className={"inner-tab"+(subTab==="prospects"?" active":"")} onClick={function(){handleSubTabChange("prospects");}}>
          Prospects<span className="tab-count">{prospects.length}</span>
        </button>
        <button className={"inner-tab"+(subTab==="applications"?" active":"")} onClick={function(){handleSubTabChange("applications");}}>
          Applications<span className="tab-count">{applications.length}</span>
        </button>
      </div>
      <div className="tab-intro">Every application, <strong>from saved to offer</strong> — tracked in one place.</div>
      <div className="tracker-stats">
        {[["All","stat-saved",counts["All"]||0]].concat(tabStatuses.map(function(s){
          var cls = "stat-"+s.toLowerCase();
          return [s, cls, counts[s]||0];
        })).map(function(item){
          var label=item[0]; var cls=item[1]; var count=item[2];
          return (
            <div key={label} className={"stat-box"+(filter===label?" active-filter":"")} onClick={function(){setFilter(label);}}>
              <div className={"stat-num "+cls}>{count}</div>
              <div className="stat-lbl">{label}</div>
            </div>
          );
        })}
      </div>

      {apps.length>0&&(
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:20,display:"flex",gap:20,flexWrap:"wrap"}}>
          <span>Ghost rate: <strong style={{color:rate>50?"var(--blood)":rate>25?"var(--bile)":"var(--signal)"}}>{rate}%</strong></span>
          {counts["Offer"]>0&&<span>Offer rate: <strong style={{color:"var(--bile)"}}>{Math.round((counts["Offer"]||0)/apps.length*100)}%</strong></span>}
          {counts["Interviewing"]>0&&<span>In pipeline: <strong style={{color:"var(--signal)"}}>{counts["Interviewing"]}</strong></span>}
        </div>
      )}

      <div className="tracker-header">
        <div className="tracker-title">
          {filter==="All"?(subTab==="prospects"?"All Prospects":"All Applications"):filter+" ("+filtered.length+")"}
        </div>
        <div className="tracker-actions">
          <button className="toggle-add-btn" onClick={function(){setShowAdd(function(v){return !v;});}}>
            {showAdd?"✕ Cancel":"+ Add Manually"}
          </button>
          {apps.length>=1&&<button className="report-btn" onClick={function(){setShowReport(true);}}>📊 My Report</button>}
          {apps.length>0&&<button className="export-btn" onClick={exportCSV}>↓ CSV</button>}
          {filter!=="All"&&<button className="small-btn" onClick={function(){setFilter("All");}}>Show all</button>}
          {apps.length>0&&<button className="small-btn danger" onClick={onClear}>Clear all</button>}
        </div>
      </div>

      {showReport&&<GhostReport apps={apps} onClose={function(){setShowReport(false);}} />}

      {showAdd&&(
        <div className="add-form">
          <span className="form-label ice">+ Add Application Manually</span>
          <div className="add-form-grid">
            <div>
              <label className="field-label" style={{color:"var(--muted)"}}>Job Title *</label>
              <input className="f-input" placeholder="e.g. Product Designer" value={addTitle} onChange={function(e){setAddTitle(e.target.value);}} />
            </div>
            <div>
              <label className="field-label" style={{color:"var(--muted)"}}>Company</label>
              <input className="f-input" placeholder="e.g. Acme Corp" value={addCompany} onChange={function(e){setAddCompany(e.target.value);}} />
            </div>
            <div>
              <label className="field-label" style={{color:"var(--muted)"}}>Status</label>
              <select className="f-input" value={addStatus} onChange={function(e){setAddStatus(e.target.value);}}>
                {tabStatuses.map(function(s){return <option key={s}>{s}</option>;})}
              </select>
            </div>
            <div>
              <label className="field-label" style={{color:"var(--muted)"}}>Source Job Board</label>
              <select className="f-input" value={addSourceBoard} onChange={function(e){setAddSourceBoard(e.target.value);}}>
                <option value="">Select board...</option>
                <option>Indeed</option>
                <option>LinkedIn</option>
                <option>Wellfound</option>
                <option>ZipRecruiter</option>
                <option>Monster</option>
                <option>SimplyHired</option>
                <option>Company Website</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="add-form-row">
            <div>
              <label className="field-label" style={{color:"var(--muted)"}}>Job URL</label>
              <input className="f-input" placeholder="https://..." value={addUrl} onChange={function(e){setAddUrl(e.target.value);}} />
            </div>
            <div>
              <label className="field-label" style={{color:"var(--muted)"}}>Follow-up Date</label>
              <input type="date" className="f-input followup-date" style={{width:"100%"}} value={addFollowup} onChange={function(e){setAddFollowup(e.target.value);}} />
            </div>
          </div>
          <div>
            <label className="field-label" style={{color:"var(--muted)"}}>Notes</label>
            <input className="f-input" placeholder="Recruiter name, salary discussed, anything relevant..." value={addNotes} onChange={function(e){setAddNotes(e.target.value);}} />
          </div>
          <button className="add-submit" onClick={handleManualAdd} disabled={!addTitle.trim()}>ADD TO TRACKER</button>
        </div>
      )}

      {filtered.length===0&&tabApps.length===0&&!showAdd&&(
        <div className="empty-state">
          <div className="empty-icon">{subTab==="prospects"?"🔎":"📋"}</div>
          <div className="empty-title">{subTab==="prospects"?"No prospects yet":"No applications yet"}</div>
          <p className="empty-sub">{subTab==="prospects"?"Use Find Jobs to search boards and save roles here, or scan listings in Ghost Detector and save to tracker. Hit + Add Manually to log any role you're researching.":"When you change a prospect's status to Applied (or beyond), it moves here automatically. You can also add applications directly with + Add Manually."}</p>
          <div style={{marginTop:24,padding:"16px",background:"rgba(201,154,0,0.08)",border:"1px solid rgba(201,154,0,0.15)",maxWidth:380,margin:"24px auto 0"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--bile)",marginBottom:8}}>📊 Ghost Report</div>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.7}}>Once you start tracking applications, you can generate your personal Ghost Report — your response rate, active pipeline, and average Ghost Score across all your saved listings.</p>
          </div>
        </div>
      )}

      {filtered.length===0&&tabApps.length>0&&(
        <div className="empty-state">
          <div className="empty-icon">{STATUS_EMOJI[filter]||"🔍"}</div>
          <div className="empty-title">No {filter} Applications</div>
          <p className="empty-sub">Nothing here yet. Applications you mark as {filter} will appear here.</p>
        </div>
      )}

      {filtered.map(function(app){
        return <AppCard key={app.id} app={app} onClick={function(a){setModalApp(a);}} />;
      })}

      {modalApp&&<AppDetailModal app={modalApp} onUpdate={onUpdate} onDelete={onDelete} onClose={function(){setModalApp(null);}} onNavigate={onNavigate} />}
    </div>
  );
}

export default TrackerTab;
