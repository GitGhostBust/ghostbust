import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  @import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap");
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #111114; --surface: #1a1a22; --surface2: #1f1f28; --surface3: #242430;
    --paper: #eeeae0; --muted: rgba(238,234,224,0.5); --ghost: #6a6a80;
    --blood: #d42200; --signal: #00e67a; --ice: #00c8e6; --bile: #c99a00;
    --border: rgba(255,255,255,0.09); --border-hi: rgba(255,255,255,0.18);
  }
  body { background: var(--void); color: var(--paper); font-family: "DM Sans", sans-serif; min-height: 100vh; }
  .ticker-wrap { background: var(--blood); overflow: hidden; padding: 7px 0; }
  .ticker-track { display: inline-flex; white-space: nowrap; animation: ticker 36s linear infinite; }
  @keyframes ticker { to { transform: translateX(-50%); } }
  .ticker-item { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; padding: 0 28px; }
  .nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; border-bottom: 1px solid var(--border); }
  .nav-logo { font-family: "Bebas Neue", sans-serif; font-size: 28px; color: var(--paper); text-decoration: none; }
  .nav-logo em { color: var(--blood); font-style: normal; }
  .nav-links { display: flex; gap: 12px; align-items: center; }
  .nav-btn { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 14px; border: 1px solid var(--border); background: none; color: var(--muted); cursor: pointer; text-decoration: none; transition: color 0.2s, border-color 0.2s; }
  .nav-btn:hover { color: var(--paper); border-color: var(--border-hi); }
  .nav-btn.active { color: var(--paper); border-color: var(--blood); }
  .wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px 120px; }
  .profile-hero { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--blood); padding: 36px; margin-bottom: 20px; position: relative; }
  .avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--blood); display: flex; align-items: center; justify-content: center; font-family: "Bebas Neue", sans-serif; font-size: 28px; color: var(--paper); margin-bottom: 16px; }
  .username { font-family: "Bebas Neue", sans-serif; font-size: 40px; color: var(--paper); line-height: 1; margin-bottom: 4px; }
  .user-email { font-family: "Space Mono", monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.08em; margin-bottom: 16px; }
  .bio-text { font-size: 14px; color: var(--muted); line-height: 1.7; margin-bottom: 16px; max-width: 500px; }
  .tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .tag { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.08em; padding: 4px 10px; border: 1px solid var(--border); color: var(--muted); background: rgba(255,255,255,0.03); }
  .tag.ice { border-color: rgba(0,200,230,0.3); color: var(--ice); }
  .tag.signal { border-color: rgba(0,230,122,0.3); color: var(--signal); }
  .tag.bile { border-color: rgba(201,154,0,0.3); color: var(--bile); }
  .member-since { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.1em; }
  .edit-btn { position: absolute; top: 20px; right: 20px; font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--border); background: none; color: var(--ghost); cursor: pointer; transition: color 0.2s; }
  .edit-btn:hover { color: var(--paper); border-color: var(--border-hi); }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-box { background: var(--surface); border: 1px solid var(--border); padding: 20px; text-align: center; }
  .stat-num { font-family: "Bebas Neue", sans-serif; font-size: 42px; color: var(--paper); line-height: 1; }
  .stat-lbl { font-family: "Space Mono", monospace; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-top: 4px; }
  .section { background: var(--surface); border: 1px solid var(--border); padding: 24px; margin-bottom: 20px; }
  .section-title { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--ghost); margin-bottom: 16px; }
  .f-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 14px; padding: 10px 14px; outline: none; width: 100%; margin-bottom: 10px; transition: border-color 0.2s; }
  .f-input:focus { border-color: var(--border-hi); }
  .f-textarea { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 13px; padding: 10px 14px; outline: none; width: 100%; margin-bottom: 10px; resize: vertical; min-height: 80px; line-height: 1.6; }
  .f-textarea:focus { border-color: var(--border-hi); }
  .field-label { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); margin-bottom: 6px; display: block; }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-label { font-size: 13px; color: var(--muted); }
  .toggle { position: relative; width: 36px; height: 20px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: var(--surface3); border: 1px solid var(--border); cursor: pointer; transition: 0.2s; border-radius: 20px; }
  .toggle input:checked + .toggle-slider { background: var(--blood); border-color: var(--blood); }
  .toggle-slider:before { content: ""; position: absolute; width: 14px; height: 14px; left: 2px; top: 2px; background: var(--ghost); border-radius: 50%; transition: 0.2s; }
  .toggle input:checked + .toggle-slider:before { transform: translateX(16px); background: var(--paper); }
  .btn-red { background: var(--blood); color: var(--paper); font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 12px 28px; cursor: pointer; transition: background 0.15s; }
  .btn-red:hover:not(:disabled) { background: #e52600; }
  .btn-red:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-ghost { background: none; border: 1px solid var(--border); color: var(--muted); font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.1em; padding: 8px 16px; cursor: pointer; margin-left: 10px; transition: color 0.2s; }
  .btn-ghost:hover { color: var(--paper); border-color: var(--border-hi); }
  .err { color: var(--blood); font-size: 12px; margin-bottom: 8px; font-family: "Space Mono", monospace; }
  .success { color: var(--signal); font-size: 12px; margin-bottom: 8px; font-family: "Space Mono", monospace; }
  .gate { position: fixed; inset: 0; background: rgba(7,7,9,0.95); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .gate-card { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--blood); max-width: 420px; width: 100%; padding: 40px; text-align: center; }
  .gate-logo { font-family: "Bebas Neue", sans-serif; font-size: 32px; margin-bottom: 4px; }
  .gate-logo em { color: var(--blood); font-style: normal; }
  .gate-sub { font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost); letter-spacing: 0.2em; margin-bottom: 24px; }
  .gate-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
  .gate-body { font-size: 13px; color: var(--muted); line-height: 1.7; margin-bottom: 28px; }
  select.f-input { appearance: none; cursor: pointer; }
  select.f-input option { background: #1a1a22; color: var(--paper); }
`;

const TICKER = ["Ghost job epidemic — 1 in 5 listings are never filled","Your data trains the GhostBust AI","Helping job seekers fight back since 2026","AI-powered ghost job detection"];

const EMPLOYMENT_OPTIONS = ["Actively job hunting","Open to opportunities","Employed — not looking","Student","Freelance / Contract","Between roles"];

export default function Profile() {
  var [session, setSession] = useState(null);
  var [profile, setProfile] = useState(null);
  var [editing, setEditing] = useState(false);
  var [saving, setSaving] = useState(false);
  var [saved, setSaved] = useState(false);
  var [error, setError] = useState(null);
  var [stats, setStats] = useState({ scans: 0, apps: 0, avgScore: 0 });
  var [loading, setLoading] = useState(true);
  var [showGate, setShowGate] = useState(false);

  var [form, setForm] = useState({
    username: "", full_name: "", education: "", current_job: "",
    industry: "", employment_status: "", bio: "",
    show_full_name: false, show_education: false, show_current_job: false,
    show_employment_status: false, show_tracked_jobs: false,
  });

  useEffect(function() {
    supabase.auth.getSession().then(function(d) {
      var s = d.data.session;
      setSession(s);
      if (s) { loadProfile(s.user.id); loadStats(s.user.id); }
      else { setShowGate(true); setLoading(false); }
    });
    var sub = supabase.auth.onAuthStateChange(function(_e, s) {
      setSession(s);
      if (s) { setShowGate(false); loadProfile(s.user.id); loadStats(s.user.id); }
      else { setShowGate(true); setLoading(false); }
    });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  async function loadProfile(uid) {
    var res = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (res.data) {
      setProfile(res.data);
      setForm({
        username: res.data.username||"",
        full_name: res.data.full_name||"",
        education: res.data.education||"",
        current_job: res.data.current_job||"",
        industry: res.data.industry||"",
        employment_status: res.data.employment_status||"",
        bio: res.data.bio||"",
        show_full_name: res.data.show_full_name||false,
        show_education: res.data.show_education||false,
        show_current_job: res.data.show_current_job||false,
        show_employment_status: res.data.show_employment_status||false,
        show_tracked_jobs: res.data.show_tracked_jobs||false,
      });
    } else { setEditing(true); }
    setLoading(false);
  }

  async function loadStats(uid) {
    var scans = await supabase.from("ghost_scans").select("ghost_score").eq("user_id", uid);
    var apps = await supabase.from("applications").select("id").eq("user_id", uid);
    var scores = (scans.data||[]).map(function(s){ return s.ghost_score||0; });
    var avg = scores.length > 0 ? Math.round(scores.reduce(function(a,b){ return a+b; },0)/scores.length) : 0;
    setStats({ scans: (scans.data||[]).length, apps: (apps.data||[]).length, avgScore: avg });
  }

  function setField(key, val) { setForm(function(f){ return Object.assign({}, f, {[key]: val}); }); }

  async function saveProfile() {
    if (!form.username.trim()) { setError("Username is required."); return; }
    setSaving(true); setError(null); setSaved(false);
    var res = await supabase.from("profiles").upsert({ id: session.user.id, ...form, username: form.username.trim() });
    if (res.error) {
      setError(res.error.message.includes("unique") ? "That username is taken. Try another." : res.error.message);
      setSaving(false); return;
    }
    setProfile({ ...form, id: session.user.id });
    setEditing(false); setSaving(false); setSaved(true);
    setTimeout(function(){ setSaved(false); }, 3000);
  }

  var initial = form.username ? form.username[0].toUpperCase() : "?";

  if (loading) return (<><style>{STYLE}</style><div style={{color:"rgba(238,234,224,0.3)",fontFamily:"Space Mono,monospace",fontSize:12,textAlign:"center",marginTop:120}}>LOADING...</div></>);

  return (
    <>
      <style>{STYLE}</style>
      <div className="ticker-wrap"><div className="ticker-track">{TICKER.concat(TICKER).map(function(t,i){return <span key={i} className="ticker-item">{t} ◆ </span>;})}</div></div>
      <nav className="nav">
        <a href="/" className="nav-logo">Ghost<em>Bust</em></a>
        <div className="nav-links">
          <a href="/" className="nav-btn">Home</a>
          <a href="/app.html" className="nav-btn">App</a>
          <span className="nav-btn active">My Profile</span>
          {session && <button onClick={function(){supabase.auth.signOut();}} className="nav-btn">Sign Out</button>}
        </div>
      </nav>

      {showGate && (
        <div className="gate">
          <div className="gate-card">
            <div className="gate-logo">Ghost<em>Bust</em></div>
            <div className="gate-sub">AI-Powered Ghost Job Detector</div>
            <div className="gate-title">Sign in to view profiles</div>
            <div className="gate-body">Create a free GhostBust account to access your personal profile page and track your job search.</div>
            <a href="/app.html" style={{display:"block",background:"var(--blood)",color:"var(--paper)",fontFamily:"Bebas Neue,sans-serif",fontSize:20,letterSpacing:"0.08em",padding:"12px 28px",textDecoration:"none",marginBottom:12}}>SIGN IN / SIGN UP</a>
            <a href="/" style={{display:"block",fontFamily:"Space Mono,monospace",fontSize:10,color:"var(--ghost)",letterSpacing:"0.1em",textDecoration:"none",marginTop:8}}>← Back to Home</a>
          </div>
        </div>
      )}

      <div className="wrap">
        <div className="profile-hero">
          <div className="avatar">{initial}</div>
          {profile && !editing ? (
            <>
              <div className="username">@{profile.username}</div>
              <div className="user-email">{session&&session.user.email}</div>
              {profile.bio && <div className="bio-text">{profile.bio}</div>}
              <div className="tag-row">
                {profile.show_employment_status && profile.employment_status && <span className="tag signal">{profile.employment_status}</span>}
                {profile.show_current_job && profile.current_job && <span className="tag ice">{profile.current_job}{profile.industry ? " · "+profile.industry : ""}</span>}
                {profile.show_education && profile.education && <span className="tag bile">{profile.education}</span>}
                {profile.show_full_name && profile.full_name && <span className="tag">{profile.full_name}</span>}
              </div>
              <div className="member-since">Member since {session&&new Date(session.user.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
              <button className="edit-btn" onClick={function(){setEditing(true);}}>Edit Profile</button>
            </>
          ) : (
            <>
              <div className="section-title" style={{marginBottom:16}}>{profile ? "Edit Your Profile" : "Set Up Your Profile"}</div>

              <div style={{marginBottom:12}}>
                <label className="field-label">Username *</label>
                <input className="f-input" placeholder="e.g. jobhunter99" value={form.username} onChange={function(e){setField("username",e.target.value);}} />
              </div>
              <div style={{marginBottom:12}}>
                <label className="field-label">Bio / About You</label>
                <textarea className="f-textarea" placeholder="Tell other GhostBusters about yourself and what you're looking for..." value={form.bio} onChange={function(e){setField("bio",e.target.value);}} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div>
                  <label className="field-label">Full Name</label>
                  <input className="f-input" placeholder="Optional" value={form.full_name} onChange={function(e){setField("full_name",e.target.value);}} />
                </div>
                <div>
                  <label className="field-label">Education</label>
                  <input className="f-input" placeholder="e.g. UChicago MAPSS" value={form.education} onChange={function(e){setField("education",e.target.value);}} />
                </div>
                <div>
                  <label className="field-label">Current / Recent Job</label>
                  <input className="f-input" placeholder="e.g. Research Assistant" value={form.current_job} onChange={function(e){setField("current_job",e.target.value);}} />
                </div>
                <div>
                  <label className="field-label">Industry</label>
                  <input className="f-input" placeholder="e.g. Finance, Tech, Healthcare" value={form.industry} onChange={function(e){setField("industry",e.target.value);}} />
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label className="field-label">Employment Status</label>
                <select className="f-input" value={form.employment_status} onChange={function(e){setField("employment_status",e.target.value);}}>
                  <option value="">Select...</option>
                  {EMPLOYMENT_OPTIONS.map(function(o){return <option key={o}>{o}</option>;})}
                </select>
              </div>

              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)",padding:"16px 20px",marginBottom:20}}>
                <div className="section-title" style={{marginBottom:12}}>Privacy — What's Visible to Others</div>
                {[
                  ["show_full_name","Show my full name"],
                  ["show_education","Show my education"],
                  ["show_current_job","Show my current job & industry"],
                  ["show_employment_status","Show my employment status"],
                  ["show_tracked_jobs","Show my recently tracked jobs"],
                ].map(function(item){
                  return (
                    <div key={item[0]} className="toggle-row">
                      <span className="toggle-label">{item[1]}</span>
                      <label className="toggle">
                        <input type="checkbox" checked={form[item[0]]} onChange={function(e){setField(item[0],e.target.checked);}} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  );
                })}
              </div>

              {error && <div className="err">{error}</div>}
              <button className="btn-red" onClick={saveProfile} disabled={saving||!form.username.trim()}>{saving?"SAVING...":"SAVE PROFILE"}</button>
              {profile && <button className="btn-ghost" onClick={function(){setEditing(false);setError(null);}}>Cancel</button>}
            </>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-box"><div className="stat-num">{stats.scans}</div><div className="stat-lbl">Scans Run</div></div>
          <div className="stat-box"><div className="stat-num">{stats.apps}</div><div className="stat-lbl">Jobs Tracked</div></div>
          <div className="stat-box"><div className="stat-num" style={{color:stats.avgScore>60?"var(--blood)":stats.avgScore>35?"var(--bile)":"var(--signal)"}}>{stats.avgScore||"--"}</div><div className="stat-lbl">Avg Ghost Score</div></div>
        </div>

        {saved && <div className="success" style={{textAlign:"center",padding:"12px 0"}}>✓ Profile saved successfully</div>}
      </div>
    </>
  );
}