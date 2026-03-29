import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

/* ================================================================
   HELPERS
================================================================ */
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
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: messages }),
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

function timeAgo(dateStr) {
  if (!dateStr) return "";
  var diff = Date.now() - new Date(dateStr).getTime();
  var days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return days + " days ago";
  return Math.floor(days / 30) + "mo ago";
}

function scoreColor(score) {
  if (score <= 30) return "var(--signal)";
  if (score <= 60) return "var(--bile)";
  return "var(--blood)";
}

function scoreBg(score) {
  if (score <= 30) return "var(--signal-dim)";
  if (score <= 60) return "var(--bile-dim)";
  return "var(--blood-dim)";
}

function scoreLabel(score) {
  if (score <= 30) return "LOW RISK";
  if (score <= 60) return "MEDIUM";
  return "HIGH RISK";
}

/* ================================================================
   STYLES
================================================================ */
var STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');

  .panel { padding: 32px 0; }
  .tab-intro { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.03em; line-height: 1.6; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .tab-intro strong { color: var(--paper); font-weight: 400; }

  /* SEARCH BAR */
  .js-search-wrap { margin-bottom: 24px; }
  .js-search-row { display: flex; gap: 1px; border-radius: 6px; overflow: hidden; }
  .js-search-input { flex: 1; background: var(--surface); border: none; color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 16px 18px; outline: none; }
  .js-search-input::placeholder { color: var(--ghost); }
  .js-search-input.loc { flex: 0.4; border-left: 1px solid var(--border); }
  .js-search-btn { background: var(--blood); border: none; color: var(--paper); padding: 0 28px; cursor: pointer; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.06em; white-space: nowrap; transition: background 0.15s; }
  .js-search-btn:hover:not(:disabled) { background: #e52600; }
  .js-search-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .js-search-hint { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); letter-spacing: 0.04em; margin-top: 6px; line-height: 1.5; }
  .js-search-hint em { font-style: italic; color: var(--muted); }
  .js-search-error { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--blood); margin-top: 8px; }

  /* RESULTS HEADER */
  .js-results-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .js-results-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 0.04em; }
  .js-results-count { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ghost); letter-spacing: 0.08em; }
  .js-results-meta { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ghost); letter-spacing: 0.06em; }
  .js-load-more { width: 100%; margin-top: 16px; padding: 14px; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.08em; border: 1px solid var(--border-hi); background: none; color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s; }
  .js-load-more:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--paper); }
  .js-load-more:disabled { opacity: 0.45; cursor: not-allowed; }

  /* JOB CARD */
  .js-card-list { display: flex; flex-direction: column; gap: 12px; }
  .js-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 20px; display: flex; gap: 16px; transition: background 0.15s; }
  .js-card:hover { background: var(--surface2); }
  .js-card-body { flex: 1; min-width: 0; }
  .js-card-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.03em; color: var(--paper); line-height: 1.1; margin-bottom: 4px; }
  .js-card-company { font-family: 'Libre Baskerville', serif; font-size: 14px; color: var(--paper); margin-bottom: 6px; }
  .js-card-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px; }
  .js-card-chip { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.06em; color: var(--muted); background: rgba(255,255,255,0.04); border: 1px solid var(--border); padding: 3px 10px; border-radius: 3px; white-space: nowrap; }
  .js-card-actions { display: flex; gap: 8px; margin-top: 4px; }
  .js-card-btn { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 7px 14px; border: 1px solid var(--border-hi); background: none; color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s; border-radius: 3px; }
  .js-card-btn:hover { background: rgba(255,255,255,0.06); color: var(--paper); }
  .js-card-btn.primary { background: var(--blood-dim); border-color: rgba(212,34,0,0.3); color: var(--blood); }
  .js-card-btn.primary:hover { background: rgba(212,34,0,0.25); }
  .js-card-btn.tracked { color: var(--ghost); border-color: var(--border); cursor: default; background: rgba(255,255,255,0.02); }

  /* GHOST SCORE BADGE */
  .js-score-badge { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 70px; padding: 10px 8px; border-radius: 4px; text-align: center; flex-shrink: 0; }
  .js-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 32px; line-height: 1; }
  .js-score-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
  .js-score-scanning { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 70px; padding: 10px 8px; }
  .js-score-dots { display: flex; gap: 4px; }
  .js-score-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ghost); animation: jsPulse 1.2s infinite; }
  .js-score-dot:nth-child(2) { animation-delay: 0.2s; }
  .js-score-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes jsPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
  .js-score-scan-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.12em; color: var(--ghost); margin-top: 6px; text-transform: uppercase; }

  /* DETAIL MODAL */
  .js-modal-overlay { position: fixed; inset: 0; z-index: 9500; background: rgba(7,7,9,0.92); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
  .js-modal { background: linear-gradient(165deg, rgba(30,30,40,0.95), rgba(22,22,30,0.9)); border: 1px solid var(--border); border-top: 4px solid var(--blood); max-width: 680px; width: 100%; max-height: 85vh; overflow-y: auto; padding: 32px; border-radius: 16px; box-shadow: 0 24px 80px rgba(0,0,0,0.6); position: relative; }
  .js-modal-close { position: absolute; top: 14px; right: 16px; background: none; border: none; color: var(--ghost); font-size: 18px; cursor: pointer; }
  .js-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 0.03em; margin-bottom: 4px; }
  .js-modal-company { font-family: 'Libre Baskerville', serif; font-size: 15px; color: var(--paper); margin-bottom: 16px; }
  .js-modal-score-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; }
  .js-modal-score-num { font-family: 'Bebas Neue', sans-serif; font-size: 48px; line-height: 1; }
  .js-modal-score-info { flex: 1; }
  .js-modal-score-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 6px; }
  .js-modal-flags { display: flex; flex-wrap: wrap; gap: 6px; }
  .js-modal-flag { font-family: 'Space Mono', monospace; font-size: 10px; padding: 3px 10px; border-radius: 3px; }
  .js-modal-section-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-bottom: 8px; margin-top: 20px; }
  .js-modal-desc { font-family: 'Libre Baskerville', serif; font-size: 13px; line-height: 1.8; color: rgba(238,234,224,0.8); white-space: pre-wrap; word-break: break-word; max-height: 400px; overflow-y: auto; padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; }
  .js-modal-actions { display: flex; gap: 10px; margin-top: 20px; }
  .js-modal-apply { flex: 1; padding: 14px; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.06em; background: var(--blood); border: none; color: var(--paper); cursor: pointer; border-radius: 4px; text-align: center; text-decoration: none; display: block; transition: background 0.15s; }
  .js-modal-apply:hover { background: #e52600; }
  .js-modal-track { flex: 1; padding: 14px; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.06em; background: none; border: 1px solid var(--border-hi); color: var(--muted); cursor: pointer; border-radius: 4px; transition: background 0.15s, color 0.15s; }
  .js-modal-track:hover { background: rgba(255,255,255,0.06); color: var(--paper); }

  /* FILTERS */
  .js-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
  .js-filter-select { background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-family: 'Space Mono', monospace; font-size: 11px; padding: 8px 12px; border-radius: 4px; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%234a4a60'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; min-width: 140px; }
  .js-filter-select:focus { outline: none; border-color: var(--border-hi); color: var(--paper); }
  .js-filter-select option { background: var(--surface); color: var(--paper); }

  /* EMPTY STATE */
  .js-empty { text-align: center; padding: 48px 24px; }
  .js-empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: var(--ghost); margin-bottom: 8px; }
  .js-empty-text { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ghost); letter-spacing: 0.04em; line-height: 1.6; }

  /* SKELETON */
  .js-skeleton { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 20px; display: flex; gap: 16px; }
  .js-skeleton-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .js-skeleton-line { height: 14px; background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%); background-size: 200% 100%; animation: jsShimmer 1.5s infinite; border-radius: 3px; }
  .js-skeleton-line.title { width: 60%; height: 20px; }
  .js-skeleton-line.company { width: 35%; }
  .js-skeleton-line.meta { width: 80%; }
  .js-skeleton-score { width: 70px; height: 70px; background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%); background-size: 200% 100%; animation: jsShimmer 1.5s infinite; border-radius: 4px; flex-shrink: 0; }
  @keyframes jsShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  @media (max-width: 720px) {
    .js-search-row { flex-direction: column; }
    .js-search-input.loc { border-left: none; border-top: 1px solid var(--border); }
    .js-search-btn { padding: 14px; }
    .js-card { flex-direction: column; }
    .js-score-badge, .js-score-scanning { flex-direction: row; min-width: 0; gap: 8px; padding: 8px 12px; }
    .js-score-label, .js-score-scan-label { margin-top: 0; }
    .js-modal { padding: 24px 18px; max-height: 90vh; }
    .js-modal-actions { flex-direction: column; }
    .js-filters { gap: 8px; }
    .js-filter-select { flex: 1; min-width: 0; }
  }
