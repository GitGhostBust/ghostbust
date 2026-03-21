import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";
import UserSearch from "./UserSearch.jsx";
import RegionModal from "./RegionModal.jsx";
// auth-ui-react removed
// auth-ui-shared removed

/* ================================================================
   STYLES
================================================================ */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #070709; --surface: #0e0e12; --surface2: #13131a; --surface3: #181820;
    --paper: #eeeae0; --muted: rgba(238,234,224,0.45); --ghost: #4a4a60;
    --blood: #d42200; --blood-dim: rgba(212,34,0,0.15);
    --bile: #c99a00; --bile-dim: rgba(201,154,0,0.15);
    --signal: #00e67a; --signal-dim: rgba(0,230,122,0.1);
    --ice: #00c8e6; --ice-dim: rgba(0,200,230,0.1);
    --border: rgba(255,255,255,0.07); --border-hi: rgba(255,255,255,0.14);
  }
  html, body { width: 100%; max-width: 100%; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: var(--void); color: var(--paper); font-family: 'Space Mono', monospace; min-height: 100vh; overflow-x: hidden; }
  .app-root { width: 100vw; max-width: 100%; margin: 0; padding: 0; box-sizing: border-box; overflow-x: hidden; }
  .scanlines { position: fixed; inset: 0; pointer-events: none; z-index: 9000; background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.055) 3px, rgba(0,0,0,0.055) 4px); }
  .app { width: 100%; max-width: 100%; margin: 0; padding: 0 24px 120px; box-sizing: border-box; }

  /* TICKER */
  .ticker-wrap { background: var(--blood); overflow: hidden; padding: 8px 0; }
  .ticker-track { display: inline-flex; white-space: nowrap; animation: ticker 36s linear infinite; }
  @keyframes ticker { to { transform: translateX(-50%); } }
  .ticker-item { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; padding: 0 28px; }

  /* APP NAV */
  .app-nav { position: sticky; top: 0; z-index: 200; background: var(--surface); border-bottom: 1px solid var(--border-hi); display: flex; align-items: center; gap: 10px; padding: 0 24px; height: 50px; }
  .app-nav-logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); text-decoration: none; flex-shrink: 0; }
  .app-nav-logo em { color: var(--blood); font-style: normal; }
  .app-nav-btn { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--paper); border: 1px solid var(--border-hi); padding: 6px 14px; background: rgba(255,255,255,0.05); cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .app-nav-btn:hover { background: rgba(255,255,255,0.08); }

  /* HEADER */
  .header { padding: 40px 0 36px; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 16px; }
  .logo-eyebrow { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--blood); margin-bottom: 6px; }
  .logo-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(56px, 10vw, 100px); line-height: 0.88; color: var(--paper); }
  .logo-title em { color: var(--blood); font-style: normal; }
  .logo-sub { font-size: 13px; color: var(--muted); line-height: 1.55; max-width: 460px; margin-top: 10px; }
  .ghost-float { font-size: 68px; line-height: 1; animation: float 5s ease-in-out infinite; }
  @keyframes float { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-10px) rotate(3deg); } }

  /* TABS */
  .tabs { display: flex; margin-top: 40px; border-bottom: 1px solid var(--border); gap: 0; }
  .tab-btn { font-family: 'Bebas Neue', sans-serif; font-size: 17px; letter-spacing: 0.08em; color: var(--ghost); background: none; border: none; padding: 12px 24px 14px; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -1px; transition: color 0.2s, border-color 0.2s; display: flex; align-items: center; gap: 7px; white-space: nowrap; }
  .tab-btn:hover { color: var(--paper); }
  .tab-btn.active { color: var(--paper); border-bottom-color: var(--blood); }
  .tab-badge { background: var(--blood); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 9px; padding: 1px 5px; border-radius: 2px; min-width: 18px; text-align: center; }
  .tab-badge.green { background: var(--signal); color: #050a07; }

  /* SHARED FORM */
  .panel { padding: 32px 0; }
  .form-box { background: var(--surface); border: 1px solid var(--border); padding: 26px; }
  .form-box.green-top { border-top: 3px solid var(--signal); }
  .form-box.red-top { border-top: 3px solid var(--blood); }
  .form-box.ice-top { border-top: 3px solid var(--ice); }
  .form-label { font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 18px; display: block; }
  .form-label.green { color: var(--paper); }
  .form-label.red { color: var(--blood); }
  .form-label.ice { color: var(--ice); }
  .field-label { font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--paper); margin-bottom: 8px; display: block; }
  .field-label.red { color: var(--blood); }
  .search-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }  .f-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 11px 14px; outline: none; width: 100%; transition: border-color 0.2s; }
  .f-input:focus { border-color: var(--border-hi); }
  .f-input::placeholder { color: rgba(255,255,255,0.4); font-family: 'Space Mono', monospace; font-size: 11px; }
  select.f-input { appearance: none; cursor: pointer; }
  select.f-input option { background: #13131a; color: var(--paper); }
  .paste-area { width: 100%; min-height: 160px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; line-height: 1.7; padding: 14px; resize: vertical; outline: none; transition: border-color 0.2s; }
  .paste-area:focus { border-color: var(--border-hi); }
  .paste-area::placeholder { color: var(--ghost); font-style: italic; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  .run-btn { width: 100%; margin-top: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 21px; letter-spacing: 0.08em; border: none; padding: 15px; cursor: pointer; transition: background 0.15s; }
  .run-btn.green { background: var(--signal); color: #050a07; }
  .run-btn.green:hover:not(:disabled) { background: #00ff88; }
  .run-btn.red { background: var(--blood); color: var(--paper); }
  .run-btn.red:hover:not(:disabled) { background: #e52600; }
  .run-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .err-box { padding: 14px 18px; background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.3); font-family: 'Space Mono', monospace; font-size: 13px; color: var(--blood); margin-top: 18px; word-break: break-all; }

  /* LOADING */
  .loading-card { background: var(--surface); border: 1px solid var(--border); padding: 40px 32px; text-align: center; margin-top: 24px; }
  .spin { width: 42px; height: 42px; border: 2px solid var(--border); border-radius: 50%; animation: spin 0.75s linear infinite; margin: 0 auto 18px; }
  .spin.red { border-top-color: var(--blood); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .load-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 18px; }
  .load-step { font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.2); padding: 4px 0; transition: color 0.3s; }
  .load-step.active-r { color: var(--blood); }
  .load-step.done { color: rgba(255,255,255,0.15); text-decoration: line-through; }

  /* SEARCH BOARDS */
  .boards-section { margin-top: 32px; }
  .boards-header { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-end; }
  .boards-title { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; }
  .boards-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.08em; margin-top: 4px; }
  .board-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .board-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--ghost); padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: background 0.15s; }
  .board-card:hover { background: var(--surface2); }
  .board-card.indeed { border-top-color: #2557a7; }
  .board-card.linkedin { border-top-color: #0a66c2; }
  .board-card.wellfound { border-top-color: #ff6154; }
  .board-card.ziprecruiter { border-top-color: #4a90d9; }
  .board-card.monster { border-top-color: #6e44ff; }
  .board-card.simplyhired { border-top-color: #ff6b35; }
  .board-name { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.04em; }
  .board-name.indeed { color: #2557a7; }
  .board-name.linkedin { color: #0a66c2; }
  .board-name.wellfound { color: #ff6154; }
  .board-name.ziprecruiter { color: #4a90d9; }
  .board-name.monster { color: #6e44ff; }
  .board-name.simplyhired { color: #ff6b35; }
  .board-desc { font-size: 11px; color: var(--muted); line-height: 1.6; flex: 1; }
  .board-link { display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--paper); text-decoration: none; background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 9px; transition: background 0.15s; }
  .board-link:hover { background: rgba(255,255,255,0.1); }
  .search-tips { margin-top: 24px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 18px; }
  .search-tips-title { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--paper); margin-bottom: 12px; }
  .tip-row { display: flex; gap: 10px; font-size: 13px; color: rgba(238,234,224,0.7); padding: 4px 0; line-height: 1.6; }
  .tip-n { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); flex-shrink: 0; margin-top: 2px; }

  /* VERDICT */
  .verdict-card { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--blood); padding: 26px; margin-top: 24px; }
  .verdict-card.legit { border-top-color: var(--signal); }
  .verdict-card.suspicious { border-top-color: var(--bile); }
  .v-headline { font-family: 'Bebas Neue', sans-serif; font-size: 30px; letter-spacing: 0.04em; margin-bottom: 18px; }
  .vh-ghost { color: var(--blood); }
  .vh-legit { color: var(--signal); }
  .vh-suspicious { color: var(--bile); }
  .score-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
  .score-box { background: var(--surface2); border: 1px solid var(--border); padding: 12px 8px; text-align: center; }
  .score-num { font-family: 'Bebas Neue', sans-serif; font-size: 32px; line-height: 1; }
  .score-lbl { font-family: 'Space Mono', monospace; font-size: 7px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); margin-top: 3px; }
  .sc-red { color: var(--blood); } .sc-yellow { color: var(--bile); } .sc-green { color: var(--signal); }
  .conf-bar-wrap { margin-bottom: 16px; }
  .conf-bar-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.2em; color: var(--ghost); display: flex; justify-content: space-between; margin-bottom: 5px; }
  .conf-bar-track { height: 3px; background: rgba(255,255,255,0.07); }
  .conf-bar-fill { height: 3px; transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
  .fill-ghost { background: var(--blood); } .fill-legit { background: var(--signal); } .fill-suspicious { background: var(--bile); }
  .v-summary { font-size: 14px; line-height: 1.75; color: rgba(238,234,224,0.8); margin-bottom: 18px; }
  .flags-list { list-style: none; }
  .flag-row { display: flex; gap: 10px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; line-height: 1.5; color: rgba(238,234,224,0.7); }
  .sev-pill { font-family: 'Space Mono', monospace; font-size: 11px; padding: 3px 9px; flex-shrink: 0; margin-top: 2px; }
  .sev-high { background: var(--blood-dim); color: var(--blood); }
  .sev-med { background: var(--bile-dim); color: var(--bile); }
  .sev-low { background: rgba(255,255,255,0.05); color: var(--ghost); }
  .action-tips { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 16px; margin-top: 18px; }
  .action-tips-title { font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--paper); margin-bottom: 10px; }

  /* SAVE TO TRACKER */
  .save-bar { margin-top: 20px; background: var(--surface2); border: 1px solid var(--border-hi); padding: 18px; display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .save-bar-title { font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ice); margin-bottom: 14px; width: 100%; }
  .save-bar .f-input { flex: 1; min-width: 160px; }
  .save-btn { background: var(--ice); color: #050a09; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 11px 22px; cursor: pointer; white-space: nowrap; transition: background 0.15s; flex-shrink: 0; }
  .save-btn:hover { background: #00e8ff; }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .save-success { font-family: 'Space Mono', monospace; font-size: 13px; color: var(--paper); padding: 10px 0; width: 100%; }

  /* TRACKER */
  .tracker-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 28px; }
  .stat-box { background: var(--surface); border: 1px solid var(--border); padding: 14px 10px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
  .stat-box:hover { background: var(--surface2); }
  .stat-box.active-filter { border-color: var(--border-hi); background: var(--surface2); }
  .stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 34px; line-height: 1; }
  .stat-lbl { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.85); margin-top: 3px; }
  .stat-saved { color: var(--paper); }
  .stat-researching { color: var(--bile); }
  .stat-applied { color: var(--ice); }
  .stat-interviewing { color: var(--signal); }
  .stat-ghosted { color: var(--ghost); }
  .stat-rejected { color: var(--blood); }
  .stat-offer { color: var(--bile); }
  .app-card.status-researching { border-left-color: var(--bile); }
  .app-card.status-saved { border-left-color: rgba(238,234,224,0.3); }
  .status-select.status-researching { color: var(--bile); }

  .tracker-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .tracker-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); }
  .tracker-actions { display: flex; gap: 8px; }
  .small-btn { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--border); background: none; color: var(--ghost); cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .small-btn:hover { color: var(--paper); border-color: var(--border-hi); }
  .small-btn.danger:hover { color: var(--blood); border-color: var(--blood); }

  .app-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--ghost); margin-bottom: 10px; padding: 16px 18px; display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; transition: background 0.15s; }
  .app-card:hover { background: var(--surface2); }
  .app-card.status-saved { border-left-color: rgba(238,234,224,0.3); }
  .app-card.status-applied { border-left-color: var(--ice); }
  .app-card.status-interviewing { border-left-color: var(--signal); }
  .app-card.status-ghosted { border-left-color: var(--ghost); }
  .app-card.status-rejected { border-left-color: var(--blood); }
  .app-card.status-offer { border-left-color: var(--bile); }
  .app-title { font-size: 14px; font-weight: 600; color: var(--paper); margin-bottom: 3px; line-height: 1.3; }
  .app-company { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.06em; margin-bottom: 8px; }
  .app-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .app-chip { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 9px; border: 1px solid var(--border); color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.03); }
  .gs-chip { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.05em; padding: 3px 9px; }
  .gs-low { background: var(--signal-dim); border: 1px solid rgba(0,230,122,0.2); color: var(--signal); }
  .gs-mid { background: var(--bile-dim); border: 1px solid rgba(201,154,0,0.2); color: var(--bile); }
  .gs-high { background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.2); color: var(--blood); }
  .app-notes { font-size: 12px; color: var(--muted); margin-top: 8px; font-style: italic; line-height: 1.5; }
  .app-date { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--ghost); }

  .app-controls { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
  .status-select { background: var(--surface2); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.08em; padding: 5px 8px; outline: none; cursor: pointer; appearance: none; text-align: center; }
  .status-select option { background: #13131a; color: var(--paper); }
  .status-select.status-saved { color: rgba(238,234,224,0.6); }
  .status-select.status-applied { color: var(--ice); }
  .status-select.status-interviewing { color: var(--signal); }
  .status-select.status-ghosted { color: var(--ghost); }
  .status-select.status-rejected { color: var(--blood); }
  .status-select.status-offer { color: var(--bile); }
  .delete-btn { background: none; border: 1px solid var(--border); color: var(--ghost); font-size: 12px; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.15s, border-color 0.15s; }
  .delete-btn:hover { color: var(--blood); border-color: var(--blood); }

  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 0.04em; color: var(--ghost); margin-bottom: 8px; }
  .empty-sub { font-size: 13px; color: var(--ghost); line-height: 1.6; max-width: 340px; margin: 0 auto; }

  .notes-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 11px; padding: 6px 10px; outline: none; margin-top: 6px; transition: border-color 0.2s; }
  .notes-input:focus { border-color: var(--border-hi); }
  .notes-input::placeholder { color: var(--ghost); }

  .footer { margin-top: 80px; padding-top: 20px; border-top: 1px solid var(--border); font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; color: rgba(255,255,255,0.55); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }

  /* MANUAL ADD */
  .add-form { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--ice); padding: 22px; margin-bottom: 28px; }
  .add-form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .add-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .add-submit { background: var(--ice); color: #050a09; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 11px 22px; cursor: pointer; transition: background 0.15s; width: 100%; margin-top: 6px; }
  .add-submit:hover:not(:disabled) { background: #00e8ff; }
  .add-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .toggle-add-btn { background: none; border: 1px solid var(--ice); color: var(--ice); font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; cursor: pointer; transition: background 0.15s; }
  .toggle-add-btn:hover { background: var(--ice-dim); }

  /* EDIT MODE ON CARD */
  .edit-inline { display: flex; gap: 6px; margin-bottom: 4px; align-items: center; }
  .edit-inline input { background: rgba(255,255,255,0.06); border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 11px; padding: 4px 8px; outline: none; flex: 1; }
  .edit-save-btn { background: var(--signal); color: #050a07; font-family: 'Space Mono', monospace; font-size: 9px; padding: 4px 10px; border: none; cursor: pointer; flex-shrink: 0; }

  /* FOLLOW-UP DATE */
  .followup-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
  .followup-label { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.65); }
  .followup-date { background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 10px; padding: 3px 8px; outline: none; cursor: pointer; }
  .followup-date:focus { border-color: var(--border-hi); }
  .followup-due { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--bile); }
  .followup-overdue { color: var(--blood); }

  /* EXPORT */
  .export-btn { background: none; border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; cursor: pointer; transition: background 0.15s; }
  .export-btn:hover { background: rgba(255,255,255,0.05); }

  /* GHOST REPORT CARD */
  .report-btn { background: none; border: 1px solid var(--bile); color: var(--bile); font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; cursor: pointer; transition: background 0.15s; }
  .report-btn:hover { background: var(--bile-dim); }
  .report-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .report-card { background: var(--void); border: 1px solid var(--border-hi); max-width: 500px; width: 100%; position: relative; }
  .report-top { background: var(--blood); padding: 22px 24px 18px; }
  .report-eyebrow { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(238,234,224,0.65); margin-bottom: 6px; }
  .report-title { font-family: 'Bebas Neue', sans-serif; font-size: 40px; line-height: 0.9; letter-spacing: 0.02em; color: var(--paper); }
  .report-date { font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(238,234,224,0.6); margin-top: 8px; }
  .report-body { padding: 22px 24px; }
  .report-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
  .report-stat { text-align: center; padding: 14px 8px; background: var(--surface); border: 1px solid var(--border); }
  .report-stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 36px; line-height: 1; color: var(--paper); }
  .report-stat-lbl { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.85); margin-top: 3px; }
  .report-insight { font-size: 13px; color: var(--muted); line-height: 1.75; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); margin-bottom: 18px; }
  .report-share-row { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 10px; }
  .report-brand { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: var(--ghost); letter-spacing: 0.05em; }
  .report-brand em { color: var(--blood); font-style: normal; }
  .copy-btn { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; padding: 7px 14px; border: 1px solid var(--border-hi); color: var(--paper); background: none; cursor: pointer; transition: background 0.15s; }
  .copy-btn:hover { background: rgba(255,255,255,0.05); }
  .copy-btn.copied { color: var(--paper); border-color: var(--border-hi); }
  .report-close { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: rgba(238,234,224,0.6); width: 28px; height: 28px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.15s; }
  .report-close:hover { color: var(--paper); }

  @media (max-width: 720px) {
    .board-grid { grid-template-columns: 1fr 1fr; }
    .tracker-stats { grid-template-columns: repeat(3, 1fr); }
    .search-grid, .two-col { grid-template-columns: 1fr; }
    .score-row { grid-template-columns: 1fr 1fr; }
    .header { grid-template-columns: 1fr; }
    .ghost-float { display: none; }
    .app-card { grid-template-columns: 1fr; }
    .app-controls { flex-direction: row; align-items: center; }
    .logo-title { font-size: clamp(42px, 12vw, 72px); }
    .tab-btn { font-size: 14px; padding: 10px 14px 12px; }
    .panel { padding: 24px 0; }
    .form-box { padding: 18px; }
  }
  @media (max-width: 480px) {
    .board-grid, .tracker-stats { grid-template-columns: 1fr 1fr; }
    .tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .app { padding: 0 16px 100px; }
    .tab-btn { font-size: 13px; padding: 10px 12px; }
    .score-row { grid-template-columns: 1fr 1fr; }
    .tracker-stats { grid-template-columns: repeat(3,1fr); }
    .stat-num { font-size: 22px; }
    .verdict-title { font-size: 24px; }
    .logo-title { font-size: clamp(38px, 11vw, 60px); }
  }
