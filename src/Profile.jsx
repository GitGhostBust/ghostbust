import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  @import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap");
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #111114;
    --surface: #181820;
    --surface2: #1e1e28;
    --surface3: #242432;
    --paper: #eeeae0;
    --muted: rgba(238,234,224,0.5);
    --ghost: #6a6a84;
    --blood: #d42200;
    --signal: #00e67a;
    --ice: #00c8e6;
    --bile: #c99a00;
    --border: rgba(255,255,255,0.08);
    --border-hi: rgba(255,255,255,0.18);
    --bg: #161619;
  }
  html, body { min-height: 100vh; }
  body {
    background: var(--bg);
    color: var(--paper);
    font-family: "DM Sans", sans-serif;
  }

  /* TICKER */
  .ticker-wrap { background: var(--blood); overflow: hidden; padding: 7px 0; }
  .ticker-track { display: inline-flex; white-space: nowrap; animation: ticker 36s linear infinite; }
  @keyframes ticker { to { transform: translateX(-50%); } }
  .ticker-item { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; padding: 0 28px; }

  /* NAV */
  .nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid var(--border); background: var(--void); }
  .nav-logo { font-family: "Bebas Neue", sans-serif; font-size: 26px; color: var(--paper); text-decoration: none; }
  .nav-logo em { color: var(--blood); font-style: normal; }
  .nav-links { display: flex; gap: 10px; align-items: center; }
  .nav-btn { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 7px 13px; border: 1px solid var(--border); background: none; color: var(--ghost); cursor: pointer; text-decoration: none; transition: color 0.2s, border-color 0.2s; }
  .nav-btn:hover { color: var(--paper); border-color: var(--border-hi); }
  .nav-btn.active { color: var(--paper); border-color: rgba(212,34,0,0.6); }

  /* GATE */
  .gate { position: fixed; inset: 0; background: rgba(7,7,9,0.95); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .gate-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); max-width: 400px; width: 100%; padding: 44px; text-align: center; }
  .gate-logo { font-family: "Bebas Neue", sans-serif; font-size: 34px; margin-bottom: 4px; }
  .gate-logo em { color: var(--blood); font-style: normal; }
  .gate-sub { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.2em; margin-bottom: 28px; }
  .gate-title { font-size: 17px; font-weight: 600; margin-bottom: 8px; }
  .gate-body { font-size: 13px; color: var(--muted); line-height: 1.7; margin-bottom: 28px; }

  /* PAGE LAYOUT */
  .page { max-width: 1060px; margin: 0 auto; padding: 0 20px 100px; }

  /* BANNER */
  .banner-wrap {
    position: relative;
    width: 100%;
    height: 220px;
    background: var(--surface2);
    overflow: hidden;
    cursor: pointer;
  }
  .banner-img {
    width: 100%; height: 100%; object-fit: cover;
  }
  .banner-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #1a1a26 0%, #0e0e16 40%, #1a0a08 70%, #2a0a04 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .banner-placeholder::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 20% 60%, rgba(212,34,0,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 80% 30%, rgba(0,200,230,0.06) 0%, transparent 60%);
  }
  .banner-placeholder-text {
    font-family: "Space Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.12);
    position: relative;
    z-index: 1;
    user-select: none;
  }
  .banner-edit-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .banner-wrap:hover .banner-edit-overlay { background: rgba(0,0,0,0.4); }
  .banner-edit-label {
    font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--paper); opacity: 0;
    transition: opacity 0.2s; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3);
    background: rgba(0,0,0,0.6);
  }
  .banner-wrap:hover .banner-edit-label { opacity: 1; }

  /* PROFILE IDENTITY ROW */
  .identity-row {
    display: flex;
    align-items: flex-end;
    gap: 0;
    padding: 0 28px;
    margin-bottom: 0;
    position: relative;
  }

  /* AVATAR */
  .avatar-wrap {
    position: relative;
    margin-top: -48px;
    flex-shrink: 0;
    z-index: 10;
  }
  .avatar {
    width: 96px; height: 96px; border-radius: 50%;
    border: 4px solid var(--bg);
    background: var(--blood);
    display: flex; align-items: center; justify-content: center;
    font-family: "Bebas Neue", sans-serif; font-size: 38px; color: var(--paper);
    overflow: hidden;
    position: relative;
    cursor: pointer;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .avatar:hover .avatar-overlay { background: rgba(0,0,0,0.5); }
  .avatar-overlay-icon {
    font-family: "Space Mono", monospace; font-size: 8px; letter-spacing: 0.1em;
    color: var(--paper); opacity: 0; transition: opacity 0.2s; text-align: center;
  }
  .avatar:hover .avatar-overlay-icon { opacity: 1; }

  .identity-info {
    padding: 12px 0 8px 16px;
    flex: 1;
  }
  .profile-username {
    font-family: "Bebas Neue", sans-serif; font-size: 36px; color: var(--paper); line-height: 1;
    margin-bottom: 2px;
  }
  .profile-name { font-size: 13px; color: var(--ghost); margin-bottom: 2px; }
  .profile-email { font-family: "Space Mono", monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.06em; }

  .identity-actions {
    padding-bottom: 10px;
    display: flex; gap: 8px; align-items: center;
  }

  /* MAIN LAYOUT */
  .profile-body {
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 16px;
    padding: 16px 28px 0;
    align-items: start;
  }
  @media (max-width: 700px) {
    .profile-body { grid-template-columns: 1fr; }
    .identity-row { padding: 0 16px; }
    .profile-body { padding: 16px 16px 0; }
  }

  /* LEFT COLUMN */
  .main-col { display: flex; flex-direction: column; gap: 12px; }

  /* BIO CARD */
  .bio-card {
    background: var(--surface); border: 1px solid var(--border);
    padding: 22px 24px;
  }
  .bio-text { font-size: 14px; color: rgba(238,234,224,0.8); line-height: 1.75; }
  .bio-empty { font-size: 13px; color: var(--ghost); font-style: italic; }

  /* TAG ROW */
  .tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .tag {
    font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.08em;
    padding: 4px 10px; border: 1px solid var(--border);
    color: var(--muted); background: rgba(255,255,255,0.03);
  }
  .tag.ice { border-color: rgba(0,200,230,0.3); color: var(--ice); }
  .tag.signal { border-color: rgba(0,230,122,0.3); color: var(--signal); }
  .tag.bile { border-color: rgba(201,154,0,0.3); color: var(--bile); }
  .tag.blood { border-color: rgba(212,34,0,0.3); color: #ff6644; }

  /* INFO CARD */
  .info-card {
    background: var(--surface); border: 1px solid var(--border);
    padding: 22px 24px;
  }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .info-item {}
  .info-label { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-bottom: 4px; }
  .info-value { font-size: 13px; color: var(--paper); }
  .info-value.empty { color: var(--ghost); font-style: italic; font-size: 12px; }

  /* SECTION HEADER */
  .card-header {
    font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.25em;
    text-transform: uppercase; color: var(--ghost); margin-bottom: 16px;
    padding-bottom: 10px; border-bottom: 1px solid var(--border);
  }

  /* MEMBER SINCE */
  .member-since { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.1em; margin-top: 16px; }

  /* RIGHT SIDEBAR */
  .sidebar { display: flex; flex-direction: column; gap: 12px; }

  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    padding: 20px 22px;
  }
  .stat-row { display: flex; flex-direction: column; gap: 14px; }
  .stat-item { display: flex; align-items: center; justify-content: space-between; }
  .stat-label { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); }
  .stat-value { font-family: "Bebas Neue", sans-serif; font-size: 32px; line-height: 1; }

  .score-bar-wrap { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
  .score-bar-label { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); margin-bottom: 8px; display: flex; justify-content: space-between; }
  .score-bar-track { height: 4px; background: var(--surface3); position: relative; }
  .score-bar-fill { height: 4px; transition: width 0.8s ease; }

  /* BUTTONS */
  .btn-red {
    background: var(--blood); color: var(--paper);
    font-family: "Bebas Neue", sans-serif; font-size: 17px; letter-spacing: 0.08em;
    border: none; padding: 10px 22px; cursor: pointer; transition: background 0.15s;
  }
  .btn-red:hover:not(:disabled) { background: #e52600; }
  .btn-red:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-outline {
    background: none; border: 1px solid var(--border); color: var(--muted);
    font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.1em;
    padding: 8px 16px; cursor: pointer; transition: color 0.2s, border-color 0.2s;
  }
  .btn-outline:hover { color: var(--paper); border-color: var(--border-hi); }

  /* EDIT FORM */
  .edit-panel {
    background: var(--surface); border: 1px solid var(--border);
    padding: 28px;
  }
  .f-input {
    background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 14px;
    padding: 10px 14px; outline: none; width: 100%; margin-bottom: 10px;
    transition: border-color 0.2s;
  }
  .f-input:focus { border-color: var(--border-hi); }
  .f-textarea {
    background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 13px;
    padding: 10px 14px; outline: none; width: 100%; margin-bottom: 10px;
    resize: vertical; min-height: 80px; line-height: 1.6;
  }
  .f-textarea:focus { border-color: var(--border-hi); }
  .field-label {
    font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--ghost); margin-bottom: 6px; display: block;
  }
  select.f-input { appearance: none; cursor: pointer; }
  select.f-input option { background: #1a1a22; color: var(--paper); }

  /* PRIVACY TOGGLES */
  .toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid var(--border);
  }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-label { font-size: 13px; color: var(--muted); }
  .toggle { position: relative; width: 36px; height: 20px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider {
    position: absolute; inset: 0; background: var(--surface3);
    border: 1px solid var(--border); cursor: pointer; transition: 0.2s; border-radius: 20px;
  }
  .toggle input:checked + .toggle-slider { background: var(--blood); border-color: var(--blood); }
  .toggle-slider:before {
    content: ""; position: absolute; width: 14px; height: 14px;
    left: 2px; top: 2px; background: var(--ghost); border-radius: 50%; transition: 0.2s;
  }
  .toggle input:checked + .toggle-slider:before { transform: translateX(16px); background: var(--paper); }

  .err { color: #ff5533; font-size: 12px; margin-bottom: 8px; font-family: "Space Mono", monospace; }
  .success-msg { color: var(--signal); font-size: 11px; font-family: "Space Mono", monospace; letter-spacing: 0.1em; }

  /* PHOTO UPLOAD PANEL */
  .photo-options {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
  }
  .photo-option {
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    padding: 12px; text-align: center; cursor: pointer; transition: border-color 0.2s;
    font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ghost);
  }
  .photo-option:hover { border-color: var(--border-hi); color: var(--paper); }

  /* GHOST AVATAR GRID */
  .ghost-avatars { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 12px; }
  .ghost-avatar-opt {
    width: 100%; aspect-ratio: 1; border-radius: 50%; cursor: pointer;
    border: 2px solid transparent; transition: border-color 0.2s; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-family: "Bebas Neue", sans-serif; font-size: 20px; color: var(--paper);
  }
  .ghost-avatar-opt:hover, .ghost-avatar-opt.selected { border-color: var(--blood); }

  .divider { height: 1px; background: var(--border); margin: 20px 0; }
`;

const TICKER = ["Ghost job epidemic — 1 in 5 listings are never filled","Your data trains the GhostBust AI","Helping job seekers fight back since 2026","AI-powered ghost job detection"];

const EMPLOYMENT_OPTIONS = ["Actively job hunting","Open to opportunities","Employed — not looking","Student","Freelance / Contract","Between roles"];

const GHOST_COLORS = [
  "#d42200","#1a6e8e","#2a6e2a","#6e2a6e","#6e5a00",
  "#3a3a9e","#8e3a00","#006e5e","#5e005e","#004e4e",
];

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

  // Photo state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [avatarColor, setAvatarColor] = useState(GHOST_COLORS[0]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

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
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) { setShowGate(false); loadProfile(s.user.id); loadStats(s.user.id); }
      else { setShowGate(true); setLoading(false); }
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  async function loadProfile(uid) {
    const res = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (res.data) {
      setProfile(res.data);
      setForm({
        username: res.data.username || "",
        full_name: res.data.full_name || "",
        education: res.data.education || "",
        current_job: res.data.current_job || "",
        industry: res.data.industry || "",
        employment_status: res.data.employment_status || "",
        bio: res.data.bio || "",
        show_full_name: res.data.show_full_name || false,
        show_education: res.data.show_education || false,
        show_current_job: res.data.show_current_job || false,
        show_employment_status: res.data.show_employment_status || false,
        show_tracked_jobs: res.data.show_tracked_jobs || false,
      });
      if (res.data.avatar_color) setAvatarColor(res.data.avatar_color);
      if (res.data.avatar_url) setAvatarUrl(res.data.avatar_url);
      if (res.data.banner_url) setBannerUrl(res.data.banner_url);
    } else {
      setEditing(true);
    }
    setLoading(false);
  }

  async function loadStats(uid) {
    const scans = await supabase.from("ghost_scans").select("ghost_score").eq("user_id", uid);
    const apps = await supabase.from("applications").select("id").eq("user_id", uid);
    const scores = (scans.data || []).map(s => s.ghost_score || 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    setStats({ scans: (scans.data || []).length, apps: (apps.data || []).length, avgScore: avg });
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

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
    const payload = {
      id: session.user.id,
      ...form,
      username: form.username.trim(),
      avatar_color: avatarColor,
      avatar_url: avatarUrl || null,
      banner_url: bannerUrl || null,
    };
    const res = await supabase.from("profiles").upsert(payload);
    if (res.error) {
      setError(res.error.message.includes("unique") ? "That username is taken." : res.error.message);
      setSaving(false); return;
    }
    setProfile({ ...form, id: session.user.id, avatar_color: avatarColor, avatar_url: avatarUrl, banner_url: bannerUrl });
    setEditing(false); setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const initial = form.username ? form.username[0].toUpperCase() : "?";

  const scoreColor = stats.avgScore > 60 ? "#ff5533" : stats.avgScore > 35 ? "var(--bile)" : "var(--signal)";

  if (loading) return (
    <>
      <style>{STYLE}</style>
      <div style={{ color: "rgba(238,234,224,0.25)", fontFamily: "Space Mono,monospace", fontSize: 11, textAlign: "center", marginTop: 140, letterSpacing: "0.2em" }}>LOADING...</div>
    </>
  );

  return (
    <>
      <style>{STYLE}</style>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {TICKER.concat(TICKER).map((t, i) => <span key={i} className="ticker-item">{t} ◆ </span>)}
        </div>
      </div>

      {/* NAV */}
      <nav className="nav">
        <a href="/" className="nav-logo">Ghost<em>Bust</em></a>
        <div className="nav-links">
          <a href="/" className="nav-btn">Home</a>
          <a href="/app.html" className="nav-btn">App</a>
          <span className="nav-btn active">Profile</span>
          {session && <button onClick={() => supabase.auth.signOut()} className="nav-btn">Sign Out</button>}
        </div>
      </nav>

      {/* GATE */}
      {showGate && (
        <div className="gate">
          <div className="gate-card">
            <div className="gate-logo">Ghost<em>Bust</em></div>
            <div className="gate-sub">AI-Powered Ghost Job Detector</div>
            <div className="gate-title">Sign in to view profiles</div>
            <div className="gate-body">Create a free GhostBust account to access your personal profile and track your job search.</div>
            <a href="/app.html" style={{ display: "block", background: "var(--blood)", color: "var(--paper)", fontFamily: "Bebas Neue,sans-serif", fontSize: 20, letterSpacing: "0.08em", padding: "13px 28px", textDecoration: "none", marginBottom: 12 }}>SIGN IN / SIGN UP</a>
            <a href="/" style={{ display: "block", fontFamily: "Space Mono,monospace", fontSize: 10, color: "var(--ghost)", letterSpacing: "0.1em", textDecoration: "none", marginTop: 8 }}>← Back to Home</a>
          </div>
        </div>
      )}

      <div className="page">

        {/* BANNER */}
        <div className="banner-wrap" onClick={() => editing && bannerInputRef.current && bannerInputRef.current.click()}>
          {bannerUrl
            ? <img className="banner-img" src={bannerUrl} alt="banner" />
            : <div className="banner-placeholder"><span className="banner-placeholder-text">Click to add a banner photo</span></div>
          }
          {editing && (
            <div className="banner-edit-overlay">
              <span className="banner-edit-label">Change Banner</span>
            </div>
          )}
          <input
            ref={bannerInputRef}
            type="file" accept="image/*"
            style={{ display: "none" }}
            onChange={handleBannerFile}
          />
        </div>

        {/* IDENTITY ROW */}
        <div className="identity-row">
          {/* AVATAR */}
          <div className="avatar-wrap">
            <div className="avatar" style={{ background: avatarColor }} onClick={() => editing && setShowAvatarPicker(p => !p)}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" />
                : initial
              }
              {editing && (
                <div className="avatar-overlay">
                  <span className="avatar-overlay-icon">CHANGE<br/>PHOTO</span>
                </div>
              )}
            </div>
          </div>

          {/* NAME / EMAIL */}
          <div className="identity-info">
            {profile && !editing ? (
              <>
                <div className="profile-username">@{profile.username}</div>
                {profile.show_full_name && profile.full_name && <div className="profile-name">{profile.full_name}</div>}
                <div className="profile-email">{session?.user?.email}</div>
              </>
            ) : (
              <div style={{ paddingTop: 8 }}>
                <div className="profile-email">{session?.user?.email}</div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="identity-actions">
            {profile && !editing && (
              <button className="btn-outline" onClick={() => setEditing(true)}>Edit Profile</button>
            )}
            {saved && <span className="success-msg">✓ Saved</span>}
          </div>
        </div>

        {/* AVATAR PICKER PANEL */}
        {editing && showAvatarPicker && (
          <div style={{ margin: "12px 28px 0", background: "var(--surface)", border: "1px solid var(--border)", padding: "20px" }}>
            <div className="card-header">Choose Profile Photo</div>
            <div className="photo-options">
              <div className="photo-option" onClick={() => avatarInputRef.current && avatarInputRef.current.click()}>
                Upload Photo
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />
              </div>
              <div className="photo-option" onClick={() => { setAvatarUrl(null); setShowAvatarPicker(false); }}>
                Use Ghost Avatar
              </div>
            </div>
            <div className="field-label" style={{ marginBottom: 10 }}>Ghost Avatar Color</div>
            <div className="ghost-avatars">
              {GHOST_COLORS.map(color => (
                <div
                  key={color}
                  className={`ghost-avatar-opt${avatarColor === color ? " selected" : ""}`}
                  style={{ background: color }}
                  onClick={() => { setAvatarColor(color); setAvatarUrl(null); }}
                >
                  {initial}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE BODY */}
        <div className="profile-body">

          {/* LEFT COLUMN */}
          <div className="main-col">

            {/* VIEW MODE */}
            {profile && !editing ? (
              <>
                {/* BIO */}
                <div className="bio-card">
                  <div className="card-header">About</div>
                  {profile.bio
                    ? <p className="bio-text">{profile.bio}</p>
                    : <p className="bio-empty">No bio yet.</p>
                  }
                  {(profile.show_employment_status && profile.employment_status) ||
                   (profile.show_current_job && profile.current_job) ||
                   (profile.show_education && profile.education) ? (
                    <div className="tag-row">
                      {profile.show_employment_status && profile.employment_status && <span className="tag signal">{profile.employment_status}</span>}
                      {profile.show_current_job && profile.current_job && <span className="tag ice">{profile.current_job}{profile.industry ? " · " + profile.industry : ""}</span>}
                      {profile.show_education && profile.education && <span className="tag bile">{profile.education}</span>}
                    </div>
                  ) : null}
                  <div className="member-since" style={{ marginTop: 16 }}>
                    Member since {session && new Date(session.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                </div>

                {/* INFO */}
                <div className="info-card">
                  <div className="card-header">Details</div>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Industry</div>
                      <div className={`info-value${profile.industry ? "" : " empty"}`}>{profile.industry || "Not set"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Role</div>
                      <div className={`info-value${profile.current_job ? "" : " empty"}`}>{profile.current_job || "Not set"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Education</div>
                      <div className={`info-value${profile.education ? "" : " empty"}`}>{profile.education || "Not set"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Status</div>
                      <div className={`info-value${profile.employment_status ? "" : " empty"}`}>{profile.employment_status || "Not set"}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (

              /* EDIT FORM */
              <div className="edit-panel">
                <div className="card-header">Edit Profile</div>

                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Username *</label>
                  <input className="f-input" placeholder="e.g. jobhunter99" value={form.username} onChange={e => setField("username", e.target.value)} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Bio</label>
                  <textarea className="f-textarea" placeholder="Tell other GhostBusters about yourself..." value={form.bio} onChange={e => setField("bio", e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className="field-label">Full Name</label>
                    <input className="f-input" placeholder="Optional" value={form.full_name} onChange={e => setField("full_name", e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Education</label>
                    <input className="f-input" placeholder="e.g. UChicago MAPSS" value={form.education} onChange={e => setField("education", e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Current / Recent Job</label>
                    <input className="f-input" placeholder="e.g. Research Assistant" value={form.current_job} onChange={e => setField("current_job", e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Industry</label>
                    <input className="f-input" placeholder="e.g. Finance, Tech" value={form.industry} onChange={e => setField("industry", e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="field-label">Employment Status</label>
                  <select className="f-input" value={form.employment_status} onChange={e => setField("employment_status", e.target.value)}>
                    <option value="">Select...</option>
                    {EMPLOYMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="divider" />

                <div className="card-header">Privacy — What's Visible to Others</div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "4px 16px", marginBottom: 20 }}>
                  {[
                    ["show_full_name", "Show my full name"],
                    ["show_education", "Show my education"],
                    ["show_current_job", "Show my current job & industry"],
                    ["show_employment_status", "Show my employment status"],
                    ["show_tracked_jobs", "Show my recently tracked jobs"],
                  ].map(([key, label]) => (
                    <div key={key} className="toggle-row">
                      <span className="toggle-label">{label}</span>
                      <label className="toggle">
                        <input type="checkbox" checked={form[key]} onChange={e => setField(key, e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>

                {error && <div className="err">{error}</div>}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="btn-red" onClick={saveProfile} disabled={saving || !form.username.trim()}>
                    {saving ? "SAVING..." : "SAVE PROFILE"}
                  </button>
                  {profile && (
                    <button className="btn-outline" onClick={() => { setEditing(false); setError(null); setShowAvatarPicker(false); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="sidebar">
            <div className="stat-card">
              <div className="card-header">Activity</div>
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-label">Scans Run</span>
                  <span className="stat-value" style={{ color: "var(--paper)" }}>{stats.scans}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Jobs Tracked</span>
                  <span className="stat-value" style={{ color: "var(--paper)" }}>{stats.apps}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Ghost Score</span>
                  <span className="stat-value" style={{ color: scoreColor }}>{stats.avgScore || "—"}</span>
                </div>
              </div>
              {stats.scans > 0 && (
                <div className="score-bar-wrap">
                  <div className="score-bar-label">
                    <span>Ghost Risk</span>
                    <span style={{ color: scoreColor }}>{stats.avgScore}/100</span>
                  </div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${stats.avgScore}%`, background: scoreColor }} />
                  </div>
                </div>
              )}
            </div>

            {/* QUICK LINKS */}
            <div className="stat-card">
              <div className="card-header">Quick Links</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="/app.html" style={{ fontFamily: "Space Mono,monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--ghost)", textDecoration: "none", padding: "8px 0", borderBottom: "1px solid var(--border)", transition: "color 0.2s" }}
                  onMouseOver={e => e.target.style.color = "var(--paper)"}
                  onMouseOut={e => e.target.style.color = "var(--ghost)"}
                >
                  → Ghost Detector
                </a>
                <a href="/app.html#tracker" style={{ fontFamily: "Space Mono,monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--ghost)", textDecoration: "none", padding: "8px 0", borderBottom: "1px solid var(--border)", transition: "color 0.2s" }}
                  onMouseOver={e => e.target.style.color = "var(--paper)"}
                  onMouseOut={e => e.target.style.color = "var(--ghost)"}
                >
                  → Application Tracker
                </a>
                <a href="/app.html#search" style={{ fontFamily: "Space Mono,monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--ghost)", textDecoration: "none", padding: "8px 0", transition: "color 0.2s" }}
                  onMouseOver={e => e.target.style.color = "var(--paper)"}
                  onMouseOut={e => e.target.style.color = "var(--ghost)"}
                >
                  → Job Search
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
