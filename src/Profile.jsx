import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import InboxDrawer from "./InboxDrawer.jsx";
import UserSearch from "./UserSearch.jsx";
import RegionModal from "./RegionModal.jsx";

const STYLE = `
  @import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap");

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --void: #0f0f12;
    --bg: #141417;
    --surface: #1c1c22;
    --surface2: #212128;
    --surface3: #27272f;
    --paper: #f0ece2;
    --paper2: rgba(240,236,226,0.75);
    --muted: rgba(240,236,226,0.45);
    --ghost: #72728a;
    --blood: #cc2200;
    --signal: #00e07a;
    --ice: #00b8d9;
    --bile: #c49500;
    --purple: #863bff;
    --border: rgba(255,255,255,0.07);
    --border-md: rgba(255,255,255,0.12);
    --border-hi: rgba(255,255,255,0.2);
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  html, body { width: 100%; max-width: 100%; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--paper);
    font-family: "Libre Baskerville", Georgia, serif;
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  .sticky-header { position: sticky; top: 0; z-index: 200; width: 100%; max-width: 100%; }
  .ticker-wrap { background: #d42200; overflow: hidden; padding: 8px 0; line-height: 1.5; }
  .ticker-track { display: inline-flex; white-space: nowrap; animation: ticker 36s linear infinite; }
  @keyframes ticker { to { transform: translateX(-50%); } }
  .ticker-item { font-family: "Space Mono", monospace; font-size: 10px; line-height: 1; letter-spacing: 0.18em; text-transform: uppercase; padding: 0 28px; }

  .nav {
    display: flex; align-items: center; gap: 12px; padding: 0 24px; height: 56px;
    background: #070709;
    border-bottom: 1px solid var(--border);
    position: static;
  }
  .nav-logo { font-family: "Bebas Neue", sans-serif; font-size: 24px; color: var(--paper); text-decoration: none; letter-spacing: 0.02em; }
  .nav-logo em { color: var(--blood); font-style: normal; }
  .nav-links { display: flex; gap: 4px; align-items: center; }
  .nav-btn { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: var(--ghost); cursor: pointer; text-decoration: none; transition: color 0.15s, border-color 0.15s; border-radius: 2px; }
  .nav-btn:hover { color: var(--paper); border-color: var(--border); }
  .nav-btn.active { color: var(--paper); border-color: var(--border-md); }
  .nav-signout { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: var(--ghost); cursor: pointer; transition: color 0.15s; }
  .nav-signout:hover { color: #ff4422; }
  .nav-inbox-btn { position: relative; background: none; border: 1px solid transparent; color: var(--ghost); padding: 6px 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 2px; transition: color 0.15s, border-color 0.15s; }
  .nav-inbox-btn:hover { color: var(--paper); border-color: var(--border); }
  .nav-inbox-dot { position: absolute; top: 2px; right: 2px; min-width: 14px; height: 14px; border-radius: 7px; background: var(--blood); font-family: "Space Mono", monospace; font-size: 8px; font-weight: 700; color: var(--paper); display: flex; align-items: center; justify-content: center; padding: 0 3px; pointer-events: none; }

  .gate { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(8px); }
  .gate-card { background: var(--surface); border: 1px solid var(--border-md); max-width: 420px; width: 100%; padding: 52px 44px; text-align: center; box-shadow: 0 20px 80px rgba(0,0,0,0.5); border-radius: 6px; position: relative; overflow: hidden; }
  .gate-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--blood), transparent); }
  .gate-logo { font-family: "Bebas Neue", sans-serif; font-size: 36px; margin-bottom: 4px; letter-spacing: 0.02em; }
  .gate-logo em { color: var(--blood); font-style: normal; }
  .gate-sub { font-family: "Space Mono", monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 32px; }
  .gate-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
  .gate-body { font-size: 13px; color: var(--muted); line-height: 1.75; margin-bottom: 28px; }
  .gate-btn { display: block; background: var(--blood); color: var(--paper); font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.1em; padding: 14px 28px; text-decoration: none; transition: background 0.15s; margin-bottom: 16px; }
  .gate-btn:hover { background: #e02600; }
  .gate-back { font-family: "Space Mono", monospace; font-size: 12px; color: var(--ghost); letter-spacing: 0.1em; text-decoration: none; }
  .gate-back:hover { color: var(--paper); }

  .page { width: 100%; max-width: 960px; margin: 0 auto; padding: 0 24px 100px; box-sizing: border-box; }

  .banner-area { width: 100%; height: 260px; position: relative; background: var(--surface); overflow: hidden; cursor: default; }
  .banner-area.editable { cursor: pointer; }
  .banner-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .banner-default {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #0a0a10 0%, #0e0816 25%, #1a0808 50%, #0c0612 75%, #0a0a10 100%);
    position: relative; overflow: hidden;
  }
  .banner-default::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 70% 100% at 10% 60%, rgba(204,34,0,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 50% 80% at 90% 20%, rgba(134,59,255,0.12) 0%, transparent 55%),
      radial-gradient(ellipse 40% 50% at 50% 90%, rgba(0,184,217,0.08) 0%, transparent 50%),
      radial-gradient(ellipse 30% 40% at 70% 40%, rgba(196,149,0,0.06) 0%, transparent 45%);
    animation: bannerPulse 8s ease-in-out infinite alternate;
  }
  .banner-default::after {
    content: ''; position: absolute; inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 3px);
    pointer-events: none;
  }
  @keyframes bannerPulse {
    0% { opacity: 0.8; }
    100% { opacity: 1; }
  }
  .banner-hover { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  .banner-area.editable:hover .banner-hover { background: rgba(0,0,0,0.45); }
  .banner-hover-label { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--paper); background: rgba(0,0,0,0.7); padding: 8px 16px; border: 1px solid rgba(255,255,255,0.2); opacity: 0; transition: opacity 0.2s; }
  .banner-area.editable:hover .banner-hover-label { opacity: 1; }

  .profile-header { background: var(--surface); border-bottom: none; padding: 0 32px 28px; position: relative; }
  .profile-header::after { content: ''; position: absolute; bottom: 0; left: 32px; right: 32px; height: 1px; background: linear-gradient(90deg, transparent, var(--blood), rgba(134,59,255,0.4), var(--ice), transparent); opacity: 0.3; }

  .tab-bar { display: flex; border-bottom: 1px solid var(--border); background: var(--surface); padding: 0 32px; gap: 0; position: relative; }
  .tab-btn { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; padding: 16px 24px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--ghost); cursor: pointer; transition: color 0.2s, border-color 0.2s; margin-bottom: -1px; position: relative; }
  .tab-btn:hover { color: var(--paper); }
  .tab-btn.active { color: var(--paper); border-bottom-color: var(--blood); }
  .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 20%; right: 20%; height: 2px; background: var(--blood); filter: blur(4px); }
  .tab-content { padding: 32px 0 0; }

  /* Overview tab */
  .overview-card { background: var(--surface); border: 1px solid var(--border); padding: 0; margin-bottom: 20px; overflow: hidden; position: relative; transition: border-color 0.2s; }
  .overview-card:hover { border-color: var(--border-md); }
  .overview-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--blood), rgba(134,59,255,0.5), transparent); opacity: 0.6; }
  .overview-card-title { font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.08em; color: var(--paper); padding: 20px 28px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
  .overview-card-body { padding: 12px 28px 20px; }
  .career-detail-row { display: flex; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border); transition: background 0.1s; }
  .career-detail-row:last-child { border-bottom: none; }
  .career-detail-row:hover { background: rgba(255,255,255,0.015); margin: 0 -28px; padding-left: 28px; padding-right: 28px; }
  .career-detail-label { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ghost); min-width: 160px; padding-top: 3px; }
  .career-detail-value { font-size: 14px; color: var(--paper); flex: 1; line-height: 1.5; }
  .skills-tag-list { display: flex; flex-wrap: wrap; gap: 10px; }
  .skill-tag-ro { font-family: "Space Mono", monospace; font-size: 11px; letter-spacing: 0.06em; padding: 6px 14px; background: rgba(134,59,255,0.08); border: 1px solid rgba(134,59,255,0.2); color: rgba(134,59,255,0.8); transition: border-color 0.15s, background 0.15s; }
  .skill-tag-ro:hover { border-color: rgba(134,59,255,0.4); background: rgba(134,59,255,0.12); }
  .overview-private-note { font-family: "Space Mono", monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.06em; margin-top: 16px; }
  .overview-empty-state { font-size: 14px; color: var(--muted); font-style: italic; padding: 32px 28px; }

  /* Username change card */
  .username-card { background: var(--surface); border: 1px solid var(--border); border-top: 2px solid var(--blood); padding: 24px 28px; margin-bottom: 20px; position: relative; transition: border-color 0.2s; }
  .username-card:hover { border-color: var(--border-md); border-top-color: var(--blood); }
  .username-card-title { font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.06em; color: var(--paper); margin-bottom: 16px; }
  .username-current-lbl { font-family: "Space Mono", monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.06em; margin-bottom: 14px; }
  .username-inp { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: "Space Mono", monospace; font-size: 13px; padding: 10px 14px; outline: none; width: 100%; transition: border-color 0.2s; box-sizing: border-box; }
  .username-inp:focus { border-color: var(--border-hi); }
  .username-feedback { font-size: 12px; margin-top: 8px; line-height: 1.5; }
  .username-feedback.error { color: var(--blood); }
  .username-feedback.success { color: var(--signal); }
  .username-feedback.muted { color: var(--muted); font-style: italic; }
  .username-save-btn { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; padding: 10px 22px; background: none; border: 1px solid var(--border-hi); color: var(--paper); cursor: pointer; margin-top: 14px; transition: background 0.15s, border-color 0.15s; border-radius: 3px; }
  .username-save-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
  .username-save-btn:disabled { opacity: 0.5; cursor: default; }

  /* First-time username modal */
  .umodal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.78); z-index: 8000; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(6px); }
  .umodal { background: var(--surface); border: 1px solid var(--border); border-top: 2px solid var(--blood); max-width: 440px; width: 100%; padding: 40px 36px 32px; border-radius: 6px; box-shadow: 0 16px 64px rgba(0,0,0,0.5); }
  .umodal-title { font-family: "Bebas Neue", sans-serif; font-size: 26px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 10px; }
  .umodal-body { font-size: 13px; color: var(--muted); line-height: 1.75; margin-bottom: 22px; }
  .umodal-inp { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: "Space Mono", monospace; font-size: 14px; padding: 12px 14px; outline: none; width: 100%; transition: border-color 0.2s; box-sizing: border-box; }
  .umodal-inp:focus { border-color: var(--border-hi); }
  .umodal-error { font-size: 12px; color: var(--blood); margin-top: 8px; min-height: 18px; }
  .umodal-actions { display: flex; align-items: center; gap: 16px; margin-top: 20px; }
  .umodal-confirm { font-family: "Bebas Neue", sans-serif; font-size: 17px; letter-spacing: 0.06em; background: var(--blood); color: #fff; border: none; padding: 11px 28px; cursor: pointer; transition: opacity 0.15s; }
  .umodal-confirm:disabled { opacity: 0.5; cursor: default; }
  .umodal-skip { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); background: none; border: none; cursor: pointer; padding: 4px 0; }
  .umodal-skip:hover { color: var(--paper); }

  /* Career Profile tab */
  .completeness-card { background: var(--surface); border: 1px solid var(--border); border-top: 2px solid var(--blood); padding: 24px 28px; margin-bottom: 20px; position: relative; overflow: hidden; }
  .completeness-card::after { content: ''; position: absolute; top: 0; right: 0; width: 120px; height: 120px; background: radial-gradient(circle at top right, rgba(204,34,0,0.06), transparent 70%); pointer-events: none; }
  .completeness-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
  .completeness-title { font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.1em; color: var(--paper); }
  .completeness-pct { font-family: "Bebas Neue", sans-serif; font-size: 36px; color: var(--blood); line-height: 1; }
  .completeness-sub { font-family: "Space Mono", monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.04em; line-height: 1.6; }
  .completeness-bar-track { height: 4px; background: var(--surface3); margin-top: 14px; border-radius: 2px; overflow: hidden; }
  .completeness-bar-fill { height: 100%; background: linear-gradient(90deg, var(--blood), rgba(204,34,0,0.7)); transition: width 0.5s ease; border-radius: 2px; }

  .privacy-card { background: var(--surface); border: 1px solid var(--border); padding: 18px 28px; margin-bottom: 20px; transition: border-color 0.2s; }
  .privacy-card:hover { border-color: var(--border-md); }
  .privacy-trigger { display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-family: "Space Mono", monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.06em; background: none; border: none; width: 100%; text-align: left; padding: 0; transition: color 0.15s; }
  .privacy-trigger:hover { color: var(--paper); }
  .privacy-content { margin-top: 18px; }
  .privacy-list { list-style: none; padding: 0; margin: 0 0 14px 0; }
  .privacy-list li { font-size: 13px; color: var(--muted); padding: 7px 0; border-bottom: 1px solid var(--border); display: flex; gap: 10px; line-height: 1.5; }
  .privacy-list li::before { content: "✕"; color: var(--blood); font-size: 10px; flex-shrink: 0; padding-top: 3px; }
  .privacy-footer { font-size: 12px; color: var(--ghost); line-height: 1.7; font-style: italic; }

  .public-info-card { background: var(--surface); border: 1px solid var(--border); padding: 0; margin-bottom: 20px; overflow: hidden; position: relative; }
  .public-info-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, rgba(0,184,217,0.5), rgba(134,59,255,0.3), transparent); opacity: 0.6; }
  .public-info-title { font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.08em; padding: 20px 28px 16px; border-bottom: 1px solid var(--border); }
  .toggle-field-row { border-bottom: 1px solid var(--border); }
  .toggle-field-row:last-child { border-bottom: none; }
  .toggle-field-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; cursor: pointer; transition: background 0.15s; }
  .toggle-field-header:hover { background: rgba(255,255,255,0.02); }
  .toggle-field-left { flex: 1; min-width: 0; }
  .toggle-field-label { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ghost); margin-bottom: 3px; }
  .toggle-field-value { font-size: 14px; color: var(--paper); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .toggle-field-value.empty { color: var(--ghost); font-style: italic; }
  .toggle-field-help { font-family: "Space Mono", monospace; font-size: 10px; color: var(--muted); letter-spacing: 0.06em; margin-top: 3px; line-height: 1.4; }
  .inline-edit-area { padding: 14px 28px 18px; background: var(--surface2); border-top: 1px solid var(--border); }
  .inline-edit-area .f-input { background: var(--surface3); border: 1px solid var(--border-hi); color: var(--paper); font-size: 14px; padding: 10px 14px; width: 100%; font-family: "Libre Baskerville", serif; box-sizing: border-box; }
  .inline-edit-area .f-input:focus { outline: none; border-color: var(--blood); }
  .inline-char-counter { font-family: "Space Mono", monospace; font-size: 10px; color: var(--muted); text-align: right; margin-top: 6px; letter-spacing: 0.06em; }

  .tag-chip-area { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .tag-chip { display: inline-flex; align-items: center; gap: 8px; font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.04em; padding: 6px 14px; background: rgba(134,59,255,0.08); border: 1px solid rgba(134,59,255,0.2); color: rgba(200,180,255,0.85); border-radius: 3px; transition: background 0.15s; }
  .tag-chip:hover { background: rgba(134,59,255,0.12); }
  .tag-chip-remove { background: none; border: none; color: var(--ghost); cursor: pointer; font-size: 12px; padding: 0; line-height: 1; transition: color 0.15s; }
  .tag-chip-remove:hover { color: var(--blood); }
  .tag-chip-helper { font-family: "Space Mono", monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.04em; }
  .tag-chip-input { background: var(--surface3); border: 1px solid var(--border-hi); color: var(--paper); font-size: 14px; padding: 8px 12px; font-family: "Libre Baskerville", serif; width: 100%; box-sizing: border-box; border-radius: 3px; }
  .tag-chip-input:focus { outline: none; border-color: var(--blood); }
  .tag-chip-input:disabled { opacity: 0.4; cursor: not-allowed; }
  .tag-max-msg { font-family: "Space Mono", monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.04em; margin-top: 6px; }

  .skills-card { background: var(--surface); border: 1px solid var(--border); padding: 0; margin-bottom: 20px; overflow: hidden; position: relative; }
  .skills-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, rgba(134,59,255,0.5), rgba(0,184,217,0.3), transparent); opacity: 0.6; }
  .skills-card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 28px 16px; border-bottom: 1px solid var(--border); }
  .skills-card-title { font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.08em; }
  .skills-card-body { padding: 20px 28px; }

  /* Activity tab */
  .activity-section { margin-bottom: 36px; }
  .activity-section-title { font-family: "Bebas Neue", sans-serif; font-size: 20px; letter-spacing: 0.08em; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .activity-section-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--border-md), transparent); }
  .activity-table { width: 100%; border-collapse: separate; border-spacing: 0 6px; }
  .activity-table th { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); padding: 8px 16px; text-align: left; }
  .activity-table td { font-size: 13px; color: var(--muted); padding: 14px 16px; background: var(--surface); vertical-align: middle; transition: background 0.15s; }
  .activity-table tr:hover td { background: var(--surface2); }
  .activity-table td:first-child { border-left: 1px solid var(--border); border-radius: 4px 0 0 4px; }
  .activity-table td:last-child { border-right: 1px solid var(--border); border-radius: 0 4px 4px 0; }
  .activity-table td { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .activity-empty { font-size: 14px; color: var(--ghost); font-style: italic; padding: 24px 0; }

  .avatar-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; }
  .avatar-wrap { position: relative; margin-top: -60px; }
  .avatar-glow { position: absolute; inset: -4px; border-radius: 50%; background: conic-gradient(from 0deg, var(--blood), rgba(134,59,255,0.5), var(--ice), rgba(196,149,0,0.3), var(--blood)); opacity: 0.4; animation: avatarGlow 6s linear infinite; filter: blur(3px); }
  @keyframes avatarGlow { to { transform: rotate(360deg); } }
  .avatar { width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--surface); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; cursor: default; box-shadow: 0 4px 20px rgba(0,0,0,0.5); z-index: 1; }
  .avatar.editable { cursor: pointer; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-hover { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background 0.2s; z-index: 2; }
  .avatar.editable:hover .avatar-hover { background: rgba(0,0,0,0.55); }
  .avatar-hover-text { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--paper); text-align: center; opacity: 0; transition: opacity 0.2s; line-height: 1.5; }
  .avatar.editable:hover .avatar-hover-text { opacity: 1; }

  .header-actions { display: flex; gap: 8px; align-items: center; padding-bottom: 4px; }

  .profile-name-row { margin-bottom: 6px; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .profile-displayname { font-family: "Bebas Neue", sans-serif; font-size: 32px; color: var(--paper); line-height: 1; letter-spacing: 0.02em; }
  .profile-username { font-family: "Space Mono", monospace; font-size: 14px; color: var(--ghost); letter-spacing: 0.04em; }
  .founding-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: linear-gradient(135deg, rgba(196,152,0,0.15), rgba(196,152,0,0.08));
    border: 1px solid rgba(196,152,0,0.35);
    color: #d4a800; font-family: "Space Mono", monospace; font-size: 10px;
    letter-spacing: 0.18em; text-transform: uppercase; padding: 5px 12px 5px 8px;
    border-radius: 3px; margin-top: 8px; width: fit-content;
    box-shadow: 0 0 12px rgba(196,152,0,0.08);
  }
  .founding-badge-icon { font-size: 12px; line-height: 1; }
  .profile-email { font-family: "Libre Baskerville", Georgia, serif; font-size: 12px; color: var(--ghost); letter-spacing: 0.04em; margin-bottom: 14px; }
  .profile-bio { font-size: 15px; color: var(--paper2); line-height: 1.75; max-width: 600px; margin-bottom: 16px; }
  .profile-bio.empty { color: var(--ghost); font-style: italic; font-size: 14px; }

  .tag-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .tag { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.06em; padding: 6px 14px; border-radius: 3px; border: 1px solid var(--border); color: var(--muted); background: rgba(255,255,255,0.03); transition: background 0.15s, border-color 0.15s; }
  .tag:hover { background: rgba(255,255,255,0.05); border-color: var(--border-md); }
  .tag.green { border-color: rgba(0,224,122,0.3); color: var(--signal); background: rgba(0,224,122,0.06); }
  .tag.green:hover { background: rgba(0,224,122,0.1); }
  .tag.blue { border-color: rgba(0,184,217,0.3); color: var(--ice); background: rgba(0,184,217,0.06); }
  .tag.blue:hover { background: rgba(0,184,217,0.1); }
  .tag.yellow { border-color: rgba(196,149,0,0.3); color: var(--bile); background: rgba(196,149,0,0.06); }
  .tag.yellow:hover { background: rgba(196,149,0,0.1); }

  .member-since { font-family: "Space Mono", monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.12em; text-transform: uppercase; }

  .body-grid { display: grid; grid-template-columns: 1fr 300px; gap: 16px; margin-top: 16px; align-items: start; }
  @media (max-width: 720px) {
    .body-grid { grid-template-columns: 1fr; }
    .profile-header { padding: 0 16px 20px; }
    .profile-header::after { left: 16px; right: 16px; }
    .avatar { width: 100px; height: 100px; }
    .avatar-glow { inset: -3px; }
    .profile-displayname { font-size: 26px; }
    .banner-area { height: 200px; }
    .tab-btn { padding: 14px 16px; font-size: 11px; }
    .follow-row { gap: 16px; }
    .overview-card-body { padding: 12px 20px 16px; }
    .overview-card-title { padding: 16px 20px 12px; }
  }

  .main-col { display: flex; flex-direction: column; gap: 12px; }
  .side-col { display: flex; flex-direction: column; gap: 12px; }

  .card { background: var(--surface); border: 1px solid var(--border); padding: 24px; }
  .card-title { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }

  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .detail-label { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-bottom: 5px; }
  .detail-value { font-size: 14px; color: var(--paper); }
  .detail-value.empty { color: var(--ghost); font-size: 13px; font-style: italic; }

  .stat-list { display: flex; flex-direction: column; }
  .stat-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .stat-row:last-child { border-bottom: none; padding-bottom: 0; }
  .stat-label { font-family: "Space Mono", monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); }
  .stat-value { font-family: "Bebas Neue", sans-serif; font-size: 30px; line-height: 1; }

  .score-bar-section { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
  .score-bar-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .score-bar-lbl { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); }
  .score-bar-track { height: 3px; background: var(--surface3); }
  .score-bar-fill { height: 3px; transition: width 1s ease; }

  .quick-link { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--paper2); text-decoration: none; transition: color 0.15s, padding-left 0.15s; }
  .quick-link:last-child { border-bottom: none; padding-bottom: 0; }
  .quick-link:hover { color: var(--paper); padding-left: 4px; }
  .quick-link-arrow { font-size: 11px; color: var(--ghost); transition: color 0.15s; flex-shrink: 0; }
  .quick-link:hover .quick-link-arrow { color: var(--blood); }

  .btn-primary { background: var(--blood); color: var(--paper); font-family: "Space Mono", monospace; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; border: none; padding: 10px 24px; cursor: pointer; transition: background 0.2s, box-shadow 0.2s; border-radius: 3px; }
  .btn-primary:hover:not(:disabled) { background: #e02600; box-shadow: 0 0 16px rgba(204,34,0,0.25); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-secondary { background: none; border: 1px solid var(--border-md); color: var(--paper2); font-family: "Space Mono", monospace; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; padding: 9px 20px; cursor: pointer; transition: border-color 0.15s, color 0.15s; border-radius: 3px; }
  .btn-secondary:hover { border-color: var(--border-hi); color: var(--paper); }

  .edit-card { background: var(--surface); border: 1px solid var(--border); padding: 28px; }
  .f-group { margin-bottom: 16px; }
  .f-label { display: block; font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); margin-bottom: 7px; }
  .f-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 2px; color: var(--paper); font-family: "Libre Baskerville", Georgia, serif; font-size: 14px; padding: 10px 14px; outline: none; transition: border-color 0.2s; }
  .f-input:focus { border-color: var(--border-md); }
  .f-input::placeholder { color: var(--ghost); }
  .f-textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 2px; color: var(--paper); font-family: "Libre Baskerville", Georgia, serif; font-size: 14px; padding: 10px 14px; outline: none; resize: vertical; min-height: 90px; line-height: 1.65; transition: border-color 0.2s; }
  .f-textarea:focus { border-color: var(--border-md); }
  .f-textarea::placeholder { color: var(--ghost); }
  select.f-input { appearance: none; cursor: pointer; }
  select.f-input option { background: #1c1c22; }
  .f-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
  .divider { height: 1px; background: var(--border); margin: 22px 0; }

  .privacy-section { background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 4px 18px; margin-bottom: 22px; }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid var(--border); }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-label { font-size: 13px; color: var(--paper2); }
  .toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: var(--surface3); border: 1px solid var(--border); cursor: pointer; transition: 0.2s; border-radius: 20px; }
  .toggle input:checked + .toggle-slider { background: var(--blood); border-color: var(--blood); }
  .toggle-slider::before { content: ""; position: absolute; width: 14px; height: 14px; left: 2px; top: 2px; background: var(--ghost); border-radius: 50%; transition: 0.2s; }
  .toggle input:checked + .toggle-slider::before { transform: translateX(16px); background: var(--paper); }

  .avatar-picker { background: var(--surface2); border: 1px solid var(--border-md); padding: 24px; margin: 0 0 20px; box-shadow: var(--shadow); border-radius: 4px; }
  .avatar-picker-title { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); margin-bottom: 16px; }
  .avatar-picker-row { display: flex; gap: 12px; margin-bottom: 18px; }
  .avatar-pick-btn { flex: 1; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); cursor: pointer; font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ghost); transition: border-color 0.15s, color 0.15s; border-radius: 3px; }
  .avatar-pick-btn:hover { border-color: var(--border-hi); color: var(--paper); }
  .color-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
  .color-swatch { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s, transform 0.15s; display: flex; align-items: center; justify-content: center; }
  .color-swatch:hover { transform: scale(1.1); }
  .color-swatch.active { border-color: rgba(255,255,255,0.7); }

  .err-msg { font-family: "Space Mono", monospace; font-size: 12px; color: #ff4422; margin-bottom: 12px; letter-spacing: 0.05em; }
  .ok-msg { font-family: "Space Mono", monospace; font-size: 12px; color: var(--signal); letter-spacing: 0.08em; }
  .loading { color: var(--ghost); font-family: "Space Mono", monospace; font-size: 12px; text-align: center; margin-top: 120px; letter-spacing: 0.2em; }

  /* ---- follow system ---- */
  .follow-row { display: flex; align-items: center; gap: 24px; margin: 8px 0 14px; }
  .follow-stat { display: flex; align-items: baseline; gap: 6px; background: none; border: none; cursor: pointer; padding: 4px 0; transition: opacity 0.15s; }
  .follow-stat:hover { opacity: 0.8; }
  .follow-stat-num { font-family: "Bebas Neue", sans-serif; font-size: 28px; line-height: 1; color: var(--paper); }
  .follow-stat-lbl { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ghost); }
  .follow-divider { width: 1px; height: 24px; background: var(--border-md); }
  .btn-follow { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 22px; border: 1px solid var(--blood); color: var(--blood); background: none; cursor: pointer; border-radius: 3px; transition: background 0.2s, color 0.2s, box-shadow 0.2s; }
  .btn-follow:hover { background: var(--blood); color: var(--paper); box-shadow: 0 0 16px rgba(204,34,0,0.25); }
  .btn-follow.following { border-color: var(--border-md); color: var(--ghost); }
  .btn-follow.following:hover { border-color: #ff4422; color: #ff4422; box-shadow: none; }

  /* ---- follow modal ---- */
  .fmodal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(6px); }
  .fmodal { background: var(--surface); border: 1px solid var(--border-md); width: 380px; max-width: 100%; max-height: 76vh; display: flex; flex-direction: column; box-shadow: 0 16px 64px rgba(0,0,0,0.6); border-radius: 6px; overflow: hidden; }
  .fmodal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .fmodal-title { font-family: "Space Mono", monospace; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--paper); }
  .fmodal-close { background: none; border: none; color: var(--ghost); font-size: 16px; cursor: pointer; padding: 0; line-height: 1; transition: color 0.15s; }
  .fmodal-close:hover { color: #ff4422; }
  .fmodal-list { overflow-y: auto; flex: 1; }
  .fmodal-list::-webkit-scrollbar { width: 4px; }
  .fmodal-list::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 2px; }
  .fmodal-user { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--border); text-decoration: none; transition: background 0.12s; }
  .fmodal-user:hover { background: rgba(255,255,255,0.04); }
  .fmodal-user:last-child { border-bottom: none; }
  .fmodal-username { font-family: "Space Mono", monospace; font-size: 12px; color: var(--paper); letter-spacing: 0.04em; }
  .fmodal-fullname { font-size: 12px; color: var(--ghost); margin-top: 2px; }
  .fmodal-empty { padding: 32px 18px; font-family: "Space Mono", monospace; font-size: 12px; color: var(--ghost); letter-spacing: 0.08em; text-align: center; }

  /* SCROLL REVEAL */
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* PAGE ENTRANCE */
  @keyframes gbFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .profile-root { animation: gbFadeIn 0.6s ease both; }
  .profile-footer { display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; padding: 24px 0 8px; border-top: 1px solid var(--border); margin-top: 60px; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.38); }
  .profile-footer a { color: inherit; text-decoration: none; transition: color 150ms; }
  .profile-footer a:hover { color: rgba(255,255,255,0.75); }
  .profile-footer-sep { opacity: 0.3; }
`;

