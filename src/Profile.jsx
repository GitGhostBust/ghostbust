import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  @import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap");
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #070709; --surface: #0e0e12; --surface2: #13131a;
    --paper: #eeeae0; --muted: rgba(238,234,224,0.45); --ghost: #4a4a60;
    --blood: #d42200; --signal: #00e67a; --ice: #00c8e6;
    --border: rgba(255,255,255,0.07); --border-hi: rgba(255,255,255,0.14);
  }
  body { background: var(--void); color: var(--paper); font-family: "DM Sans", sans-serif; min-height: 100vh; }
  .wrap { max-width: 680px; margin: 0 auto; padding: 48px 24px 120px; }
  .back-btn { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--blood); background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 32px; display: block; text-decoration: none; }
  .logo { font-family: "Bebas Neue", sans-serif; font-size: 48px; line-height: 0.9; margin-bottom: 32px; }
  .logo em { color: var(--blood); font-style: normal; }
  .profile-card { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--blood); padding: 32px; margin-bottom: 24px; }
  .label { font-family: "Space Mono", monospace; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--ghost); margin-bottom: 8px; }
  .username { font-family: "Bebas Neue", sans-serif; font-size: 36px; color: var(--paper); margin-bottom: 4px; }
  .email { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
  .f-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 14px; padding: 11px 14px; outline: none; width: 100%; margin-bottom: 10px; }
  .f-input:focus { border-color: var(--border-hi); }
  .btn-red { background: var(--blood); color: var(--paper); font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.08em; border: none; padding: 12px 28px; cursor: pointer; }
  .btn-ghost { background: none; border: 1px solid var(--border); color: var(--muted); font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.1em; padding: 8px 16px; cursor: pointer; margin-left: 10px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-box { background: var(--surface); border: 1px solid var(--border); padding: 20px; text-align: center; }
  .stat-num { font-family: "Bebas Neue", sans-serif; font-size: 40px; color: var(--paper); line-height: 1; }
  .stat-lbl { font-family: "Space Mono", monospace; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-top: 4px; }
  .err { color: var(--blood); font-size: 12px; margin-bottom: 8px; font-family: "Space Mono", monospace; }
`;

export default function Profile() {
  var [session, setSession] = useState(null);
  var [profile, setProfile] = useState(null);
  var [username, setUsername] = useState("");
  var [editUsername, setEditUsername] = useState("");
  var [editing, setEditing] = useState(false);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState(null);
  var [stats, setStats] = useState({ scans: 0, apps: 0, avgScore: 0 });
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    supabase.auth.getSession().then(function(d) {
      var s = d.data.session;
      setSession(s);
      if (s) { loadProfile(s.user.id); loadStats(s.user.id); }
      else { setLoading(false); }
    });
    var sub = supabase.auth.onAuthStateChange(function(_e, s) {
      setSession(s);
      if (s) { loadProfile(s.user.id); loadStats(s.user.id); }
      else { setLoading(false); }
    });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  async function loadProfile(uid) {
    var res = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (res.data) { setProfile(res.data); setUsername(res.data.username); }
    else { setEditing(true); }
    setLoading(false);
  }

  async function loadStats(uid) {
    var scans = await supabase.from("ghost_scans").select("ghost_score").eq("user_id", uid);
    var apps = await supabase.from("applications").select("id").eq("user_id", uid);
    var scores = (scans.data||[]).map(function(s){ return s.ghost_score||0; });
    var avg = scores.length > 0 ? Math.round(scores.reduce(function(a,b){ return a+b; },0)/scores.length) : 0;
    setStats({ scans: (scans.data||[]).length, apps: (apps.data||[]).length, avgScore: avg });
  }

  async function saveUsername() {
    if (!editUsername.trim()) return;
    setSaving(true); setError(null);
    var res = await supabase.from("profiles").upsert({ id: session.user.id, username: editUsername.trim() });
    if (res.error) {
      setError(res.error.message.includes("unique") ? "That username is taken. Try another." : res.error.message);
      setSaving(false); return;
    }
    setUsername(editUsername.trim());
    setProfile({ id: session.user.id, username: editUsername.trim() });
    setEditing(false);
    setSaving(false);
  }

  if (loading) return (<><style>{STYLE}</style><div className="wrap"><div style={{color:"var(--muted)",fontFamily:"Space Mono,monospace",fontSize:12,marginTop:80,textAlign:"center"}}>LOADING...</div></div></>);

  if (!session) return (
    <><style>{STYLE}</style>
    <div className="wrap">
      <a href="/app.html" className="back-btn">← Back to GhostBust</a>
      <div className="logo">Ghost<em>Bust</em></div>
      <div style={{textAlign:"center",padding:"80px 24px"}}>
        <h2 style={{fontFamily:"Bebas Neue,sans-serif",fontSize:32,marginBottom:12}}>Sign In to View Your Profile</h2>
        <p style={{fontSize:14,color:"var(--muted)",marginBottom:24}}>Create a free account to access your personal GhostBust page.</p>
        <a href="/app.html" style={{display:"inline-block",background:"var(--blood)",color:"var(--paper)",fontFamily:"Bebas Neue,sans-serif",fontSize:20,letterSpacing:"0.08em",padding:"12px 28px",textDecoration:"none"}}>GO TO APP</a>
      </div>
    </div></>
  );

  return (
    <><style>{STYLE}</style>
    <div className="wrap">
      <a href="/app.html" className="back-btn">← Back to GhostBust</a>
      <div className="logo">Ghost<em>Bust</em></div>

      {editing ? (
        <div className="profile-card">
          <div className="label">Choose Your Username</div>
          <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,marginBottom:16}}>This is how you'll appear on GhostBust. You can change it later.</p>
          <input className="f-input" placeholder="e.g. jobhunter99" value={editUsername} onChange={function(e){setEditUsername(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")saveUsername();}} autoFocus />
          {error && <div className="err">{error}</div>}
          <button className="btn-red" onClick={saveUsername} disabled={saving||!editUsername.trim()}>{saving?"SAVING...":"SET USERNAME"}</button>
        </div>
      ) : (
        <div className="profile-card">
          <div className="label">Username</div>
          <div className="username">@{username}</div>
          <div className="email">{session.user.email}</div>
          <button className="btn-ghost" onClick={function(){setEditUsername(username);setEditing(true);}}>Change username</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-box"><div className="stat-num">{stats.scans}</div><div className="stat-lbl">Scans Run</div></div>
        <div className="stat-box"><div className="stat-num">{stats.apps}</div><div className="stat-lbl">Jobs Tracked</div></div>
        <div className="stat-box"><div className="stat-num" style={{color:stats.avgScore>60?"var(--blood)":stats.avgScore>35?"#c99a00":"var(--signal)"}}>{stats.avgScore||"--"}</div><div className="stat-lbl">Avg Ghost Score</div></div>
      </div>

      <div style={{background:"var(--surface)",border:"1px solid var(--border)",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div className="label">Account</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>Member since {new Date(session.user.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
        </div>
        <button onClick={function(){supabase.auth.signOut().then(function(){window.location.href="/";});}} style={{background:"none",border:"1px solid rgba(212,34,0,0.3)",color:"var(--blood)",fontFamily:"Space Mono,monospace",fontSize:10,letterSpacing:"0.1em",padding:"8px 16px",cursor:"pointer"}}>SIGN OUT</button>
      </div>
    </div></>
  );
} 
