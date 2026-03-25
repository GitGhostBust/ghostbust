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
  .ra-upload-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(238,234,224,0.65); letter-spacing: 0.1em; text-transform: uppercase; }

  /* Resume card */
  .ra-resume-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--blood); padding: 18px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  .ra-resume-icon { font-size: 28px; flex-shrink: 0; }
  .ra-resume-name { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--paper); font-weight: 700; }
  .ra-resume-date { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(238,234,224,0.65); margin-top: 3px; }
  .ra-resume-actions { margin-left: auto; display: flex; gap: 8px; flex-shrink: 0; }
  .ra-replace-btn { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--border-hi); background: none; color: rgba(238,234,224,0.65); cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .ra-replace-btn:hover { color: var(--paper); border-color: var(--paper); }

  /* Extracted text preview */
  .ra-text-preview { background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 16px; margin-top: 16px; max-height: 220px; overflow-y: auto; }
  .ra-text-preview-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(238,234,224,0.65); margin-bottom: 10px; }
  .ra-text-preview pre { font-family: 'Libre Baskerville', Georgia, serif; font-size: 12px; color: rgba(238,234,224,0.65); line-height: 1.75; white-space: pre-wrap; word-break: break-word; }

  /* Advisor form */
  .ra-advisor-box { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 26px; }
  .ra-no-resume { text-align: center; padding: 48px 20px; }
  .ra-no-resume-icon { font-size: 36px; margin-bottom: 12px; }
  .ra-no-resume-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 0.04em; color: var(--ghost); margin-bottom: 8px; }
  .ra-no-resume-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(238,234,224,0.65); letter-spacing: 0.08em; }

  /* Results */
  .ra-results { margin-top: 28px; display: flex; flex-direction: column; gap: 20px; }

  .ra-section { background: var(--surface); border: 1px solid var(--border); padding: 22px 24px; }
  .ra-section-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(238,234,224,0.65); margin-bottom: 14px; }

  /* Fit score */
  .ra-fit-score-display { display: flex; align-items: center; gap: 20px; }
  .ra-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 80px; line-height: 1; letter-spacing: -0.01em; }
  .ra-score-green { color: var(--signal); }
  .ra-score-yellow { color: var(--bile); }
  .ra-score-red { color: var(--blood); }
  .ra-score-label { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; color: var(--paper); }
  .ra-score-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(238,234,224,0.65); margin-top: 4px; letter-spacing: 0.08em; }
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
  .ra-history-snippet { font-family: 'Libre Baskerville', Georgia, serif; font-size: 14px; color: rgba(238,234,224,0.7); line-height: 1.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ra-history-date { font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(238,234,224,0.65); margin-top: 4px; letter-spacing: 0.06em; }
  .ra-history-arrow { color: var(--ghost); flex-shrink: 0; }
  .ra-history-back { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--border); background: none; color: rgba(238,234,224,0.65); cursor: pointer; margin-bottom: 20px; transition: color 0.15s; }
  .ra-history-back:hover { color: var(--paper); }

  /* Loading */
  .ra-loading { text-align: center; padding: 48px 20px; background: var(--surface); border: 1px solid var(--border); }
  .ra-spin { width: 36px; height: 36px; border: 2px solid var(--border); border-top-color: var(--blood); border-radius: 50%; animation: spin 0.75s linear infinite; margin: 0 auto 14px; }
  .ra-load-text { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: rgba(238,234,224,0.65); text-transform: uppercase; }

  /* Locked / no session */
  .ra-locked { text-align: center; padding: 60px 20px; }
  .ra-locked-icon { font-size: 52px; margin-bottom: 16px; }
  .ra-locked-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 8px; }
  .ra-locked-sub { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.6); line-height: 1.75; max-width: 400px; margin: 0 auto; }
  .ra-pro-badge { display: inline-block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-hi); color: var(--muted); margin-bottom: 20px; }

  /* Section header with divider */
  .ra-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .ra-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); }
  .ra-section-count { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(238,234,224,0.65); letter-spacing: 0.08em; }

  /* Error */
  .ra-error { padding: 14px 18px; background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.3); font-family: 'Space Mono', monospace; font-size: 11px; color: var(--blood); margin-top: 16px; }

  /* Delete button */
  .ra-delete-btn { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid rgba(212,34,0,0.35); background: none; color: var(--blood); cursor: pointer; transition: background 0.15s, color 0.15s; }
  .ra-delete-btn:hover { background: var(--blood-dim); }

  /* PREVIEW */
  .ra-preview-container { margin-top: 24px; }
  .ra-preview-label { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.06em; color: var(--paper); margin-bottom: 10px; }
  .ra-preview-box { background: #111; border: 1px solid rgba(212,34,0,0.3); overflow: hidden; height: 800px; position: relative; z-index: 9001; }
  .ra-preview-loading { display: flex; align-items: center; justify-content: center; height: 100%; gap: 12px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: rgba(238,234,224,0.65); text-transform: uppercase; }
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
  .ra-preview-docx a { color: #111; text-decoration: underline; }
  .ra-preview-docx table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .ra-preview-docx td, .ra-preview-docx th { font-family: 'Libre Baskerville', Georgia, serif; font-size: 12px; color: rgba(238,234,224,0.75); padding: 5px 8px; border: 1px solid var(--border); vertical-align: top; }

  /* MODE TOGGLE */
  .ra-mode-toggle { display: flex; gap: 0; border: 1px solid var(--border-hi); margin-bottom: 28px; }
  .ra-mode-btn { flex: 1; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 12px 16px; border: none; background: none; color: #72728a; cursor: pointer; transition: color 0.15s, background 0.15s; border-right: 1px solid var(--border-hi); }
  .ra-mode-btn:last-child { border-right: none; }
  .ra-mode-btn:hover { color: var(--paper); background: rgba(255,255,255,0.03); }
  .ra-mode-btn.active { color: var(--paper); background: var(--blood-dim); border-bottom: 2px solid var(--blood); }

  /* SCORE CARDS */
  .ra-scores-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
  .ra-score-card { background: var(--surface); border: 1px solid var(--border); padding: 24px; }
  .ra-score-card-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(238,234,224,0.65); margin-bottom: 10px; }
  .ra-score-big { font-family: 'Bebas Neue', sans-serif; font-size: 88px; line-height: 1; letter-spacing: -0.01em; }
  .ra-score-card-sub { font-family: 'Libre Baskerville', Georgia, serif; font-size: 12px; color: rgba(238,234,224,0.6); line-height: 1.65; margin-top: 8px; }
  .ra-score-card-bar { height: 4px; background: rgba(255,255,255,0.07); margin-top: 14px; }
  .ra-score-card-bar-fill { height: 4px; transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }

  /* FEEDBACK CARDS */
  .ra-feedback-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--border-hi); padding: 20px 22px; margin-bottom: 12px; }
  .ra-feedback-card.danger { border-left-color: var(--blood); }
  .ra-feedback-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .ra-feedback-icon { font-size: 16px; }
  .ra-feedback-title { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(238,234,224,0.65); }

  /* NEXT STEPS */
  .ra-next-steps-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--signal); padding: 20px 22px; margin-bottom: 12px; }
  .ra-next-steps { display: flex; flex-direction: column; gap: 14px; margin-top: 12px; }
  .ra-next-step { display: flex; gap: 14px; align-items: flex-start; }
  .ra-step-num { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: var(--signal); line-height: 1; flex-shrink: 0; width: 24px; }

  /* ANALYZING STATE */
  .ra-analyzing { text-align: center; padding: 60px 20px; background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); margin-top: 20px; }
  .ra-analyzing-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 0.08em; color: var(--paper); margin-top: 20px; }
  .ra-analyzing-sub { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: rgba(238,234,224,0.65); margin-top: 8px; text-transform: uppercase; }

  /* COVER LETTER GENERATOR (general mode) */
  .ra-cl-trigger { display: block; width: 100%; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 14px; border: 1px dashed var(--border-hi); background: none; color: rgba(238,234,224,0.65); cursor: pointer; transition: color 0.15s, border-color 0.15s; margin-top: 12px; }
  .ra-cl-trigger:hover { color: var(--paper); border-color: var(--paper); }
  .ra-cl-form-box { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 22px; margin-top: 12px; }
  .ra-cl-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 10px 14px; outline: none; margin-bottom: 10px; transition: border-color 0.2s; box-sizing: border-box; }
  .ra-cl-input:focus { border-color: rgba(255,255,255,0.3); }
  .ra-cl-input::placeholder { color: rgba(238,234,224,0.65); }
  .ra-cl-result-box { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 22px; margin-top: 16px; }

  /* ANALYZING: doc selector (AI Advisor tab) */
  .ra-doc-selector { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 16px 20px; margin-bottom: 24px; }
  .ra-doc-selector-label { font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.18em; color: rgba(238,234,224,0.65); margin-bottom: 10px; }
  .ra-doc-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .ra-doc-name { font-family: 'Space Mono', monospace; font-size: 13px; color: var(--paper); font-weight: 700; }
  .ra-doc-date { font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(238,234,224,0.65); }
  .ra-analysis-badge { display: inline-block; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; padding: 3px 8px; }
  .ra-analysis-badge.first { background: rgba(255,255,255,0.04); border: 1px solid var(--border-hi); color: rgba(238,234,224,0.65); }
  .ra-analysis-badge.followup { background: var(--bile-dim); border: 1px solid rgba(201,154,0,0.35); color: var(--bile); }
  .ra-resume-btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .ra-resume-btn { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.08em; padding: 6px 12px; border: 1px solid var(--border-hi); background: none; color: rgba(238,234,224,0.65); cursor: pointer; transition: color 0.15s, border-color 0.15s, background 0.15s; white-space: nowrap; max-width: 240px; overflow: hidden; text-overflow: ellipsis; }
  .ra-resume-btn:hover { color: var(--paper); border-color: rgba(255,255,255,0.2); }
  .ra-resume-btn.active { color: var(--paper); border-color: var(--blood); background: var(--blood-dim); }

  /* HISTORY badge */
  .ra-mode-badge { display: inline-block; font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 7px; border-radius: 0; margin-right: 8px; }
  .ra-mode-badge.general { background: rgba(0,200,230,0.12); border: 1px solid rgba(0,200,230,0.25); color: var(--ice); }
  .ra-mode-badge.job { background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.25); color: var(--blood); }

  @media (max-width: 720px) {
    .ra-bullet-pair { grid-template-columns: 1fr; }
    .ra-fit-score-display { flex-direction: column; align-items: flex-start; gap: 12px; }
    .ra-score-bar-wrap { width: 100%; max-width: 100%; }
  }

  /* JOB SEARCH ADVISOR */
  .ra-jsa-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 28px; }
  .ra-jsa-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--blood); padding: 22px 24px; }
  .ra-jsa-score-card { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--blood); padding: 24px; display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
  .ra-jsa-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 88px; line-height: 1; letter-spacing: -0.01em; }
  .ra-jsa-score-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 10px; }
  .ra-jsa-score-meta { flex: 1; min-width: 200px; }
  .ra-jsa-score-bar { height: 4px; background: rgba(255,255,255,0.07); margin-top: 14px; }
  .ra-jsa-score-bar-fill { height: 4px; transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
  .ra-jsa-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 10px; }
  .ra-jsa-action-list { display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }
  .ra-jsa-action { display: flex; gap: 14px; align-items: flex-start; }
  .ra-jsa-action-num { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: var(--blood); line-height: 1; flex-shrink: 0; width: 24px; }
  .ra-mode-badge.search { background: rgba(0,230,122,0.12); border: 1px solid rgba(0,230,122,0.25); color: var(--signal); }
  .ra-mode-badge.coach { background: rgba(201,154,0,0.15); border: 1px solid rgba(201,154,0,0.35); color: var(--bile); }

  /* CAREER COACH */
  .ra-cc-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 28px; }
  .ra-cc-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--blood); padding: 22px 24px; }
  .ra-cc-card.honest { border-left-color: var(--bile); background: rgba(201,154,0,0.04); }
  .ra-cc-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 10px; }
  .ra-cc-interview-list { display: flex; flex-direction: column; gap: 18px; margin-top: 4px; }
  .ra-cc-interview-q { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 14px 16px; }
  .ra-cc-q-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(238,234,224,0.65); margin-bottom: 6px; }
  .ra-cc-q-text { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: var(--paper); line-height: 1.6; margin-bottom: 10px; font-style: italic; }
  .ra-cc-coaching-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(238,234,224,0.65); margin-bottom: 6px; }
  .ra-cc-coaching-text { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.85); line-height: 1.75; }
  .ra-cc-week-list { display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }
  .ra-cc-week { display: flex; gap: 16px; align-items: flex-start; }
  .ra-cc-week-label { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: var(--blood); line-height: 1; flex-shrink: 0; width: 64px; }

  /* HISTORY DETAIL VIEW — all Space Mono & Libre Baskerville +2pt */
  .ra-history-detail .ra-history-back { font-size: 11px; }
  .ra-history-detail .ra-mode-badge { font-size: 10px; }
  .ra-history-detail .ra-score-card-label { font-size: 11px; }
  .ra-history-detail .ra-score-card-sub { font-size: 14px; }
  .ra-history-detail .ra-section-label { font-size: 11px; }
  .ra-history-detail .ra-feedback-title { font-size: 11px; }
  .ra-history-detail .ra-prose { font-size: 15px; }
  .ra-history-detail .ra-bullet-side-label { font-size: 10px; }
  .ra-history-detail .ra-bullet-text { font-size: 14px; }
  .ra-history-detail .ra-pill { font-size: 12px; }
  .ra-history-detail .ra-copy-btn { font-size: 11px; }
  .ra-history-detail .ra-cover-letter { font-size: 15px; }
  .ra-history-detail .ra-cl-trigger { font-size: 12px; }