const TICKER_ITEMS = [
  "Ghost job epidemic — 1 in 5 listings are never filled",
  "Your data trains the GhostBust AI",
  "Helping job seekers fight back since 2026",
  "AI-powered ghost job detection",
];

const EMPLOYMENT_OPTIONS = [
  "Actively job hunting",
  "Open to opportunities",
  "Employed — not looking",
  "Student",
  "Freelance / Contract",
  "Between roles",
];

const AVATAR_COLORS = [
  "#e02200", // red
  "#ff6600", // orange
  "#f5c400", // yellow
  "#1a9e1a", // green
  "#0066cc", // blue
  "#4b0acd", // indigo
  "#8b00cc", // violet
  "#111111", // black
  "#666666", // grey
  "#e8e4da", // white
];

const GHOST_COLORS = [
  "#e8e4da", // cream (default)
  "#ff6600", // orange
  "#f5c400", // yellow
  "#1a9e1a", // green
  "#0066cc", // blue
  "#4b0acd", // indigo
  "#8b00cc", // violet
  "#111111", // black
  "#666666", // grey
  "#ffffff", // white
];

const GhostIcon = ({ size = 64, color = "#eeeae0" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
    <path d="M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z" fill={color} opacity="0.9"/>
    <circle cx="13" cy="14" r="2" fill="#d42200"/>
    <circle cx="19" cy="14" r="2" fill="#d42200"/>
  </svg>
);

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

const SELECT_OPTIONS = {
  employment_status: ["Actively Looking", "Open to Opportunities", "Employed — Not Looking", "Freelancing", "Student", "On a Career Break"],
  experience_years: ["Under 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"],
  seniority_level: ["Intern", "Entry-level", "Mid-level", "Senior", "Lead", "Principal", "Executive"],
  work_arrangement: ["Remote only", "Remote or Hybrid", "Hybrid", "In-office", "Flexible", "No preference"],
  target_salary_band: ["Under $40k", "$40k–$60k", "$60k–$80k", "$80k–$100k", "$100k–$130k", "$130k–$160k", "$160k–$200k", "$200k+", "Prefer not to say"],
  search_duration: ["Just started (< 1 month)", "1–3 months", "3–6 months", "6–12 months", "Over a year", "Not actively searching"],
};

const FIELD_TYPE = {
  employment_status: "select",
  current_job: "input",
  industry: "input",
  education: "input",
  experience_years: "select",
  seniority_level: "select",
  work_arrangement: "select",
  target_roles: "tags",
  target_salary_band: "select",
  search_duration: "select",
  career_goal: "textarea",
  skills: "skills-card",
};

export default function Profile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activityLoaded, setActivityLoaded] = useState(false); // MUST be false — controls lazy-load gate
  const [activityScans, setActivityScans] = useState([]);
  const [activityApps, setActivityApps] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [openEditRow, setOpenEditRow] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [skillTags, setSkillTags] = useState([]);
  const [targetRolesList, setTargetRolesList] = useState([]);
  const [roleInput, setRoleInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const profileSnapshotRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ scans: 0, apps: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [showGate, setShowGate] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [ghostColor, setGhostColor] = useState(GHOST_COLORS[0]);

  // username change
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState(null);
  const [usernameSuccess, setUsernameSuccess] = useState(null);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [modalUsernameInput, setModalUsernameInput] = useState("");
  const [modalUsernameError, setModalUsernameError] = useState(null);
  const [modalUsernameSaving, setModalUsernameSaving] = useState(false);

  // follow system
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(null); // null | "followers" | "following"
  const [followModalUsers, setFollowModalUsers] = useState([]);
  const [followModalLoading, setFollowModalLoading] = useState(false);

  const avatarFileRef = useRef(null);
  const bannerFileRef = useRef(null);
  const mountedRef = useRef(true);

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

  useEffect(() => {
    const urlUser = new URLSearchParams(window.location.search).get("user");
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      if (urlUser) {
        // viewing someone else's public profile (or own via ?user=)
        loadProfileByUsername(urlUser, s?.user?.id);
      } else {
        // own profile page — gate if not signed in
        if (s) { loadProfile(s.user.id); loadStats(s.user.id); }
        else { setShowGate(true); setLoading(false); }
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!urlUser) {
        if (s) { setShowGate(false); loadProfile(s.user.id); loadStats(s.user.id); }
        else { setShowGate(true); setLoading(false); }
      }
    });
    return function(){ mountedRef.current = false; sub.subscription.unsubscribe(); };
  }, []);

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

  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (!mountedRef.current) return;
    if (data) {
      setProfile(data);
      try {
        if (!data.region_set && !sessionStorage.getItem("gb_region_skipped")) setShowRegionModal(true);
      } catch(e) {};
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
      setSkillTags(data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : []);
      setTargetRolesList(data.target_roles ? data.target_roles.split(",").map(s => s.trim()).filter(Boolean) : []);
      profileSnapshotRef.current = { ...newForm };
      try {
        if (data.username?.startsWith("user_") && !sessionStorage.getItem("gb_username_modal_skipped")) {
          setShowUsernameModal(true);
        }
      } catch(e) {}
      if (data.avatar_color) setAvatarColor(data.avatar_color);
      if (data.ghost_color) setGhostColor(data.ghost_color);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
      if (data.banner_url) setBannerUrl(data.banner_url);
      await loadFollowData(uid, uid); // own profile: viewer = owner
    }
    setLoading(false);
  }

  async function loadProfileByUsername(username, currentUserId) {
    const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
    if (p) {
      setProfile(p);
      if (p.avatar_color) setAvatarColor(p.avatar_color);
      if (p.ghost_color) setGhostColor(p.ghost_color);
      if (p.avatar_url) setAvatarUrl(p.avatar_url);
      if (p.banner_url) setBannerUrl(p.banner_url);
      await loadFollowData(p.id, currentUserId);
    }
    setLoading(false);
  }

  async function loadFollowData(targetId, viewerId) {
    const [fc, fg] = await Promise.all([
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", targetId),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", targetId),
    ]);
    setFollowerCount(fc.count || 0);
    setFollowingCount(fg.count || 0);
    if (viewerId && viewerId !== targetId) {
      const { data } = await supabase.from("follows")
        .select("id").eq("follower_id", viewerId).eq("following_id", targetId).maybeSingle();
      setIsFollowing(!!data);
    }
  }

  async function toggleFollow() {
    if (!session || !profile) return;
    const targetId = profile.id;
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
      await supabase.from("follows").delete().eq("follower_id", session.user.id).eq("following_id", targetId);
    } else {
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
      await supabase.from("follows").insert({ follower_id: session.user.id, following_id: targetId });
    }
  }

  async function openFollowModal(type) {
    setShowFollowModal(type);
    setFollowModalLoading(true);
    setFollowModalUsers([]);
    if (!profile) { setFollowModalLoading(false); return; }

    const col = type === "followers" ? "follower_id" : "following_id";
    const filter = type === "followers" ? "following_id" : "follower_id";
    const { data: rows } = await supabase.from("follows").select(col).eq(filter, profile.id);
    const ids = (rows || []).map(r => r[col]);
    if (ids.length === 0) { setFollowModalLoading(false); return; }

    const { data: users } = await supabase.from("profiles")
      .select("id, username, full_name, avatar_url, avatar_color, ghost_color").in("id", ids);
    setFollowModalUsers(users || []);
    setFollowModalLoading(false);
  }

  async function loadStats(uid) {
    const [scans, apps] = await Promise.all([
      supabase.from("ghost_scans").select("ghost_score").eq("user_id", uid),
      supabase.from("applications").select("id").eq("user_id", uid),
    ]);
    const scores = (scans.data || []).map(s => s.ghost_score || 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    setStats({ scans: (scans.data || []).length, apps: (apps.data || []).length, avgScore: avg });
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function validateUsername(val) {
    const v = val.trim();
    if (v.length < 3) return "Username must be at least 3 characters.";
    if (v.length > 20) return "Username must be 20 characters or less.";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Only letters, numbers, and underscores allowed.";
    return null;
  }

  async function applyUsernameChange(val) {
    const trimmed = val.trim();
    const valErr = validateUsername(trimmed);
    if (valErr) return valErr;
    const { data: existing } = await supabase.from("profiles")
      .select("id").eq("username", trimmed).neq("id", session.user.id).maybeSingle();
    if (existing) return "That username is already taken.";
    const now = new Date().toISOString();
    const { error } = await supabase.from("profiles")
      .update({ username: trimmed, username_changed_at: now }).eq("id", session.user.id);
    if (error) return error.message;
    setProfile(p => ({ ...p, username: trimmed, username_changed_at: now }));
    setForm(f => ({ ...f, username: trimmed }));
    profileSnapshotRef.current = { ...profileSnapshotRef.current, username: trimmed };
    return null;
  }

  async function handleChangeUsername() {
    setUsernameError(null); setUsernameSuccess(null); setUsernameSaving(true);
    const err = await applyUsernameChange(usernameInput);
    if (err) { setUsernameError(err); } else { setUsernameSuccess("Username updated."); setUsernameInput(""); }
    setUsernameSaving(false);
  }

  async function handleModalSave() {
    setModalUsernameError(null); setModalUsernameSaving(true);
    const err = await applyUsernameChange(modalUsernameInput);
    if (err) { setModalUsernameError(err); setModalUsernameSaving(false); return; }
    setModalUsernameSaving(false);
    setShowUsernameModal(false);
    try { sessionStorage.setItem("gb_username_modal_skipped", "1"); } catch(e) {}
  }

  function dismissUsernameModal() {
    setShowUsernameModal(false);
    try { sessionStorage.setItem("gb_username_modal_skipped", "1"); } catch(e) {}
  }

  async function handleAvatarFile(e) {
    const file = e.target.files[0];
    if (!file || !session) return;
    const ext = file.name.split('.').pop();
    const path = `${session.user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { console.error('Avatar upload error:', error.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl + '?t=' + Date.now());
    setShowAvatarPicker(false);
  }

  async function handleBannerFile(e) {
    const file = e.target.files[0];
    if (!file || !session) return;
    const ext = file.name.split('.').pop();
    const path = `${session.user.id}/banner.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { console.error('Banner upload error:', error.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setBannerUrl(data.publicUrl + '?t=' + Date.now());
  }

  async function saveProfile() {
    if (!form.username.trim()) { setError("Username is required."); return; }
    setSaving(true); setError(null); setSaved(false);
    const payload = {
      id: session.user.id,
      ...form,
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
      setError((res.error.code === "23505" || res.error.message.includes("unique")) ? "That username is already taken." : res.error.message);
      setSaving(false); return;
    }
    setProfile({ ...payload });
    setSaving(false); setSaved(true);
    setShowAvatarPicker(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const scoreColor = stats.avgScore > 60 ? "#ff4422" : stats.avgScore > 35 ? "#c49500" : "#00e07a";
  const displayName = profile?.show_full_name && profile?.full_name ? profile.full_name : null;
  const isOwnProfile = !profile || !session || profile.id === session.user.id;

  if (loading) return <><style>{STYLE}</style><div className="loading">LOADING...</div></>;

  const OverviewTab = () => {
    const src = isOwnProfile ? form : profile;
    if (!src) return null;

    const publicFields = CAREER_FIELD_LABELS.filter(([key]) => {
      const visKey = VISIBILITY_KEY[key];
      return src[visKey] && src[key] && String(src[key]).trim();
    });

    const filledPrivateCount = isOwnProfile ? CAREER_FIELD_LABELS.filter(([key]) => {
      const visKey = VISIBILITY_KEY[key];
      return !src[visKey] && src[key] && String(src[key]).trim();
    }).length : 0;

    const showSkillsCard = src.show_skills && src.skills && src.skills.trim();
    const skillsForDisplay = showSkillsCard
      ? src.skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];

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
      return null;
    }

    return (
      <>
        {detailFields.length > 0 && (
          <div className="overview-card">
            <div className="overview-card-title">Career Details</div>
            <div className="overview-card-body">
              {detailFields.map(([key, label]) => (
                <div key={key} className="career-detail-row">
                  <span className="career-detail-label">{label}</span>
                  <span className="career-detail-value">{src[key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showSkillsCard && (
          <div className="overview-card">
            <div className="overview-card-title">Skills</div>
            <div className="overview-card-body">
              <div className="skills-tag-list">
                {skillsForDisplay.map(tag => (
                  <span key={tag} className="skill-tag-ro">{tag}</span>
                ))}
              </div>
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

  const CareerProfileTab = () => {
    const filledCount = CAREER_FIELD_LABELS.filter(([key]) => {
      if (key === "skills") return skillTags.length > 0;
      if (key === "target_roles") return targetRolesList.length > 0;
      return form[key] && String(form[key]).trim();
    }).length;
    const completenessPercent = Math.round((filledCount / 12) * 100);

    function addRole(val) {
      const trimmed = val.trim();
      if (!trimmed || targetRolesList.includes(trimmed) || targetRolesList.length >= 3) return;
      setTargetRolesList([...targetRolesList, trimmed]);
      setRoleInput("");
    }
    function handleRoleKeyDown(e) {
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addRole(roleInput); }
    }
    function addSkill(val) {
      const trimmed = val.trim();
      if (!trimmed || skillTags.includes(trimmed) || skillTags.length >= 10) return;
      setSkillTags([...skillTags, trimmed]);
      setSkillInput("");
    }
    function handleSkillKeyDown(e) {
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(skillInput); }
    }

    if (!isOwnProfile) {
      const src = profile;
      if (!src) return null;
      const pubFields = CAREER_FIELD_LABELS.filter(([key]) =>
        key !== "skills" && src[VISIBILITY_KEY[key]] && src[key] && String(src[key]).trim()
      );
      const showSkills = src.show_skills && src.skills && src.skills.trim();
      const pubSkills = showSkills ? src.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
      return (
        <>
          {pubFields.length > 0 && (
            <div className="overview-card">
              <div className="overview-card-title">Career Details</div>
              <div className="overview-card-body">
                {pubFields.map(([key, label]) => (
                  <div key={key} className="career-detail-row">
                    <span className="career-detail-label">{label}</span>
                    <span className="career-detail-value">{src[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showSkills && (
            <div className="overview-card">
              <div className="overview-card-title">Skills</div>
              <div className="overview-card-body">
                <div className="skills-tag-list">
                  {pubSkills.map(tag => <span key={tag} className="skill-tag-ro">{tag}</span>)}
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        {/* Bio */}
        <div className="username-card">
          <div className="username-card-title">Bio</div>
          <textarea
            className="username-inp"
            value={form.bio}
            onChange={e => setField("bio", e.target.value)}
            placeholder="Write a short bio…"
            maxLength={300}
            rows={3}
            style={{ resize: "vertical", lineHeight: 1.6 }}
          />
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--ghost)", marginTop: 4, letterSpacing: "0.04em" }}>{form.bio.length} / 300</div>
        </div>
        {/* Username change */}
        <div className="username-card">
          <div className="username-card-title">Username</div>
          <div className="username-current-lbl">Current: @{profile.username}</div>
          {(() => {
            const changedAt = profile.username_changed_at;
            const cooldownMs = 30 * 24 * 60 * 60 * 1000;
            const elapsed = changedAt ? Date.now() - new Date(changedAt).getTime() : cooldownMs + 1;
            const cooldownActive = elapsed < cooldownMs;
            const daysLeft = cooldownActive ? Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000)) : 0;
            if (cooldownActive) return (
              <div className="username-feedback muted">You can change your username in {daysLeft} day{daysLeft !== 1 ? "s" : ""}.</div>
            );
            return (
              <>
                <input className="username-inp" type="text" value={usernameInput} onChange={e => { setUsernameInput(e.target.value); setUsernameError(null); setUsernameSuccess(null); }} placeholder="New username" maxLength={20} />
                {usernameError && <div className="username-feedback error">{usernameError}</div>}
                {usernameSuccess && <div className="username-feedback success">{usernameSuccess}</div>}
                <button className="username-save-btn" onClick={handleChangeUsername} disabled={usernameSaving || !usernameInput.trim()}>
                  {usernameSaving ? "Saving…" : "Save Username"}
                </button>
              </>
            );
          })()}
        </div>
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

        <div className="privacy-card">
          <button className="privacy-trigger" onClick={() => setPrivacyOpen(v => !v)}>
            <span>GhostBust will never ask for certain information</span>
            <span>{privacyOpen ? "▲" : "▾"}</span>
          </button>
          {privacyOpen && (
            <div className="privacy-content">
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 10, textTransform: "uppercase" }}>We will never ask for:</div>
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

        <div className="public-info-card">
          <div className="public-info-title">Public Info</div>
          {CAREER_FIELD_LABELS.filter(([key]) => key !== "skills").map(([key, label]) => {
            const visKey = VISIBILITY_KEY[key];
            const isOpen = openEditRow === key;
            const value = key === "target_roles"
              ? (targetRolesList.length ? targetRolesList.join(", ") : "")
              : form[key];
            const fieldType = FIELD_TYPE[key];
            const helpText = key === "industry" ? "Hides industry from Career Details. Industry may still appear in your role tag above." : null;
            return (
              <div key={key} className="toggle-field-row">
                <div className="toggle-field-header" onClick={() => setOpenEditRow(isOpen ? null : key)}>
                  <div className="toggle-field-left">
                    <div className="toggle-field-label">{label}</div>
                    <div className={`toggle-field-value${!value ? " empty" : ""}`}>{value || "not set"}</div>
                    {helpText && <div className="toggle-field-help">{helpText}</div>}
                  </div>
                  <label className="toggle" onClick={e => { e.preventDefault(); e.stopPropagation(); setField(visKey, !form[visKey]); }}>
                    <input type="checkbox" checked={form[visKey]} readOnly />
                    <span className="toggle-slider" />
                  </label>
                </div>
                {isOpen && (
                  <div className="inline-edit-area">
                    {fieldType === "select" && (
                      <select className="f-input" value={form[key]} onChange={e => setField(key, e.target.value)} autoFocus>
                        <option value="">Select...</option>
                        {SELECT_OPTIONS[key].map(o => <option key={o}>{o}</option>)}
                      </select>
                    )}
                    {fieldType === "input" && (
                      <input className="f-input" value={form[key]} onChange={e => setField(key, e.target.value)} autoFocus onKeyDown={e => e.key === "Escape" && setOpenEditRow(null)} />
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
                          <input className="tag-chip-input" placeholder="Add role, press Enter or comma" value={roleInput} onChange={e => setRoleInput(e.target.value)} onKeyDown={handleRoleKeyDown} onBlur={() => { if (roleInput.trim()) addRole(roleInput); }} autoFocus />
                        ) : (
                          <div className="tag-max-msg">Maximum 3 roles</div>
                        )}
                      </>
                    )}
                    {fieldType === "textarea" && (
                      <>
                        <textarea className="f-input" value={form[key]} onChange={e => setField(key, e.target.value)} maxLength={200} rows={3} autoFocus onKeyDown={e => e.key === "Escape" && setOpenEditRow(null)} style={{ resize: "vertical" }} />
                        <div className="inline-char-counter">{form[key].length} / 200</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="skills-card">
          <div className="skills-card-header">
            <span className="skills-card-title">Skills</span>
            <label className="toggle" onClick={e => { e.preventDefault(); e.stopPropagation(); setField("show_skills", !form.show_skills); }}>
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
              <input className="tag-chip-input" placeholder="Add skill, press Enter or comma" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown} onBlur={() => { if (skillInput.trim()) addSkill(skillInput); }} />
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
                    <th>Company</th><th>Title</th><th>Ghost Score</th><th>Date</th>
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
                    <th>Title</th><th>Company</th><th>Status</th><th>Date</th>
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

  return (
    <div className="profile-root">
      <style>{STYLE}</style>

      <div className="sticky-header">
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className="ticker-item">{t} &nbsp;◆&nbsp; </span>
            ))}
          </div>
        </div>

        <nav className="nav">
        <a href="/" className="nav-logo">Ghost<em>Bust</em></a>
        <div className="nav-links">
          <a href="/" className="nav-btn">Home</a>
          <a href="/app.html" className="nav-btn">App</a>
          <a href="/community.html" className="nav-btn">Community</a>
          <span className="nav-btn active">Profile</span>
        </div>
        <UserSearch />
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {session && (
            <button className="nav-inbox-btn" title="Inbox" onClick={() => setShowInbox(v => !v)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M1.5 4L8 9.5L14.5 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
              {inboxUnread > 0 && (
                <span className="nav-inbox-dot">{inboxUnread > 9 ? "9+" : inboxUnread}</span>
              )}
            </button>
          )}
          {session && (
            <button className="nav-signout" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          )}
        </div>
      </nav>
      </div>

      {showRegionModal && session && <RegionModal userId={session.user.id} onClose={() => setShowRegionModal(false)} />}

      <InboxDrawer
        session={session}
        myProfile={profile}
        open={showInbox}
        onClose={() => setShowInbox(false)}
        onUnreadChange={setInboxUnread}
      />

      {showGate && !new URLSearchParams(window.location.search).get("user") && (
        <div className="gate">
          <div className="gate-card">
            <div className="gate-logo">Ghost<em>Bust</em></div>
            <div className="gate-sub">AI-Powered Ghost Job Detector</div>
            <div className="gate-title">Sign in to view your profile</div>
            <div className="gate-body">Create a free account to build your GhostBust profile and track your entire job search in one place.</div>
            <a href="/app.html" className="gate-btn">Sign In / Sign Up</a>
            <a href="/" className="gate-back">← Back to Home</a>
          </div>
        </div>
      )}

      <div className="page">

        {/* BANNER */}
        <div
          className={`banner-area${(isOwnProfile && !!session) ? " editable" : ""}`}
          onClick={() => (isOwnProfile && !!session) && bannerFileRef.current?.click()}
        >
          {bannerUrl
            ? <img className="banner-img" src={bannerUrl} alt="" />
            : <div className="banner-default" />
          }
          {(isOwnProfile && !!session) && (
            <div className="banner-hover">
              <span className="banner-hover-label">
                {bannerUrl ? "Change Banner Photo" : "Add Banner Photo"}
              </span>
            </div>
          )}
          <input ref={bannerFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBannerFile} />
        </div>

        {/* PROFILE HEADER */}
        <div className="profile-header">
          <div className="avatar-row">
            <div className="avatar-wrap">
              <div className="avatar-glow" />
              <div
                className={`avatar${(isOwnProfile && !!session) ? " editable" : ""}`}
                style={{ background: avatarUrl ? "transparent" : avatarColor }}
                onClick={() => (isOwnProfile && !!session) && setShowAvatarPicker(p => !p)}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" />
                  : <GhostIcon size={70} color={ghostColor} />
                }
                {(isOwnProfile && !!session) && (
                  <div className="avatar-hover">
                    <span className="avatar-hover-text">CHANGE<br />PHOTO</span>
                  </div>
                )}
              </div>
            </div>
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
          </div>

          {/* AVATAR PICKER */}
          {(isOwnProfile && !!session) && showAvatarPicker && (
            <div className="avatar-picker">
              <div className="avatar-picker-title">Profile Photo</div>
              <div className="avatar-picker-row">
                <button className="avatar-pick-btn" onClick={() => avatarFileRef.current?.click()}>
                  Upload Photo
                </button>
                <button className="avatar-pick-btn" onClick={() => { setAvatarUrl(null); setShowAvatarPicker(false); }}>
                  Use Ghost Logo
                </button>
              </div>
              <div className="f-label" style={{ marginBottom: 10 }}>Background Color</div>
              <div className="color-swatches" style={{ marginBottom: 16 }}>
                {AVATAR_COLORS.map(c => (
                  <div
                    key={c}
                    className={`color-swatch${avatarColor === c ? " active" : ""}`}
                    style={{ background: c }}
                    onClick={() => { setAvatarColor(c); setAvatarUrl(null); }}
                  />
                ))}
              </div>
              <div className="f-label" style={{ marginBottom: 10 }}>Ghost Color</div>
              <div className="color-swatches">
                {GHOST_COLORS.map(c => (
                  <div
                    key={c}
                    className={`color-swatch${ghostColor === c ? " active" : ""}`}
                    style={{ background: c, border: c === "#ffffff" ? "1px solid rgba(255,255,255,0.2)" : undefined }}
                    onClick={() => { setGhostColor(c); setAvatarUrl(null); }}
                  />
                ))}
              </div>
              <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />
            </div>
          )}

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
                <div className="follow-divider" />
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
        </div>

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
          {activeTab === "overview" && OverviewTab()}
          {activeTab === "career" && CareerProfileTab()}
          {activeTab === "activity" && ActivityTab()}
        </div>

      </div>

      {/* FOLLOW MODAL */}
      {showFollowModal && (
        <div className="fmodal-backdrop" onClick={() => setShowFollowModal(null)}>
          <div className="fmodal" onClick={e => e.stopPropagation()}>
            <div className="fmodal-header">
              <span className="fmodal-title">
                {showFollowModal === "followers" ? "Followers" : "Following"}
              </span>
              <button className="fmodal-close" onClick={() => setShowFollowModal(null)}>✕</button>
            </div>
            <div className="fmodal-list">
              {followModalLoading && (
                <div className="fmodal-empty">Loading…</div>
              )}
              {!followModalLoading && followModalUsers.length === 0 && (
                <div className="fmodal-empty">No users yet.</div>
              )}
              {!followModalLoading && followModalUsers.map(u => (
                <a
                  key={u.id}
                  href={`/profile.html?user=${encodeURIComponent(u.username)}`}
                  className="fmodal-user"
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: u.avatar_url ? "transparent" : (u.avatar_color || "#1c1c22"),
                    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                      : <GhostIcon size={24} color={u.ghost_color || "#e8e4da"} />
                    }
                  </div>
                  <div>
                    <div className="fmodal-username">@{u.username}</div>
                    {u.full_name && <div className="fmodal-fullname">{u.full_name}</div>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
      {showUsernameModal && (
        <div className="umodal-backdrop" onClick={dismissUsernameModal}>
          <div className="umodal" onClick={e => e.stopPropagation()}>
            <div className="umodal-title">Set Your Username</div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "20px" }}>
              Your account was created with a temporary username. Pick one that's yours — you can change it later, but only once every 30 days.
            </p>
            <input
              className="username-inp"
              type="text"
              value={modalUsernameInput}
              onChange={e => { setModalUsernameInput(e.target.value); setModalUsernameError(null); }}
              placeholder="New username"
              maxLength={20}
              autoFocus
            />
            {modalUsernameError && <div className="username-feedback error" style={{ marginTop: "8px" }}>{modalUsernameError}</div>}
            <button
              className="umodal-confirm"
              onClick={handleModalSave}
              disabled={modalUsernameSaving || !modalUsernameInput.trim()}
              style={{ marginTop: "18px" }}
            >
              {modalUsernameSaving ? "Saving…" : "Set Username"}
            </button>
            <button className="umodal-skip" onClick={dismissUsernameModal}>Skip for now</button>
          </div>
        </div>
      )}
      <footer className="profile-footer">
        <span>GhostBust</span>
        <span className="profile-footer-sep">·</span>
        <a href="/tos.html">TOS</a>
        <span className="profile-footer-sep">·</span>
        <a href="/privacy.html">Privacy</a>
        <span className="profile-footer-sep">·</span>
        <a href="/roadmap.html">Roadmap</a>
        <span className="profile-footer-sep">·</span>
        <a href="https://mail.google.com/mail/?view=cm&to=ghostbustofficial@gmail.com&su=GhostBust%20Inquiry" target="_blank" rel="noreferrer">ghostbustofficial@gmail.com</a>
      </footer>
    </div>
  );
}
