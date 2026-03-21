import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  @import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap");

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

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--paper);
    font-family: "DM Sans", sans-serif;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .ticker-wrap { background: var(--blood); overflow: hidden; padding: 6px 0; position: sticky; top: 0; z-index: 200; }
  .ticker-track { display: inline-flex; white-space: nowrap; animation: ticker 40s linear infinite; }
  @keyframes ticker { to { transform: translateX(-50%); } }
  .ticker-item { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; padding: 0 32px; opacity: 0.9; }

  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 56px;
    background: var(--void);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 27px; z-index: 100;
  }
  .nav-logo { font-family: "Bebas Neue", sans-serif; font-size: 24px; color: var(--paper); text-decoration: none; letter-spacing: 0.02em; }
  .nav-logo em { color: var(--blood); font-style: normal; }
  .nav-links { display: flex; gap: 4px; align-items: center; }
  .nav-btn { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: var(--ghost); cursor: pointer; text-decoration: none; transition: color 0.15s, border-color 0.15s; border-radius: 2px; }
  .nav-btn:hover { color: var(--paper); border-color: var(--border); }
  .nav-btn.active { color: var(--paper); border-color: var(--border-md); }
  .nav-signout { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: var(--ghost); cursor: pointer; transition: color 0.15s; }
  .nav-signout:hover { color: #ff4422; }

  .gate { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
  .gate-card { background: var(--surface); border: 1px solid var(--border-md); max-width: 400px; width: 100%; padding: 48px 40px; text-align: center; box-shadow: var(--shadow); }
  .gate-logo { font-family: "Bebas Neue", sans-serif; font-size: 36px; margin-bottom: 4px; letter-spacing: 0.02em; }
  .gate-logo em { color: var(--blood); font-style: normal; }
  .gate-sub { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 32px; }
  .gate-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
  .gate-body { font-size: 13px; color: var(--muted); line-height: 1.75; margin-bottom: 28px; }
  .gate-btn { display: block; background: var(--blood); color: var(--paper); font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.1em; padding: 14px 28px; text-decoration: none; transition: background 0.15s; margin-bottom: 16px; }
  .gate-btn:hover { background: #e02600; }
  .gate-back { font-family: "Space Mono", monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.1em; text-decoration: none; }
  .gate-back:hover { color: var(--paper); }

  .page { max-width: 1080px; margin: 0 auto; padding: 0 24px 100px; }

  .banner-area { width: 100%; height: 220px; position: relative; background: var(--surface); overflow: hidden; cursor: default; }
  .banner-area.editable { cursor: pointer; }
  .banner-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .banner-default {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #131318 0%, #0e0e16 30%, #180a06 65%, #1e0e04 100%);
    position: relative; overflow: hidden;
  }
  .banner-default::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 55% 80% at 15% 50%, rgba(204,34,0,0.10) 0%, transparent 65%),
      radial-gradient(ellipse 40% 60% at 85% 30%, rgba(134,59,255,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 30% 40% at 60% 80%, rgba(0,184,217,0.04) 0%, transparent 55%);
  }
  .banner-hover { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  .banner-area.editable:hover .banner-hover { background: rgba(0,0,0,0.45); }
  .banner-hover-label { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--paper); background: rgba(0,0,0,0.7); padding: 8px 16px; border: 1px solid rgba(255,255,255,0.2); opacity: 0; transition: opacity 0.2s; }
  .banner-area.editable:hover .banner-hover-label { opacity: 1; }

  .profile-header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 32px 24px; }

  .avatar-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
  .avatar-wrap { position: relative; margin-top: -44px; }
  .avatar { width: 88px; height: 88px; border-radius: 50%; border: 4px solid var(--surface); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; cursor: default; box-shadow: 0 0 0 1px var(--border); }
  .avatar.editable { cursor: pointer; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-hover { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  .avatar.editable:hover .avatar-hover { background: rgba(0,0,0,0.55); }
  .avatar-hover-text { font-family: "Space Mono", monospace; font-size: 7px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--paper); text-align: center; opacity: 0; transition: opacity 0.2s; line-height: 1.5; }
  .avatar.editable:hover .avatar-hover-text { opacity: 1; }

  .header-actions { display: flex; gap: 8px; align-items: center; padding-bottom: 4px; }

  .profile-name-row { margin-bottom: 4px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .profile-displayname { font-size: 22px; font-weight: 700; color: var(--paper); line-height: 1.2; }
  .profile-username { font-family: "Space Mono", monospace; font-size: 13px; color: var(--ghost); letter-spacing: 0.04em; }
  .profile-email { font-family: "Space Mono", monospace; font-size: 11px; color: var(--ghost); letter-spacing: 0.04em; margin-bottom: 12px; }
  .profile-bio { font-size: 14px; color: var(--paper2); line-height: 1.75; max-width: 600px; margin-bottom: 14px; }
  .profile-bio.empty { color: var(--ghost); font-style: italic; font-size: 13px; }

  .tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
  .tag { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.07em; padding: 4px 11px; border-radius: 2px; border: 1px solid var(--border); color: var(--muted); background: rgba(255,255,255,0.03); }
  .tag.green { border-color: rgba(0,224,122,0.25); color: var(--signal); background: rgba(0,224,122,0.05); }
  .tag.blue { border-color: rgba(0,184,217,0.25); color: var(--ice); background: rgba(0,184,217,0.05); }
  .tag.yellow { border-color: rgba(196,149,0,0.25); color: var(--bile); background: rgba(196,149,0,0.05); }

  .member-since { font-family: "Space Mono", monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.06em; }

  .body-grid { display: grid; grid-template-columns: 1fr 300px; gap: 16px; margin-top: 16px; align-items: start; }
  @media (max-width: 720px) {
    .body-grid { grid-template-columns: 1fr; }
    .profile-header { padding: 0 16px 20px; }
  }

  .main-col { display: flex; flex-direction: column; gap: 12px; }
  .side-col { display: flex; flex-direction: column; gap: 12px; }

  .card { background: var(--surface); border: 1px solid var(--border); padding: 24px; }
  .card-title { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }

  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .detail-label { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-bottom: 5px; }
  .detail-value { font-size: 14px; color: var(--paper); }
  .detail-value.empty { color: var(--ghost); font-size: 13px; font-style: italic; }

  .stat-list { display: flex; flex-direction: column; }
  .stat-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .stat-row:last-child { border-bottom: none; padding-bottom: 0; }
  .stat-label { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); }
  .stat-value { font-family: "Bebas Neue", sans-serif; font-size: 30px; line-height: 1; }

  .score-bar-section { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
  .score-bar-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .score-bar-lbl { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); }
  .score-bar-track { height: 3px; background: var(--surface3); }
  .score-bar-fill { height: 3px; transition: width 1s ease; }

  .quick-link { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--paper2); text-decoration: none; transition: color 0.15s, padding-left 0.15s; }
  .quick-link:last-child { border-bottom: none; padding-bottom: 0; }
  .quick-link:hover { color: var(--paper); padding-left: 4px; }
  .quick-link-arrow { font-size: 11px; color: var(--ghost); transition: color 0.15s; flex-shrink: 0; }
  .quick-link:hover .quick-link-arrow { color: var(--blood); }

  .btn-primary { background: var(--blood); color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 600; border: none; padding: 9px 22px; cursor: pointer; transition: background 0.15s; letter-spacing: 0.02em; border-radius: 2px; }
  .btn-primary:hover:not(:disabled) { background: #e02600; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-secondary { background: none; border: 1px solid var(--border-md); color: var(--paper2); font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 500; padding: 8px 18px; cursor: pointer; transition: border-color 0.15s, color 0.15s; border-radius: 2px; }
  .btn-secondary:hover { border-color: var(--border-hi); color: var(--paper); }

  .edit-card { background: var(--surface); border: 1px solid var(--border); padding: 28px; }
  .f-group { margin-bottom: 16px; }
  .f-label { display: block; font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); margin-bottom: 7px; }
  .f-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 2px; color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 14px; padding: 10px 14px; outline: none; transition: border-color 0.2s; }
  .f-input:focus { border-color: var(--border-md); }
  .f-input::placeholder { color: var(--ghost); }
  .f-textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 2px; color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 14px; padding: 10px 14px; outline: none; resize: vertical; min-height: 90px; line-height: 1.65; transition: border-color 0.2s; }
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

  .avatar-picker { background: var(--surface2); border: 1px solid var(--border-md); padding: 20px; margin: 0 0 18px; box-shadow: var(--shadow); }
  .avatar-picker-title { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-bottom: 14px; }
  .avatar-picker-row { display: flex; gap: 10px; margin-bottom: 16px; }
  .avatar-pick-btn { flex: 1; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); cursor: pointer; font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ghost); transition: border-color 0.15s, color 0.15s; }
  .avatar-pick-btn:hover { border-color: var(--border-hi); color: var(--paper); }
  .color-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
  .color-swatch { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s, transform 0.15s; display: flex; align-items: center; justify-content: center; }
  .color-swatch:hover { transform: scale(1.1); }
  .color-swatch.active { border-color: rgba(255,255,255,0.7); }

  .err-msg { font-family: "Space Mono", monospace; font-size: 11px; color: #ff4422; margin-bottom: 12px; letter-spacing: 0.05em; }
  .ok-msg { font-family: "Space Mono", monospace; font-size: 11px; color: var(--signal); letter-spacing: 0.08em; }
  .loading { color: var(--ghost); font-family: "Space Mono", monospace; font-size: 11px; text-align: center; margin-top: 120px; letter-spacing: 0.2em; }
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
  "#863bff","#cc2200","#0077b6","#2d6a4f",
  "#9b2226","#1b4332","#023e8a","#6a0572",
  "#ae2012","#344e41",
];