`;

/* ================================================================
   HELPERS
================================================================ */
function apiCall(messages) {
  return fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages }),
  })
    .then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) { throw new Error("HTTP " + r.status + ": " + t); });
      }
      return r.json();
    })
    .then(function (data) {
      if (data.error) throw new Error(data.error.type + ": " + data.error.message);
      if (!data.content || !data.content.length) throw new Error("Empty API response");
      return data.content.filter(function (b) { return b.type === "text"; }).map(function (b) { return b.text; }).join("\n").replace(/```json/g, "").replace(/```/g, "").trim();
    })
    .catch(function (err) {
      console.error("[ResumeAdvisor] API call failed:", err);
      throw err;
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
function formatDateTime(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  var date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  var time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return date + " at " + time;
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
// styleMap tells mammoth not to emit <hr> elements for any DOCX paragraph style
var MAMMOTH_OPTIONS = {
  styleMap: [
    "p[style-name='Horizontal Line'] => ",
    "p[style-name='horizontal line'] => ",
    "p[style-name='HR'] => ",
    "p[style-name='ruling line'] => ",
  ],
  ignoreEmptyParagraphs: false,
};

// Strip all <hr> tags and border/box-shadow inline styles from mammoth HTML.
// CSS !important alone cannot beat inline style !important in all browsers,
// so we sanitize the HTML string directly before rendering.
function sanitizeDocxHtml(html) {
  // Remove all <hr> elements outright
  var out = html.replace(/<hr\s*\/?>/gi, "");
  // Strip border-*, box-shadow, and outline from every inline style attribute
  out = out.replace(/style="([^"]*)"/gi, function (_, styleVal) {
    var cleaned = styleVal
      .split(";")
      .map(function (rule) { return rule.trim(); })
      .filter(function (rule) {
        var prop = rule.split(":")[0].trim().toLowerCase();
        return prop !== "" && !prop.startsWith("border") && prop !== "box-shadow" && prop !== "outline";
      })
      .join("; ");
    return cleaned ? 'style="' + cleaned + '"' : "";
  });
  return out;
}

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
   SCORE CARD
================================================================ */
function ScoreCard({ label, score, sub }) {
  var cls = score >= 70 ? "ra-score-green" : score >= 40 ? "ra-score-yellow" : "ra-score-red";
  var bar = score >= 70 ? "var(--signal)" : score >= 40 ? "var(--bile)" : "var(--blood)";
  return (
    <div className="ra-score-card" style={{ borderTop: "4px solid " + bar }}>
      <div className="ra-score-card-label">{label}</div>
      <div className={"ra-score-big " + cls}>{score}</div>
      {sub && <div className="ra-score-card-sub">{sub}</div>}
      <div className="ra-score-card-bar"><div className="ra-score-card-bar-fill" style={{ width: Math.min(100, score) + "%", background: bar }} /></div>
    </div>
  );
}

/* ================================================================
   FEEDBACK CARD
================================================================ */
function FeedbackCard({ title, text, icon, danger }) {
  return (
    <div className={"ra-feedback-card" + (danger ? " danger" : "")}>
      <div className="ra-feedback-header">
        {icon && <span className="ra-feedback-icon">{icon}</span>}
        <div className="ra-feedback-title">{title}</div>
      </div>
      <div className="ra-prose">{text}</div>
    </div>
  );
}

/* ================================================================
   CAREER COACH RESULTS
================================================================ */
function CareerCoachResults({ data }) {
  var interviews = [];
  try { interviews = typeof data.ats_feedback === "string" ? JSON.parse(data.ats_feedback) : (Array.isArray(data.ats_feedback) ? data.ats_feedback : []); } catch (e) { interviews = []; }
  var weekPlan = [];
  try { weekPlan = typeof data.next_steps === "string" ? JSON.parse(data.next_steps) : (Array.isArray(data.next_steps) ? data.next_steps : []); } catch (e) { weekPlan = []; }

  return (
    <div className="ra-cc-grid">
      {data.career_trajectory && (
        <div className="ra-cc-card">
          <div className="ra-cc-section-title">Career Stage Assessment</div>
          <div className="ra-prose">{data.career_trajectory}</div>
        </div>
      )}
      {data.missing_sections && (
        <div className="ra-cc-card">
          <div className="ra-cc-section-title">Skills Gap Analysis</div>
          <div className="ra-prose">{data.missing_sections}</div>
        </div>
      )}
      {interviews.length > 0 && (
        <div className="ra-cc-card">
          <div className="ra-cc-section-title">Interview Preparation</div>
          <div className="ra-cc-interview-list">
            {interviews.map(function (item, i) {
              return (
                <div key={i} className="ra-cc-interview-q">
                  <div className="ra-cc-q-label">Question {i + 1}</div>
                  <div className="ra-cc-q-text">{item.question}</div>
                  <div className="ra-cc-coaching-label">How to Answer</div>
                  <div className="ra-cc-coaching-text">{item.coaching}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {data.writing_quality && (
        <div className="ra-cc-card">
          <div className="ra-cc-section-title">Salary Intelligence</div>
          <div className="ra-prose">{data.writing_quality}</div>
        </div>
      )}
      {data.industry_alignment && (
        <div className="ra-cc-card">
          <div className="ra-cc-section-title">Application Pattern Analysis</div>
          <div className="ra-prose">{data.industry_alignment}</div>
        </div>
      )}
      {weekPlan.length > 0 && (
        <div className="ra-cc-card" style={{ borderLeft: "3px solid var(--signal)" }}>
          <div className="ra-cc-section-title">30-Day Career Action Plan</div>
          <div className="ra-cc-week-list">
            {weekPlan.map(function (week, i) {
              return (
                <div key={i} className="ra-cc-week">
                  <div className="ra-cc-week-label">WK {i + 1}</div>
                  <div className="ra-prose">{week}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {data.red_flags && (
        <div className="ra-cc-card honest">
          <div className="ra-cc-section-title">Honest Assessment</div>
          <div className="ra-prose">{data.red_flags}</div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   JOB SEARCH ADVISOR RESULTS
================================================================ */
function JobSearchAdvisorResults({ data }) {
  var score = data.fit_score || 0;
  var cls = score >= 70 ? "ra-score-green" : score >= 40 ? "ra-score-yellow" : "ra-score-red";
  var barColor = score >= 70 ? "var(--signal)" : score >= 40 ? "var(--bile)" : "var(--blood)";
  var readinessLabel = score >= 70 ? "Ready to Apply" : score >= 40 ? "Nearly There" : "Build Before Applying";
  var actionPlan = [];
  try { actionPlan = typeof data.next_steps === "string" ? JSON.parse(data.next_steps) : (Array.isArray(data.next_steps) ? data.next_steps : []); } catch (e) { actionPlan = []; }

  return (
    <div className="ra-jsa-grid">
      {/* Search Readiness Score */}
      <div className="ra-jsa-score-card">
        <div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(238,234,224,0.65)", marginBottom: 8 }}>Search Readiness Score</div>
          <div className={"ra-jsa-score-num " + cls}>{score}</div>
          <div className="ra-jsa-score-bar"><div className="ra-jsa-score-bar-fill" style={{ width: Math.min(100, score) + "%", background: barColor }} /></div>
        </div>
        <div className="ra-jsa-score-meta">
          <div className="ra-jsa-score-title">{readinessLabel}</div>
          {data.strength_justification && <div className="ra-prose">{data.strength_justification}</div>}
        </div>
      </div>

      {/* Target Role Clarity */}
      {data.career_trajectory && (
        <div className="ra-jsa-card">
          <div className="ra-jsa-section-title">Target Role Clarity</div>
          <div className="ra-prose">{data.career_trajectory}</div>
        </div>
      )}

      {/* Regional Market Intelligence */}
      {data.industry_alignment && (
        <div className="ra-jsa-card">
          <div className="ra-jsa-section-title">Regional Market Intelligence</div>
          <div className="ra-prose">{data.industry_alignment}</div>
        </div>
      )}

      {/* Job Board Strategy */}
      {data.formatting_feedback && (
        <div className="ra-jsa-card">
          <div className="ra-jsa-section-title">Job Board Strategy</div>
          <div className="ra-prose">{data.formatting_feedback}</div>
        </div>
      )}

      {/* Application Cadence */}
      {data.writing_quality && (
        <div className="ra-jsa-card">
          <div className="ra-jsa-section-title">Application Cadence</div>
          <div className="ra-prose">{data.writing_quality}</div>
        </div>
      )}

      {/* Immediate Action Plan */}
      {actionPlan.length > 0 && (
        <div className="ra-jsa-card" style={{ borderLeft: "3px solid var(--signal)" }}>
          <div className="ra-jsa-section-title">Immediate Action Plan</div>
          <div className="ra-jsa-action-list">
            {actionPlan.map(function (step, i) {
              return (
                <div key={i} className="ra-jsa-action">
                  <div className="ra-jsa-action-num">{i + 1}</div>
                  <div className="ra-prose">{step}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ghost Job Avoidance */}
      {data.red_flags && (
        <div className="ra-jsa-card" style={{ borderLeft: "3px solid var(--bile)" }}>
          <div className="ra-jsa-section-title">Ghost Job Avoidance</div>
          <div className="ra-prose">{data.red_flags}</div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   COMPREHENSIVE RESULTS
================================================================ */
function ComprehensiveResults({ data, onCopy, copied, onShowCLForm, showCLForm, clJobTitle, clCompany, onCLJobTitle, onCLCompany, onGenerateCL, generatingCL, clResult, onCopyCL, copiedCL }) {
  var isJobSpecific = (data.mode || "job_specific") === "job_specific";

  var bullets = [];
  try { bullets = typeof data.bullet_rewrites === "string" ? JSON.parse(data.bullet_rewrites) : (data.bullet_rewrites || []); } catch (e) { bullets = []; }
  var keywords = [];
  try {
    keywords = typeof data.keyword_gaps === "string" ? JSON.parse(data.keyword_gaps) : (data.keyword_gaps || []);
    if (!Array.isArray(keywords)) keywords = [];
  } catch (e) {
    if (typeof data.keyword_gaps === "string") keywords = data.keyword_gaps.split(",").map(function (k) { return k.trim(); }).filter(Boolean);
  }
  var nextSteps = [];
  try { nextSteps = typeof data.next_steps === "string" ? JSON.parse(data.next_steps) : (data.next_steps || []); if (!Array.isArray(nextSteps)) nextSteps = []; } catch (e) { nextSteps = []; }

  return (
    <div className="ra-results">
      {/* Scores */}
      <div className="ra-scores-row">
        {isJobSpecific && data.fit_score != null && <ScoreCard label="Job Fit Score" score={data.fit_score} sub="Match to this specific role" />}
        {data.strength_score != null && data.strength_score > 0 && <ScoreCard label="Resume Strength" score={data.strength_score} sub={data.strength_justification} />}
      </div>

      {/* Feedback sections */}
      {data.formatting_feedback && <FeedbackCard title="Formatting & Structure" text={data.formatting_feedback} icon="📐" />}
      {data.writing_quality && <FeedbackCard title="Writing Quality" text={data.writing_quality} icon="✏️" />}
      {data.missing_sections && <FeedbackCard title="Missing or Weak Sections" text={data.missing_sections} icon="🔍" />}
      {data.industry_alignment && <FeedbackCard title="Industry Alignment" text={data.industry_alignment} icon="🏭" />}
      {data.career_trajectory && <FeedbackCard title="Career Trajectory" text={data.career_trajectory} icon="📈" />}
      {data.red_flags && <FeedbackCard title="Red Flags" text={data.red_flags} icon="⚠️" danger={true} />}
      {/* Backward compat: old analyses only have gap_analysis */}
      {!data.formatting_feedback && data.gap_analysis && <FeedbackCard title="Gap Analysis" text={data.gap_analysis} icon="🔍" />}

      {/* Job-specific: keywords */}
      {isJobSpecific && keywords.length > 0 && (
        <div className="ra-feedback-card">
          <div className="ra-feedback-header"><span className="ra-feedback-icon">🔑</span><div className="ra-feedback-title">Missing Keywords</div></div>
          <div className="ra-pills" style={{ marginTop: 4 }}>{keywords.map(function (k, i) { return <span key={i} className="ra-pill">{k}</span>; })}</div>
        </div>
      )}

      {/* Job-specific: bullet rewrites */}
      {isJobSpecific && bullets.length > 0 && (
        <div className="ra-section">
          <div className="ra-section-label">Bullet Rewrites — {bullets.length} Improved for This Role</div>
          <div className="ra-bullets">
            {bullets.map(function (b, i) {
              return (
                <div key={i} className="ra-bullet-pair">
                  <div className="ra-bullet-side original"><div className="ra-bullet-side-label">Original</div><div className="ra-bullet-text">{b.original}</div></div>
                  <div className="ra-bullet-side improved"><div className="ra-bullet-side-label">Improved</div><div className="ra-bullet-text">{b.improved}</div></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Job-specific: ATS */}
      {isJobSpecific && data.ats_feedback && <FeedbackCard title="ATS Optimization" text={data.ats_feedback} icon="🤖" />}

      {/* Next steps */}
      {nextSteps.length > 0 && (
        <div className="ra-next-steps-card">
          <div className="ra-feedback-header"><span className="ra-feedback-icon">🎯</span><div className="ra-feedback-title">Top 3 Highest-Impact Next Steps</div></div>
          <div className="ra-next-steps">
            {nextSteps.map(function (step, i) {
              return (
                <div key={i} className="ra-next-step">
                  <div className="ra-step-num">{i + 1}</div>
                  <div className="ra-prose">{step}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Job-specific: auto cover letter */}
      {isJobSpecific && data.cover_letter && (
        <div className="ra-section">
          <div className="ra-section-label">Generated Cover Letter</div>
          <div className="ra-cover-letter">{data.cover_letter}</div>
          <button className={"ra-copy-btn" + (copied ? " copied" : "")} onClick={onCopy}>{copied ? "✓ Copied!" : "Copy Cover Letter"}</button>
        </div>
      )}

      {/* General mode: optional cover letter generator */}
      {!isJobSpecific && !data.cover_letter && (
        <div style={{ marginTop: 8 }}>
          {!showCLForm ? (
            <button className="ra-cl-trigger" onClick={onShowCLForm}>+ Generate a Cover Letter from This Resume</button>
          ) : (
            <div className="ra-cl-form-box">
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>Cover Letter Generator</div>
              <input className="ra-cl-input" type="text" placeholder="Target job title (required)" value={clJobTitle} onChange={function (e) { onCLJobTitle(e.target.value); }} />
              <input className="ra-cl-input" type="text" placeholder="Company name (optional)" value={clCompany} onChange={function (e) { onCLCompany(e.target.value); }} />
              <button className="run-btn red" style={{ marginTop: 4 }} onClick={onGenerateCL} disabled={generatingCL || !clJobTitle.trim()}>
                {generatingCL ? "Generating..." : "Generate Cover Letter →"}
              </button>
            </div>
          )}
          {clResult && (
            <div className="ra-cl-result-box" style={{ marginTop: 16 }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Cover Letter</div>
              <div className="ra-cover-letter">{clResult}</div>
              <button className={"ra-copy-btn" + (copiedCL ? " copied" : "")} onClick={onCopyCL}>{copiedCL ? "✓ Copied!" : "Copy Cover Letter"}</button>
            </div>
          )}
        </div>
      )}

      {/* General mode: if cover letter already saved (from a prior CL generation) */}
      {!isJobSpecific && data.cover_letter && (
        <div className="ra-section">
          <div className="ra-section-label">Cover Letter</div>
          <div className="ra-cover-letter">{data.cover_letter}</div>
          <button className={"ra-copy-btn" + (copied ? " copied" : "")} onClick={onCopy}>{copied ? "✓ Copied!" : "Copy Cover Letter"}</button>
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
  // Advisor mode
  var [advisorMode, setAdvisorMode] = useState("general"); // "general" | "job_specific"
  var [userProfile, setUserProfile] = useState(null);
  var [showCLForm, setShowCLForm] = useState(false);
  var [clJobTitle, setCLJobTitle] = useState("");
  var [clCompany, setCLCompany] = useState("");
  var [generatingCL, setGeneratingCL] = useState(false);
  var [clResult, setCLResult] = useState(null);
  var [copiedCL, setCopiedCL] = useState(false);
  var [advisorResume, setAdvisorResume] = useState(null); // resume selected for AI analysis (may differ from manager tab selection)
  var fileRef = useRef(null);
  var canvasRef = useRef(null);

  // Load Pro status + admin check + profile context for AI prompts
  useEffect(function () {
    if (!session) return;
    supabase.from("profiles").select("founding_member, username, job_market_region, job_market_country, job_market_state, experience_years, seniority_level, work_arrangement, target_roles, target_salary_band, search_duration, career_goal, skills").eq("id", session.user.id).single()
      .then(function (res) {
        if (res.data) {
          setIsPro(res.data.founding_member === true);
          setIsAdmin(res.data.username === "GhostBustOfficial");
          setUserProfile(res.data);
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
        setPreviewContent({ type: "docx", html: sanitizeDocxHtml(res.value) });
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
        setPreviewContent({ type: "docx", html: sanitizeDocxHtml(res2.value) });
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
          var targetResume = list.find(function (r) { return resume && r.id === resume.id; }) || list[0];
          setResume(targetResume);
          setAdvisorResume(function (prev) {
            var still = list.find(function (r) { return prev && r.id === prev.id; });
            return still || list[0];
          });
          setExpandedId(function (prev) { return prev || list[0].id; });
          // Build preview on initial load (when no preview exists yet)
          if (!previewContent) buildPreviewFromDb(targetResume);
        } else {
          setResume(null);
          setAdvisorResume(null);
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
      if (advisorResume && advisorResume.id === r.id) setAdvisorResume(null);
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
      setAdvisorResume(newResume);
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

  // Fetch user history from all three sources in parallel for AI context enrichment.
  // Each source is individually try/caught — a failed fetch degrades gracefully.
  async function buildUserContext() {
    var lines = [];

    // 1. Full profile
    try {
      var { data: profile } = await supabase.from("profiles")
        .select("full_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country, experience_years, seniority_level, work_arrangement, target_roles, target_salary_band, search_duration, career_goal, skills")
        .eq("id", session.user.id).single();
      if (profile) {
        var p = [];
        if (profile.employment_status) p.push("Employment status: " + profile.employment_status);
        if (profile.current_job) p.push("Current role: " + profile.current_job);
        if (profile.industry) p.push("Industry: " + profile.industry);
        if (profile.job_market_region) p.push("Job market: " + profile.job_market_region + (profile.job_market_country ? ", " + profile.job_market_country : ""));
        if (profile.bio) p.push("Bio: " + profile.bio.slice(0, 300));
        if (profile.experience_years) p.push("Experience: " + profile.experience_years);
        if (profile.seniority_level) p.push("Seniority: " + profile.seniority_level);
        if (profile.target_roles) p.push("Target roles: " + profile.target_roles);
        if (profile.target_salary_band) p.push("Salary target: " + profile.target_salary_band);
        if (profile.search_duration) p.push("Search duration: " + profile.search_duration);
        if (profile.work_arrangement) p.push("Work preference: " + profile.work_arrangement);
        if (profile.career_goal) p.push("Career goal: " + profile.career_goal);
        if (profile.skills) p.push("Skills: " + profile.skills);
        if (p.length) lines.push("PROFILE: " + p.join(" | "));
      }
    } catch (e) {
      // Fall back to cached userProfile state
      if (userProfile) {
        var fb = [];
        if (userProfile.job_market_region) fb.push("Job market: " + userProfile.job_market_region);
        if (userProfile.job_market_country) fb.push("Country: " + userProfile.job_market_country);
        if (fb.length) lines.push("PROFILE: " + fb.join(" | "));
      }
    }

    // 2. Last 5 resume analyses — track score trajectory
    try {
      var { data: prevAnalyses } = await supabase.from("resume_analyses")
        .select("strength_score, fit_score, mode, job_title, next_steps, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (prevAnalyses && prevAnalyses.length > 0) {
        var scoreHistory = prevAnalyses.map(function (a) {
          return a.mode === "general"
            ? "strength " + (a.strength_score || 0)
            : "fit " + (a.fit_score || 0) + (a.job_title ? " for " + a.job_title : "");
        }).join(", ");
        lines.push("PREVIOUS ANALYSES (" + prevAnalyses.length + "): " + scoreHistory);
        // Surface the last recommended next steps so the AI can check for follow-through
        try {
          var lastSteps = typeof prevAnalyses[0].next_steps === "string"
            ? JSON.parse(prevAnalyses[0].next_steps) : (prevAnalyses[0].next_steps || []);
          if (Array.isArray(lastSteps) && lastSteps.length) {
            lines.push("LAST RECOMMENDED NEXT STEPS: " + lastSteps.join("; "));
          }
        } catch (e2) { /* ignore parse error */ }
      }
    } catch (e) { /* non-critical */ }

    // 3. Last 10 ghost scans — reveal targeting patterns
    try {
      var { data: scans } = await supabase.from("ghost_scans")
        .select("company, title, ghost_score, outcome, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (scans && scans.length > 0) {
        var scanLines = scans.slice(0, 6).map(function (s) {
          return (s.title || "Unknown role") + (s.company ? " at " + s.company : "") +
            " (ghost score: " + (s.ghost_score != null ? s.ghost_score : "?") + (s.outcome ? ", outcome: " + s.outcome : "") + ")";
        }).join("; ");
        lines.push("RECENT JOB SCANS (" + scans.length + " total): " + scanLines);
        var uniqueTitles = [];
        scans.forEach(function (s) { if (s.title && !uniqueTitles.includes(s.title)) uniqueTitles.push(s.title); });
        if (uniqueTitles.length) lines.push("ROLES BEING TARGETED: " + uniqueTitles.slice(0, 6).join(", "));
      }
    } catch (e) { /* non-critical */ }

    if (!lines.length) return "";
    return "=== USER CONTEXT (use this to personalize your analysis) ===\n" + lines.join("\n") + "\n===========================================================";
  }

  async function handleCareerCoach() {
    setAnalyzing(true);
    setAnalysisError(null);
    setResult(null);
    try {
      var [resumeRes, profileRes, scansRes, analysesRes] = await Promise.all([
        supabase.from("resumes").select("extracted_text, id").eq("user_id", session.user.id)
          .order("uploaded_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("profiles")
          .select("full_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country, education, experience_years, seniority_level, work_arrangement, target_roles, target_salary_band, search_duration, career_goal, skills")
          .eq("id", session.user.id).single(),
        supabase.from("ghost_scans").select("company, title, ghost_score, outcome")
          .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("resume_analyses").select("strength_score, fit_score, mode, next_steps, created_at")
          .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      var resumeText = resumeRes.data ? resumeRes.data.extracted_text : null;
      var resumeId = resumeRes.data ? resumeRes.data.id : null;
      var profile = profileRes.data || {};
      var scans = scansRes.data || [];
      var priorAnalyses = analysesRes.data || [];

      var ctxLines = [];
      if (profile.employment_status) ctxLines.push("Employment: " + profile.employment_status);
      if (profile.current_job) ctxLines.push("Current role: " + profile.current_job);
      if (profile.industry) ctxLines.push("Industry: " + profile.industry);
      if (profile.education) ctxLines.push("Education: " + profile.education);
      if (profile.job_market_region) ctxLines.push("Market: " + profile.job_market_region + (profile.job_market_state ? ", " + profile.job_market_state : "") + (profile.job_market_country ? ", " + profile.job_market_country : ""));
      if (profile.bio) ctxLines.push("Bio: " + profile.bio.slice(0, 300));
      if (profile.experience_years) ctxLines.push("Experience: " + profile.experience_years);
      if (profile.seniority_level) ctxLines.push("Seniority: " + profile.seniority_level);
      if (profile.target_roles) ctxLines.push("Target roles: " + profile.target_roles);
      if (profile.target_salary_band) ctxLines.push("Salary target: " + profile.target_salary_band);
      if (profile.search_duration) ctxLines.push("Search duration: " + profile.search_duration);
      if (profile.work_arrangement) ctxLines.push("Work preference: " + profile.work_arrangement);
      if (profile.career_goal) ctxLines.push("Career goal: " + profile.career_goal);
      if (profile.skills) ctxLines.push("Skills: " + profile.skills);
      if (scans.length) {
        var scanSummary = scans.map(function (s) {
          return (s.title || "?") + (s.company ? " at " + s.company : "") + " (ghost score: " + (s.ghost_score != null ? s.ghost_score : "?") + (s.outcome ? ", " + s.outcome : "") + ")";
        }).join("; ");
        ctxLines.push("Ghost scans (" + scans.length + "): " + scanSummary);
      }
      if (priorAnalyses.length) {
        var analysisSummary = priorAnalyses.map(function (a) {
          return (a.mode || "unknown") + " score: " + (a.strength_score || a.fit_score || 0);
        }).join(", ");
        ctxLines.push("Prior analyses: " + analysisSummary);
      }

      var ctxBlock = ctxLines.length ? "=== USER CONTEXT ===\n" + ctxLines.join("\n") + "\n===================\n\n" : "";

      var ccPrompt = "You are an expert career coach with 20 years of experience helping professionals navigate job searches. Based on all available context, deliver a personalized career coaching session. Return a JSON object with EXACTLY these fields:\n" +
        "career_stage (string, 3-4 sentences — where is this person in their career, what stage are they at, and what does that mean for how they should be approaching their job search), " +
        "skills_gap (string, 3-4 sentences — what hard and soft skills are they missing based on their resume and target industry that would make them significantly more competitive; be specific about both technical and interpersonal gaps), " +
        "interview_questions (array of exactly 5 objects, each with \"question\" (string — a likely interview question for their target roles) and \"coaching\" (string, 2-3 sentences — concrete advice on how to answer this specific question based on their actual background and experience)), " +
        "salary_intelligence (string, 3-4 sentences — realistic salary ranges for their target roles in their region, how to approach negotiation given their background, and whether their current trajectory positions them above or below median), " +
        "application_patterns (string, 3-4 sentences — based on their scan and application history, identify any patterns: too many ghost listings, too narrow a search, inconsistent role targeting, or other behaviors that may be hurting their results), " +
        "action_plan (array of exactly 4 strings — a concrete week-by-week breakdown; each string should describe specific, actionable steps for that week to meaningfully advance their job search over the next month), " +
        "honest_assessment (string, 3-4 sentences — a direct, no-BS summary of where this person actually stands, what their biggest obstacle is, and the one or two things that will most determine whether their search succeeds or stalls).\n" +
        "Return only valid JSON, no markdown, no code blocks.";

      var userMsg = ctxBlock + (resumeText ? "RESUME:\n" + resumeText : "(No resume on file — provide coaching based on profile context only)");
      var raw = await apiCall([{ role: "user", content: ccPrompt + "\n\n" + userMsg }]);
      var parsed = parseJSON(raw);

      var dbPayload = {
        user_id: session.user.id,
        resume_id: resumeId || (advisorResume ? advisorResume.id : null),
        mode: "career_coach",
        job_listing_text: "",
        fit_score: 0,
        strength_score: 0,
        strength_justification: "",
        career_trajectory: parsed.career_stage || "",
        missing_sections: parsed.skills_gap || "",
        ats_feedback: typeof parsed.interview_questions === "string" ? parsed.interview_questions : JSON.stringify(parsed.interview_questions || []),
        writing_quality: parsed.salary_intelligence || "",
        industry_alignment: parsed.application_patterns || "",
        next_steps: JSON.stringify(parsed.action_plan || []),
        red_flags: parsed.honest_assessment || "",
        formatting_feedback: "", gap_analysis: "", bullet_rewrites: "[]", keyword_gaps: "[]", cover_letter: "",
      };

      var { data: saved, error: dbErr } = await supabase.from("resume_analyses").insert(dbPayload).select().single();
      if (dbErr) throw dbErr;
      setResult(Object.assign({}, saved, {
        next_steps: parsed.action_plan || [],
        ats_feedback: parsed.interview_questions || [],
      }));
      loadAnalyses();
    } catch (err) {
      setAnalysisError("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleJobSearchAdvisor() {
    setAnalyzing(true);
    setAnalysisError(null);
    setResult(null);
    try {
      var [resumeRes, profileRes, scansRes, analysesRes] = await Promise.all([
        supabase.from("resumes").select("extracted_text, id").eq("user_id", session.user.id)
          .order("uploaded_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("profiles")
          .select("full_name, bio, industry, employment_status, current_job, job_market_region, job_market_state, job_market_country, experience_years, seniority_level, work_arrangement, target_roles, target_salary_band, search_duration, career_goal, skills")
          .eq("id", session.user.id).single(),
        supabase.from("ghost_scans").select("company, title, ghost_score, outcome")
          .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("resume_analyses").select("strength_score, fit_score, mode, next_steps")
          .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(3),
      ]);

      var resumeText = resumeRes.data ? resumeRes.data.extracted_text : null;
      var resumeId = resumeRes.data ? resumeRes.data.id : null;
      var profile = profileRes.data || {};
      var scans = scansRes.data || [];
      var priorAnalyses = analysesRes.data || [];

      var ctxLines = [];
      if (profile.employment_status) ctxLines.push("Employment: " + profile.employment_status);
      if (profile.current_job) ctxLines.push("Current role: " + profile.current_job);
      if (profile.industry) ctxLines.push("Industry: " + profile.industry);
      if (profile.job_market_region) ctxLines.push("Market: " + profile.job_market_region + (profile.job_market_state ? ", " + profile.job_market_state : "") + (profile.job_market_country ? ", " + profile.job_market_country : ""));
      if (profile.bio) ctxLines.push("Bio: " + profile.bio.slice(0, 300));
      if (profile.experience_years) ctxLines.push("Experience: " + profile.experience_years);
      if (profile.seniority_level) ctxLines.push("Seniority: " + profile.seniority_level);
      if (profile.target_roles) ctxLines.push("Target roles: " + profile.target_roles);
      if (profile.target_salary_band) ctxLines.push("Salary target: " + profile.target_salary_band);
      if (profile.search_duration) ctxLines.push("Search duration: " + profile.search_duration);
      if (profile.work_arrangement) ctxLines.push("Work preference: " + profile.work_arrangement);
      if (profile.career_goal) ctxLines.push("Career goal: " + profile.career_goal);
      if (profile.skills) ctxLines.push("Skills: " + profile.skills);
      if (scans.length) {
        var scanSummary = scans.map(function (s) {
          return (s.title || "?") + (s.company ? " at " + s.company : "") + " (ghost score: " + (s.ghost_score != null ? s.ghost_score : "?") + (s.outcome ? ", " + s.outcome : "") + ")";
        }).join("; ");
        ctxLines.push("Ghost scans (" + scans.length + "): " + scanSummary);
      }
      if (priorAnalyses.length) {
        var analysisSummary = priorAnalyses.map(function (a) {
          return (a.mode || "unknown") + " score: " + (a.strength_score || a.fit_score || 0);
        }).join(", ");
        ctxLines.push("Prior analyses: " + analysisSummary);
      }

      var ctxBlock = ctxLines.length ? "=== USER CONTEXT ===\n" + ctxLines.join("\n") + "\n===================\n\n" : "";

      var jsaPrompt = "You are an expert job search strategist and career coach. Based on all available context, produce a personalized job search strategy report. Return a JSON object with EXACTLY these fields:\n" +
        "search_readiness_score (integer 0-100 — how ready is this person to be actively applying right now; factor in resume quality, targeting consistency, market conditions, and ghost job exposure), " +
        "search_readiness_justification (string, 2-3 sentences explaining the score), " +
        "target_role_clarity (string, 3-4 sentences — what roles are they realistically positioned for based on their resume and scan history, are they being consistent or scattered in their targeting), " +
        "regional_market_intelligence (string, 3-4 sentences — what is the job market like in their selected region for their industry, what should they know about ghost job prevalence in their field based on their scan data), " +
        "job_board_strategy (string, 3-4 sentences — which job boards to prioritize and deprioritize based on their industry and region, include ghost score awareness and direct application vs. aggregator tradeoffs), " +
        "application_cadence (string, 3-4 sentences — how many applications per week, what mix of reach/target/safety roles, when to follow up, how to pace for sustainability vs. urgency), " +
        "immediate_action_plan (array of exactly 5 strings — specific concrete actions ranked by impact that they should take THIS WEEK, be specific to their situation), " +
        "ghost_job_avoidance (string, 3-4 sentences — specific red flags to watch for in their target industry and region based on GhostBust scan patterns and general ghost job intelligence).\n" +
        "Return only valid JSON, no markdown, no code blocks.";

      var userMsg = ctxBlock + (resumeText ? "RESUME:\n" + resumeText : "(No resume on file — provide advice based on profile context only)");
      var raw = await apiCall([{ role: "user", content: jsaPrompt + "\n\n" + userMsg }]);
      var parsed = parseJSON(raw);

      var dbPayload = {
        user_id: session.user.id,
        resume_id: resumeId || (advisorResume ? advisorResume.id : null),
        mode: "job_search_advisor",
        job_listing_text: "",
        fit_score: parsed.search_readiness_score || 0,
        strength_score: 0,
        strength_justification: parsed.search_readiness_justification || "",
        formatting_feedback: parsed.job_board_strategy || "",
        writing_quality: parsed.application_cadence || "",
        missing_sections: "",
        industry_alignment: parsed.regional_market_intelligence || "",
        career_trajectory: parsed.target_role_clarity || "",
        red_flags: parsed.ghost_job_avoidance || "",
        next_steps: JSON.stringify(parsed.immediate_action_plan || []),
        gap_analysis: "", bullet_rewrites: "[]", keyword_gaps: "[]", ats_feedback: "", cover_letter: "",
      };

      var { data: saved, error: dbErr } = await supabase.from("resume_analyses").insert(dbPayload).select().single();
      if (dbErr) throw dbErr;
      setResult(Object.assign({}, saved, { next_steps: parsed.immediate_action_plan || [] }));
      loadAnalyses();
    } catch (err) {
      setAnalysisError("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAnalyze() {
    if (!advisorResume || !advisorResume.extracted_text) return;
    if (advisorMode === "job_specific" && jobText.trim().length < 50) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setResult(null);
    setShowCLForm(false);
    setCLResult(null);
    var ctx = await buildUserContext();
    try {
      var parsed;
      var dbPayload;

      if (advisorMode === "general") {
        var genPrompt = "You are an expert resume advisor with 20 years of experience reviewing resumes for top companies. Analyze the resume and return a JSON object with EXACTLY these fields:\n" +
          "strength_score (integer 0-100), " +
          "strength_justification (string, 2 sentences explaining the score — if previous scores are in the USER CONTEXT, explicitly note whether this is an improvement or regression), " +
          "formatting_feedback (string, 2-3 sentences on layout/length/section order/density), " +
          "writing_quality (string, 2-3 sentences on action verbs/quantification/passive voice/filler language), " +
          "missing_sections (string, 2-3 sentences on absent or underdeveloped sections: summary/skills/certifications/links/portfolio), " +
          "industry_alignment (string, 2-3 sentences on how well the resume speaks to industry norms and what industry-specific keywords are missing — use the user's industry and targeted roles from USER CONTEXT if available), " +
          "career_trajectory (string, 2-3 sentences on what career story this resume tells — flag any mismatch between what the resume positions the user for and the roles they are actually targeting from ROLES BEING TARGETED in USER CONTEXT), " +
          "red_flags (string, 2-3 sentences on what a recruiter would pause at — gaps/job hopping/vague titles/inconsistencies — write None identified. if none), " +
          "next_steps (array of exactly 3 strings, the highest-impact improvements ranked by importance — if LAST RECOMMENDED NEXT STEPS are in USER CONTEXT, note whether they were addressed).\n" +
          "Return only valid JSON, no markdown, no code blocks.";
        var genMsg = (ctx ? ctx + "\n\n" : "") + "RESUME:\n" + advisorResume.extracted_text;
        var raw = await apiCall([{ role: "user", content: genPrompt + "\n\n" + genMsg }]);
        parsed = parseJSON(raw);
        dbPayload = {
          user_id: session.user.id, resume_id: advisorResume.id,
          mode: "general", job_listing_text: "", fit_score: 0,
          strength_score: parsed.strength_score || 0,
          strength_justification: parsed.strength_justification || "",
          formatting_feedback: parsed.formatting_feedback || "",
          writing_quality: parsed.writing_quality || "",
          missing_sections: parsed.missing_sections || "",
          industry_alignment: parsed.industry_alignment || "",
          career_trajectory: parsed.career_trajectory || "",
          red_flags: parsed.red_flags || "",
          next_steps: JSON.stringify(parsed.next_steps || []),
          gap_analysis: "", bullet_rewrites: "[]", keyword_gaps: "[]", ats_feedback: "", cover_letter: "",
        };

      } else {
        var jobPrompt = "You are an expert resume advisor and ATS optimization specialist. Analyze the resume against the job listing and return a JSON object with EXACTLY these fields:\n" +
          "fit_score (integer 0-100, match to this specific role), " +
          "strength_score (integer 0-100, overall resume quality independent of this job), " +
          "strength_justification (string, 2 sentences — if USER CONTEXT includes prior strength_scores, explicitly note whether the score has improved, declined, or stayed flat since the last analysis and why), " +
          "formatting_feedback (string, 2 sentences), " +
          "writing_quality (string, 2 sentences), " +
          "missing_sections (string, 2 sentences), " +
          "industry_alignment (string, 2 sentences on alignment to this role's industry — if USER CONTEXT includes prior ghost_scans or analyses, note whether this role is consistent with the user's recent targeting pattern or represents a shift), " +
          "career_trajectory (string, 2 sentences relative to this role's requirements — if USER CONTEXT includes ROLES BEING TARGETED, flag any mismatch between what the resume positions them for and the roles they are actively pursuing), " +
          "red_flags (string, 2 sentences or None identified.), " +
          "next_steps (array of exactly 3 strings, highest-impact improvements ranked — if USER CONTEXT includes prior next_steps, check whether the user has addressed those recommendations and open your first item by acknowledging follow-through or lack thereof), " +
          "keyword_gaps (array of strings — up to 15 important keywords from the job listing missing from resume), " +
          "bullet_rewrites (array of 3-5 objects with original and improved fields — pick weakest bullets and rewrite for this role), " +
          "ats_feedback (string, 2-3 sentences of specific ATS optimization tips for this listing), " +
          "cover_letter (string, complete tailored cover letter in 3-4 paragraphs — incorporate the user's background and any relevant details from USER CONTEXT to personalize the opening).\n" +
          "If a USER CONTEXT block is present in the user message, use it to personalize all feedback. Reference specific prior scores, companies scanned, or unaddressed action items where relevant.\n" +
          "Return only valid JSON, no markdown, no code blocks.";
        var jobMsg = (ctx ? ctx + "\n\n" : "") + "RESUME:\n" + advisorResume.extracted_text + "\n\nJOB LISTING:\n" + jobText;
        var raw2 = await apiCall([{ role: "user", content: jobPrompt + "\n\n" + jobMsg }]);
        parsed = parseJSON(raw2);
        dbPayload = {
          user_id: session.user.id, resume_id: advisorResume.id,
          mode: "job_specific", job_listing_text: jobText.slice(0, 8000),
          fit_score: parsed.fit_score || 0,
          strength_score: parsed.strength_score || 0,
          strength_justification: parsed.strength_justification || "",
          formatting_feedback: parsed.formatting_feedback || "",
          writing_quality: parsed.writing_quality || "",
          missing_sections: parsed.missing_sections || "",
          industry_alignment: parsed.industry_alignment || "",
          career_trajectory: parsed.career_trajectory || "",
          red_flags: parsed.red_flags || "",
          next_steps: JSON.stringify(parsed.next_steps || []),
          gap_analysis: "",
          bullet_rewrites: typeof parsed.bullet_rewrites === "string" ? parsed.bullet_rewrites : JSON.stringify(parsed.bullet_rewrites || []),
          keyword_gaps: typeof parsed.keyword_gaps === "string" ? parsed.keyword_gaps : JSON.stringify(parsed.keyword_gaps || []),
          ats_feedback: parsed.ats_feedback || "",
          cover_letter: parsed.cover_letter || "",
        };
      }

      var { data: saved, error: dbErr } = await supabase.from("resume_analyses").insert(dbPayload).select().single();
      if (dbErr) throw dbErr;
      // Merge saved DB record with parsed arrays (DB stores arrays as JSON strings)
      setResult(Object.assign({}, saved, {
        next_steps: parsed.next_steps || [],
        bullet_rewrites: parsed.bullet_rewrites || [],
        keyword_gaps: parsed.keyword_gaps || [],
      }));
      loadAnalyses();
    } catch (err) {
      setAnalysisError("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerateCoverLetter() {
    if (!resume || !resume.extracted_text || !clJobTitle.trim()) return;
    setGeneratingCL(true);
    setCLResult(null);
    try {
      var clPrompt = "You are an expert career coach. Write a professional, engaging, specific cover letter (3-4 paragraphs) based on the candidate's resume and target job information. Do not use placeholder text. Return only the cover letter text — no subject line, no headers.";
      var clMsg = "RESUME:\n" + resume.extracted_text +
        "\n\nTARGET JOB TITLE: " + clJobTitle +
        (clCompany ? "\nCOMPANY: " + clCompany : "");
      var raw = await apiCall([{ role: "user", content: clPrompt + "\n\n" + clMsg }]);
      setCLResult(raw.trim());
      // Patch the saved analysis with the generated cover letter
      if (result && result.id) {
        supabase.from("resume_analyses").update({ cover_letter: raw.trim(), job_title: clJobTitle, company_name: clCompany }).eq("id", result.id).then(function () { loadAnalyses(); });
      }
    } catch (err) {
      setCLResult("Generation failed: " + err.message);
    } finally {
      setGeneratingCL(false);
    }
  }

  function copyCoverLetter(text) {
    navigator.clipboard.writeText(text || "").catch(function () {});
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2500);
  }

  function copyCoverLetterStandalone(text) {
    navigator.clipboard.writeText(text || "").catch(function () {});
    setCopiedCL(true);
    setTimeout(function () { setCopiedCL(false); }, 2500);
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
          <div style={{ marginTop: 28, fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(238,234,224,0.65)", letterSpacing: "0.1em" }}>PRO PLAN — COMING SOON</div>
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
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(238,234,224,0.65)", lineHeight: 1.8 }}>
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
          {/* Career Profile completeness nudge */}
          {userProfile && (() => {
            const careerFields = ["experience_years","seniority_level","work_arrangement","target_roles","target_salary_band","search_duration","career_goal","skills"];
            const filled = careerFields.filter(k => userProfile[k] && String(userProfile[k]).trim()).length;
            if (filled >= 5) return null;
            const pct = Math.round((filled / 8) * 100);
            return (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--bile)", padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: "0.1em", color: "var(--bile)", marginBottom: 3 }}>AI Context: {pct}% Complete</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                    Fill in your Career Profile to get sharper, more personalised AI advice.
                  </div>
                </div>
                <a href="/profile.html" style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--bile)", textDecoration: "none", border: "1px solid var(--bile)", padding: "6px 14px", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Complete Profile →
                </a>
              </div>
            );
          })()}
          {!advisorResume ? (
            <div className="ra-no-resume">
              <div className="ra-no-resume-icon">📄</div>
              <div className="ra-no-resume-title">Upload Your Resume First</div>
              <div className="ra-no-resume-sub" style={{ marginTop: 6 }}>Go to the My Resume tab to upload your resume before running an analysis.</div>
              <button className="run-btn red" style={{ maxWidth: 240, margin: "20px auto 0", display: "block" }} onClick={function () { setInnerTab("manager"); }}>Go to My Resume →</button>
            </div>
          ) : !advisorResume.extracted_text ? (
            <div className="ra-no-resume">
              <div className="ra-no-resume-icon">⚠️</div>
              <div className="ra-no-resume-title">No Text Extracted</div>
              <div className="ra-no-resume-sub" style={{ marginTop: 6 }}>Re-upload your resume — DOCX files give the most accurate text extraction for AI analysis.</div>
              <button className="run-btn red" style={{ maxWidth: 240, margin: "16px auto 0", display: "block" }} onClick={function () { setInnerTab("manager"); }}>Re-upload Resume →</button>
            </div>
          ) : (
            <div>
              {/* ANALYZING: doc selector */}
              {advisorMode !== "job_search_advisor" && (function () {
                var priorForResume = analyses.filter(function (a) { return a.resume_id === advisorResume.id; });
                var isFirst = priorForResume.length === 0;
                var lastDate = !isFirst ? priorForResume[0].created_at : null;
                return (
                  <div className="ra-doc-selector">
                    <div className="ra-doc-selector-label">Analyzing</div>
                    <div className="ra-doc-info">
                      <span className="ra-doc-name">
                        {advisorResume.file_name.toLowerCase().endsWith(".pdf") ? "📕" : "📘"} {advisorResume.file_name}
                      </span>
                      <span className="ra-doc-date">Uploaded {formatDate(advisorResume.uploaded_at)}</span>
                      {isFirst
                        ? <span className="ra-analysis-badge first">First Analysis</span>
                        : <span className="ra-analysis-badge followup">Follow-Up · {formatDate(lastDate)}</span>
                      }
                    </div>
                    {resumes.length > 1 && (
                      <div className="ra-resume-btns">
                        {resumes.map(function (r) {
                          return (
                            <button
                              key={r.id}
                              className={"ra-resume-btn" + (advisorResume.id === r.id ? " active" : "")}
                              onClick={function () { setAdvisorResume(r); setResult(null); setAnalysisError(null); }}
                              title={r.file_name}
                            >
                              {r.file_name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Mode toggle */}
              <div className="ra-mode-toggle">
                <button className={"ra-mode-btn" + (advisorMode === "general" ? " active" : "")} onClick={function () { setAdvisorMode("general"); setResult(null); setAnalysisError(null); }}>
                  📋 General Resume Review
                </button>
                <button className={"ra-mode-btn" + (advisorMode === "job_specific" ? " active" : "")} onClick={function () { setAdvisorMode("job_specific"); setResult(null); setAnalysisError(null); }}>
                  🎯 Job-Specific Analysis
                </button>
                <button className={"ra-mode-btn" + (advisorMode === "job_search_advisor" ? " active" : "")} onClick={function () { setAdvisorMode("job_search_advisor"); setResult(null); setAnalysisError(null); }}>
                  🔍 Job Search Advisor
                </button>
                <button className={"ra-mode-btn" + (advisorMode === "career_coach" ? " active" : "")} onClick={function () { setAdvisorMode("career_coach"); setResult(null); setAnalysisError(null); }}>
                  🎓 Career Coach
                </button>
              </div>

              {/* Mode description */}
              {advisorMode === "general" ? (
                <div style={{ fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: 13, color: "rgba(238,234,224,0.65)", lineHeight: 1.75, marginBottom: 20 }}>
                  Get a full critique of your resume — strength score, formatting, writing quality, missing sections, industry alignment, career trajectory, red flags, and the top 3 changes that will have the highest impact.
                </div>
              ) : advisorMode === "job_specific" ? (
                <div style={{ fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: 13, color: "rgba(238,234,224,0.65)", lineHeight: 1.75, marginBottom: 16 }}>
                  Paste a job listing to get a job fit score, keyword gap analysis, rewritten bullets tailored to the role, ATS optimization tips, and a generated cover letter.
                </div>
              ) : advisorMode === "job_search_advisor" ? (
                <div style={{ fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: 13, color: "rgba(238,234,224,0.65)", lineHeight: 1.75, marginBottom: 20 }}>
                  Get a personalized job search strategy — search readiness score, target role clarity, regional market intelligence, job board recommendations, application cadence, a 5-step action plan, and ghost job avoidance tips tailored to your field.
                </div>
              ) : (
                <div style={{ fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: 13, color: "rgba(238,234,224,0.65)", lineHeight: 1.75, marginBottom: 20 }}>
                  Get a personalized coaching session — career stage assessment, skills gap analysis, 5 likely interview questions with coaching, salary intelligence, application pattern feedback, a 30-day week-by-week action plan, and an honest assessment of where you stand.
                </div>
              )}

              {/* Job listing textarea (job-specific only) */}
              {advisorMode === "job_specific" && (
                <div className="ra-advisor-box" style={{ marginBottom: 16 }}>
                  <textarea
                    className="paste-area"
                    style={{ minHeight: 200, marginTop: 0 }}
                    placeholder="Paste the full job listing here — title, responsibilities, requirements, company description..."
                    value={jobText}
                    onChange={function (e) { setJobText(e.target.value); setResult(null); }}
                  />
                </div>
              )}

              {/* Analyze button */}
              <button
                className="run-btn red"
                onClick={advisorMode === "job_search_advisor" ? handleJobSearchAdvisor : advisorMode === "career_coach" ? handleCareerCoach : handleAnalyze}
                disabled={analyzing || (advisorMode === "job_specific" && jobText.trim().length < 50) || (advisorMode !== "job_search_advisor" && advisorMode !== "career_coach" && !advisorResume)}
              >
                {analyzing
                  ? (advisorMode === "job_search_advisor" ? "Building..." : advisorMode === "career_coach" ? "Coaching..." : "Analysing...")
                  : advisorMode === "general" ? "Analyze My Resume →"
                  : advisorMode === "job_specific" ? "Analyze Against This Job →"
                  : advisorMode === "job_search_advisor" ? "Build My Search Strategy →"
                  : "Start My Coaching Session →"}
              </button>

              {/* Loading */}
              {analyzing && (
                <div className="ra-analyzing">
                  <div className="ra-spin" style={{ margin: "0 auto" }} />
                  <div className="ra-analyzing-title">{advisorMode === "job_search_advisor" ? "Building Your Search Strategy..." : advisorMode === "career_coach" ? "Your Career Coach is Thinking..." : "Analyzing Your Resume..."}</div>
                  <div className="ra-analyzing-sub">{advisorMode === "general" ? "Running full resume review" : advisorMode === "job_specific" ? "Matching against job listing" : advisorMode === "career_coach" ? "Pulling resume, scans, and profile data" : "Pulling scan history, profile, and resume data"}</div>
                </div>
              )}

              {/* Error */}
              {analysisError && <div className="ra-error" style={{ marginTop: 16 }}>{analysisError}</div>}

              {/* Results */}
              {result && !analyzing && (
                <div style={{ marginTop: 28 }}>
                  {result.mode === "job_search_advisor" ? (
                    <JobSearchAdvisorResults data={result} />
                  ) : result.mode === "career_coach" ? (
                    <CareerCoachResults data={result} />
                  ) : (
                    <ComprehensiveResults
                      data={result}
                      onCopy={function () { copyCoverLetter(result.cover_letter); }}
                      copied={copied}
                      onShowCLForm={function () { setShowCLForm(true); }}
                      showCLForm={showCLForm}
                      clJobTitle={clJobTitle}
                      clCompany={clCompany}
                      onCLJobTitle={setCLJobTitle}
                      onCLCompany={setCLCompany}
                      onGenerateCL={handleGenerateCoverLetter}
                      generatingCL={generatingCL}
                      clResult={clResult}
                      onCopyCL={function () { copyCoverLetterStandalone(clResult); }}
                      copiedCL={copiedCL}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {innerTab === "history" && (
        <div>
          {selectedAnalysis ? (
            <div className="ra-history-detail">
              <button className="ra-history-back" onClick={function () { setSelectedAnalysis(null); setCopied(false); }}>← Back to History</button>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: "rgba(238,234,224,0.65)", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span className={"ra-mode-badge " + (selectedAnalysis.mode === "general" ? "general" : selectedAnalysis.mode === "job_search_advisor" ? "search" : selectedAnalysis.mode === "career_coach" ? "coach" : "job")}>
                  {selectedAnalysis.mode === "general" ? "General Review" : selectedAnalysis.mode === "job_search_advisor" ? "Search Strategy" : selectedAnalysis.mode === "career_coach" ? "Career Coach" : "Job-Specific"}
                </span>
                {formatDateTime(selectedAnalysis.created_at)}
                {selectedAnalysis.job_title && selectedAnalysis.mode !== "job_search_advisor" && selectedAnalysis.mode !== "career_coach" && <span>· {selectedAnalysis.job_title}</span>}
                {selectedAnalysis.fit_score > 0 && selectedAnalysis.mode !== "job_search_advisor" && selectedAnalysis.mode !== "career_coach" && <span>· Fit: {selectedAnalysis.fit_score}</span>}
                {selectedAnalysis.strength_score > 0 && selectedAnalysis.mode !== "career_coach" && <span>· Strength: {selectedAnalysis.strength_score}</span>}
                {selectedAnalysis.mode === "job_search_advisor" && selectedAnalysis.fit_score > 0 && <span>· Readiness: {selectedAnalysis.fit_score}</span>}
              </div>
              {selectedAnalysis.mode === "job_search_advisor" ? (
                <JobSearchAdvisorResults data={selectedAnalysis} />
              ) : selectedAnalysis.mode === "career_coach" ? (
                <CareerCoachResults data={selectedAnalysis} />
              ) : (
                <ComprehensiveResults
                  data={selectedAnalysis}
                  onCopy={function () { copyCoverLetter(selectedAnalysis.cover_letter); }}
                  copied={copied}
                  onShowCLForm={function () {}}
                  showCLForm={false}
                  clJobTitle="" clCompany="" onCLJobTitle={function () {}} onCLCompany={function () {}}
                  onGenerateCL={function () {}} generatingCL={false} clResult={null} onCopyCL={function () {}} copiedCL={false}
                />
              )}
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
                  var isJSA = a.mode === "job_search_advisor";
                  var isCC = a.mode === "career_coach";
                  var displayScore = isJSA ? (a.fit_score || 0) : isCC ? 0 : a.mode === "general" ? (a.strength_score || 0) : (a.fit_score || 0);
                  var cls = fitScoreClass(displayScore);
                  var snippet = isJSA
                    ? (a.strength_justification || "Job search strategy report")
                    : isCC
                      ? (a.career_trajectory ? a.career_trajectory.slice(0, 100) : "Career coaching session")
                      : a.mode === "general"
                        ? (a.strength_justification || "General resume review")
                        : (a.job_listing_text ? a.job_listing_text.slice(0, 100) : "Job-specific analysis");
                  var badgeClass = isJSA ? "search" : isCC ? "coach" : a.mode === "general" ? "general" : "job";
                  var badgeLabel = isJSA ? "Search Strategy" : isCC ? "Career Coach" : a.mode === "general" ? "General" : "Job-Specific";
                  return (
                    <div key={a.id} className="ra-history-card" onClick={function () { setSelectedAnalysis(a); setCopied(false); }}>
                      <div className={"ra-history-score " + cls}>{displayScore || "—"}</div>
                      <div className="ra-history-meta">
                        <div style={{ marginBottom: 4 }}>
                          <span className={"ra-mode-badge " + badgeClass}>{badgeLabel}</span>
                          {a.job_title && !isJSA && !isCC && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--paper)", letterSpacing: "0.06em" }}>{a.job_title}</span>}
                        </div>
                        <div className="ra-history-snippet">{snippet}</div>
                        <div className="ra-history-date">{formatDateTime(a.created_at)}</div>
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
