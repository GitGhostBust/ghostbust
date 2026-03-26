import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase.js";
import UserSearch from "./UserSearch.jsx";
import RegionModal from "./RegionModal.jsx";
import ResumeAdvisor from "./ResumeAdvisor.jsx";
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
  .app-nav-btn { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: #72728a; cursor: pointer; text-decoration: none; transition: color 0.15s, border-color 0.15s; border-radius: 2px; white-space: nowrap; display: inline-block; }
  .app-nav-btn:hover { color: var(--paper); border-color: var(--border); }
  .app-nav-btn.active { color: var(--paper); border-color: var(--border-hi); }
  .app-nav-signout { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: #72728a; cursor: pointer; transition: color 0.15s; margin-left: auto; flex-shrink: 0; }
  .app-nav-signout:hover { color: #ff4422; }

  /* HEADER */
  .header { padding: 40px 0 36px; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 16px; }
  .logo-eyebrow { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--blood); margin-bottom: 6px; }
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
  .tab-badge { background: var(--blood); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 10px; padding: 1px 5px; border-radius: 2px; min-width: 18px; text-align: center; }
  .tab-badge.green { background: var(--signal); color: #050a07; }

  /* SHARED FORM */
  .panel { padding: 32px 0; }
  .form-box { background: var(--surface); border: 1px solid var(--border); padding: 26px; }
  .form-box.green-top { border-top: 3px solid var(--blood); }
  .form-box.red-top { border-top: 3px solid var(--blood); }
  .form-box.ice-top { border-top: 3px solid var(--blood); }
  .form-label { font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 18px; display: block; }
  .form-label.green { color: var(--paper); }
  .form-label.red { color: var(--blood); }
  .form-label.ice { color: var(--muted); }
  .field-label { font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--paper); margin-bottom: 8px; display: block; }
  .field-label.red { color: var(--blood); }
  .search-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }  .f-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 11px 14px; outline: none; width: 100%; transition: border-color 0.2s; }
  .f-input:focus { border-color: var(--border-hi); }
  .f-input::placeholder { color: rgba(255,255,255,0.4); font-family: 'Space Mono', monospace; font-size: 12px; }
  select.f-input { appearance: none; cursor: pointer; }
  select.f-input option { background: #13131a; color: var(--paper); }
  .paste-area { width: 100%; min-height: 160px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; line-height: 1.7; padding: 14px; resize: vertical; outline: none; transition: border-color 0.2s; }
  .paste-area:focus { border-color: var(--border-hi); }
  .paste-area::placeholder { color: var(--ghost); font-style: italic; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  .run-btn { width: 100%; margin-top: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 21px; letter-spacing: 0.08em; border: none; padding: 15px; cursor: pointer; transition: background 0.15s; }
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
  .boards-header { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-end; }
  .boards-title { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; }
  .boards-sub { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ghost); letter-spacing: 0.08em; margin-top: 4px; }
  .board-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
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
  .board-link { display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--paper); text-decoration: none; background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 9px; transition: background 0.15s; }
  .board-link:hover { background: rgba(255,255,255,0.1); }
  .search-tips { margin-top: 24px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 18px; }
  .search-tips-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--paper); margin-bottom: 12px; }
  .tip-row { display: flex; gap: 10px; font-size: 13px; color: rgba(238,234,224,0.7); padding: 4px 0; line-height: 1.6; }
  .tip-n { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ghost); flex-shrink: 0; margin-top: 2px; }

  /* SEARCH — ENHANCED */
  .search-nudge { background: rgba(255,255,255,0.03); border: 1px solid var(--border-hi); border-left: 3px solid var(--border-hi); padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
  .search-nudge-icon { font-size: 16px; flex-shrink: 0; color: var(--muted); }
  .search-nudge-text { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); line-height: 1.5; }
  .search-form-actions { display: flex; gap: 8px; margin-top: 12px; }
  .search-form-actions .run-btn { flex: 1; margin-top: 0; }
  .save-search-btn { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; background: none; border: 1px solid var(--border-hi); color: var(--paper); padding: 0 18px; cursor: pointer; white-space: nowrap; transition: background 0.15s, border-color 0.15s; }
  .save-search-btn:hover:not(:disabled) { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.25); }
  .save-search-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  /* INNER TABS */
  .inner-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); background: var(--void); margin-bottom: 24px; }
  .inner-tab { padding: 10px 24px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.08em; color: var(--muted); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; }
  .inner-tab:hover { color: var(--paper); }
  .inner-tab.active { color: var(--blood); border-bottom-color: var(--blood); }
  .inner-tab .tab-count { background: var(--blood-dim); padding: 1px 7px; border-radius: 8px; font-size: 11px; margin-left: 6px; }

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
  .scan-history-company { font-size: 10px; color: var(--muted); font-family: 'Libre Baskerville', serif; }
  .scan-history-right { display: flex; align-items: center; gap: 8px; }
  .scan-history-date { font-size: 9px; color: var(--muted); font-family: 'Space Mono', monospace; }
  .scan-history-badge { padding: 2px 8px; border-radius: 3px; font-size: 9px; font-family: 'Space Mono', monospace; letter-spacing: 0.06em; }
  .scan-history-badge.ghost { background: var(--blood-dim); color: var(--blood); }
  .scan-history-badge.suspicious { background: var(--bile-dim); color: var(--bile); }
  .scan-history-badge.legit { background: var(--signal-dim); color: var(--signal); }
  .scan-history-detail { border-top: 1px solid var(--border); padding-top: 8px; margin-top: 8px; }
  .scan-history-summary { font-size: 10px; color: var(--muted); font-family: 'Libre Baskerville', serif; line-height: 1.6; margin-bottom: 8px; }
  .scan-history-flags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .scan-history-flag { padding: 2px 6px; border-radius: 3px; font-size: 8px; font-family: 'Space Mono', monospace; }
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
  .scan-modal-save-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--muted); padding: 6px 14px; border-radius: 4px; font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; transition: color 0.15s, border-color 0.15s; }
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
  .adm-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
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
  .adm-ghost-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--muted); letter-spacing: 0.06em; }
  .adm-ghost-verdict { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 3px; display: inline-block; margin-top: 3px; }
  .adm-action-btn { font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.06em; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: background 0.15s; text-align: center; border: none; }
  .adm-scan-btn { background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.3); color: var(--blood); }
  .adm-scan-btn:hover { background: rgba(212,34,0,0.25); }
  .adm-career-btn { background: var(--ice-dim); border: 1px solid rgba(0,200,230,0.2); color: var(--ice); }
  .adm-career-btn:hover { background: rgba(0,200,230,0.18); }
  .adm-footer { border-top: 1px solid var(--border); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .adm-save-btn { background: var(--blood); color: var(--paper); font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.06em; padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; transition: background 0.15s; }
  .adm-save-btn:hover { background: #e82800; }
  .adm-delete-btn { background: none; border: 1px solid var(--border); color: var(--ghost); font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; padding: 8px 14px; border-radius: 4px; cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .adm-delete-btn:hover { color: var(--blood); border-color: var(--blood); }
  .adm-actions-row { display: flex; gap: 8px; }
  @media (max-width: 600px) { .adm-row { grid-template-columns: 1fr; } }

  .saved-searches-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
  .saved-searches-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); margin-bottom: 10px; }
  .saved-search-list { display: flex; flex-direction: column; gap: 6px; }
  .saved-search-item { display: flex; align-items: center; gap: 10px; background: var(--surface2); border: 1px solid var(--border); padding: 9px 12px; cursor: pointer; transition: background 0.15s; }
  .saved-search-item:hover { background: var(--surface3); }
  .saved-search-label { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--paper); flex: 1; }
  .saved-search-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); }
  .saved-search-del { background: none; border: none; color: var(--ghost); font-size: 13px; cursor: pointer; padding: 0 4px; transition: color 0.15s; flex-shrink: 0; }
  .saved-search-del:hover { color: var(--blood); }
  .ai-refine-btn { width: 100%; margin-top: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 19px; letter-spacing: 0.08em; border: 1px solid var(--border-hi); padding: 12px; cursor: pointer; background: none; color: var(--muted); transition: background 0.15s, color 0.15s; }
  .ai-refine-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--paper); }
  .ai-refine-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .ai-refine-section { margin-top: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-hi); border-top: 3px solid var(--border-hi); padding: 20px 22px; }
  .ai-refine-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 16px; }
  .ai-refine-group { margin-bottom: 18px; }
  .ai-refine-group:last-child { margin-bottom: 0; }
  .ai-refine-group-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); margin-bottom: 10px; }
  .ai-refine-pill-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .ai-refine-pill { font-family: 'Space Mono', monospace; font-size: 11px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-hi); color: var(--muted); padding: 6px 13px; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .ai-refine-pill:hover { background: rgba(255,255,255,0.09); color: var(--paper); }
  .ai-refine-row { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12px; color: rgba(238,234,224,0.65); line-height: 1.55; }
  .ai-refine-row:last-child { border-bottom: none; }
  .ai-refine-key { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--paper); flex-shrink: 0; min-width: 94px; }
  .board-card-actions { display: flex; flex-direction: column; gap: 6px; }
  .track-role-btn { display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); background: none; border: 1px solid var(--border-hi); padding: 8px; cursor: pointer; transition: background 0.15s, color 0.15s; width: 100%; }
  .track-role-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--paper); }
  .track-role-btn.saved { color: var(--ghost); background: rgba(255,255,255,0.03); border-color: var(--border); cursor: default; }

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
  .score-lbl { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); margin-top: 3px; }
  .sc-red { color: var(--blood); } .sc-yellow { color: var(--bile); } .sc-green { color: var(--signal); }
  .conf-bar-wrap { margin-bottom: 16px; }
  .conf-bar-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--ghost); display: flex; justify-content: space-between; margin-bottom: 5px; }
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
  .score-hero-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); }
  .score-hero-verdict { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; line-height: 1; }
  .severity-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; margin-bottom: 20px; }
  .sev-seg { height: 4px; border-radius: 1px; opacity: 0.25; transition: opacity 0.3s; }
  .sev-seg.active { opacity: 1; }
  .sev-seg.low { background: var(--signal); }
  .sev-seg.mid { background: var(--bile); }
  .sev-seg.high { background: var(--blood); }
  .sev-labels { display: flex; justify-content: space-between; margin-top: 4px; margin-bottom: 18px; }
  .sev-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ghost); }
  .sub-score-row { display: flex; gap: 20px; margin-bottom: 18px; flex-wrap: wrap; }
  .sub-score-item { display: flex; flex-direction: column; gap: 3px; }
  .sub-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 28px; line-height: 1; }
  .sub-score-lbl { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ghost); }

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
  .stat-lbl { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.85); margin-top: 3px; }
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
  .small-btn { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--border); background: none; color: var(--ghost); cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .small-btn:hover { color: var(--paper); border-color: var(--border-hi); }
  .small-btn.danger:hover { color: var(--blood); border-color: var(--blood); }

  .app-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--border-hi); margin-bottom: 12px; padding: 20px 22px; display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; transition: background 0.18s, border-color 0.18s, box-shadow 0.18s; border-radius: 4px; }
  .app-card:hover { background: var(--surface2); border-color: var(--border-hi); box-shadow: 0 2px 12px rgba(0,0,0,0.25); }
  .app-card:hover .app-title { color: #fff; }
  .app-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.03em; color: var(--paper); margin-bottom: 2px; line-height: 1.2; transition: color 0.18s; }
  .app-company { font-family: 'Libre Baskerville', serif; font-size: 12px; color: rgba(238,234,224,0.7); letter-spacing: 0.02em; margin-bottom: 10px; }
  .app-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .app-chip { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 3px; }
  .status-pill-researching { background: var(--ice-dim); color: var(--ice); }
  .status-pill-saved { background: rgba(255,255,255,0.05); color: var(--muted); }
  .status-pill-applied { background: var(--bile-dim); color: var(--bile); }
  .status-pill-interviewing { background: var(--signal-dim); color: var(--signal); }
  .status-pill-ghosted { background: var(--blood-dim); color: var(--blood); }
  .status-pill-rejected { background: rgba(212,34,0,0.08); color: rgba(212,34,0,0.5); }
  .status-pill-offer { background: var(--signal-dim); color: var(--signal); font-weight: 700; }
  .unscanned-chip { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; color: var(--muted); padding: 3px 10px; border: 1px dashed var(--border-hi); border-radius: 3px; }
  .gs-chip { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.05em; padding: 3px 10px; border-radius: 3px; }
  .gs-low { background: var(--signal-dim); border: 1px solid rgba(0,230,122,0.2); color: var(--signal); }
  .gs-mid { background: var(--bile-dim); border: 1px solid rgba(201,154,0,0.2); color: var(--bile); }
  .gs-high { background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.2); color: var(--blood); }
  .app-notes { font-family: 'Libre Baskerville', serif; font-size: 11px; color: var(--muted); margin-top: 10px; font-style: italic; line-height: 1.6; }
  .app-date { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.04em; }

  .app-controls { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
  .status-select { background: var(--surface2); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; padding: 5px 8px; outline: none; cursor: pointer; appearance: none; text-align: center; }
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

  .footer { margin-top: 80px; padding: 20px 0 8px; border-top: 1px solid var(--border); font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.38); display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; }
  .footer a { color: inherit; text-decoration: none; transition: color 150ms; }
  .footer a:hover { color: rgba(255,255,255,0.75); }
  .footer-sep { opacity: 0.3; }

  /* MANUAL ADD */
  .add-form { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 22px; margin-bottom: 28px; }
  .add-form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .add-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .add-submit { background: var(--blood); color: var(--paper); font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 11px 22px; cursor: pointer; transition: background 0.15s; width: 100%; margin-top: 6px; }
  .add-submit:hover:not(:disabled) { background: #e52600; }
  .add-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .toggle-add-btn { background: none; border: 1px solid var(--border-hi); color: var(--muted); font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .toggle-add-btn:hover { background: rgba(255,255,255,0.05); color: var(--paper); }

  /* EDIT MODE ON CARD */
  .edit-inline { display: flex; gap: 6px; margin-bottom: 4px; align-items: center; }
  .edit-inline input { background: rgba(255,255,255,0.06); border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 4px 8px; outline: none; flex: 1; }
  .edit-save-btn { background: var(--blood); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 10px; padding: 4px 10px; border: none; cursor: pointer; flex-shrink: 0; }

  /* FOLLOW-UP DATE */
  .followup-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .followup-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .followup-date { background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 11px; padding: 3px 8px; outline: none; cursor: pointer; }
  .followup-date:focus { border-color: var(--border-hi); }
  .followup-due { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--bile); }
  .followup-overdue { color: var(--blood); }

  /* EXPORT */
  .export-btn { background: none; border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; cursor: pointer; transition: background 0.15s; }
  .export-btn:hover { background: rgba(255,255,255,0.05); }

  /* GHOST REPORT CARD */
  .report-btn { background: none; border: 1px solid var(--bile); color: var(--bile); font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; cursor: pointer; transition: background 0.15s; }
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
  .share-btn { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 16px; border: 1px solid var(--border-hi); color: var(--paper); background: none; cursor: pointer; transition: background 0.15s, color 0.15s; }
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

  /* SCROLL REVEAL */
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }
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
const PROSPECT_STATUSES = ["Researching","Saved"];
const APPLICATION_STATUSES = ["Applied","Interviewing","Ghosted","Rejected","Offer"];

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
   SEARCH TAB
