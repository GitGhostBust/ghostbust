import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void: #070709; --surface: #0e0e12; --paper: #eeeae0; --muted: rgba(238,234,224,0.45);
    --ghost: #4a4a60; --blood: #d42200; --bile: #c99a00; --signal: #00e67a;
    --border: rgba(255,255,255,0.07); --border-hi: rgba(255,255,255,0.14);
  }
  html, body { background: var(--void); color: var(--paper); font-family: 'Libre Baskerville', serif; min-height: 100vh; }
  @keyframes gbFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .sp-root { width: 100%; max-width: 680px; margin: 0 auto; padding: 48px 24px 80px; animation: gbFadeIn 0.5s ease both; }
  .sp-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 48px; }
  .sp-logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.02em; color: var(--paper); text-decoration: none; }
  .sp-logo em { color: var(--blood); font-style: normal; }
  .sp-cta-nav { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--paper); background: var(--blood); border: none; padding: 8px 16px; cursor: pointer; text-decoration: none; }
  .sp-card { background: var(--surface); border: 1px solid var(--border); padding: 32px; margin-bottom: 24px; }
  .sp-job { margin-bottom: 24px; }
  .sp-company { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .sp-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); }
  .sp-score-hero { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 16px; }
  .sp-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 96px; line-height: 0.85; }
  .sp-score-num.red { color: var(--blood); }
  .sp-score-num.yellow { color: var(--bile); }
  .sp-score-num.green { color: var(--signal); }
  .sp-score-meta { display: flex; flex-direction: column; gap: 6px; padding-bottom: 10px; }
  .sp-score-lbl { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); }
  .sp-verdict { font-family: 'Bebas Neue', sans-serif; font-size: 22px; }
  .sp-verdict.red { color: var(--blood); }
  .sp-verdict.yellow { color: var(--bile); }
  .sp-verdict.green { color: var(--signal); }
  .sp-sev-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; margin-bottom: 24px; }
  .sp-sev-seg { height: 4px; border-radius: 1px; opacity: 0.2; }
  .sp-sev-seg.active { opacity: 1; }
  .sp-subscores { display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 24px; }
  .sp-subscore-num { font-family: 'Bebas Neue', sans-serif; font-size: 28px; }
  .sp-subscore-lbl { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ghost); margin-top: 2px; }
  .sp-summary { font-size: 13px; color: var(--muted); line-height: 1.8; }
  .sp-footer-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--blood); padding: 28px 32px; text-align: center; }
  .sp-footer-headline { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; margin-bottom: 10px; }
  .sp-footer-body { font-size: 13px; color: var(--muted); line-height: 1.8; margin-bottom: 20px; }
  .sp-footer-cta { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; background: var(--blood); color: #fff; text-decoration: none; padding: 12px 28px; display: inline-block; }
  .sp-error { text-align: center; padding: 80px 24px; color: var(--muted); font-family: 'Space Mono', monospace; font-size: 13px; }
  .sp-loading { text-align: center; padding: 80px 24px; color: var(--ghost); font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; }
`;

function scoreColor(gs) {
  return gs > 60 ? "red" : gs > 35 ? "yellow" : "green";
}

function verdictText(v) {
  return v === "LEGIT" ? "Appears Legitimate" : v === "SUSPICIOUS" ? "Suspicious — Proceed With Caution" : "Ghost Listing Detected";
}

export default function ScorePage() {
  var [scan, setScan] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  useEffect(function () {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    if (!id) { setError("No scan ID provided."); setLoading(false); return; }

    supabase
      .from("ghost_scans")
      .select("ghost_score, assessment, title, company, confidence, scores, summary")
      .eq("id", id)
      .eq("share_enabled", true)
      .single()
      .then(function (res) {
        if (res.error || !res.data) { setError("This score card is not available."); }
        else {
          setScan(res.data);
          var gs = res.data.ghost_score || 0;
          var v = res.data.assessment || "UNKNOWN";
          var title = (res.data.title ? res.data.title + " — " : "") + "Ghost Score: " + gs + "/100 · GhostBust";
          var desc = verdictText(v) + ". Analyzed by GhostBust — the ghost job detector.";
          document.title = title;
          var setMeta = function(prop, val, attr) {
            attr = attr || "name";
            var el = document.querySelector('meta[' + attr + '="' + prop + '"]');
            if (!el) { el = document.createElement("meta"); el.setAttribute(attr, prop); document.head.appendChild(el); }
            el.setAttribute("content", val);
          };
          setMeta("description", desc);
          setMeta("og:title", title, "property");
          setMeta("og:description", desc, "property");
          setMeta("og:image", "https://ghostbust.us/api/og?id=" + id, "property");
          setMeta("og:url", "https://ghostbust.us/score?id=" + id, "property");
          setMeta("og:type", "website", "property");
          setMeta("twitter:card", "summary_large_image");
          setMeta("twitter:image", "https://ghostbust.us/api/og?id=" + id);
        }
        setLoading(false);
      });
  }, []);

  var gs = scan ? (scan.ghost_score || 0) : 0;
  var sc = scan ? (scan.scores || {}) : {};
  var colorCls = scoreColor(gs);
  var sevLevel = gs > 60 ? "high" : gs > 35 ? "mid" : "low";

  return (
    <>
      <style>{STYLE}</style>
      <div className="sp-root">
        <div className="sp-nav">
          <a href="/" className="sp-logo">Ghost<em>Bust</em></a>
          <a href="/app.html" className="sp-cta-nav">Verify a Listing →</a>
        </div>

        {loading && <div className="sp-loading">Loading score…</div>}
        {error && <div className="sp-error">{error}</div>}

        {scan && (
          <>
            <div className="sp-card">
              {(scan.company || scan.title) && (
                <div className="sp-job">
                  {scan.company && <div className="sp-company">{scan.company}</div>}
                  {scan.title && <div className="sp-title">{scan.title}</div>}
                </div>
              )}
              <div className="sp-score-hero">
                <div className={"sp-score-num " + colorCls}>{gs}</div>
                <div className="sp-score-meta">
                  <div className="sp-score-lbl">Ghost Score</div>
                  <div className={"sp-verdict " + colorCls}>{verdictText(scan.assessment)}</div>
                </div>
              </div>
              <div className="sp-sev-bar">
                <div className={"sp-sev-seg low" + (sevLevel === "low" ? " active" : "")} style={{ background: "#00e67a" }} />
                <div className={"sp-sev-seg mid" + (sevLevel === "mid" ? " active" : "")} style={{ background: "#c99a00" }} />
                <div className={"sp-sev-seg high" + (sevLevel === "high" ? " active" : "")} style={{ background: "#d42200" }} />
              </div>
              <div className="sp-subscores">
                {[["Specificity", sc.specificityScore], ["Transparency", sc.transparencyScore], ["Process", sc.processScore], ["Confidence", scan.confidence]].map(function (item) {
                  return (
                    <div key={item[0]}>
                      <div className={"sp-subscore-num " + scoreColor(item[1] || 0)}>{item[1] != null ? item[1] : "—"}</div>
                      <div className="sp-subscore-lbl">{item[0]}</div>
                    </div>
                  );
                })}
              </div>
              {scan.summary && <p className="sp-summary">{scan.summary}</p>}
            </div>

            <div className="sp-footer-card">
              <div className="sp-footer-headline">Verify your own listings</div>
              <p className="sp-footer-body">GhostBust detects ghost job listings before you apply. Paste any listing — get a ghost score, signal breakdown, and concrete next steps in under a minute.</p>
              <a href="/app.html" className="sp-footer-cta">Open Ghost Detector →</a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