const GhostIcon = ({ size = 64 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
    <path d="M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z" fill="#eeeae0" opacity="0.85"/>
    <circle cx="13" cy="14" r="2" fill="#d42200"/>
    <circle cx="19" cy="14" r="2" fill="#d42200"/>
  </svg>
);

export default function Profile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ scans: 0, apps: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [showGate, setShowGate] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const avatarFileRef = useRef(null);
  const bannerFileRef = useRef(null);

  const [form, setForm] = useState({
    username: "", full_name: "", education: "", current_job: "",
    industry: "", employment_status: "", bio: "",
    show_full_name: false, show_education: false, show_current_job: false,
    show_employment_status: false, show_tracked_jobs: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      if (s) { loadProfile(s.user.id); loadStats(s.user.id); }
      else { setShowGate(true); setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) { setShowGate(false); loadProfile(s.user.id); loadStats(s.user.id); }
      else { setShowGate(true); setLoading(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) {
      setProfile(data);
      setForm({
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
      });
      if (data.avatar_color) setAvatarColor(data.avatar_color);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
      if (data.banner_url) setBannerUrl(data.banner_url);
    } else {
      setEditing(true);
    }
    setLoading(false);
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

  function handleAvatarFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setAvatarUrl(ev.target.result); setShowAvatarPicker(false); };
    reader.readAsDataURL(file);
  }

  function handleBannerFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBannerUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (!form.username.trim()) { setError("Username is required."); return; }
    setSaving(true); setError(null); setSaved(false);
    const res = await supabase.from("profiles").upsert({
      id: session.user.id,
      ...form,
      username: form.username.trim(),
      avatar_color: avatarColor,
      avatar_url: avatarUrl || null,
      banner_url: bannerUrl || null,
    });
    if (res.error) {
      setError(res.error.message.includes("unique") ? "That username is already taken." : res.error.message);
      setSaving(false); return;
    }
    setProfile({ ...form, id: session.user.id, avatar_color: avatarColor, avatar_url: avatarUrl, banner_url: bannerUrl });
    setEditing(false); setSaving(false); setSaved(true);
    setShowAvatarPicker(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const scoreColor = stats.avgScore > 60 ? "#ff4422" : stats.avgScore > 35 ? "#c49500" : "#00e07a";
  const displayName = profile?.show_full_name && profile?.full_name ? profile.full_name : null;

  if (loading) return <><style>{STYLE}</style><div className="loading">LOADING...</div></>;

  return (
    <>
      <style>{STYLE}</style>

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
          <span className="nav-btn active">Profile</span>
          {session && (
            <button className="nav-signout" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          )}
        </div>
      </nav>

      {showGate && (
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
          className={`banner-area${editing ? " editable" : ""}`}
          onClick={() => editing && bannerFileRef.current?.click()}
        >
          {bannerUrl
            ? <img className="banner-img" src={bannerUrl} alt="" />
            : <div className="banner-default" />
          }
          {editing && (
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
              <div
                className={`avatar${editing ? " editable" : ""}`}
                style={{ background: avatarUrl ? "transparent" : "#070709" }}
                onClick={() => editing && setShowAvatarPicker(p => !p)}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" />
                  : <GhostIcon size={56} />
                }
                {editing && (
                  <div className="avatar-hover">
                    <span className="avatar-hover-text">CHANGE<br />PHOTO</span>
                  </div>
                )}
              </div>
            </div>
            <div className="header-actions">
              {saved && <span className="ok-msg">✓ Saved</span>}
              {profile && !editing && (
                <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
              )}
            </div>
          </div>

          {/* AVATAR PICKER */}
          {editing && showAvatarPicker && (
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
              <div className="color-swatches">
                {AVATAR_COLORS.map(c => (
                  <div
                    key={c}
                    className={`color-swatch${avatarColor === c ? " active" : ""}`}
                    style={{ background: c }}
                    onClick={() => { setAvatarColor(c); setAvatarUrl(null); }}
                  />
                ))}
              </div>
              <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />
            </div>
          )}

          {/* IDENTITY */}
          {profile && !editing ? (
            <>
              <div className="profile-name-row">
                {displayName && <span className="profile-displayname">{displayName}</span>}
                <span className="profile-username">@{profile.username}</span>
              </div>
              <div className="profile-email">{session?.user?.email}</div>
              {profile.bio
                ? <p className="profile-bio">{profile.bio}</p>
                : <p className="profile-bio empty">No bio yet — click Edit Profile to add one.</p>
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
              <div className="member-since">
                Member since {session && new Date(session.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            </>
          ) : (
            <div style={{ paddingTop: 4 }}>
              <div className="profile-email">{session?.user?.email}</div>
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="body-grid">

          {/* LEFT */}
          <div className="main-col">
            {profile && !editing ? (
              <div className="card">
                <div className="card-title">Details</div>
                <div className="details-grid">
                  {[
                    ["Industry", profile.industry],
                    ["Current Role", profile.current_job],
                    ["Education", profile.education],
                    ["Status", profile.employment_status],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="detail-label">{label}</div>
                      <div className={`detail-value${val ? "" : " empty"}`}>{val || "Not set"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="edit-card">
                <div className="card-title">Edit Profile</div>

                <div className="f-group">
                  <label className="f-label">Username *</label>
                  <input className="f-input" placeholder="e.g. jobhunter99" value={form.username} onChange={e => setField("username", e.target.value)} />
                </div>

                <div className="f-group">
                  <label className="f-label">Bio</label>
                  <textarea className="f-textarea" placeholder="Tell other GhostBusters about yourself and your job search..." value={form.bio} onChange={e => setField("bio", e.target.value)} />
                </div>

                <div className="f-row">
                  <div>
                    <label className="f-label">Full Name</label>
                    <input className="f-input" placeholder="Optional" value={form.full_name} onChange={e => setField("full_name", e.target.value)} />
                  </div>
                  <div>
                    <label className="f-label">Education</label>
                    <input className="f-input" placeholder="e.g. B.S. Economics" value={form.education} onChange={e => setField("education", e.target.value)} />
                  </div>
                </div>

                <div className="f-row">
                  <div>
                    <label className="f-label">Current / Recent Role</label>
                    <input className="f-input" placeholder="e.g. Marketing Manager" value={form.current_job} onChange={e => setField("current_job", e.target.value)} />
                  </div>
                  <div>
                    <label className="f-label">Industry</label>
                    <input className="f-input" placeholder="e.g. Finance, Tech, Healthcare" value={form.industry} onChange={e => setField("industry", e.target.value)} />
                  </div>
                </div>

                <div className="f-group">
                  <label className="f-label">Employment Status</label>
                  <select className="f-input" value={form.employment_status} onChange={e => setField("employment_status", e.target.value)}>
                    <option value="">Select...</option>
                    {EMPLOYMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="divider" />

                <div className="card-title" style={{ marginBottom: 14 }}>Privacy</div>
                <div className="privacy-section">
                  {[
                    ["show_full_name", "Show full name on profile"],
                    ["show_education", "Show education"],
                    ["show_current_job", "Show current job & industry"],
                    ["show_employment_status", "Show employment status"],
                    ["show_tracked_jobs", "Show recently tracked jobs"],
                  ].map(([key, label]) => (
                    <div key={key} className="toggle-row">
                      <span className="toggle-label">{label}</span>
                      <label className="toggle">
                        <input type="checkbox" checked={form[key]} onChange={e => setField(key, e.target.checked)} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>

                {error && <div className="err-msg">{error}</div>}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="btn-primary" onClick={saveProfile} disabled={saving || !form.username.trim()}>
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                  {profile && (
                    <button className="btn-secondary" onClick={() => { setEditing(false); setError(null); setShowAvatarPicker(false); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="side-col">
            <div className="card">
              <div className="card-title">Activity</div>
              <div className="stat-list">
                <div className="stat-row">
                  <span className="stat-label">Scans Run</span>
                  <span className="stat-value" style={{ color: "var(--paper)" }}>{stats.scans}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Jobs Tracked</span>
                  <span className="stat-value" style={{ color: "var(--paper)" }}>{stats.apps}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Avg Ghost Score</span>
                  <span className="stat-value" style={{ color: scoreColor }}>{stats.avgScore || "—"}</span>
                </div>
              </div>
              {stats.scans > 0 && (
                <div className="score-bar-section">
                  <div className="score-bar-head">
                    <span className="score-bar-lbl">Ghost Risk Level</span>
                    <span className="score-bar-lbl" style={{ color: scoreColor }}>{stats.avgScore}/100</span>
                  </div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${stats.avgScore}%`, background: scoreColor }} />
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">Tools</div>
              {[
                ["/app.html", "Ghost Detector"],
                ["/app.html", "Application Tracker"],
                ["/app.html", "Job Search"],
              ].map(([href, label]) => (
                <a key={label} href={href} className="quick-link">
                  <span className="quick-link-arrow">→</span>
                  {label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