================================================================ */
function SearchTab({ session, addApp }) {
  var [innerTab, setInnerTab] = useState("search");
  var [industry, setIndustry] = useState("");
  var [subfield, setSubfield] = useState("");
  var [jobType, setJobType] = useState("");
  var [city, setCity] = useState("");
  var [usState, setUsState] = useState("");
  var [radius, setRadius] = useState("25");
  var [results, setResults] = useState(null);
  var [trackedBoards, setTrackedBoards] = useState({});

  // Feature 2: AI Refine
  var [aiRefining, setAiRefining] = useState(false);
  var [aiRefinement, setAiRefinement] = useState(null);
  var [aiRefineError, setAiRefineError] = useState(null);

  // Feature 5: Saved searches
  var [savedSearches, setSavedSearches] = useState([]);
  var [saving, setSaving] = useState(false);

  var userId = session ? session.user.id : null;
  var subfields = industry ? (INDUSTRY_MAP[industry] || []) : [];

  // Feature 5: Load saved searches on login
  useEffect(function() {
    if (!userId) { setSavedSearches([]); return; }
    supabase.from("saved_searches")
      .select("id, label, query, location, radius, job_type, industry, subfield, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false })
      .then(function(res) {
        if (res.error) { console.error("[saved_searches] load failed:", res.error.message); return; }
        setSavedSearches(res.data || []);
      });
  }, [userId]);

  // Feature 4: Daily nudge based on last search date
  var nudge = null;
  var lastSearched = localStorage.getItem("ghostbust-last-search");
  if (lastSearched) {
    var daysSince = Math.floor((Date.now() - Number(lastSearched)) / 86400000);
    if (daysSince === 0) nudge = "You searched today — keep the momentum going.";
    else if (daysSince === 1) nudge = "It's been 1 day since your last search. Consistent daily searching gets results faster.";
    else if (daysSince <= 3) nudge = "It's been " + daysSince + " days since your last search. Now is a good time to check what's new.";
    else if (daysSince <= 7) nudge = "It's been " + daysSince + " days. Job boards refresh daily — you may be missing fresh listings.";
    else nudge = "It's been " + daysSince + " days since your last search. Fresh listings are waiting — let's go.";
  }

  function handleIndustryChange(e) {
    setIndustry(e.target.value);
    setSubfield("");
    setResults(null);
  }

  function buildResults(q, loc, r) {
    setResults({ q: q, loc: loc, radius: r, boards: BOARDS.map(function(b) { return { id: b.id, name: b.name, desc: b.desc, url: b.buildUrl(q, loc, r) }; }) });
    setTrackedBoards({});
    localStorage.setItem("ghostbust-last-search", String(Date.now()));
  }

  function handleSearch() {
    var q = [subfield || industry, jobType].filter(Boolean).join(" ");
    var loc = [city.trim(), usState.trim()].filter(Boolean).join(", ");
    buildResults(q, loc, radius);
    setAiRefinement(null);
    setAiRefineError(null);
  }

  // Feature 3: Log board click to search_history
  function handleBoardClick(board) {
    if (!userId || !results) return;
    supabase.from("search_history").insert({
      user_id: userId,
      query: results.q || "",
      location: results.loc || "",
      radius: results.radius || "",
      job_type: jobType,
      industry: industry,
      board_id: board.id,
      board_name: board.name,
    }).then(function() {}).catch(function(err) { console.warn("[search_history] log failed:", err); });
  }

  // Feature 1: Track this role
  function handleTrackRole(board) {
    if (!addApp || !results) return;
    var title = subfield || industry || results.q || "Job";
    addApp({
      title: title,
      company: "",
      status: "Researching",
      ghostScore: 0,
      verdict: "UNKNOWN",
      signalFlags: [],
      notes: "Saved from " + board.name + " search: " + (results.q || ""),
      url: board.url,
      sourceBoard: board.name,
      appliedDate: "",
      followupDate: "",
    });
    setTrackedBoards(function(prev) { return Object.assign({}, prev, { [board.id]: true }); });
  }

  // Feature 2: AI-powered search refinement
  function handleAiRefine() {
    setAiRefining(true);
    setAiRefineError(null);
    var q = results ? results.q : [subfield || industry, jobType].filter(Boolean).join(" ");
    var loc = results ? results.loc : [city.trim(), usState.trim()].filter(Boolean).join(", ");
    var prompt = 'You are a job search strategist. The user is searching for: "' + q + '" in "' + (loc || "USA") + '".\n\nProvide targeted search refinement as JSON with exactly these keys:\n{\n  "alternative_titles": ["title1", "title2", "title3"],\n  "board_priorities": [\n    {"board": "Indeed", "reason": "one sentence why this board suits this search"},\n    {"board": "LinkedIn", "reason": "..."},\n    {"board": "Wellfound", "reason": "..."}\n  ],\n  "search_tips": ["tip1", "tip2", "tip3"]\n}\n\nalternative_titles: 3 related job titles that often yield hidden results for this role.\nboard_priorities: top 3 boards for this specific query and location with a brief reason each.\nsearch_tips: 3 specific actionable tips for this exact role and location — not generic advice.\n\nReturn only the JSON object.';
    apiCall([{ role: "user", content: prompt }], session?.access_token)
      .then(function(text) {
        var parsed = parseJSON(text);
        setAiRefinement(parsed);
        setAiRefining(false);
      })
      .catch(function(err) {
        if (err.message === "RATE_LIMIT") {
          setAiRefineError("You've reached your limit of 20 analyses per hour. Please try again later.");
        } else {
          setAiRefineError(err.message);
        }
        setAiRefining(false);
      });
  }

  // Feature 5: Save current search
  function handleSaveSearch() {
    if (!userId || !canSearch) return;
    setSaving(true);
    var q = [subfield || industry, jobType].filter(Boolean).join(" ");
    var loc = [city.trim(), usState.trim()].filter(Boolean).join(", ");
    var label = [subfield || industry, jobType, loc].filter(Boolean).join(" · ") || "Search";
    supabase.from("saved_searches").insert({
      user_id: userId,
      label: label,
      query: q,
      location: loc,
      radius: radius,
      job_type: jobType,
      industry: industry,
      subfield: subfield,
    }).select("id, label, query, location, radius, job_type, industry, subfield, saved_at").single()
      .then(function(res) {
        setSaving(false);
        if (!res.error && res.data) setSavedSearches(function(prev) { return [res.data].concat(prev); });
      });
  }

  function handleLoadSaved(s) {
    setInnerTab("search");
    setIndustry(s.industry || "");
    setSubfield(s.subfield || "");
    setJobType(s.job_type || "");
    var locParts = (s.location || "").split(", ");
    setCity(locParts[0] || "");
    setUsState(locParts[1] || "");
    setRadius(s.radius || "25");
    setResults(null);
    setAiRefinement(null);
  }

  function handleDeleteSaved(e, id) {
    e.stopPropagation();
    supabase.from("saved_searches").delete().eq("id", id).then(function() {});
    setSavedSearches(function(prev) { return prev.filter(function(s) { return s.id !== id; }); });
  }

  var canSearch = industry.length > 0 || city.length > 0 || usState.length > 0 || jobType.length > 0;

  return (
    <div className="panel">
      <div className="inner-tabs">
        <button className={"inner-tab"+(innerTab==="search"?" active":"")} onClick={function(){setInnerTab("search");}}>Search</button>
        <button className={"inner-tab"+(innerTab==="saved"?" active":"")} onClick={function(){setInnerTab("saved");}}>
          Saved Searches{savedSearches.length>0&&<span className="tab-count">{savedSearches.length}</span>}
        </button>
      </div>

      {innerTab==="search"&&<>
      {/* Feature 4: Daily search nudge */}
      {nudge && (
        <div className="search-nudge">
          <span className="search-nudge-icon">◈</span>
          <span className="search-nudge-text">{nudge}</span>
        </div>
      )}

      <div className="form-box green-top">
        <span className="form-label green">Find Real Jobs — Search All Major Boards</span>
        <div className="search-grid">
          <div>
            <label className="field-label">Industry</label>
            <select className="f-input" value={industry} onChange={handleIndustryChange}>
              <option value="">Any Industry</option>
              {Object.keys(INDUSTRY_MAP).map(function(ind) { return <option key={ind} value={ind}>{ind}</option>; })}
            </select>
          </div>
          <div>
            <label className="field-label" style={{ color: subfields.length > 0 ? "var(--paper)" : "var(--ghost)" }}>
              Specialisation {subfields.length === 0 ? "— select an industry first" : ""}
            </label>
            <select className="f-input" value={subfield} onChange={function(e) { setSubfield(e.target.value); }} disabled={subfields.length === 0}>
              <option value="">All {industry || "fields"}</option>
              {subfields.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
            </select>
          </div>
          <div>
            <label className="field-label">Job Type</label>
            <select className="f-input" value={jobType} onChange={function(e) { setJobType(e.target.value); }}>
              <option value="">Any</option>
              <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Remote</option>
            </select>
          </div>
          <div>
            <label className="field-label">City</label>
            <input className="f-input" placeholder="e.g. San Francisco, Austin" value={city} onChange={function(e) { setCity(e.target.value); }} />
          </div>
          <div>
            <label className="field-label">State</label>
            <input className="f-input" placeholder="e.g. California, TX" value={usState} onChange={function(e) { setUsState(e.target.value); }} />
          </div>
          <div>
            <label className="field-label">Distance</label>
            <select className="f-input" value={radius} onChange={function(e) { setRadius(e.target.value); }}>
              <option value="5">Within 5 miles</option>
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
              <option value="50">Within 50 miles</option>
              <option value="100">Within 100 miles</option>
            </select>
          </div>
        </div>
        <div className="search-form-actions">
          <button className="run-btn green" onClick={handleSearch} disabled={!canSearch}>GENERATE SEARCH LINKS</button>
          {userId && (
            <button className="save-search-btn" onClick={handleSaveSearch} disabled={saving || !canSearch} title="Save this search for quick reuse">
              {saving ? "SAVING..." : "SAVE SEARCH"}
            </button>
          )}
        </div>

      </div>

      {results && (
        <div className="boards-section">
          <div className="boards-header">
            <div>
              <div className="boards-title">6 Boards — Pre-Filtered</div>
              <div className="boards-sub">{results.q ? results.q.toUpperCase() : "ALL JOBS"}{results.loc ? " · " + results.loc.toUpperCase() + (results.radius ? " +" + results.radius + "MI" : "") : " · USA"} · LAST 14 DAYS · DATE SORTED</div>
            </div>
          </div>
          <div className="board-grid">
            {results.boards.map(function(b) {
              return (
                <div key={b.id} className={"board-card " + b.id}>
                  <div className={"board-name " + b.id}>{b.name}</div>
                  <p className="board-desc">{b.desc}</p>
                  <div className="board-card-actions">
                    {/* Feature 3: log click; Feature link */}
                    <a className="board-link" href={b.url} target="_blank" rel="noreferrer" onClick={function() { handleBoardClick(b); }}>Search {b.name} ↗</a>
                    {/* Feature 1: Track this role */}
                    <button
                      className={"track-role-btn" + (trackedBoards[b.id] ? " saved" : "")}
                      onClick={function() { if (!trackedBoards[b.id]) handleTrackRole(b); }}
                      disabled={!!trackedBoards[b.id]}
                    >
                      {trackedBoards[b.id] ? "✓ Added to Tracker" : "+ Track This Role"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature 2: AI Refine */}
          <button className="ai-refine-btn" onClick={handleAiRefine} disabled={aiRefining}>
            {aiRefining ? "ANALYZING YOUR SEARCH..." : "✦ AI REFINE MY SEARCH"}
          </button>
          {aiRefineError && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "var(--blood)", marginTop: 8 }}>{aiRefineError}</div>}
          {aiRefinement && (
            <div className="ai-refine-section">
              <div className="ai-refine-title">AI Search Refinement</div>
              {aiRefinement.alternative_titles && aiRefinement.alternative_titles.length > 0 && (
                <div className="ai-refine-group">
                  <div className="ai-refine-group-label">Also Search These Titles</div>
                  <div className="ai-refine-pill-row">
                    {aiRefinement.alternative_titles.map(function(t, i) {
                      return (
                        <button key={i} className="ai-refine-pill" title="Search with this title" onClick={function() {
                          var loc = results ? results.loc : [city.trim(), usState.trim()].filter(Boolean).join(", ");
                          buildResults(t, loc, radius);
                          setAiRefinement(null);
                        }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {aiRefinement.board_priorities && aiRefinement.board_priorities.length > 0 && (
                <div className="ai-refine-group">
                  <div className="ai-refine-group-label">Top Boards for This Search</div>
                  {aiRefinement.board_priorities.map(function(bp, i) {
                    return (
                      <div key={i} className="ai-refine-row">
                        <span className="ai-refine-key">{bp.board}</span>
                        <span>{bp.reason}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {aiRefinement.search_tips && aiRefinement.search_tips.length > 0 && (
                <div className="ai-refine-group">
                  <div className="ai-refine-group-label">Tips for This Search</div>
                  {aiRefinement.search_tips.map(function(tip, i) {
                    return (
                      <div key={i} className="ai-refine-row">
                        <span className="ai-refine-key">{String(i + 1).padStart(2, "0")}</span>
                        <span>{tip}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="search-tips">
            <div className="search-tips-title">Ghost-Proof Your Search</div>
            {SEARCH_TIPS.map(function(t, i) { return <div key={i} className="tip-row"><span className="tip-n">{String(i + 1).padStart(2, "0")}</span><span>{t}</span></div>; })}
          </div>
        </div>
      )}
      </>}

      {innerTab==="saved"&&(
        <div>
          {savedSearches.length===0?(
            <div className="scan-history-empty">
              No saved searches yet. Use the Search tab to find jobs, then click "Save Search" to save your filters for quick reuse.
            </div>
          ):(
            <div className="saved-search-list">
              {savedSearches.map(function(s) {
                return (
                  <div key={s.id} className="saved-search-item" onClick={function() { handleLoadSaved(s); }}>
                    <span className="saved-search-label">{s.label}</span>
                    <span className="saved-search-meta">{s.location || "USA"}</span>
                    <button className="saved-search-del" onClick={function(e) { handleDeleteSaved(e, s.id); }} title="Remove">✕</button>
                  </div>
                );
              })}
            </div>
          )}
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
      <div className="inner-tabs">
        <button className={"inner-tab"+(innerTab==="scan"?" active":"")} onClick={function(){setInnerTab("scan");}}>Scan</button>
        <button className={"inner-tab"+(innerTab==="history"?" active":"")} onClick={function(){setInnerTab("history");}}>
          History{scans.length>0&&<span className="tab-count">{scans.length}</span>}
        </button>
      </div>

      {innerTab==="scan"&&<>
      <div className="form-box red-top">
        <span className="form-label red">Ghost Detector — Full Listing Analysis</span>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)",padding:"14px 16px",marginBottom:18}}>
          <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.8}}>
            Paste the full text of any job listing. The AI reads the actual language — not just surface signals — and identifies patterns that correlate with listings that never result in hires: vague or contradictory requirements, copy-pasted boilerplate, implausible experience stacking, missing process detail, and structural inconsistencies. It returns a Ghost Score, a breakdown of specific signals found in this listing, and concrete next steps.
          </p>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.7,marginTop:8,fontFamily:"'Space Mono',monospace"}}>
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

/* ================================================================
   APPLICATION CARD
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
      <div className="inner-tabs">
        <button className={"inner-tab"+(subTab==="prospects"?" active":"")} onClick={function(){handleSubTabChange("prospects");}}>
          Prospects<span className="tab-count">{prospects.length}</span>
        </button>
        <button className={"inner-tab"+(subTab==="applications"?" active":"")} onClick={function(){handleSubTabChange("applications");}}>
          Applications<span className="tab-count">{applications.length}</span>
        </button>
      </div>
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
    body: "That's everything. Start with Find Jobs, paste any interesting listing into the Ghost Detector before applying, and track your progress in the Application Tracker. Good luck out there.",
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
            <button onClick={prev} style={{fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:"0.12em",background:"none",border:"1px solid var(--border)",color:"var(--muted)",padding:"10px 18px",cursor:"pointer"}}>← BACK</button>
          )}
          <button onClick={next} style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.08em",background:"var(--blood)",color:"var(--paper)",border:"none",padding:"12px 28px",cursor:"pointer",flex:1}}>
            {isLast ? "LET'S GO →" : "NEXT →"}
          </button>
        </div>

        {/* Step counter */}
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:16,letterSpacing:"0.1em"}}>{step+1} of {TUTORIAL_STEPS.length}</div>
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
  var [showProfileModal, setShowProfileModal] = useState(false);
  var [toast, setToast] = useState(null);
  var [showRegionModal, setShowRegionModal] = useState(false);
  var [userRegion, setUserRegion] = useState(null);
  useEffect(function(){
    supabase.auth.getSession().then(function(d){ setSession(d.data.session); });
    var sub = supabase.auth.onAuthStateChange(function(event,s){ setSession(s); if(event==="PASSWORD_RECOVERY"){setResetMode(true);return;} if(event==="SIGNED_IN"&&!resetMode){setToast("Signed in as "+s.user.email);setTimeout(function(){setToast(null);},4000);} if(event==="SIGNED_OUT"){setToast("Signed out");setTimeout(function(){setToast(null);},2000);} });
    return function(){ sub.data.subscription.unsubscribe(); };
  },[]);
  useEffect(function(){
    if (!session) return;
    try { if (sessionStorage.getItem("gb_region_skipped")) return; } catch(e) {}
    supabase.from("profiles").select("region_set,job_market_region").eq("id", session.user.id).single()
      .then(function(res){
        if (res.data) {
          if (!res.data.region_set) setShowRegionModal(true);
          if (res.data.job_market_region) setUserRegion(res.data.job_market_region);
        }
      });
  },[session]);
  var [tab,setTab] = useState("search");
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
  var [showHero, setShowHero] = useState(function() {
    try { return !localStorage.getItem("gb_visited"); } catch(e) { return true; }
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

  var trackerCount = storage.apps.length;
  var activeCount = storage.apps.filter(function(a){return a.status==="Researching"||a.status==="Applied"||a.status==="Interviewing";}).length;

  return (
    <div className="app-root">
      <style>{STYLE}</style>
          {resetMode&&(<div style={{position:"fixed",inset:0,background:"rgba(7,7,9,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{background:"var(--surface)",border:"1px solid var(--border)",borderTop:"4px solid var(--blood)",maxWidth:420,width:"100%",padding:36}}>{resetDone?(<div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>✓</div><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:24,marginBottom:8}}>Password Updated</div><p style={{fontSize:13,color:"var(--muted)"}}>Your password has been changed. You are now signed in.</p><button className="run-btn red" style={{marginTop:16}} onClick={function(){setResetMode(false);setResetDone(false);}}>Continue</button></div>):(<div><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:28,marginBottom:4}}>GhostBust</div><div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--blood)",letterSpacing:"0.2em",marginBottom:24}}>SET NEW PASSWORD</div><input className="f-input" style={{marginBottom:10,width:"100%"}} type="password" placeholder="New password (min 6 characters)" value={newPassword} onChange={function(e){setNewPassword(e.target.value);}}/>{resetError&&<div style={{color:"var(--blood)",fontSize:12,marginBottom:8}}>{resetError}</div>}<button className="run-btn red" onClick={async function(){if(newPassword.length<6){setResetError("Password must be at least 6 characters.");return;}setResetError(null);var res=await supabase.auth.updateUser({password:newPassword});if(res.error){setResetError(res.error.message);return;}setResetDone(true);}} disabled={!newPassword}>SET PASSWORD</button></div>)}</div></div>)}
  {toast&&(<div style={{position:"fixed",bottom:24,right:24,zIndex:99999,background:"var(--surface)",border:"1px solid var(--signal)",borderLeft:"4px solid var(--signal)",padding:"14px 40px 14px 18px",maxWidth:340}}><div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--signal)",letterSpacing:"0.2em",marginBottom:4}}>GHOSTBUST</div><div style={{fontSize:13,color:"var(--paper)"}}>{toast}</div><button onClick={function(){setToast(null);}} style={{position:"absolute",top:8,right:10,background:"none",border:"none",color:"var(--ghost)",cursor:"pointer",fontSize:14}}>✕</button></div>)}
{showAuth&&(<div style={{position:"fixed",inset:0,background:"rgba(7,7,9,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{background:"var(--surface)",border:"1px solid var(--border)",borderTop:"4px solid var(--blood)",maxWidth:420,width:"100%",padding:36,position:"relative"}}><button onClick={function(){setShowAuth(false);}} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"var(--ghost)",fontSize:18,cursor:"pointer"}}>X</button><div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:28,marginBottom:4}}>GhostBust</div><div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--blood)",letterSpacing:"0.2em",marginBottom:24}}>FREE ACCOUNT</div><AuthForm supabase={supabase} onClose={function(){setShowAuth(false);}} /></div></div>)}
      {showTutorial && <TutorialOverlay onClose={closeTutorial} onTabSwitch={setTab} />}
      {showRegionModal && session && <RegionModal userId={session.user.id} onClose={function(){setShowRegionModal(false);}} />}
      {showProfileModal && <div onClick={function(e){if(e.target===e.currentTarget)setShowProfileModal(false);}} style={{position:"fixed",inset:0,zIndex:9500,background:"rgba(7,7,9,0.92)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{background:"#0e0e12",border:"1px solid rgba(255,255,255,0.07)",borderTop:"4px solid #d42200",maxWidth:420,width:"calc(100% - 48px)",padding:"36px",position:"relative"}}>
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
        {showHero && (
          <header className="header">
            <div>
              <div className="logo-eyebrow">AI-powered job intelligence</div>
              <a href="/" style={{display:"inline-block",marginTop:8,marginBottom:4,fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:"0.15em",color:"var(--paper)",background:"var(--blood)",padding:"6px 14px",textDecoration:"none",cursor:"pointer"}}>← BACK TO GHOSTBUST.US</a>
              <h1 className="logo-title">Ghost<em>Bust</em></h1>
              <p className="logo-sub">Find real jobs. Expose ghost listings. Track every application. The only job search tool built to fight back against a broken market.</p>
            </div>
            <div className="ghost-float">👻</div>
          </header>
        )}

        <nav className="tabs">
          <button className={"tab-btn"+(tab==="search"?" active":"")} onClick={function(){setPrefill(null);setTab("search");}}>
            Find Jobs
          </button>
          <button className={"tab-btn"+(tab==="verify"?" active":"")} onClick={function(){setPrefill(null);setTab("verify");}}>
            Ghost Detector
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
          {tab==="search"&&<SearchTab session={session} addApp={storage.addApp} />}
          {tab==="verify"&&<VerifyTab addApp={storage.addApp} onSaved={function(){setTab("tracker");}} session={session} prefill={tab==="verify"?prefill:null} />}
          {tab==="tracker"&&<TrackerTab apps={storage.apps} loaded={storage.loaded} onUpdate={storage.updateApp} onDelete={storage.deleteApp} onClear={handleClearAll} addApp={storage.addApp} onNavigate={function(t,pf){setPrefill(pf);setTab(t);}} />}
          {tab==="resume"&&<ResumeAdvisor session={session} onRequestSignIn={function(){setShowAuth(true);}} prefill={tab==="resume"?prefill:null} />}
        </div>
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

