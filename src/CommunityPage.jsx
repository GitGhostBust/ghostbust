import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import UserSearch from "./UserSearch.jsx";
import CommunityBoard from "./CommunityBoard.jsx";

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


  /* TICKER */
  .ticker-wrap { background: var(--blood); overflow: hidden; padding: 8px 0; line-height: 1.5; }
  .ticker-track { display: inline-flex; white-space: nowrap; animation: ticker 36s linear infinite; }
  @keyframes ticker { to { transform: translateX(-50%); } }
  .ticker-item { font-family: 'Space Mono', monospace; font-size: 10px; line-height: 1; letter-spacing: 0.18em; text-transform: uppercase; padding: 0 28px; }

  /* NAV */
  .cp-nav { position: sticky; top: 0; z-index: 200; background: var(--void); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; padding: 0 24px; height: 56px; }
  .cp-logo { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 0.02em; color: var(--paper); text-decoration: none; flex-shrink: 0; }
  .cp-logo em { color: var(--blood); font-style: normal; }
  .cp-nav-links { display: flex; gap: 4px; align-items: center; }
  .cp-nav-btn { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: #72728a; cursor: pointer; text-decoration: none; transition: color 0.15s, border-color 0.15s; border-radius: 2px; white-space: nowrap; display: inline-block; }
  .cp-nav-btn:hover { color: var(--paper); border-color: var(--border); }
  .cp-nav-btn.active { color: var(--paper); border-color: var(--border-hi); }
  .cp-nav-right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .cp-nav-signout { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border: 1px solid transparent; background: none; color: #72728a; cursor: pointer; transition: color 0.15s; }
  .cp-nav-signout:hover { color: #ff4422; }

  /* BODY */
  .cp-body { width: 100%; max-width: 800px; margin: 0 auto; padding: 0 24px 120px; box-sizing: border-box; }

  /* FOOTER */
  .cp-footer { display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; padding: 24px 0 8px; border-top: 1px solid var(--border); margin-top: 60px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.38); }
  .cp-footer a { color: inherit; text-decoration: none; transition: color 150ms; }
  .cp-footer a:hover { color: rgba(255,255,255,0.75); }
  .cp-footer-sep { opacity: 0.3; }

  /* AUTH MODAL */
  .cp-auth-modal { position: fixed; inset: 0; background: rgba(7,7,9,0.92); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .cp-auth-inner { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--blood); max-width: 420px; width: 100%; padding: 36px; position: relative; }
  .cp-auth-close { position: absolute; top: 14px; right: 16px; background: none; border: none; color: var(--ghost); font-size: 18px; cursor: pointer; }

  /* AUTH FORM (inline) */
  .af-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; margin-bottom: 4px; }
  .af-sub { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--blood); letter-spacing: 0.2em; margin-bottom: 24px; }
  .af-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 11px 14px; outline: none; margin-bottom: 10px; transition: border-color 0.2s; }
  .af-input:focus { border-color: rgba(255,255,255,0.3); }
  .af-input::placeholder { color: var(--ghost); }
  .af-btn { width: 100%; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.08em; background: var(--blood); color: var(--paper); border: none; padding: 13px; cursor: pointer; margin-top: 4px; transition: background 0.15s; }
  .af-btn:hover:not(:disabled) { background: #e52600; }
  .af-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .af-error { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--blood); margin-bottom: 10px; }
  .af-toggle { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ghost); margin-top: 14px; text-align: center; }
  .af-toggle span { color: var(--paper); cursor: pointer; text-decoration: underline; }

  /* SCROLL REVEAL */
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* PAGE ENTRANCE */
  @keyframes gbFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .community-root { animation: gbFadeIn 0.6s ease both; }
