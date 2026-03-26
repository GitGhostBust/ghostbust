import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase.js";
import UserSearch from "./UserSearch.jsx";
import RegionModal from "./RegionModal.jsx";
import ResumeAdvisor from "./ResumeAdvisor.jsx";
import SearchTab from "./SearchTab.jsx";
import VerifyTab from "./VerifyTab.jsx";
import TrackerTab from "./TrackerTab.jsx";
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
  body { background: var(--void); color: var(--paper); font-family: 'Libre Baskerville', Georgia, serif; min-height: 100vh; overflow-x: hidden; }
  @keyframes gbFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .app-root { width: 100vw; max-width: 100%; margin: 0; padding: 0; box-sizing: border-box; overflow-x: hidden; animation: gbFadeIn 0.6s ease both; }
  .app { width: 100%; max-width: 100%; margin: 0; padding: 0 24px 120px; box-sizing: border-box; }

  /* TICKER */
  .ticker-wrap { background: var(--blood); overflow: hidden; padding: 8px 0; line-height: 1.5; }
  .ticker-track { display: inline-flex; white-space: nowrap; animation: ticker 36s linear infinite; }
  @keyframes ticker { to { transform: translateX(-50%); } }
  .ticker-item { font-family: 'Space Mono', monospace; font-size: 10px; line-height: 1; letter-spacing: 0.18em; text-transform: uppercase; padding: 0 28px; }

  /* APP NAV */
  .app-nav { position: sticky; top: 0; z-index: 200; background: var(--void); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; padding: 0 24px; height: 56px; }
  .app-nav-logo { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 0.02em; color: var(--paper); text-decoration: none; flex-shrink: 0; }
  .app-nav-logo em { color: var(--blood); font-style: normal; }
  .app-nav-links { display: flex; gap: 4px; align-items: center; }
  .app-nav-btn { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: #72728a; cursor: pointer; text-decoration: none; transition: color 0.15s, border-color 0.15s; border-radius: 2px; white-space: nowrap; display: inline-block; }
  .app-nav-btn:hover { color: var(--paper); border-color: var(--border); }
  .app-nav-btn.active { color: var(--paper); border-color: var(--border-hi); }
  .app-nav-signout { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: #72728a; cursor: pointer; transition: color 0.15s; margin-left: auto; flex-shrink: 0; }
  .app-nav-signout:hover { color: #ff4422; }

  /* PAGE HERO */
  .page-hero { padding: 24px 0 20px; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 16px; }
  .page-hero-eyebrow { display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--blood); margin-bottom: 6px; }
  .page-hero-ghost { flex-shrink: 0; opacity: 0.7; }
  .page-hero-heading { font-family: 'Bebas Neue', sans-serif; font-size: clamp(28px, 5vw, 42px); line-height: 0.94; letter-spacing: 0.03em; color: var(--paper); }
  .page-hero-heading em { color: var(--blood); font-style: normal; }
  .page-hero-desc { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.03em; line-height: 1.6; margin-top: 10px; }
  .page-hero-back { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--muted); text-decoration: none; border: 1px solid var(--border); padding: 5px 10px; white-space: nowrap; transition: color 0.15s, border-color 0.15s; }
  .page-hero-back:hover { color: var(--paper); border-color: var(--border-hi); }

  /* TABS */
  .tabs { display: flex; margin-top: 40px; border-bottom: 1px solid var(--border); gap: 0; }
  .tab-btn { font-family: 'Bebas Neue', sans-serif; font-size: 17px; letter-spacing: 0.08em; color: var(--ghost); background: none; border: none; padding: 12px 24px 14px; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -1px; transition: color 0.2s, border-color 0.2s; display: flex; align-items: center; gap: 7px; white-space: nowrap; }
  .tab-btn:hover { color: var(--paper); }
  .tab-btn.active { color: var(--paper); border-bottom-color: var(--blood); }
  .tab-badge { background: var(--blood); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 1px 5px; border-radius: 2px; min-width: 18px; text-align: center; }
  .tab-badge.green { background: var(--signal); color: #050a07; }

  /* SHARED FORM */
  .panel { padding: 32px 0; }
  .form-box { background: var(--surface); border: 1px solid var(--border); padding: 28px; border-radius: 6px; }
  .form-box.green-top { border-top: 3px solid var(--blood); }
  .form-box.red-top { border-top: 3px solid var(--blood); }
  .form-box.ice-top { border-top: 3px solid var(--blood); }
  .form-label { font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 18px; display: block; }
  .form-label.green { color: var(--paper); }
  .form-label.red { color: var(--blood); }
  .form-label.ice { color: var(--muted); }
  .field-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; display: block; }
  .field-label.red { color: var(--blood); }
  .search-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
  .f-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 10px 14px; outline: none; width: 100%; transition: border-color 0.2s; border-radius: 8px; }
  .f-input:focus { border-color: var(--blood); }
  .f-input::placeholder { color: var(--ghost); font-family: 'Space Mono', monospace; font-size: 12px; }
  select.f-input { appearance: none; cursor: pointer; }
  select.f-input option { background: #13131a; color: var(--paper); }
  .tab-intro { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.03em; line-height: 1.6; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .tab-intro strong { color: var(--paper); font-weight: 400; }
  .search-streak { display: flex; align-items: center; gap: 10px; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--signal); letter-spacing: 0.06em; margin-bottom: 16px; }
  .search-streak-num { font-family: 'Bebas Neue', sans-serif; font-size: 22px; line-height: 1; }
  .saved-nudge { display: flex; align-items: center; justify-content: space-between; background: rgba(201,154,0,0.06); border: 1px solid rgba(201,154,0,0.12); border-radius: 4px; padding: 10px 14px; margin-bottom: 16px; cursor: pointer; transition: background 0.15s; }
  .saved-nudge:hover { background: rgba(201,154,0,0.1); }
  .saved-nudge-text { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--bile); letter-spacing: 0.04em; }
  .saved-nudge-arrow { font-family: 'Bebas Neue', sans-serif; font-size: 14px; color: var(--bile); }
  .paste-area { width: 100%; min-height: 160px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; line-height: 1.7; padding: 14px; resize: vertical; outline: none; transition: border-color 0.2s; }
  .paste-area:focus { border-color: var(--border-hi); }
  .paste-area::placeholder { color: var(--ghost); font-style: italic; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  .run-btn { width: 100%; margin-top: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 21px; letter-spacing: 0.08em; border: none; padding: 15px; cursor: pointer; transition: background 0.15s; border-radius: 8px; }
  .run-btn.green { background: var(--blood); color: var(--paper); }
  .run-btn.green:hover:not(:disabled) { background: #e52600; }
  .run-btn.red { background: var(--blood); color: var(--paper); }
  .run-btn.red:hover:not(:disabled) { background: #e52600; }
  .run-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .err-box { padding: 14px 18px; background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.3); font-family: 'Space Mono', monospace; font-size: 14px; color: var(--blood); margin-top: 18px; word-break: break-all; }

  /* LOADING */
  .loading-card { background: var(--surface); border: 1px solid var(--border); padding: 40px 32px; text-align: center; margin-top: 24px; }
  .spin { width: 42px; height: 42px; border: 2px solid var(--border); border-radius: 50%; animation: spin 0.75s linear infinite; margin: 0 auto 18px; }
  .spin.red { border-top-color: var(--blood); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .load-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 18px; }
  .load-step { font-family: 'Space Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.2); padding: 4px 0; transition: color 0.3s; }
  .load-step.active-r { color: var(--blood); }
  .load-step.done { color: rgba(255,255,255,0.15); text-decoration: line-through; }

  /* SEARCH BOARDS */
  .boards-section { margin-top: 32px; }
  .boards-header { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-end; }
  .boards-title { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; }
  .boards-sub { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ghost); letter-spacing: 0.1em; margin-top: 4px; }
  .board-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .board-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--ghost); padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: background 0.18s, box-shadow 0.18s; border-radius: 4px; }
  .board-card:hover { background: var(--surface2); box-shadow: 0 2px 12px rgba(0,0,0,0.2); }
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
  .board-desc { font-size: 12px; color: var(--muted); line-height: 1.6; flex: 1; }
  .board-link { display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--paper); text-decoration: none; background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 9px; transition: background 0.15s; }
  .board-link:hover { background: rgba(255,255,255,0.1); }
  .search-tips { margin-top: 24px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 18px; }
  .search-tips-title { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--paper); margin-bottom: 12px; }
  .tip-row { display: flex; gap: 10px; font-size: 13px; color: rgba(238,234,224,0.7); padding: 4px 0; line-height: 1.6; }
  .tip-n { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ghost); flex-shrink: 0; margin-top: 2px; }

  /* SEARCH — COMPACT ROW */
  .search-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .search-header-left { display: flex; align-items: center; gap: 10px; }
  .search-header-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.06em; color: var(--paper); }
  .search-header-ghost { opacity: 0.2; }
  .search-board-dots { display: flex; gap: 6px; align-items: center; }
  .search-board-dot { width: 6px; height: 6px; border-radius: 50%; }
  .search-row { display: flex; gap: 1px; border-radius: 6px; overflow: hidden; margin-bottom: 2px; }
  .search-row-cell { flex: 1; background: var(--surface); padding: 12px 16px; }
  .search-row-cell.primary { flex: 1.2; }
  .search-row-cell.narrow { flex: 0.6; }
  .search-row-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .search-row-label.accent { color: var(--blood); }
  .search-row-input { background: none; border: none; color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 0; outline: none; width: 100%; }
  .search-row-input::placeholder { color: var(--ghost); }
  .search-row-select { background: none; border: none; color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 0; outline: none; width: 100%; appearance: none; cursor: pointer; }
  .search-row-select option { background: var(--surface2); color: var(--paper); }
  .search-row-btn { background: var(--blood); border: none; color: var(--paper); padding: 0 24px; cursor: pointer; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.06em; white-space: nowrap; transition: background 0.15s; }
  .search-row-btn:hover:not(:disabled) { background: #e52600; }
  .search-row-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .search-filters { display: flex; gap: 10px; align-items: center; padding: 10px 0; flex-wrap: wrap; }
  .search-filters-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); }
  .search-filter-pill { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); background: rgba(255,255,255,0.04); border: 1px solid var(--border); padding: 0; border-radius: 3px; cursor: pointer; display: flex; align-items: center; overflow: hidden; }
  .search-filter-pill select { background: none; border: none; color: var(--muted); font-family: 'Space Mono', monospace; font-size: 12px; padding: 5px 12px; outline: none; appearance: none; cursor: pointer; }
  .search-filter-pill select option { background: var(--surface2); color: var(--paper); }
  .search-filter-pill:hover { border-color: var(--border-hi); }
  .search-save-link { margin-left: auto; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); cursor: pointer; border: none; background: none; border-bottom: 1px solid var(--border); transition: color 0.15s; padding: 0; }
  .search-save-link:hover:not(:disabled) { color: var(--paper); }
  .search-save-link:disabled { opacity: 0.4; cursor: not-allowed; }
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
  .search-form-actions { display: flex; gap: 10px; margin-top: 16px; }
  .search-form-actions .run-btn { flex: 1; margin-top: 0; border-radius: 4px; }
  .save-search-btn { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; background: none; border: 1px solid var(--border-hi); color: var(--paper); padding: 0 18px; cursor: pointer; white-space: nowrap; transition: background 0.15s, border-color 0.15s; border-radius: 4px; }
  .save-search-btn:hover:not(:disabled) { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.25); }
  .save-search-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  /* INNER TABS */
  .inner-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); background: var(--void); margin-bottom: 24px; }
  .inner-tab { padding: 10px 24px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.08em; color: var(--muted); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; }
  .inner-tab:hover { color: var(--paper); }
  .inner-tab.active { color: var(--blood); border-bottom-color: var(--blood); }
  .inner-tab .tab-count { background: var(--blood-dim); padding: 1px 7px; border-radius: 8px; font-size: 12px; margin-left: 6px; }

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

  .saved-searches-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
  .saved-searches-title { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); margin-bottom: 10px; }
  .saved-search-list { display: flex; flex-direction: column; gap: 6px; }
  .saved-search-item { display: flex; align-items: center; gap: 10px; background: var(--surface2); border: 1px solid var(--border); padding: 9px 12px; cursor: pointer; transition: background 0.15s; }
  .saved-search-item:hover { background: var(--surface3); }
  .saved-search-label { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--paper); flex: 1; }
  .saved-search-meta { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ghost); }
  .saved-search-del { background: none; border: none; color: var(--ghost); font-size: 13px; cursor: pointer; padding: 0 4px; transition: color 0.15s; flex-shrink: 0; }
  .saved-search-del:hover { color: var(--blood); }
  .ai-refine-btn { width: 100%; margin-top: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 19px; letter-spacing: 0.08em; border: 1px solid var(--border-hi); padding: 12px; cursor: pointer; background: none; color: var(--muted); transition: background 0.15s, color 0.15s; }
  .ai-refine-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--paper); }
  .ai-refine-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .ai-refine-section { margin-top: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-hi); border-top: 3px solid var(--border-hi); padding: 20px 22px; }
  .ai-refine-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 16px; }
  .ai-refine-group { margin-bottom: 18px; }
  .ai-refine-group:last-child { margin-bottom: 0; }
  .ai-refine-group-label { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); margin-bottom: 10px; }
  .ai-refine-pill-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .ai-refine-pill { font-family: 'Space Mono', monospace; font-size: 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-hi); color: var(--muted); padding: 6px 13px; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .ai-refine-pill:hover { background: rgba(255,255,255,0.09); color: var(--paper); }
  .ai-refine-row { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12px; color: rgba(238,234,224,0.65); line-height: 1.55; }
  .ai-refine-row:last-child { border-bottom: none; }
  .ai-refine-key { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--paper); flex-shrink: 0; min-width: 94px; }
  .board-card-actions { display: flex; flex-direction: column; gap: 6px; }
  .track-role-btn { display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); background: none; border: 1px solid var(--border-hi); padding: 8px; cursor: pointer; transition: background 0.15s, color 0.15s; width: 100%; }
  .track-role-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--paper); }
  .track-role-btn.saved { color: var(--ghost); background: rgba(255,255,255,0.03); border-color: var(--border); cursor: default; }

  /* VERDICT */
  .verdict-card { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--blood); padding: 26px; margin-top: 24px; position: relative; overflow: hidden; }
  .verdict-card::after { content: ''; position: absolute; right: -10px; top: -10px; width: 180px; height: 180px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z' fill='%23f0ece0'/%3E%3Ccircle cx='13' cy='14' r='2' fill='%23d42200'/%3E%3Ccircle cx='19' cy='14' r='2' fill='%23d42200'/%3E%3C/svg%3E") no-repeat center/contain; opacity: 0.035; pointer-events: none; transform: rotate(8deg); }
  .verdict-card.legit { border-top-color: var(--signal); }
  .verdict-card.suspicious { border-top-color: var(--bile); }
  .v-headline { font-family: 'Bebas Neue', sans-serif; font-size: 30px; letter-spacing: 0.04em; margin-bottom: 18px; }
  .vh-ghost { color: var(--blood); }
  .vh-legit { color: var(--signal); }
  .vh-suspicious { color: var(--bile); }
  .score-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
  .score-box { background: var(--surface2); border: 1px solid var(--border); padding: 12px 8px; text-align: center; }
  .score-num { font-family: 'Bebas Neue', sans-serif; font-size: 32px; line-height: 1; }
  .score-lbl { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); margin-top: 3px; }
  .sc-red { color: var(--blood); } .sc-yellow { color: var(--bile); } .sc-green { color: var(--signal); }
  .conf-bar-wrap { margin-bottom: 16px; }
  .conf-bar-label { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--ghost); display: flex; justify-content: space-between; margin-bottom: 5px; }
  .conf-bar-track { height: 3px; background: rgba(255,255,255,0.07); }
  .conf-bar-fill { height: 3px; transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
  .fill-ghost { background: var(--blood); } .fill-legit { background: var(--signal); } .fill-suspicious { background: var(--bile); }
  .v-summary { font-size: 14px; line-height: 1.75; color: rgba(238,234,224,0.8); margin-bottom: 18px; }
  .flags-list { list-style: none; }
  .flag-row { display: flex; gap: 10px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; line-height: 1.5; color: rgba(238,234,224,0.7); }
  .sev-pill { font-family: 'Space Mono', monospace; font-size: 12px; padding: 3px 9px; flex-shrink: 0; margin-top: 2px; }
  .sev-high { background: var(--blood-dim); color: var(--blood); }
  .sev-med { background: var(--bile-dim); color: var(--bile); }
  .sev-low { background: rgba(255,255,255,0.05); color: var(--ghost); }
  .action-tips { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 16px; margin-top: 18px; }
  .action-tips-title { font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--paper); margin-bottom: 10px; }

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

  /* SKELETON LOADING */
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  .skeleton-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--surface2); margin-bottom: 10px; padding: 16px 18px; }
  .skeleton-line { background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: 2px; }
  .skeleton-line.title { height: 14px; width: 55%; margin-bottom: 10px; }
  .skeleton-line.company { height: 10px; width: 35%; margin-bottom: 12px; }
  .skeleton-line.chips { height: 10px; width: 75%; }

  /* SAVE TO TRACKER */
  .save-bar { margin-top: 20px; background: var(--surface2); border: 1px solid var(--border-hi); padding: 18px; display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .save-bar-title { font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; width: 100%; }
  .save-bar .f-input { flex: 1; min-width: 160px; }
  .save-btn { background: var(--blood); color: var(--paper); font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 11px 22px; cursor: pointer; white-space: nowrap; transition: background 0.15s; flex-shrink: 0; }
  .save-btn:hover { background: #e52600; }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .save-success { font-family: 'Space Mono', monospace; font-size: 14px; color: var(--paper); padding: 10px 0; width: 100%; }

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
  .delete-btn { background: none; border: 1px solid var(--border); color: var(--ghost); font-size: 12px; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.15s, border-color 0.15s; }
  .delete-btn:hover { color: var(--blood); border-color: var(--blood); }

  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 0.04em; color: var(--ghost); margin-bottom: 8px; }
  .empty-sub { font-size: 13px; color: var(--ghost); line-height: 1.6; max-width: 340px; margin: 0 auto; }

  .notes-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 6px 10px; outline: none; margin-top: 6px; transition: border-color 0.2s; }
  .notes-input:focus { border-color: var(--border-hi); }
  .notes-input::placeholder { color: var(--ghost); }

  .footer { margin-top: 80px; padding: 20px 0 8px; border-top: 1px solid var(--border); font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.38); display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; }
  .footer a { color: inherit; text-decoration: none; transition: color 150ms; }
  .footer a:hover { color: rgba(255,255,255,0.75); }
  .footer-sep { opacity: 0.3; }
  .share-row { display: flex; justify-content: center; margin-top: 32px; margin-bottom: -48px; }
  .share-btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(212,34,0,0.12), rgba(212,34,0,0.04)); border: 1px solid rgba(212,34,0,0.35); color: var(--blood); font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; padding: 10px 22px; cursor: pointer; transition: all 200ms; border-radius: 6px; }
  .share-btn:hover { background: linear-gradient(135deg, rgba(212,34,0,0.22), rgba(212,34,0,0.1)); border-color: var(--blood); color: var(--paper); }
  .share-btn svg { width: 14px; height: 14px; }
  .share-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--surface); border: 1px solid var(--signal); color: var(--signal); font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 20px; border-radius: 6px; z-index: 9999; animation: toastIn 300ms ease; }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  /* MANUAL ADD */
  .add-form { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 22px; margin-bottom: 28px; }
  .add-form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .add-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .add-submit { background: var(--blood); color: var(--paper); font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 11px 22px; cursor: pointer; transition: background 0.15s; width: 100%; margin-top: 6px; }
  .add-submit:hover:not(:disabled) { background: #e52600; }
  .add-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .toggle-add-btn { background: none; border: 1px solid var(--border-hi); color: var(--muted); font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .toggle-add-btn:hover { background: rgba(255,255,255,0.05); color: var(--paper); }

  /* EDIT MODE ON CARD */
  .edit-inline { display: flex; gap: 6px; margin-bottom: 4px; align-items: center; }
  .edit-inline input { background: rgba(255,255,255,0.06); border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 4px 8px; outline: none; flex: 1; }
  .edit-save-btn { background: var(--blood); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 4px 10px; border: none; cursor: pointer; flex-shrink: 0; }

  /* FOLLOW-UP DATE */
  .followup-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .followup-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .followup-date { background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 3px 8px; outline: none; cursor: pointer; }
  .followup-date:focus { border-color: var(--border-hi); }
  .followup-due { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--bile); }
  .followup-overdue { color: var(--blood); }

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
  .share-row { display: flex; gap: 10px; margin-top: 18px; }
  .share-btn { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 16px; border: 1px solid var(--border-hi); color: var(--paper); background: none; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .share-btn:hover { background: rgba(255,255,255,0.06); }
  .share-btn.copied { border-color: var(--signal); color: var(--signal); }
  .share-btn.downloading { opacity: 0.6; cursor: default; }
  .copy-btn.copied { color: var(--paper); border-color: var(--border-hi); }
  .report-close { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: rgba(238,234,224,0.6); width: 28px; height: 28px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.15s; }
  .report-close:hover { color: var(--paper); }

  @media (max-width: 720px) {
    .board-grid { grid-template-columns: 1fr; }
    .tracker-stats { grid-template-columns: repeat(3, 1fr); }
    .search-grid, .two-col { grid-template-columns: 1fr; }
    .search-row { flex-direction: column; border-radius: 6px; }
    .search-row-btn { padding: 14px; }
    .search-filters { gap: 8px; }
    .scan-context-row { flex-direction: column; }
    .scan-context-cell:first-child { border-radius: 0; }
    .scan-context-cell:last-child { border-radius: 0 0 6px 6px; }
    .scan-detect-btn { width: 100%; margin-left: 0; }
    .score-row { grid-template-columns: 1fr 1fr; }
    .page-hero { grid-template-columns: 1fr; }
    .app-card { grid-template-columns: 1fr; }
    .app-controls { flex-direction: row; align-items: center; }
    .tab-btn { font-size: 14px; padding: 10px 14px 12px; }
    .panel { padding: 24px 0; }
    .form-box { padding: 18px; }
  }
  @media (max-width: 480px) {
    .board-grid, .tracker-stats { grid-template-columns: 1fr 1fr; }
    .tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .app { padding: 0 16px 100px; }
    .app-nav { padding: 0 16px; gap: 8px; }
    .app-nav-links { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .app-nav-links::-webkit-scrollbar { display: none; }
    .app-nav-btn { font-size: 10px; padding: 6px 8px; }
    .tab-btn { font-size: 13px; padding: 10px 12px; }
    .score-row { grid-template-columns: 1fr 1fr; }
    .tracker-stats { grid-template-columns: repeat(3,1fr); }
    .stat-num { font-size: 22px; }
    .verdict-title { font-size: 24px; }
    .page-hero { gap: 10px; }
    .score-hero-num { font-size: 72px; }
    .verdict-card { padding: 20px 16px; }
    .v-headline { font-size: 22px; }
    .sub-score-row { gap: 12px; }
    .sub-score-num { font-size: 22px; }
  }

  /* SCROLL REVEAL */
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* FOLLOW-UP REMINDERS */
  .followup-banner { background: linear-gradient(135deg, rgba(201,154,0,0.12), rgba(201,154,0,0.04)); border: 1px solid rgba(201,154,0,0.35); border-radius: 8px; padding: 12px 18px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; font-family: 'Space Mono', monospace; }
  .followup-banner-icon { color: var(--bile); font-size: 18px; flex-shrink: 0; }
  .followup-banner-text { font-size: 12px; color: var(--paper); letter-spacing: 0.04em; }
  .followup-banner-text strong { color: var(--bile); }
  .followup-banner-overdue { border-color: rgba(212,34,0,0.35); background: linear-gradient(135deg, rgba(212,34,0,0.12), rgba(212,34,0,0.04)); }
  .followup-banner-overdue .followup-banner-icon { color: var(--blood); }
  .followup-banner-overdue strong { color: var(--blood); }
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



const STORAGE_KEY = "ghostbust-applications";

/* ================================================================
   STORAGE HOOKS
================================================================ */

// The exact 15 columns that exist in the applications table
var APP_SELECT = "id, user_id, company, title, job_board, url, status, ghost_score, signal_flags, notes, applied_date, outcome, created_at, updated_at, followup_date";

// Map a Supabase row → UI app object (camelCase shape the rest of the UI expects)
function appFromDb(row) {
  return {
    id:          row.id,
    title:       row.title || "",
    company:     row.company || "",
    ghostScore:  row.ghost_score || 0,
    verdict:     row.outcome || "UNKNOWN",
    signalFlags: row.signal_flags || [],
    status:      row.status || "Researching",
    notes:       row.notes || "",
    url:         row.url || "",
    sourceBoard: row.job_board || "",
    appliedDate: row.applied_date || "",
    followupDate:row.followup_date || "",
    savedAt:     row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

// Map a UI app object → Supabase insert/update payload (snake_case)
function appToDb(app, userId) {
  var row = {
    title:        app.title || "",
    company:      app.company || "",
    ghost_score:  app.ghostScore || 0,
    outcome:      app.verdict || "UNKNOWN",
    signal_flags: app.signalFlags || [],
    status:       app.status || "Researching",
    notes:        app.notes || "",
    url:          app.url || "",
    job_board:    app.sourceBoard || "",
    applied_date: app.appliedDate || null,
    followup_date:app.followupDate || null,
  };
  if (userId) row.user_id = userId;
  return row;
}

// Map only the changed fields to DB column names for updates
function changestoDb(changes) {
  var db = {};
  if (changes.title       !== undefined) db.title        = changes.title;
  if (changes.company     !== undefined) db.company      = changes.company;
  if (changes.ghostScore  !== undefined) db.ghost_score  = changes.ghostScore;
  if (changes.verdict     !== undefined) db.outcome      = changes.verdict;
  if (changes.signalFlags !== undefined) db.signal_flags = changes.signalFlags;
  if (changes.status      !== undefined) db.status       = changes.status;
  if (changes.notes       !== undefined) db.notes        = changes.notes;
  if (changes.url         !== undefined) db.url          = changes.url;
  if (changes.sourceBoard !== undefined) db.job_board    = changes.sourceBoard;
  if (changes.appliedDate !== undefined) db.applied_date = changes.appliedDate || null;
  if (changes.followupDate!== undefined) db.followup_date= changes.followupDate || null;
  if (Object.keys(db).length > 0) db.updated_at = new Date().toISOString();
  return db;
}

function useApplications(session) {
  var [apps, setApps] = useState([]);
  var [loaded, setLoaded] = useState(false);
  var userId = session ? session.user.id : null;

  useEffect(function() {
    if (!userId) {
      // Not signed in — fall back to localStorage
      try {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) { try { setApps(JSON.parse(stored)); } catch(e) { setApps([]); } }
      } catch(e) {}
      setLoaded(true);
      return;
    }

    // Load existing rows from Supabase — explicit columns avoid schema-cache 400s
    supabase.from("applications")
      .select(APP_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(function(res) {
        if (res.error) {
          console.error("[applications] load failed — message:", res.error.message, "| code:", res.error.code, "| details:", res.error.details, "| hint:", res.error.hint);
          setLoaded(true);
          return;
        }
        var dbApps = (res.data || []).map(appFromDb);

        // One-time localStorage migration
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            var local = JSON.parse(raw);
            if (Array.isArray(local) && local.length > 0) {
              var rows = local.map(function(a) { return appToDb(a, userId); });
              supabase.from("applications").insert(rows).select(APP_SELECT)
                .then(function(ins) {
                  if (ins.error) {
                    console.error("[applications] migration failed — message:", ins.error.message, "| code:", ins.error.code, "| details:", ins.error.details);
                    setApps(dbApps);
                  } else {
                    var migrated = (ins.data || []).map(appFromDb);
                    setApps(migrated.concat(dbApps));
                    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
                  }
                  setLoaded(true);
                });
              return;
            }
            try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
          }
        } catch(e) {}

        setApps(dbApps);
        setLoaded(true);
      });
  }, [userId]);

  var addApp = useCallback(function(app) {
    if (!userId) {
      setApps(function(prev) {
        var next = [app].concat(prev);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
        return next;
      });
      return;
    }
    var row = appToDb(app, userId);
    console.log("[applications] inserting row:", row);
    supabase.from("applications").insert(row).select(APP_SELECT).single()
      .then(function(res) {
        if (res.error) {
          console.error("[applications] insert failed — message:", res.error.message, "| code:", res.error.code, "| details:", res.error.details, "| hint:", res.error.hint);
          return;
        }
        console.log("[applications] insert ok, id:", res.data.id);
        setApps(function(prev) { return [appFromDb(res.data)].concat(prev); });
      });
  }, [userId]);

  var updateApp = useCallback(function(id, changes) {
    // Optimistic update
    setApps(function(prev) {
      return prev.map(function(a) { return a.id === id ? Object.assign({}, a, changes) : a; });
    });
    if (!userId) return;
    var db = changestoDb(changes);
    if (Object.keys(db).length > 0) {
      supabase.from("applications").update(db).eq("id", id).eq("user_id", userId)
        .then(function(res) {
          if (res.error) console.error("[applications] update failed — message:", res.error.message, "| code:", res.error.code, "| details:", res.error.details);
        });
    }
  }, [userId]);

  var deleteApp = useCallback(function(id) {
    setApps(function(prev) { return prev.filter(function(a) { return a.id !== id; }); });
    if (!userId) return;
    supabase.from("applications").delete().eq("id", id).eq("user_id", userId)
      .then(function(res) {
        if (res.error) console.error("[applications] delete failed — message:", res.error.message, "| code:", res.error.code, "| details:", res.error.details);
      });
  }, [userId]);

  var save = useCallback(function(newApps) {
    // Only called by handleClearAll (newApps === [])
    setApps(newApps);
    if (!userId) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newApps)); } catch(e) {}
      return;
    }
    if (newApps.length === 0) {
      supabase.from("applications").delete().eq("user_id", userId)
        .then(function(res) {
          if (res.error) console.error("[applications] clear failed — message:", res.error.message, "| code:", res.error.code, "| details:", res.error.details);
        });
    }
  }, [userId]);

  return { apps: apps, loaded: loaded, addApp: addApp, updateApp: updateApp, deleteApp: deleteApp, save: save };
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
  var [showProfileModal, setShowProfileModal] = useState(false);
  var [toast, setToast] = useState(null);
  var [showRegionModal, setShowRegionModal] = useState(false);
  var [userRegion, setUserRegion] = useState(null);
  useEffect(function(){
    supabase.auth.getSession().then(function(d){ setSession(d.data.session); });
    var sub = supabase.auth.onAuthStateChange(function(event,s){ setSession(s); if(event==="PASSWORD_RECOVERY"){setResetMode(true);return;} if(event==="SIGNED_IN"&&!resetMode){setToast("Signed in as "+s.user.email);setTimeout(function(){setToast(null);},4000);} if(event==="SIGNED_OUT"){setToast("Signed out");setTimeout(function(){setToast(null);},2000);} });
    return function(){ sub.data.subscription.unsubscribe(); };
  },[]);
  var [profileCompletePct, setProfileCompletePct] = useState(100);
  var [profileNudgeDismissed, setProfileNudgeDismissed] = useState(function(){ try { return !!sessionStorage.getItem("gb_profile_nudge_off"); } catch(e) { return false; } });
  var [shareToast, setShareToast] = useState(false);
  useEffect(function(){
    if (!session) return;
    try { if (sessionStorage.getItem("gb_region_skipped")) return; } catch(e) {}
    supabase.from("profiles").select("region_set,job_market_region,bio,industry,employment_status,experience_years,seniority_level,work_arrangement,target_roles,career_goal,skills").eq("id", session.user.id).single()
      .then(function(res){
        if (res.data) {
          if (!res.data.region_set) setShowRegionModal(true);
          if (res.data.job_market_region) setUserRegion(res.data.job_market_region);
          var fields = ["bio","industry","employment_status","experience_years","seniority_level","work_arrangement","target_roles","career_goal","skills","job_market_region"];
          var filled = fields.filter(function(k){ return res.data[k] && String(res.data[k]).trim(); }).length;
          setProfileCompletePct(Math.round((filled / fields.length) * 100));
        }
      });
  },[session]);
  var [tab,setTab] = useState("verify");
  var [prefill,setPrefill] = useState(null);
  var storage = useApplications(session);

  // Handle one-click status updates from nudge emails (?tab=tracker&appId=xxx&markAs=Ghosted).
  useEffect(function() {
    if (!session || !storage.loaded) return;
    var params = new URLSearchParams(window.location.search);
    var appId  = params.get("appId");
    var markAs = params.get("markAs");
    var tabParam = params.get("tab");
    if (tabParam) setTab(tabParam);
    if (appId && markAs && ["Ghosted","Rejected","Applied","Interviewing"].includes(markAs)) {
      storage.updateApp(appId, { status: markAs, updatedAt: Date.now() });
      setToast("Marked as " + markAs);
      setTimeout(function() { setToast(null); }, 3000);
    }
    if (tabParam || appId) {
      // Clean up URL params without triggering a reload.
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [session, storage.loaded]);
  var [showTutorial, setShowTutorial] = useState(function() {
    try { return !localStorage.getItem("gb_tutorial_done"); } catch(e) { return true; }
  });

  // Scroll reveal — panel fades in on each tab switch
  useEffect(function() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.panel, .ra-panel').forEach(function(el) { el.classList.add('reveal'); observer.observe(el); });
    return function() { observer.disconnect(); };
  }, [tab]);

  useEffect(function() {
    try { localStorage.setItem("gb_visited", "1"); } catch(e) {}
  }, []);

  function closeTutorial() {
    try { localStorage.setItem("gb_tutorial_done", "1"); } catch(e) {}
    setShowTutorial(false);
  }

  function handleClearAll() {
    if (window.confirm("Delete all applications? This cannot be undone.")) {
      storage.save([]);
    }
  }

  function handleShare() {
    var url = "https://ghostbust.us";
    var text = "GhostBust — detect ghost job listings before you waste your time applying. Built for a broken market.";
    if (navigator.share) {
      navigator.share({ title: "GhostBust", text: text, url: url }).catch(function(){});
    } else {
      try { navigator.clipboard.writeText(url); } catch(e) { window.prompt("Copy this link:", url); }
      setShareToast(true);
      setTimeout(function(){ setShareToast(false); }, 2500);
    }
  }

  var trackerCount = storage.apps.length;
  var activeCount = storage.apps.filter(function(a){return a.status==="Researching"||a.status==="Applied"||a.status==="Interviewing";}).length;

  return (
    <div className="app-root">
      <style>{STYLE}</style>
          {resetMode&&(<div style={{position:"fixed",inset:0,background:"rgba(7,7,9,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}><div style={{background:"linear-gradient(165deg, rgba(30,30,40,0.95), rgba(22,22,30,0.9))",border:"1px solid var(--border)",borderTop:"4px solid var(--blood)",maxWidth:420,width:"100%",padding:36,borderRadius:16,boxShadow:"0 24px 80px rgba(0,0,0,0.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>{resetDone?(<div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>✓</div><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:24,marginBottom:8}}>Password Updated</div><p style={{fontSize:13,color:"var(--muted)"}}>Your password has been changed. You are now signed in.</p><button className="run-btn red" style={{marginTop:16}} onClick={function(){setResetMode(false);setResetDone(false);}}>Continue</button></div>):(<div><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:28,marginBottom:4}}>GhostBust</div><div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--blood)",letterSpacing:"0.2em",marginBottom:24}}>SET NEW PASSWORD</div><input className="f-input" style={{marginBottom:10,width:"100%"}} type="password" placeholder="New password (min 6 characters)" value={newPassword} onChange={function(e){setNewPassword(e.target.value);}}/>{resetError&&<div style={{color:"var(--blood)",fontSize:12,marginBottom:8}}>{resetError}</div>}<button className="run-btn red" onClick={async function(){if(newPassword.length<6){setResetError("Password must be at least 6 characters.");return;}setResetError(null);var res=await supabase.auth.updateUser({password:newPassword});if(res.error){setResetError(res.error.message);return;}setResetDone(true);}} disabled={!newPassword}>SET PASSWORD</button></div>)}</div></div>)}
  {toast&&(<div style={{position:"fixed",bottom:24,right:24,zIndex:99999,background:"var(--surface)",border:"1px solid var(--signal)",borderLeft:"4px solid var(--signal)",padding:"14px 40px 14px 18px",maxWidth:340}}><div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--signal)",letterSpacing:"0.2em",marginBottom:4}}>GHOSTBUST</div><div style={{fontSize:13,color:"var(--paper)"}}>{toast}</div><button onClick={function(){setToast(null);}} style={{position:"absolute",top:8,right:10,background:"none",border:"none",color:"var(--ghost)",cursor:"pointer",fontSize:14}}>✕</button></div>)}
{showAuth&&(<div style={{position:"fixed",inset:0,background:"rgba(7,7,9,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}><div style={{background:"linear-gradient(165deg, rgba(30,30,40,0.95), rgba(22,22,30,0.9))",border:"1px solid var(--border)",borderTop:"4px solid var(--blood)",maxWidth:420,width:"100%",padding:36,position:"relative",borderRadius:16,boxShadow:"0 24px 80px rgba(0,0,0,0.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}><button onClick={function(){setShowAuth(false);}} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"var(--ghost)",fontSize:18,cursor:"pointer"}}>X</button><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:28,marginBottom:4}}>GhostBust</div><div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--blood)",letterSpacing:"0.2em",marginBottom:24}}>FREE ACCOUNT</div><AuthForm supabase={supabase} onClose={function(){setShowAuth(false);}} /></div></div>)}
      {showTutorial && <TutorialOverlay onClose={closeTutorial} onTabSwitch={setTab} />}
      {showRegionModal && session && <RegionModal userId={session.user.id} onClose={function(){setShowRegionModal(false);}} />}
      {showProfileModal && <div onClick={function(e){if(e.target===e.currentTarget)setShowProfileModal(false);}} style={{position:"fixed",inset:0,zIndex:9500,background:"rgba(7,7,9,0.92)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
        <div style={{background:"linear-gradient(165deg, rgba(30,30,40,0.95), rgba(22,22,30,0.9))",border:"1px solid rgba(255,255,255,0.07)",borderTop:"4px solid #d42200",maxWidth:420,width:"calc(100% - 48px)",padding:"36px",position:"relative",borderRadius:16,boxShadow:"0 24px 80px rgba(0,0,0,0.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
          <button onClick={function(){setShowProfileModal(false);}} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"#4a4a60",fontSize:18,cursor:"pointer",lineHeight:1}}>✕</button>
          <AuthForm supabase={supabase} onClose={function(){ setShowProfileModal(false); window.location.href="/profile.html"; }} />
        </div>
      </div>}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {TICKER_ITEMS.concat(TICKER_ITEMS).map(function(t,i){return <span key={i} className="ticker-item">{t} ◆ </span>;})}
        </div>
      </div>
      <nav className="app-nav">
        <a href="/" className="app-nav-logo">Ghost<em>Bust</em></a>
        <div className="app-nav-links">
          <a href="/" className="app-nav-btn">Home</a>
          <span className="app-nav-btn active">App</span>
          <a href="/community.html" className="app-nav-btn">Community</a>
          <a href="/profile.html" className="app-nav-btn" onClick={function(e){if(!session){e.preventDefault();setShowProfileModal(true);}}}> Profile</a>
        </div>
        <UserSearch />
        <button className="app-nav-signout" onClick={function(){if(session){supabase.auth.signOut();}else{setShowAuth(true);}}}>{session?"Sign Out":"Sign In"}</button>
      </nav>
      <div className="app">
        <div className="page-hero">
          <div>
            <div className="page-hero-eyebrow">
              <svg className="page-hero-ghost" width="28" height="28" viewBox="0 0 32 32"><path d="M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z" fill="#eeeae0" opacity="0.9"/><circle cx="13" cy="14" r="2" fill="#d42200"/><circle cx="19" cy="14" r="2" fill="#d42200"/></svg>
              GHOSTBUST APP
            </div>
            <h1 className="page-hero-heading">Built For A <em>Broken Market.</em></h1>
            <p className="page-hero-desc">AI-powered ghost detection, job tracking, and career intelligence. One platform.</p>
          </div>
          <a href="/" className="page-hero-back">← GHOSTBUST.US</a>
        </div>

        <nav className="tabs">
          <button className={"tab-btn"+(tab==="verify"?" active":"")} onClick={function(){setPrefill(null);setTab("verify");}}>
            Ghost Detector
          </button>
          <button className={"tab-btn"+(tab==="search"?" active":"")} onClick={function(){setPrefill(null);setTab("search");}}>
            Find Jobs
          </button>
          <button className={"tab-btn"+(tab==="tracker"?" active":"")} onClick={function(){setPrefill(null);setTab("tracker");}}>
            Application Tracker
            {trackerCount>0&&<span className={"tab-badge"+(activeCount>0?" green":"")}>{activeCount>0?activeCount:trackerCount}</span>}
          </button>
          <button className={"tab-btn"+(tab==="resume"?" active":"")} onClick={function(){setPrefill(null);setTab("resume");}}>
            Career HQ
          </button>
          <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <UserSearch />
            <button className="tab-btn" onClick={function(){setShowTutorial(true);}} style={{fontFamily:"'Space Mono',monospace",fontSize:12,letterSpacing:"0.12em",color:"var(--paper)",border:"1px solid var(--border-hi)",padding:"6px 14px",background:"rgba(255,255,255,0.05)",cursor:"pointer"}} title="How to use GhostBust">
              ? HELP
            </button>
          </span>
        </nav>

        <div style={{maxWidth:1280,margin:"0 auto",width:"100%"}}>
          {session && profileCompletePct < 60 && !profileNudgeDismissed && (
            <div style={{background:"rgba(201,154,0,0.06)",border:"1px solid rgba(201,154,0,0.15)",borderLeft:"3px solid var(--bile)",padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"var(--bile)",lineHeight:1,flexShrink:0}}>{profileCompletePct}%</div>
                <div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--bile)",letterSpacing:"0.06em"}}>Career Profile Incomplete</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"var(--muted)",marginTop:2}}>AI advice improves with more context about your background and goals.</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <a href="/profile.html" style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--bile)",textDecoration:"none",border:"1px solid var(--bile)",padding:"6px 14px",whiteSpace:"nowrap"}}>Complete Profile</a>
                <button onClick={function(){setProfileNudgeDismissed(true);try{sessionStorage.setItem("gb_profile_nudge_off","1");}catch(e){}}} style={{background:"none",border:"none",color:"var(--ghost)",fontSize:14,cursor:"pointer",padding:"0 4px"}} title="Dismiss">&times;</button>
              </div>
            </div>
          )}
          {tab==="verify"&&<VerifyTab addApp={storage.addApp} onSaved={function(){setTab("tracker");}} session={session} prefill={tab==="verify"?prefill:null} />}
          {tab==="search"&&<SearchTab session={session} addApp={storage.addApp} />}
          {tab==="tracker"&&<TrackerTab apps={storage.apps} loaded={storage.loaded} onUpdate={storage.updateApp} onDelete={storage.deleteApp} onClear={handleClearAll} addApp={storage.addApp} onNavigate={function(t,pf){setPrefill(pf);setTab(t);}} />}
          {tab==="resume"&&<><div className="tab-intro">Upload your resume. Get <strong>AI-powered analysis, coaching, and career strategy.</strong></div><ResumeAdvisor session={session} onRequestSignIn={function(){setShowAuth(true);}} prefill={tab==="resume"?prefill:null} /></>}
        </div>
        <div className="share-row">
          <button className="share-btn" onClick={handleShare}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share GhostBust
          </button>
        </div>
        {shareToast && <div className="share-toast">Link copied</div>}
        <footer className="footer">
          <span>GhostBust</span>
          <span className="footer-sep">·</span>
          <a href="/tos.html">TOS</a>
          <span className="footer-sep">·</span>
          <a href="/privacy.html">Privacy</a>
          <span className="footer-sep">·</span>
          <a href="/roadmap.html">Roadmap</a>
          <span className="footer-sep">·</span>
          <a href="https://mail.google.com/mail/?view=cm&to=ghostbustofficial@gmail.com&su=GhostBust%20Inquiry" target="_blank" rel="noreferrer">ghostbustofficial@gmail.com</a>
        </footer>
      </div>
    </div>
  );
}

