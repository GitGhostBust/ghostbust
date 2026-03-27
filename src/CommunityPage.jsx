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
  .cp-body { width: 100%; max-width: 100%; margin: 0; padding: 0 24px 120px; box-sizing: border-box; }

  /* FOOTER */
  .cp-footer { display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; padding: 24px 0 8px; border-top: 1px solid var(--border); margin-top: 60px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.38); }
  .cp-footer a { color: inherit; text-decoration: none; transition: color 150ms; }
  .cp-footer a:hover { color: rgba(255,255,255,0.75); }
  .cp-footer-sep { opacity: 0.3; }

  /* COMING SOON OVERLAY */
  .cp-coming-soon { position: fixed; top: 56px; left: 0; right: 0; bottom: 0; background: var(--void); z-index: 150; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; }
  .cp-coming-ghost { opacity: 0.18; margin-bottom: 32px; }
  .cp-coming-title { font-family: 'Bebas Neue', sans-serif; font-size: 42px; letter-spacing: 0.06em; color: var(--paper); text-align: center; line-height: 1.1; margin-bottom: 16px; }
  .cp-coming-title em { color: var(--blood); font-style: normal; }
  .cp-coming-sub { font-family: 'Libre Baskerville', Georgia, serif; font-size: 15px; color: rgba(238,234,224,0.45); text-align: center; line-height: 1.7; font-style: italic; }

  @media (max-width: 480px) {
    .cp-coming-soon { top: 56px; }
    .cp-coming-title { font-size: 32px; }
    .cp-coming-ghost svg { width: 80px; height: 80px; }
    .cp-nav { padding: 0 16px; gap: 8px; }
    .cp-nav-links { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .cp-nav-links::-webkit-scrollbar { display: none; }
    .cp-nav-btn { font-size: 9px; padding: 6px 8px; }
    .cp-body { padding: 0 16px 100px; }
  }

  /* AUTH MODAL */
  .cp-auth-modal { position: fixed; inset: 0; background: rgba(7,7,9,0.92); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .cp-auth-inner { background: linear-gradient(165deg, rgba(30,30,40,0.98) 0%, rgba(22,22,30,0.95) 100%); backdrop-filter: blur(8px); border: 1px solid var(--border); border-top: 4px solid var(--blood); max-width: 420px; width: 100%; padding: 36px; position: relative; border-radius: 16px; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
  .cp-auth-close { position: absolute; top: 14px; right: 16px; background: none; border: none; color: var(--ghost); font-size: 18px; cursor: pointer; }

  /* AUTH FORM (inline) */
  .af-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; margin-bottom: 4px; }
  .af-sub { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--blood); letter-spacing: 0.2em; margin-bottom: 24px; }
  .af-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border-hi); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 11px 14px; outline: none; margin-bottom: 10px; transition: border-color 0.2s; border-radius: 8px; }
  .af-input:focus { border-color: rgba(255,255,255,0.3); }
  .af-input::placeholder { color: var(--ghost); }
  .af-btn { width: 100%; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.08em; background: var(--blood); color: var(--paper); border: none; padding: 13px; cursor: pointer; margin-top: 4px; transition: background 0.15s; border-radius: 8px; }
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

  .cp-share-row { display: flex; justify-content: center; margin-top: 32px; margin-bottom: -48px; }
  .cp-share-btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(212,34,0,0.12), rgba(212,34,0,0.04)); border: 1px solid rgba(212,34,0,0.35); color: var(--blood); font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; padding: 10px 22px; cursor: pointer; transition: all 200ms; border-radius: 6px; }
  .cp-share-btn:hover { background: linear-gradient(135deg, rgba(212,34,0,0.22), rgba(212,34,0,0.1)); border-color: var(--blood); color: var(--paper); }
  .cp-share-btn svg { width: 14px; height: 14px; }
  .cp-share-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--surface); border: 1px solid var(--signal); color: var(--signal); font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 20px; border-radius: 6px; z-index: 9999; animation: cpToastIn 300ms ease; }
  @keyframes cpToastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
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
  var [shareToast, setShareToast] = useState(false);

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
      })
      .catch(function(e){ console.error("[CommunityPage] region fetch failed:", e); });
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

      <div className="cp-coming-soon">
        <div className="cp-coming-ghost">
          <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
            <path d="M16 3 C9 3 5 8 5 14 L5 28 L8.5 24.5 L12 28 L16 24.5 L20 28 L23.5 24.5 L27 28 L27 14 C27 8 23 3 16 3 Z" fill="#eeeae0"/>
            <circle cx="12" cy="13" r="2.5" fill="#d42200"/>
            <circle cx="20" cy="13" r="2.5" fill="#d42200"/>
          </svg>
        </div>
        <div className="cp-coming-title">COMMUNITY. <em>COMING SOON.</em></div>
      </div>

      <div className="cp-body">
        <CommunityBoard
          session={session}
          userRegion={userRegion}
          onRequestSignIn={function(){ setShowAuth(true); }}
        />
        <div className="cp-share-row">
          <button className="cp-share-btn" onClick={handleShare}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share GhostBust
          </button>
        </div>
        {shareToast && <div className="cp-share-toast">Link copied</div>}
        <footer className="cp-footer">
          <span>GhostBust</span>
          <span className="cp-footer-sep">·</span>
          <a href="/tos.html">TOS</a>
          <span className="cp-footer-sep">·</span>
          <a href="/privacy.html">Privacy</a>
          <span className="cp-footer-sep">·</span>
          <a href="/roadmap.html">Roadmap</a>
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