`;

const TICKER_ITEMS = [
  "Ghost Job Season is Open",
  "1 in 5 Listings Are Fake",
  "Share Your Experience",
  "Community Intelligence",
  "Fight Back Against Ghost Jobs",
  "GhostBust Community",
];

function AuthForm({ onClose }) {
  var [mode, setMode] = useState("signin");
  var [email, setEmail] = useState("");
  var [password, setPassword] = useState("");
  var [error, setError] = useState(null);
  var [loading, setLoading] = useState(false);
  var [done, setDone] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        var res = await supabase.auth.signInWithPassword({ email, password });
        if (res.error) throw res.error;
        onClose();
      } else {
        var res2 = await supabase.auth.signUp({ email, password });
        if (res2.error) throw res2.error;
        setDone(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>✉️</div>
      <div className="af-title">Check Your Email</div>
      <p style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"var(--ghost)",marginTop:8,lineHeight:1.7}}>We sent a confirmation link to <strong style={{color:"var(--paper)"}}>{email}</strong>. Click it to activate your account.</p>
      <button className="af-btn" style={{marginTop:20}} onClick={onClose}>Done</button>
    </div>
  );

  return (
    <div>
      <div className="af-title">GhostBust</div>
      <div className="af-sub">{mode === "signin" ? "SIGN IN" : "CREATE FREE ACCOUNT"}</div>
      {error && <div className="af-error">{error}</div>}
      <input className="af-input" type="email" placeholder="Email address" value={email} onChange={function(e){setEmail(e.target.value);}} />
      <input className="af-input" type="password" placeholder="Password" value={password} onChange={function(e){setPassword(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") handleSubmit();}} />
      <button className="af-btn" onClick={handleSubmit} disabled={loading || !email || !password}>
        {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
      </button>
      <div className="af-toggle">
        {mode === "signin" ? <>No account? <span onClick={function(){setMode("signup");setError(null);}}>Sign up free</span></> : <>Have an account? <span onClick={function(){setMode("signin");setError(null);}}>Sign in</span></>}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  var [session, setSession] = useState(null);
  var [userRegion, setUserRegion] = useState(null);
  var [showAuth, setShowAuth] = useState(false);
  var [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(function(){
    supabase.auth.getSession().then(function(d){ setSession(d.data.session); });
    var sub = supabase.auth.onAuthStateChange(function(_event, s){ setSession(s); });
    return function(){ sub.data.subscription.unsubscribe(); };
  }, []);

  useEffect(function(){
    if (!session) return;
    supabase.from("profiles").select("job_market_region").eq("id", session.user.id).single()
      .then(function(res){
        if (res.data && res.data.job_market_region) setUserRegion(res.data.job_market_region);
      });
  }, [session]);

  return (
    <div className="community-root" style={{width:"100%",maxWidth:"100%",margin:0,padding:0,boxSizing:"border-box",overflowX:"hidden"}}>
      <style>{STYLE}</style>

      <div className="ticker-wrap">
        <div className="ticker-track">
          {TICKER_ITEMS.concat(TICKER_ITEMS).map(function(t,i){ return <span key={i} className="ticker-item">{t} ◆ </span>; })}
        </div>
      </div>

      <nav className="cp-nav">
        <a href="/" className="cp-logo">Ghost<em>Bust</em></a>
        <div className="cp-nav-links">
          <a href="/" className="cp-nav-btn">Home</a>
          <a href="/app.html" className="cp-nav-btn">App</a>
          <span className="cp-nav-btn active">Community</span>
          <a href="/profile.html" className="cp-nav-btn" onClick={function(e){if(!session){e.preventDefault();setShowProfileModal(true);}}}>Profile</a>
        </div>
        <UserSearch />
        <div className="cp-nav-right">
          <button className="cp-nav-signout" onClick={function(){ if(session){ supabase.auth.signOut(); } else { setShowAuth(true); } }}>
            {session ? "Sign Out" : "Sign In"}
          </button>
        </div>
      </nav>

      <div className="cp-body">
        <CommunityBoard
          session={session}
          userRegion={userRegion}
          onRequestSignIn={function(){ setShowAuth(true); }}
        />
        <footer className="cp-footer">
          <span>GhostBust</span>
          <span className="cp-footer-sep">·</span>
          <a href="/tos.html">TOS</a>
          <span className="cp-footer-sep">·</span>
          <a href="/privacy.html">Privacy</a>
          <span className="cp-footer-sep">·</span>
          <a href="https://mail.google.com/mail/?view=cm&to=ghostbustofficial@gmail.com&su=GhostBust%20Inquiry" target="_blank" rel="noreferrer">ghostbustofficial@gmail.com</a>
        </footer>
      </div>

      {showProfileModal && <div onClick={function(e){if(e.target===e.currentTarget)setShowProfileModal(false);}} style={{position:"fixed",inset:0,zIndex:9500,background:"rgba(7,7,9,0.92)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{background:"#0e0e12",border:"1px solid rgba(255,255,255,0.07)",borderTop:"4px solid #d42200",maxWidth:420,width:"calc(100% - 48px)",padding:"36px",position:"relative"}}>
          <button onClick={function(){setShowProfileModal(false);}} style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"#4a4a60",fontSize:18,cursor:"pointer",lineHeight:1}}>✕</button>
          <AuthForm onClose={function(){ setShowProfileModal(false); window.location.href="/profile.html"; }} />
        </div>
      </div>}

      {showAuth && (
        <div className="cp-auth-modal" onClick={function(e){ if(e.target===e.currentTarget) setShowAuth(false); }}>
          <div className="cp-auth-inner">
            <button className="cp-auth-close" onClick={function(){ setShowAuth(false); }}>✕</button>
            <AuthForm onClose={function(){ setShowAuth(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}