`;

/* ================================================================
   CONSTANTS
================================================================ */
const TICKER_ITEMS = [
  "72% of job seekers applied to a ghost listing",
  "The average job posting gets 250 resumes",
  "40% of companies admit to posting fake jobs",
  "1 in 5 listings are never intended to be filled",
  "Ghost jobs waste millions of hours every year",
  "Track every application. Miss nothing.",
];

const VERIFY_STEPS = [
  "Parsing listing structure...",
  "Scanning for ghost job patterns...",
  "Scoring language specificity...",
  "Checking hiring intent signals...",
  "Calculating Ghost Score...",
  "Rendering verdict...",
];

const INDUSTRY_MAP = {
  "Technology and Software": ["Software Engineering","Frontend Development","Backend Development","Full Stack Development","Mobile Development","DevOps and Infrastructure","Cybersecurity","Cloud Computing","AI and Machine Learning","Product Management","QA and Testing","IT Support and Systems","Game Development","Blockchain and Web3","Embedded Systems"],
  "Finance and Banking": ["Investment Banking","Private Equity","Venture Capital","Asset Management","Financial Planning","Accounting and Auditing","Risk Management","Compliance and Regulation","Insurance","Retail Banking","Corporate Finance","Quantitative Analysis","Fintech","Tax","Treasury"],
  "Healthcare and Medicine": ["Psychology and Counseling","Psychiatry","Nursing","Physician and Medical Doctor","Physical Therapy","Occupational Therapy","Pharmacy","Dentistry","Public Health","Healthcare Administration","Medical Research","Radiology","Surgery","Social Work","Nutrition and Dietetics"],
  "Marketing and Advertising": ["Digital Marketing","Content Marketing","SEO and SEM","Social Media","Brand Strategy","Performance Marketing","Email Marketing","Product Marketing","Growth Marketing","Public Relations","Media Buying","Influencer Marketing","Marketing Analytics","Event Marketing","Creative Direction"],
  "Design and Creative": ["UX and Product Design","Graphic Design","Visual Design","Motion Graphics","Brand Identity","Illustration","3D and Animation","Industrial Design","Interior Design","Fashion Design","Photography","Video Production","Art Direction","Web Design","Packaging Design"],
  "Engineering and Manufacturing": ["Mechanical Engineering","Civil Engineering","Electrical Engineering","Chemical Engineering","Aerospace Engineering","Structural Engineering","Process Engineering","Environmental Engineering","Materials Engineering","Quality Engineering","Manufacturing Operations","Supply Chain Engineering","Robotics","Nuclear Engineering","Petroleum Engineering"],
  "Education and Training": ["K-12 Teaching","Higher Education","Special Education","Curriculum Development","Instructional Design","Corporate Training","Educational Technology","School Administration","Tutoring","Early Childhood Education","Adult Education","STEM Education","Language Teaching","Academic Research","School Counseling"],
  "Legal and Compliance": ["Corporate Law","Litigation","Employment Law","Intellectual Property","Real Estate Law","Criminal Law","Immigration Law","Regulatory Compliance","Contract Management","Privacy and Data Law","Healthcare Law","Environmental Law","Paralegal","Legal Operations","Government Affairs"],
  "Sales and Business Development": ["Enterprise Sales","SMB Sales","SaaS Sales","Business Development","Account Management","Sales Engineering","Inside Sales","Channel Partnerships","Revenue Operations","Customer Success","Retail Sales","Real Estate Sales","Financial Sales","Pharmaceutical Sales","Recruiting Sales"],
  "Human Resources and Recruitment": ["Talent Acquisition","HR Business Partner","Compensation and Benefits","People Operations","Learning and Development","DEI and Culture","HR Technology","Payroll","Employee Relations","Organizational Development","Executive Recruiting","HR Analytics","Workforce Planning","Labour Relations","HR Compliance"],
  "Operations and Logistics": ["Supply Chain Management","Warehouse Operations","Procurement","Inventory Management","Fulfillment and Distribution","Fleet Management","Import and Export","Operations Management","Project Operations","Facilities Management","Food and Beverage Operations","Healthcare Operations","Retail Operations","Customer Operations","Business Operations"],
  "Data and Analytics": ["Data Science","Data Engineering","Data Analysis","Business Intelligence","Machine Learning Engineering","Data Architecture","Analytics Engineering","Data Governance","Database Administration","Quantitative Research","Market Research","Sports Analytics","Product Analytics","Revenue Analytics","AI Research"],
  "Media and Journalism": ["News Reporting","Investigative Journalism","Broadcast Media","Podcast Production","Documentary Film","Magazine and Editorial","Sports Media","Political Journalism","Science Journalism","Digital Media","Newsletter and Publishing","Photography and Photojournalism","Media Strategy","Content Strategy","Copywriting"],
  "Construction and Real Estate": ["General Contracting","Architecture","Construction Management","Real Estate Development","Property Management","Real Estate Brokerage","Urban Planning","Estimating and Bidding","HVAC and Mechanical","Electrical Contracting","Plumbing","Structural Engineering","Interior Architecture","Land Development","Facilities Management"],
  "Retail and eCommerce": ["Store Management","Buying and Merchandising","eCommerce Management","Category Management","Visual Merchandising","Retail Operations","Customer Experience","Loss Prevention","Inventory Planning","Wholesale","Direct to Consumer","Marketplace Selling","Retail Analytics","Fashion Retail","Luxury Retail"],
  "Hospitality and Tourism": ["Hotel Management","Restaurant Management","Event Planning","Travel and Tourism","Front of House","Culinary and Chefs","Revenue Management","Concierge and Guest Services","Catering","Bar and Beverage","Spa and Wellness","Cruise and Maritime","Theme Park Operations","Travel Agency","Airline Operations"],
  "Non-Profit and Government": ["Program Management","Policy Analysis","Community Organizing","Grant Writing","Non-Profit Leadership","Government Affairs","Public Administration","Social Services","International Development","Advocacy","Fundraising and Development","Civic Technology","Environmental Policy","Healthcare Policy","Education Policy"],
  "Science and Research": ["Biology and Life Sciences","Chemistry","Physics","Neuroscience","Environmental Science","Clinical Research","Epidemiology","Geology and Earth Science","Astronomy","Materials Science","Biotechnology","Pharmaceuticals","Food Science","Agricultural Science","Marine Science"],
};

const STATUSES = ["Researching","Saved","Applied","Interviewing","Ghosted","Rejected","Offer"];

const STATUS_EMOJI = {
  Researching: "🔎", Saved: "📌", Applied: "📤", Interviewing: "🎯", Ghosted: "👻", Rejected: "✗", Offer: "🏆"
};

const BOARDS = [
  { id:"indeed", name:"Indeed", desc:"Largest US job board. Best for volume and breadth across all industries.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("q",q); if(l)p.set("l",l); if(r)p.set("radius",r); p.set("fromage","14"); p.set("sort","date"); return "https://www.indeed.com/jobs?"+p; }},
  { id:"linkedin", name:"LinkedIn", desc:"Best for professional roles. Company info and recruiter contacts on every listing.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("keywords",q); if(l)p.set("location",l); p.set("f_TPR","r604800"); p.set("sortBy","DD"); if(r)p.set("distance",r); return "https://www.linkedin.com/jobs/search/?"+p; }},
  { id:"wellfound", name:"Wellfound", desc:"Startup-focused board with high hiring intent. Companies post because they're actively hiring — less ghost job noise than the big boards.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("query",q); if(l)p.set("location",l); return "https://wellfound.com/jobs?"+p; }},
  { id:"ziprecruiter", name:"ZipRecruiter", desc:"Strong AI matching. Good for roles that fit your profile across employer networks.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("search",q); if(l)p.set("location",l); p.set("days","14"); if(r)p.set("radius",r); return "https://www.ziprecruiter.com/jobs-search?"+p; }},
  { id:"monster", name:"Monster", desc:"Strong presence in mid-market and trade sectors. Good for non-tech roles.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("q",q); if(l)p.set("where",l); p.set("tm","14"); if(r)p.set("rad",r); return "https://www.monster.com/jobs/search?"+p; }},
  { id:"simplyhired", name:"SimplyHired", desc:"Aggregates from hundreds of sources. Finds listings not on the bigger boards.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("q",q); if(l)p.set("l",l); p.set("date","14"); p.set("sb","dd"); if(r)p.set("radius",r); return "https://www.simplyhired.com/search?"+p; }},
];

const SEARCH_TIPS = [
  "Filter by 'Last 14 days' on every platform — older listings are ghost jobs 80% of the time.",
  "No salary range + no recruiter name + vague requirements = run it through the Verify tab first.",
  "Same listing on 4+ boards with identical text is likely resume harvesting, not real hiring.",
  "Cross-check: open the company LinkedIn page. No recent posts + under 10 employees = red flag.",
];

const STORAGE_KEY = "ghostbust-applications";

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

function parseJSON(text) {
  var t = text.trim();
  try { return JSON.parse(t); } catch(e1) { /* continue */ }
  var s = t.indexOf("{"); var e = t.lastIndexOf("}");
  if (s !== -1 && e > s) { try { return JSON.parse(t.slice(s,e+1)); } catch(e2) { /* continue */ } }
  throw new Error("Could not parse response: " + t.slice(0,200));
}

function apiCall(messages) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:4000, messages:messages }),
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if (data.error) throw new Error(data.error.type+": "+data.error.message);
    if (!data.content||!data.content.length) throw new Error("Empty API response");
    return data.content.filter(function(b){return b.type==="text";}).map(function(b){return b.text;}).join("\n").replace(/```json/g,"").replace(/```/g,"").trim();
  });
}

/* ================================================================
   STORAGE HOOKS
================================================================ */
function useApplications() {
  var [apps, setApps] = useState([]);
  var [loaded, setLoaded] = useState(false);

  useEffect(function() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) { try { setApps(JSON.parse(stored)); } catch(e) { setApps([]); } }
    } catch(e) {}
    setLoaded(true);
  }, []);

  var save = useCallback(function(newApps) {
    setApps(newApps);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newApps)); } catch(e) {}
  }, []);

  var addApp = useCallback(function(app) {
    setApps(function(prev) {
      var next = [app].concat(prev);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }, []);

  var updateApp = useCallback(function(id, changes) {
    setApps(function(prev) {
      var next = prev.map(function(a) { return a.id === id ? Object.assign({}, a, changes) : a; });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }, []);

  var deleteApp = useCallback(function(id) {
    setApps(function(prev) {
      var next = prev.filter(function(a) { return a.id !== id; });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }, []);

  return { apps:apps, loaded:loaded, addApp:addApp, updateApp:updateApp, deleteApp:deleteApp, save:save };
}

/* ================================================================
   LOADING BLOCK
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
   VERDICT CARD
================================================================ */
function VerdictCard(props) {
  var r = props.result;
  var v = r.verdict;
  var fillCls = v==="LEGIT"?"fill-legit":v==="SUSPICIOUS"?"fill-suspicious":"fill-ghost";
  var cardCls = "verdict-card"+(v==="LEGIT"?" legit":v==="SUSPICIOUS"?" suspicious":"");
  var headCls = "v-headline "+(v==="LEGIT"?"vh-legit":v==="SUSPICIOUS"?"vh-suspicious":"vh-ghost");
  var headText = v==="LEGIT"?"✓ Appears Legitimate":v==="SUSPICIOUS"?"◈ Suspicious — Proceed With Caution":"⚠ Ghost Listing Detected";
  var sc = r.scores||{};
  return (
    <div className={cardCls}>
      <div className={headCls}>{headText}</div>
      <div className="score-row">
        {[["Ghost Score",r.ghostScore,true],["Specificity",sc.specificityScore,false],["Transparency",sc.transparencyScore,false],["Process",sc.processScore,false]].map(function(item){
          var label=item[0]; var val=item[1]; var inv=item[2];
          return (
            <div key={label} className="score-box">
              <div className={"score-num "+(inv?gsColor(val||0):scoreColor(val||0))}>{val!=null?val:"—"}</div>
              <div className="score-lbl">{label}</div>
            </div>
          );
        })}
      </div>
      <div className="conf-bar-wrap">
        <div className="conf-bar-label"><span>Detection Confidence</span><span>{r.confidence||0}%</span></div>
        <div className="conf-bar-track"><div className={"conf-bar-fill "+fillCls} style={{width:(r.confidence||0)+"%"}} /></div>
      </div>
      <p className="v-summary">{r.summary}</p>
      {r.flags&&r.flags.length>0&&(
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.3em",color:"rgba(255,255,255,0.6)",textTransform:"uppercase",marginBottom:10}}>Signals Detected</div>
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
        <p style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.5)",lineHeight:1.7}}>
          DISCLAIMER: GhostBust scores are algorithmic estimates based on patterns in listing language and structure. They are not verified facts about employer intent and should not be the sole basis for any application decision. A low score does not guarantee a role is unfilled, and a high score does not guarantee a hire. Always conduct your own research.
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   SEARCH TAB
================================================================ */
function SearchTab() {
  var [industry,setIndustry] = useState("");
  var [subfield,setSubfield] = useState("");
  var [jobType,setJobType] = useState("");
  var [city,setCity] = useState("");
  var [usState,setUsState] = useState("");
  var [radius,setRadius] = useState("25");
  var [results,setResults] = useState(null);

  var subfields = industry ? (INDUSTRY_MAP[industry] || []) : [];

  function handleIndustryChange(e) {
    setIndustry(e.target.value);
    setSubfield("");
  }

  function handleSearch() {
    var q = [subfield||industry, jobType].filter(Boolean).join(" ");
    var loc = [city.trim(), usState.trim()].filter(Boolean).join(", ");
    var r = radius;
    setResults({ q:q, loc:loc, radius:r, boards:BOARDS.map(function(b){return {id:b.id,name:b.name,desc:b.desc,url:b.buildUrl(q,loc,r)};}) });
  }

  var canSearch = industry.length>0||city.length>0||usState.length>0||jobType.length>0;

  return (
    <div className="panel">
      <div className="form-box green-top">
        <span className="form-label green">Find Real Jobs — Search All Major Boards</span>
        <div className="search-grid">
          <div>
            <label className="field-label">Industry</label>
            <select className="f-input" value={industry} onChange={handleIndustryChange}>
              <option value="">Any Industry</option>
              {Object.keys(INDUSTRY_MAP).map(function(ind){return <option key={ind} value={ind}>{ind}</option>;})}
            </select>
          </div>
          <div>
            <label className="field-label" style={{color:subfields.length>0?"var(--paper)":"var(--ghost)"}}>
              Specialisation {subfields.length===0?"— select an industry first":""}
            </label>
            <select className="f-input" value={subfield} onChange={function(e){setSubfield(e.target.value);}} disabled={subfields.length===0}>
              <option value="">All {industry||"fields"}</option>
              {subfields.map(function(s){return <option key={s} value={s}>{s}</option>;})}
            </select>
          </div>
          <div>
            <label className="field-label">Job Type</label>
            <select className="f-input" value={jobType} onChange={function(e){setJobType(e.target.value);}}>
              <option value="">Any</option>
              <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Remote</option>
            </select>
          </div>
          <div>
            <label className="field-label">City</label>
            <input className="f-input" placeholder="e.g. San Francisco, Austin" value={city} onChange={function(e){setCity(e.target.value);}} />
          </div>
          <div>
            <label className="field-label">State</label>
            <input className="f-input" placeholder="e.g. California, TX" value={usState} onChange={function(e){setUsState(e.target.value);}} />
          </div>
          <div>
            <label className="field-label">Distance</label>
            <select className="f-input" value={radius} onChange={function(e){setRadius(e.target.value);}}>
              <option value="5">Within 5 miles</option>
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
              <option value="50">Within 50 miles</option>
              <option value="100">Within 100 miles</option>
            </select>
          </div>
        </div>
        <button className="run-btn green" onClick={handleSearch} disabled={!canSearch}>GENERATE SEARCH LINKS</button>
      </div>

      {results&&(
        <div className="boards-section">
          <div className="boards-header">
            <div>
              <div className="boards-title">6 Boards — Pre-Filtered</div>
              <div className="boards-sub">{results.q?results.q.toUpperCase():"ALL JOBS"}{results.loc?" · "+results.loc.toUpperCase()+(results.radius?" +"+results.radius+"MI":""):" · USA"} · LAST 14 DAYS · DATE SORTED</div>
            </div>
          </div>
          <div className="board-grid">
            {results.boards.map(function(b){
              return (
                <div key={b.id} className={"board-card "+b.id}>
                  <div className={"board-name "+b.id}>{b.name}</div>
                  <p className="board-desc">{b.desc}</p>
                  <a className="board-link" href={b.url} target="_blank" rel="noreferrer">Search {b.name} ↗</a>
                </div>
              );
            })}
          </div>
          <div className="search-tips">
            <div className="search-tips-title">Ghost-Proof Your Search</div>
            {SEARCH_TIPS.map(function(t,i){return <div key={i} className="tip-row"><span className="tip-n">{String(i+1).padStart(2,"0")}</span><span>{t}</span></div>;})}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   VERIFY TAB
================================================================ */
function VerifyTab(props) {
  var addApp = props.addApp;
  var onSaved = props.onSaved;

  var [text,setText] = useState("");
  var [company,setCompany] = useState("");
  var [jobTitle,setJobTitle] = useState("");
  var [age,setAge] = useState("");
  var [sourceBoard,setSourceBoard] = useState("");
  var [loading,setLoading] = useState(false);
  var [step,setStep] = useState(-1);
  var [result,setResult] = useState(null);
  var [error,setError] = useState(null);
  var [saving,setSaving] = useState(false);
  var [saved,setSaved] = useState(false);
  var resultRef = useRef(null);

  useEffect(function(){
    if (result&&resultRef.current) resultRef.current.scrollIntoView({behavior:"smooth"});
  },[result]);

  function analyze() {
    setLoading(true); setResult(null); setError(null); setSaved(false); setStep(0);
    var iv = setInterval(function(){setStep(function(s){return Math.min(s+1,VERIFY_STEPS.length-1);});},700);
    var prompt = "You are a ghost job analyst. Analyze this job listing and return ONLY a JSON object.\n\nListing:\n"+text+(company?"\nCompany: "+company:"")+(age?"\nPosted: "+age:"")+"\n\nReturn JSON with: verdict (LEGIT or SUSPICIOUS or GHOST), ghostScore (0-100 where 100=fake), confidence (0-100), summary (2-3 sentences), scores (object: specificityScore, urgencyScore, transparencyScore, processScore each 0-100), flags (array of objects: severity HIGH/MEDIUM/LOW, flag string, explanation string, isPositive boolean), actionTips (array of 3 strings). Only return the JSON object.";
    apiCall([{role:"user",content:prompt}])
      .then(function(raw){
        clearInterval(iv); setStep(VERIFY_STEPS.length-1);
        var parsed = parseJSON(raw);
        setResult(parsed); try { var anonId = localStorage.getItem("gb_anon_id"); if (!anonId) { anonId = Math.random().toString(36).slice(2); localStorage.setItem("gb_anon_id", anonId); } import("./supabase.js").then(function(m){ m.supabase.from("ghost_scans").insert({ anon_id: anonId, company: company||null, title: jobTitle||null, job_board: sourceBoard||null, ghost_score: parsed.ghostScore||0, signal_flags: parsed.flags||[], assessment: parsed.verdict||null }).then(function(){}).catch(function(){}); }); } catch(e) {}
        setLoading(false); setStep(-1);
      })
      .catch(function(err){
        clearInterval(iv);
        setError("Analysis failed: "+err.message);
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

  return (
    <div className="panel">
      <div className="form-box red-top">
        <span className="form-label red">Ghost Detector — Full Listing Analysis</span>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)",padding:"14px 16px",marginBottom:18}}>
          <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.8}}>
            Paste the full text of any job listing. The AI reads the actual language — not just surface signals — and identifies patterns that correlate with listings that never result in hires: vague or contradictory requirements, copy-pasted boilerplate, implausible experience stacking, missing process detail, and structural inconsistencies. It returns a Ghost Score, a breakdown of specific signals found in this listing, and concrete next steps.
          </p>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.7,marginTop:8,fontFamily:"'Space Mono',monospace"}}>
            Paste the raw listing text — do not summarise it. The more complete the text, the more accurate the analysis.
          </p>
        </div>
        <label className="field-label red">Full Job Listing Text</label>
        <textarea className="paste-area" placeholder="Paste the complete listing here — job title, responsibilities, requirements, and company description. Everything on the page." value={text} onChange={function(e){setText(e.target.value);setSaved(false);setResult(null);}} />
        <div className="two-col">
          <div>
            <label className="field-label red" style={{marginTop:12}}>Job Title (optional)</label>
            <input className="f-input" placeholder="e.g. Senior Product Designer" value={jobTitle} onChange={function(e){setJobTitle(e.target.value);}} />
          </div>
          <div>
            <label className="field-label red" style={{marginTop:12}}>Company (optional)</label>
            <input className="f-input" placeholder="e.g. Acme Corp" value={company} onChange={function(e){setCompany(e.target.value);}} />
          </div>
        </div>
        <div className="two-col" style={{marginTop:12}}>
          <div>
            <label className="field-label red">Posting Age (optional)</label>
            <input className="f-input" placeholder="e.g. posted 3 months ago" value={age} onChange={function(e){setAge(e.target.value);}} />
          </div>
          <div>
            <label className="field-label red">Source Job Board (optional)</label>
            <select className="f-input" value={sourceBoard} onChange={function(e){setSourceBoard(e.target.value);}}>
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
        <button className="run-btn red" onClick={analyze} disabled={text.trim().length<50||loading}>
          {loading?"ANALYSING...":"DETECT GHOST JOB"}
        </button>
      </div>

      {loading&&<LoadingBlock steps={VERIFY_STEPS} current={step} />}
      {error&&<div className="err-box">{"⚠ "+error}</div>}

      {result&&(
        <div ref={resultRef}>
          <VerdictCard result={result} />
          <div className="save-bar">
            <div className="save-bar-title">📌 Save to Tracker — starts as <span style={{color:"var(--ice)"}}>Researching</span></div>
            {!saved?(
              <>
                <input className="f-input" style={{flex:1,minWidth:160}} placeholder="Job title (e.g. Product Designer)" value={jobTitle} onChange={function(e){setJobTitle(e.target.value);}} />
                <input className="f-input" style={{flex:1,minWidth:140}} placeholder="Company name" value={company} onChange={function(e){setCompany(e.target.value);}} />
                <button className="save-btn" onClick={saveToTracker} disabled={saving}>
                  {saving?"SAVING...":"SAVE TO TRACKER →"}
                </button>
              </>
            ):(
              <div className="save-success">✓ Saved to tracker as <strong>Researching</strong>. Switch to the Tracker tab to update status.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   APPLICATION CARD
================================================================ */
function AppCard(props) {
  var app = props.app;
  var onUpdate = props.onUpdate;
  var onDelete = props.onDelete;
  var [editingNotes,setEditingNotes] = useState(false);
  var [notes,setNotes] = useState(app.notes||"");
  var [editingTitle,setEditingTitle] = useState(false);
  var [editTitle,setEditTitle] = useState(app.title||"");
  var [editCompany,setEditCompany] = useState(app.company||"");

  function handleStatusChange(e) {
    onUpdate(app.id, {status:e.target.value, updatedAt:Date.now()});
  }
  function saveNotes() {
    onUpdate(app.id, {notes:notes, updatedAt:Date.now()});
    setEditingNotes(false);
  }
  function saveTitleCompany() {
    onUpdate(app.id, {title:editTitle||"Untitled Role", company:editCompany||"Unknown", updatedAt:Date.now()});
    setEditingTitle(false);
  }
  function handleFollowup(e) {
    onUpdate(app.id, {followupDate:e.target.value, updatedAt:Date.now()});
  }

  var today = new Date().toISOString().slice(0,10);
  var isOverdue = app.followupDate && app.followupDate < today;
  var isDueToday = app.followupDate && app.followupDate === today;

  return (
    <div className={"app-card status-"+app.status.toLowerCase()}>
      <div>
        {editingTitle?(
          <div className="edit-inline" style={{marginBottom:6}}>
            <input value={editTitle} onChange={function(e){setEditTitle(e.target.value);}} placeholder="Job title" onKeyDown={function(e){if(e.key==="Enter")saveTitleCompany();if(e.key==="Escape")setEditingTitle(false);}} autoFocus />
            <input value={editCompany} onChange={function(e){setEditCompany(e.target.value);}} placeholder="Company" onKeyDown={function(e){if(e.key==="Enter")saveTitleCompany();}} />
            <button className="edit-save-btn" onClick={saveTitleCompany}>Save</button>
          </div>
        ):(
          <div style={{cursor:"pointer"}} onClick={function(){setEditingTitle(true);}}>
            <div className="app-title">{app.title} <span style={{opacity:0.25,fontSize:10}}>✎</span></div>
            <div className="app-company">{app.company}</div>
          </div>
        )}
        <div className="app-meta" style={{marginTop:6}}>
          <span className={gsChipClass(app.ghostScore)}>Ghost: {app.ghostScore}</span>
          <span className="app-chip">{app.verdict}</span>
          <span className="app-chip">{STATUS_EMOJI[app.status]} {app.status}</span>
          {app.sourceBoard&&<span className="app-chip" style={{color:"var(--ice)"}}>📍 {app.sourceBoard}</span>}
          <span className="app-date">{formatDate(app.savedAt)}</span>
        </div>
        <div className="followup-row">
          <span className="followup-label">Follow-up:</span>
          <input type="date" className="followup-date" value={app.followupDate||""} onChange={handleFollowup} />
          {app.followupDate&&(
            <span className={"followup-due"+(isOverdue?" followup-overdue":"")}>
              {isOverdue?"⚠ Overdue":isDueToday?"📅 Today!":""}
            </span>
          )}
        </div>
        {app.notes&&!editingNotes&&(
          <div className="app-notes" onClick={function(){setEditingNotes(true);}} style={{cursor:"pointer",marginTop:6}}>"{app.notes}" <span style={{opacity:0.35,fontSize:10}}>(edit)</span></div>
        )}
        {editingNotes?(
          <div style={{display:"flex",gap:6,marginTop:6}}>
            <input className="notes-input" placeholder="Notes..." value={notes} onChange={function(e){setNotes(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")saveNotes();if(e.key==="Escape")setEditingNotes(false);}} autoFocus />
            <button className="small-btn" onClick={saveNotes} style={{flexShrink:0}}>Save</button>
          </div>
        ):(
          !app.notes&&<div style={{marginTop:5}}><button className="small-btn" style={{fontSize:8}} onClick={function(){setEditingNotes(true);}}>+ Add notes</button></div>
        )}
      </div>
      <div className="app-controls">
        <select className={"status-select status-"+app.status.toLowerCase()} value={app.status} onChange={handleStatusChange}>
          {STATUSES.map(function(s){return <option key={s}>{s}</option>;})}
        </select>
        <button className="delete-btn" onClick={function(){onDelete(app.id);}} title="Remove">✕</button>
      </div>
    </div>
  );
}

/* ================================================================
   GHOST REPORT CARD
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
   TRACKER TAB
================================================================ */
function TrackerTab(props) {
  var apps = props.apps;
  var loaded = props.loaded;
  var onUpdate = props.onUpdate;
  var onDelete = props.onDelete;
  var onClear = props.onClear;
  var addApp = props.addApp;
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

  var counts = {};
  STATUSES.forEach(function(s){ counts[s]=apps.filter(function(a){return a.status===s;}).length; });
  counts["All"]=apps.length;

  var filtered = filter==="All"?apps:apps.filter(function(a){return a.status===filter;});
  var rate = apps.length>0?Math.round((counts["Ghosted"]||0)/apps.length*100):0;

  function handleManualAdd() {
    if (!addTitle.trim()) return;
    addApp({
      id:uid(), title:addTitle.trim(), company:addCompany.trim()||"Unknown",
      ghostScore:0, verdict:"UNKNOWN", status:addStatus,
      notes:addNotes.trim(), url:addUrl.trim(), followupDate:addFollowup,
      sourceBoard:addSourceBoard, savedAt:Date.now(), manual:true,
    });
    setAddTitle(""); setAddCompany(""); setAddNotes(""); setAddUrl(""); setAddFollowup(""); setAddStatus("Researching"); setAddSourceBoard("");
    setShowAdd(false);
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
    return <div className="panel"><div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Space Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.5)"}}>Loading...</div></div>;
  }

  return (
    <div className="panel">
      <div className="tracker-stats">
        {[
          ["All","stat-saved",counts["All"]||0],
          ["Researching","stat-researching",counts["Researching"]||0],
          ["Applied","stat-applied",counts["Applied"]||0],
          ["Interviewing","stat-interviewing",counts["Interviewing"]||0],
          ["Ghosted","stat-ghosted",counts["Ghosted"]||0],
          ["Rejected","stat-rejected",counts["Rejected"]||0],
          ["Offer","stat-offer",counts["Offer"]||0],
        ].map(function(item){
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
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.6)",marginBottom:20,display:"flex",gap:20,flexWrap:"wrap"}}>
          <span>Ghost rate: <strong style={{color:rate>50?"var(--blood)":rate>25?"var(--bile)":"var(--signal)"}}>{rate}%</strong></span>
          {counts["Offer"]>0&&<span>Offer rate: <strong style={{color:"var(--bile)"}}>{Math.round((counts["Offer"]||0)/apps.length*100)}%</strong></span>}
          {counts["Interviewing"]>0&&<span>In pipeline: <strong style={{color:"var(--signal)"}}>{counts["Interviewing"]}</strong></span>}
        </div>
      )}

      <div className="tracker-header">
        <div className="tracker-title">
          {filter==="All"?"All Applications":filter+" ("+filtered.length+")"}
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
              <label className="field-label" style={{color:"var(--ice)"}}>Job Title *</label>
              <input className="f-input" placeholder="e.g. Product Designer" value={addTitle} onChange={function(e){setAddTitle(e.target.value);}} />
            </div>
            <div>
              <label className="field-label" style={{color:"var(--ice)"}}>Company</label>
              <input className="f-input" placeholder="e.g. Acme Corp" value={addCompany} onChange={function(e){setAddCompany(e.target.value);}} />
            </div>
            <div>
              <label className="field-label" style={{color:"var(--ice)"}}>Status</label>
              <select className="f-input" value={addStatus} onChange={function(e){setAddStatus(e.target.value);}}>
                {STATUSES.map(function(s){return <option key={s}>{s}</option>;})}
              </select>
            </div>
            <div>
              <label className="field-label" style={{color:"var(--ice)"}}>Source Job Board</label>
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
              <label className="field-label" style={{color:"var(--ice)"}}>Job URL</label>
              <input className="f-input" placeholder="https://..." value={addUrl} onChange={function(e){setAddUrl(e.target.value);}} />
            </div>
            <div>
              <label className="field-label" style={{color:"var(--ice)"}}>Follow-up Date</label>
              <input type="date" className="f-input followup-date" style={{width:"100%"}} value={addFollowup} onChange={function(e){setAddFollowup(e.target.value);}} />
            </div>
          </div>
          <div>
            <label className="field-label" style={{color:"var(--ice)"}}>Notes</label>
            <input className="f-input" placeholder="Recruiter name, salary discussed, anything relevant..." value={addNotes} onChange={function(e){setAddNotes(e.target.value);}} />
          </div>
          <button className="add-submit" onClick={handleManualAdd} disabled={!addTitle.trim()}>ADD TO TRACKER</button>
        </div>
      )}

      {filtered.length===0&&apps.length===0&&!showAdd&&(
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">Your tracker is empty</div>
          <p className="empty-sub">Go to the Ghost Detector tab, paste a listing, get your analysis — then save it here with one click. Or hit <strong style={{color:"var(--ice)"}}>+ Add Manually</strong> above to log any job you're tracking, no analysis needed.</p>
          <div style={{marginTop:24,padding:"16px",background:"rgba(201,154,0,0.08)",border:"1px solid rgba(201,154,0,0.15)",maxWidth:380,margin:"24px auto 0"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--bile)",marginBottom:8}}>📊 Ghost Report</div>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.7}}>Once you start tracking applications, you can generate your personal Ghost Report — your response rate, active pipeline, and average Ghost Score across all your saved listings.</p>
          </div>
        </div>
      )}

      {filtered.length===0&&apps.length>0&&(
        <div className="empty-state">
          <div className="empty-icon">{STATUS_EMOJI[filter]||"🔍"}</div>
          <div className="empty-title">No {filter} Applications</div>
          <p className="empty-sub">Nothing here yet. Applications you mark as {filter} will appear here.</p>
        </div>
      )}

      {filtered.map(function(app){
        return <AppCard key={app.id} app={app} onUpdate={onUpdate} onDelete={onDelete} />;
      })}
    </div>
  );
}

/* ================================================================
   TUTORIAL OVERLAY
================================================================ */
const TUTORIAL_STEPS = [
  {
    icon: "👋",
    title: "Welcome to GhostBust",
    body: "Here's a quick overview of how GhostBust works so you can get the most out of it.",
    tab: null,
  },
  {
    icon: "🔍",
    title: "Step 1 — Find Jobs",
    body: "Start here. Pick your industry, specialisation, city, and distance. GhostBust opens pre-filtered, date-sorted links to all six major US job boards at once — no re-entering the same search six times.",
    tab: "search",
  },
  {
    icon: "👻",
    title: "Step 2 — Ghost Detector",
    body: "Found a listing that looks interesting? Before you spend time applying, paste the full text into the Ghost Detector. The AI reads the language and returns a Ghost Score from 0–100, a breakdown of specific signals, and concrete next steps. High score = proceed with caution.",
    tab: "verify",
  },
  {
    icon: "📋",
    title: "Step 3 — Application Tracker",
    body: "Every listing you analyse gets saved here automatically as Researching. Update the status as you go — Applied, Interviewing, Ghosted, Rejected, Offer. Set follow-up dates. Export to CSV anytime. Generate your Ghost Report once you have data.",
    tab: "tracker",
  },
  {
    icon: "🏁",
    title: "You're Ready",
    body: "That's everything. Start with Find Jobs, paste any interesting listing into the Ghost Detector before applying, and track your progress in the Tracker. Good luck out there.",
    tab: null,
  },
];

function TutorialOverlay(props) {
  var onClose = props.onClose;
  var onTabSwitch = props.onTabSwitch;
  var [step, setStep] = useState(0);
  var current = TUTORIAL_STEPS[step];
  var isLast = step === TUTORIAL_STEPS.length - 1;

  function next() {
    if (isLast) {
      onClose();
    } else {
      if (TUTORIAL_STEPS[step+1].tab) onTabSwitch(TUTORIAL_STEPS[step+1].tab);
      setStep(step + 1);
    }
  }

  function prev() {
    if (step > 0) {
      if (TUTORIAL_STEPS[step-1].tab) onTabSwitch(TUTORIAL_STEPS[step-1].tab);
      setStep(step - 1);
    }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(7,7,9,0.92)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderTop:"4px solid var(--blood)",maxWidth:480,width:"100%",padding:36,position:"relative"}}>
        
        {/* Close */}
        <button onClick={onClose} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"var(--ghost)",fontSize:18,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>✕</button>

        {/* Progress dots */}
        <div style={{display:"flex",gap:6,marginBottom:24}}>
          {TUTORIAL_STEPS.map(function(_,i){
            return <div key={i} style={{width:i===step?24:6,height:6,background:i===step?"var(--blood)":"rgba(255,255,255,0.1)",transition:"width 0.3s"}} />;
          })}
        </div>

        {/* Icon + title */}
        <div style={{fontSize:40,marginBottom:12}}>{current.icon}</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:"0.03em",color:"var(--paper)",marginBottom:14,lineHeight:1.1}}>{current.title}</div>
        <p style={{fontFamily:"'Libre Baskerville',Georgia,serif",fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.85,marginBottom:32}}>{current.body}</p>

        {/* Buttons */}
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          {step > 0 && (
            <button onClick={prev} style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"0.12em",background:"none",border:"1px solid var(--border)",color:"var(--muted)",padding:"10px 18px",cursor:"pointer"}}>← BACK</button>
          )}
          <button onClick={next} style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.08em",background:"var(--blood)",color:"var(--paper)",border:"none",padding:"12px 28px",cursor:"pointer",flex:1}}>
            {isLast ? "LET'S GO →" : "NEXT →"}
          </button>
        </div>

        {/* Step counter */}
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.45)",marginTop:16,letterSpacing:"0.1em"}}>{step+1} of {TUTORIAL_STEPS.length}</div>
      </div>
    </div>
  );
}

/* ================================================================
   ROOT
================================================================ */
function AuthForm({supabase,onClose}){
  var [done,setDone]=useState(false);
  var [forgotMode,setForgotMode]=useState(false);
  var [forgotSent,setForgotSent]=useState(false);
  var [mode,setMode]=useState("signin");
  var [email,setEmail]=useState("");
  var [password,setPassword]=useState("");
  var [error,setError]=useState(null);
  var [loading,setLoading]=useState(false);
  async function handle(){
    setLoading(true);setError(null);
    var res=mode==="signin"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
    if(res.error){setError(res.error.message);setLoading(false);return;}
    if(mode==="signup"){
      if(res.data&&res.data.user&&res.data.user.identities&&res.data.user.identities.length===0){setError("An account with this email already exists. Please sign in instead.");setLoading(false);return;}
      setDone(true);setLoading(false);return;
    }
    onClose();setLoading(false);
  }
  async function handleForgot(){
    setLoading(true);setError(null);
    var res=await supabase.auth.resetPasswordForEmail(email,{redirectTo:"https://ghostbust.us/app.html"});
    if(res.error){setError(res.error.message);setLoading(false);return;}
    setForgotSent(true);setLoading(false);
  }
  if(done)return(<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:40,marginBottom:12}}>📬</div><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:24,marginBottom:8}}>Check Your Email</div><p style={{fontSize:13,color:"var(--muted)",lineHeight:1.7}}>Confirmation link sent to <strong style={{color:"var(--paper)"}}>{email}</strong>. Click it to activate your account, then sign in.</p><button className="run-btn red" style={{marginTop:16}} onClick={function(){setDone(false);setMode("signin");}}>Back to Sign In</button></div>);
  if(forgotSent)return(<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:40,marginBottom:12}}>📬</div><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:24,marginBottom:8}}>Check Your Email</div><p style={{fontSize:13,color:"var(--muted)",lineHeight:1.7}}>Password reset link sent to <strong style={{color:"var(--paper)"}}>{email}</strong>.</p><button className="run-btn red" style={{marginTop:16}} onClick={function(){setForgotSent(false);setForgotMode(false);}}>Back to Sign In</button></div>);
  if(forgotMode)return(<div><input className="f-input" style={{marginBottom:10,width:"100%"}} placeholder="Email" value={email} onChange={function(e){setEmail(e.target.value);}}/>{error&&<div style={{color:"var(--blood)",fontSize:12,marginBottom:8}}>{error}</div>}<button className="run-btn red" onClick={handleForgot} disabled={loading}>{loading?"...":"SEND RESET LINK"}</button><div style={{marginTop:12,textAlign:"center",fontSize:12}}><button onClick={function(){setForgotMode(false);setError(null);}} style={{background:"none",border:"none",color:"var(--blood)",cursor:"pointer",fontSize:12}}>Back to Sign In</button></div></div>);
  return(<div><input className="f-input" style={{marginBottom:10,width:"100%"}} placeholder="Email" value={email} onChange={function(e){setEmail(e.target.value);}}/><input className="f-input" style={{marginBottom:10,width:"100%"}} type="password" placeholder="Password" value={password} onChange={function(e){setPassword(e.target.value);}}/>{error&&<div style={{color:"var(--blood)",fontSize:12,marginBottom:8}}>{error}</div>}<button className="run-btn red" onClick={handle} disabled={loading}>{loading?"...":mode==="signin"?"SIGN IN":"CREATE ACCOUNT"}</button><div style={{marginTop:12,textAlign:"center",fontSize:12,color:"var(--muted)"}}>{mode==="signin"&&<button onClick={function(){setForgotMode(true);setError(null);}} style={{background:"none",border:"none",color:"rgba(238,234,224,0.4)",cursor:"pointer",fontSize:11,display:"block",margin:"0 auto 8px"}}>Forgot password?</button>}{mode==="signin"?<span>No account? <button onClick={function(){setMode("signup");setError(null);}} style={{background:"none",border:"none",color:"var(--blood)",cursor:"pointer",fontSize:12}}>Sign up free</button></span>:<span>Have an account? <button onClick={function(){setMode("signin");setError(null);}} style={{background:"none",border:"none",color:"var(--blood)",cursor:"pointer",fontSize:12}}>Sign in</button></span>}</div></div>);
}

export default function App() {
  var [session, setSession] = useState(null);
  var [resetMode, setResetMode] = useState(false);
  var [newPassword, setNewPassword] = useState("");
  var [resetError, setResetError] = useState(null);
  var [resetDone, setResetDone] = useState(false);
  var [showAuth, setShowAuth] = useState(false);
  var [toast, setToast] = useState(null);
  var [showRegionModal, setShowRegionModal] = useState(false);
  useEffect(function(){
    supabase.auth.getSession().then(function(d){ setSession(d.data.session); });
    var sub = supabase.auth.onAuthStateChange(function(event,s){ setSession(s); if(event==="PASSWORD_RECOVERY"){setResetMode(true);return;} if(event==="SIGNED_IN"&&!resetMode){setToast("Signed in as "+s.user.email);setTimeout(function(){setToast(null);},4000);} if(event==="SIGNED_OUT"){setToast("Signed out");setTimeout(function(){setToast(null);},2000);} });
    return function(){ sub.data.subscription.unsubscribe(); };
  },[]);
  useEffect(function(){
    if (!session) return;
    try { if (sessionStorage.getItem("gb_region_skipped")) return; } catch(e) {}
    supabase.from("profiles").select("region_set").eq("id", session.user.id).single()
      .then(function(res){
        if (res.data && !res.data.region_set) setShowRegionModal(true);
      });
  },[session]);
  var [tab,setTab] = useState("search");
  var storage = useApplications();
  var [showTutorial, setShowTutorial] = useState(function() {
    try { return !localStorage.getItem("gb_tutorial_done"); } catch(e) { return true; }
  });

  function closeTutorial() {
    try { localStorage.setItem("gb_tutorial_done", "1"); } catch(e) {}
    setShowTutorial(false);
  }

  function handleClearAll() {
    if (window.confirm("Delete all applications? This cannot be undone.")) {
      storage.save([]);
    }
  }

  var trackerCount = storage.apps.length;
  var activeCount = storage.apps.filter(function(a){return a.status==="Researching"||a.status==="Applied"||a.status==="Interviewing";}).length;

  return (
    <div className="app-root">
      <style>{STYLE}</style>
          {resetMode&&(<div style={{position:"fixed",inset:0,background:"rgba(7,7,9,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{background:"var(--surface)",border:"1px solid var(--border)",borderTop:"4px solid var(--blood)",maxWidth:420,width:"100%",padding:36}}>{resetDone?(<div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>✓</div><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:24,marginBottom:8}}>Password Updated</div><p style={{fontSize:13,color:"var(--muted)"}}>Your password has been changed. You are now signed in.</p><button className="run-btn red" style={{marginTop:16}} onClick={function(){setResetMode(false);setResetDone(false);}}>Continue</button></div>):(<div><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:28,marginBottom:4}}>GhostBust</div><div style={{fontFamily:"Space Mono,monospace",fontSize:10,color:"var(--blood)",letterSpacing:"0.2em",marginBottom:24}}>SET NEW PASSWORD</div><input className="f-input" style={{marginBottom:10,width:"100%"}} type="password" placeholder="New password (min 6 characters)" value={newPassword} onChange={function(e){setNewPassword(e.target.value);}}/>{resetError&&<div style={{color:"var(--blood)",fontSize:12,marginBottom:8}}>{resetError}</div>}<button className="run-btn red" onClick={async function(){if(newPassword.length<6){setResetError("Password must be at least 6 characters.");return;}setResetError(null);var res=await supabase.auth.updateUser({password:newPassword});if(res.error){setResetError(res.error.message);return;}setResetDone(true);}} disabled={!newPassword}>SET PASSWORD</button></div>)}</div></div>)}
  {toast&&(<div style={{position:"fixed",bottom:24,right:24,zIndex:99999,background:"var(--surface)",border:"1px solid var(--signal)",borderLeft:"4px solid var(--signal)",padding:"14px 40px 14px 18px",maxWidth:340}}><div style={{fontFamily:"Space Mono,monospace",fontSize:10,color:"var(--signal)",letterSpacing:"0.2em",marginBottom:4}}>SIGNED IN</div><div style={{fontSize:13,color:"var(--paper)"}}>{toast}</div><button onClick={function(){setToast(null);}} style={{position:"absolute",top:8,right:10,background:"none",border:"none",color:"var(--ghost)",cursor:"pointer",fontSize:14}}>✕</button></div>)}
{showAuth&&(<div style={{position:"fixed",inset:0,background:"rgba(7,7,9,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{background:"var(--surface)",border:"1px solid var(--border)",borderTop:"4px solid var(--blood)",maxWidth:420,width:"100%",padding:36,position:"relative"}}><button onClick={function(){setShowAuth(false);}} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"var(--ghost)",fontSize:18,cursor:"pointer"}}>X</button><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:28,marginBottom:4}}>GhostBust</div><div style={{fontFamily:"Space Mono,monospace",fontSize:10,color:"var(--blood)",letterSpacing:"0.2em",marginBottom:24}}>FREE ACCOUNT</div><AuthForm supabase={supabase} onClose={function(){setShowAuth(false);}} /></div></div>)}
      {showTutorial && <TutorialOverlay onClose={closeTutorial} onTabSwitch={setTab} />}
      {showRegionModal && session && <RegionModal userId={session.user.id} onClose={function(){setShowRegionModal(false);}} />}
      <div className="scanlines" />
      <div className="ticker-wrap">
        <div className="ticker-track">
          {TICKER_ITEMS.concat(TICKER_ITEMS).map(function(t,i){return <span key={i} className="ticker-item">{t} ◆ </span>;})}
        </div>
      </div>
      <nav className="app-nav">
        <a href="/" className="app-nav-logo">Ghost<em>Bust</em></a>
        <button onClick={function(){window.location.href="/profile.html";}} className="app-nav-btn">My Profile</button>
        <button onClick={function(){if(session){supabase.auth.signOut();}else{setShowAuth(true);}}} className="app-nav-btn">{session?"Sign Out":"Sign In"}</button>
      </nav>
      <div className="app">
        <header className="header">
          <div>
            <div className="logo-eyebrow">AI-powered job intelligence</div>
            <a href="/" style={{display:"inline-block",marginTop:8,marginBottom:4,fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"0.15em",color:"var(--paper)",background:"var(--blood)",padding:"6px 14px",textDecoration:"none",cursor:"pointer"}}>← BACK TO GHOSTBUST.US</a>
            <h1 className="logo-title">Ghost<em>Bust</em></h1>
            <p className="logo-sub">Find real jobs. Expose ghost listings. Track every application. The only job search tool built to fight back against a broken market.</p>
          </div>
          <div className="ghost-float">👻</div>
        </header>

        <nav className="tabs">
          <button className={"tab-btn"+(tab==="search"?" active":"")} onClick={function(){setTab("search");}}>
            🔍 Find Jobs
          </button>
          <button className={"tab-btn"+(tab==="verify"?" active":"")} onClick={function(){setTab("verify");}}>
            👻 Verify Listing
          </button>
          <button className={"tab-btn"+(tab==="tracker"?" active":"")} onClick={function(){setTab("tracker");}}>
            📋 Tracker
            {trackerCount>0&&<span className={"tab-badge"+(activeCount>0?" green":"")}>{activeCount>0?activeCount:trackerCount}</span>}
          </button>
          <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <UserSearch />
            <button className="tab-btn" onClick={function(){setShowTutorial(true);}} style={{fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:"0.12em",color:"var(--paper)",border:"1px solid var(--border-hi)",padding:"6px 14px",background:"rgba(255,255,255,0.05)",cursor:"pointer"}} title="How to use GhostBust">
              ? HELP
            </button>
          </span>
        </nav>

        {tab==="search"&&<SearchTab />}
        {tab==="verify"&&<VerifyTab addApp={storage.addApp} onSaved={function(){setTab("tracker");}} />}
        {tab==="tracker"&&<TrackerTab apps={storage.apps} loaded={storage.loaded} onUpdate={storage.updateApp} onDelete={storage.deleteApp} onClear={handleClearAll} addApp={storage.addApp} />}

        <footer className="footer">
          <span>GHOSTBUST · 2026</span>
          <span>POWERED BY CLAUDE AI</span>
          <span>CONTACT: <a href="https://mail.google.com/mail/?view=cm&to=ghostbustofficial@gmail.com&su=GhostBust%20Inquiry" target="_blank" rel="noreferrer" style={{color:"var(--paper)",textDecoration:"none"}}>ghostbustofficial@gmail.com</a></span>
        </footer>
      </div>
    </div>
  );
}