`;

/* ================================================================
   SEARCH TAB COMPONENT
================================================================ */
function SearchTab({ session, addApp }) {
  var [query, setQuery] = useState("");
  var [location, setLocation] = useState("");
  var [searching, setSearching] = useState(false);
  var [listings, setListings] = useState([]);
  var [searchError, setSearchError] = useState(null);
  var [hasSearched, setHasSearched] = useState(false);
  var [page, setPage] = useState(1);
  var [loadingMore, setLoadingMore] = useState(false);
  var [totalResults, setTotalResults] = useState(0);
  var [noMoreResults, setNoMoreResults] = useState(false);

  // Filters
  var [jobType, setJobType] = useState("");
  var [datePosted, setDatePosted] = useState("month");
  var [sortBy, setSortBy] = useState("");

  // Ghost scores: { listingId: { score, flags, scanning } }
  var [scores, setScores] = useState({});

  // Detail modal
  var [detailListing, setDetailListing] = useState(null);

  // Tracked listings
  var [tracked, setTracked] = useState({});

  // Abort controller ref for background scoring
  var abortRef = useRef(null);

  // Search function
  var doSearch = useCallback(function(q, loc, pageNum, append, filters) {
    if (!q.trim()) return;
    if (!append) {
      setSearching(true);
      setSearchError(null);
      setListings([]);
      setScores({});
      setHasSearched(true);
      setNoMoreResults(false);
    } else {
      setLoadingMore(true);
    }

    var body = { query: q.trim(), location: loc.trim(), page: pageNum };
    if (filters.jobType) body.employment_types = filters.jobType;
    if (filters.datePosted) body.date_posted = filters.datePosted;

    fetch("/api/jobSearch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    .then(function(r) {
      if (!r.ok) throw new Error("Search failed");
      return r.json();
    })
    .then(function(data) {
      var newListings = data.listings || [];
      setTotalResults(data.total || 0);
      if (newListings.length === 0) setNoMoreResults(true);
      if (append) {
        setListings(function(prev) { return prev.concat(newListings); });
      } else {
        setListings(newListings);
      }
      setSearching(false);
      setLoadingMore(false);

      // Start background ghost scoring
      if (newListings.length > 0) scoreListingsInBackground(newListings);
    })
    .catch(function(err) {
      setSearchError(err.message);
      setSearching(false);
      setLoadingMore(false);
    });
  }, [session]);

  function currentFilters() {
    return { jobType: jobType, datePosted: datePosted };
  }

  function handleSearch() {
    if (!query.trim()) return;
    setPage(1);
    doSearch(query, location, 1, false, currentFilters());
  }

  function handleLoadMore() {
    var nextPage = page + 1;
    setPage(nextPage);
    doSearch(query, location, nextPage, true, currentFilters());
  }

  // Background ghost scoring
  function scoreListingsInBackground(newListings) {
    // Cancel any previous scoring run
    if (abortRef.current) abortRef.current.abort = true;
    var controller = { abort: false };
    abortRef.current = controller;

    var accessToken = session ? session.access_token : null;
    var userId = session ? session.user.id : null;

    // Mark all as scanning
    var scanningState = {};
    newListings.forEach(function(l) { scanningState[l.id] = { scanning: true }; });
    setScores(function(prev) { return Object.assign({}, prev, scanningState); });

    // Score sequentially with delay and timeout
    function withTimeout(promise, ms) {
      return Promise.race([
        promise,
        new Promise(function(_, reject) { setTimeout(function() { reject(new Error("TIMEOUT")); }, ms); }),
      ]);
    }

    (async function() {
      for (var i = 0; i < newListings.length; i++) {
        if (controller.abort) return;
        var listing = newListings[i];
        try {
          var prompt = 'You are a ghost job detection system. Analyze this job listing and determine how likely it is to be a "ghost job" — a listing that is fake, already filled, posted for compliance reasons, or not genuinely open.\n\nJob Title: ' + listing.title + '\nCompany: ' + listing.company + '\nJob Board: ' + listing.job_board + '\nPosted: ' + (listing.posted || "Unknown") + '\nDescription:\n' + (listing.description || "").slice(0, 3000) + '\n\nReturn a JSON object with exactly two keys:\n{"ghost_score": <integer 0-100>, "pattern_flags": ["flag1", "flag2", "flag3"]}\n\nReturn ONLY the JSON object.';

          var text = await withTimeout(apiCall([{ role: "user", content: prompt }], accessToken), 15000);
          var parsed = parseJSON(text);
          var score = parseInt(parsed.ghost_score, 10) || 0;
          var flags = Array.isArray(parsed.pattern_flags) ? parsed.pattern_flags : [];

          setScores(function(prev) {
            var next = Object.assign({}, prev);
            next[listing.id] = { score: score, flags: flags, scanning: false };
            return next;
          });

          // Save to ghost_scans
          if (userId) {
            supabase.from("ghost_scans").insert({
              user_id: userId,
              title: listing.title || "",
              company: listing.company || "",
              job_board: listing.job_board || "",
              ghost_score: score,
              signal_flags: flags,
              full_description: (listing.description || "").slice(0, 10000),
              initiated_by: "user",
              job_city: (listing.location || "").split(",")[0]?.trim() || null,
              job_state: (listing.location || "").split(",")[1]?.trim() || null,
            }).then(function() {}).catch(function() {});
          }
        } catch(err) {
          var failReason = err.message === "RATE_LIMIT" ? "rate_limit" : err.message === "TIMEOUT" ? "timeout" : "error";
          setScores(function(prev) {
            var next = Object.assign({}, prev);
            next[listing.id] = { score: -1, flags: [], scanning: false, failReason: failReason };
            return next;
          });
          // If rate limited, stop scoring remaining listings — mark all as rate limited
          if (failReason === "rate_limit") {
            for (var j = i + 1; j < newListings.length; j++) {
              (function(lid) {
                setScores(function(prev) {
                  var next = Object.assign({}, prev);
                  next[lid] = { score: -1, flags: [], scanning: false, failReason: "rate_limit" };
                  return next;
                });
              })(newListings[j].id);
            }
            return;
          }
        }

        // 500ms delay between scoring calls
        if (i < newListings.length - 1 && !controller.abort) {
          await new Promise(function(r) { setTimeout(r, 500); });
        }
      }
    })();
  }

  // Add to tracker
  function handleAddToTracker(listing) {
    if (!addApp || tracked[listing.id]) return;
    var scoreData = scores[listing.id] || {};
    addApp({
      title: listing.title || "",
      company: listing.company || "",
      status: "Researching",
      ghostScore: scoreData.score || 0,
      verdict: "UNKNOWN",
      signalFlags: scoreData.flags || [],
      notes: "Found on " + (listing.job_board || "JSearch"),
      url: listing.apply_url || "",
      sourceBoard: listing.job_board || "",
      appliedDate: "",
      followupDate: "",
    });
    setTracked(function(prev) { return Object.assign({}, prev, { [listing.id]: true }); });
  }

  // Render score badge
  function renderScoreBadge(listing) {
    var data = scores[listing.id];
    if (!data || data.scanning) {
      return (
        <div className="js-score-scanning">
          <div className="js-score-dots">
            <span className="js-score-dot" />
            <span className="js-score-dot" />
            <span className="js-score-dot" />
          </div>
          <span className="js-score-scan-label">Scanning</span>
        </div>
      );
    }
    if (data.score === -1) {
      var failLabel = data.failReason === "rate_limit" ? "LIMIT" : data.failReason === "timeout" ? "TIMEOUT" : "N/A";
      return (
        <div className="js-score-badge" style={{ background: "var(--surface2)" }}>
          <span className="js-score-num" style={{ color: "var(--ghost)", fontSize: 24 }}>—</span>
          <span className="js-score-label" style={{ color: "var(--ghost)" }}>{failLabel}</span>
        </div>
      );
    }
    return (
      <div className="js-score-badge" style={{ background: scoreBg(data.score) }}>
        <span className="js-score-num" style={{ color: scoreColor(data.score) }}>{data.score}</span>
        <span className="js-score-label" style={{ color: scoreColor(data.score) }}>{scoreLabel(data.score)}</span>
      </div>
    );
  }

  // Detail modal
  function renderModal() {
    if (!detailListing) return null;
    var l = detailListing;
    var data = scores[l.id] || {};
    var hasScore = data.score != null && data.score !== -1 && !data.scanning;

    return (
      <div className="js-modal-overlay" onClick={function(e) { if (e.target === e.currentTarget) setDetailListing(null); }}>
        <div className="js-modal">
          <button className="js-modal-close" onClick={function() { setDetailListing(null); }}>✕</button>
          <div className="js-modal-title">{l.title}</div>
          <div className="js-modal-company">{l.company}{l.location ? " — " + l.location : ""}</div>

          {hasScore && (
            <div className="js-modal-score-row">
              <span className="js-modal-score-num" style={{ color: scoreColor(data.score) }}>{data.score}</span>
              <div className="js-modal-score-info">
                <div className="js-modal-score-label" style={{ color: scoreColor(data.score) }}>Ghost Score — {scoreLabel(data.score)}</div>
                <div className="js-modal-flags">
                  {(data.flags || []).map(function(f, i) {
                    return <span key={i} className="js-modal-flag" style={{ background: scoreBg(data.score), color: scoreColor(data.score) }}>{f}</span>;
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="js-card-meta">
            {l.job_board && <span className="js-card-chip">{l.job_board}</span>}
            {l.posted && <span className="js-card-chip">{timeAgo(l.posted)}</span>}
            {l.job_type && <span className="js-card-chip">{l.job_type}</span>}
          </div>

          <div className="js-modal-section-title">Job Description</div>
          <div className="js-modal-desc">{l.description || "No description available."}</div>

          <div className="js-modal-actions">
            {l.apply_url && <a className="js-modal-apply" href={l.apply_url} target="_blank" rel="noreferrer">Apply on {l.job_board || "Job Board"} →</a>}
            <button className="js-modal-track" onClick={function() { handleAddToTracker(l); setDetailListing(null); }}>+ Add to Tracker</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <style>{STYLE}</style>
      <div className="tab-intro">Describe your ideal role in plain English. AI searches real listings across job boards and <strong>ghost-scores every result in real time</strong>.</div>

      {/* SEARCH BAR */}
      <div className="js-search-wrap">
        <div className="js-search-row">
          <input
            className="js-search-input"
            placeholder='Try "Senior pharma marketing director, oncology" or "remote data analyst"'
            value={query}
            onChange={function(e) { setQuery(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter") handleSearch(); }}
          />
          <input
            className="js-search-input loc"
            placeholder="City, State"
            value={location}
            onChange={function(e) { setLocation(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter") handleSearch(); }}
          />
          <button className="js-search-btn" onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? "SEARCHING..." : "SEARCH →"}
          </button>
        </div>
        <div className="js-filters">
          <select className="js-filter-select" value={jobType} onChange={function(e) { setJobType(e.target.value); }}>
            <option value="">Any Job Type</option>
            <option value="FULLTIME">Full-time</option>
            <option value="PARTTIME">Part-time</option>
            <option value="CONTRACTOR">Contract</option>
            <option value="INTERN">Internship</option>
          </select>
          <select className="js-filter-select" value={datePosted} onChange={function(e) { setDatePosted(e.target.value); }}>
            <option value="all">Any Time</option>
            <option value="today">Past 24 Hours</option>
            <option value="3days">Past 3 Days</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
        </div>
        <div className="js-search-hint">AI understands natural language — include title, industry, seniority, location, company type. <em>The more detail, the better.</em></div>
        {searchError && <div className="js-search-error">{searchError}</div>}
      </div>

      {/* LOADING SKELETON */}
      {searching && (
        <div className="js-card-list">
          {[1,2,3,4,5].map(function(n) {
            return (
              <div key={n} className="js-skeleton">
                <div className="js-skeleton-body">
                  <div className="js-skeleton-line title" />
                  <div className="js-skeleton-line company" />
                  <div className="js-skeleton-line meta" />
                </div>
                <div className="js-skeleton-score" />
              </div>
            );
          })}
        </div>
      )}

      {/* RESULTS */}
      {!searching && listings.length > 0 && (
        <>
          <div className="js-results-header">
            <div>
              <div className="js-results-title">Job Listings</div>
              <div className="js-results-meta">{query.toUpperCase()}{location ? " · " + location.toUpperCase() : ""} · LAST 30 DAYS</div>
            </div>
            <span className="js-results-count">{listings.length} shown{totalResults > listings.length ? " of " + totalResults : ""}</span>
          </div>
          <div className="js-card-list">
            {listings.map(function(l) {
              return (
                <div key={l.id} className="js-card">
                  <div className="js-card-body">
                    <div className="js-card-title">{l.title}</div>
                    <div className="js-card-company">{l.company}</div>
                    <div className="js-card-meta">
                      {l.location && <span className="js-card-chip">{l.location}</span>}
                      {l.job_board && <span className="js-card-chip">{l.job_board}</span>}
                      {l.posted && <span className="js-card-chip">{timeAgo(l.posted)}</span>}
                      {l.job_type && <span className="js-card-chip">{l.job_type}</span>}
                    </div>
                    <div className="js-card-actions">
                      <button className="js-card-btn primary" onClick={function() { setDetailListing(l); }}>View Details</button>
                      <button
                        className={"js-card-btn" + (tracked[l.id] ? " tracked" : "")}
                        onClick={function() { handleAddToTracker(l); }}
                        disabled={!!tracked[l.id]}
                      >
                        {tracked[l.id] ? "✓ Tracked" : "+ Add to Tracker"}
                      </button>
                    </div>
                  </div>
                  {renderScoreBadge(l)}
                </div>
              );
            })}
          </div>

          {!noMoreResults && (
            <button className="js-load-more" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More Results"}
            </button>
          )}
        </>
      )}

      {/* EMPTY STATE */}
      {!searching && hasSearched && listings.length === 0 && !searchError && (
        <div className="js-empty">
          <div className="js-empty-title">No Listings Found</div>
          <div className="js-empty-text">Try broadening your search — fewer keywords or a larger area.</div>
        </div>
      )}

      {/* PRE-SEARCH STATE */}
      {!searching && !hasSearched && (
        <div className="js-empty">
          <div className="js-empty-title">Search Across Job Boards</div>
          <div className="js-empty-text">Enter a job title or describe your ideal role above. Results appear here with live ghost scoring.</div>
        </div>
      )}

      {renderModal()}
    </div>
  );
}

export default SearchTab;
