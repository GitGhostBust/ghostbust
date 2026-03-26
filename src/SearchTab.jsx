import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

/* ================================================================
   CONSTANTS (SearchTab-specific)
================================================================ */
var INDUSTRY_MAP = {
  "Technology and Software": ["Software Engineering","Frontend Development","Backend Development","Full Stack Development","Mobile Development","DevOps and Infrastructure","Cybersecurity","Cloud Computing","AI and Machine Learning","Product Management","QA and Testing","IT Support and Systems","Game Development","Blockchain and Web3","Embedded Systems"],
  "Finance and Banking": ["Investment Banking","Private Equity","Venture Capital","Asset Management","Financial Planning","Accounting and Auditing","Risk Management","Compliance and Regulation","Insurance","Retail Banking","Corporate Finance","Quantitative Analysis","Fintech","Tax","Treasury"],
  "Healthcare and Medicine": ["Psychology and Counseling","Psychiatry","Nursing","Physician and Medical Doctor","Physical Therapy","Occupational Therapy","Pharmacy","Dentistry","Public Health","Healthcare Administration","Medical Research","Radiology","Surgery","Social Work","Nutrition and Dietetics"],
  "Marketing and Advertising": ["Digital Marketing","Content Marketing","SEO and SEM","Social Media","Brand Strategy","Performance Marketing","Email Marketing","Product Marketing","Growth Marketing","Public Relations","Media Buying","Influencer Marketing","Marketing Analytics","Event Marketing","Creative Direction"],
  "Design and Creative": ["UX and Product Design","Graphic Design","Visual Design","Motion Graphics","Brand Identity","Illustration","3D and Animation","Industrial Design","Interior Design","Fashion Design","Photography","Video Production","Art Direction","Web Design","Packaging Design"],
  "Engineering and Manufacturing": ["Mechanical Engineering","Civil Engineering","Electrical Engineering","Chemical Engineering","Aerospace Engineering","Structural Engineering","Process Engineering","Environmental Engineering","Materials Engineering","Quality Engineering","Manufacturing Operations","Supply Chain Engineering","Robotics","Nuclear Engineering","Petroleum Engineering"],
  "Education and Training": ["K-12 Teaching","Higher Education","Special Education","Curriculum Development","Instructional Design","Corporate Training","Educational Technology","School Administration","Tutoring","Early Childhood Education","Adult Education","STEM Education","Language Teaching","Academic Research","School Counseling"],
  "Legal and Compliance": ["Corporate Law","Litigation","Employment Law","Intellectual Property","Real Estate Law","Criminal Law","Immigration Law","Regulatory Compliance","Contract Management","Privacy and Data Law","Healthcare Law","Environmental Law","Paralegal","Legal Operations","Government Affairs"],
  "Sales and Business Development": ["Enterprise Sales","SMB Sales","SaaS Sales","Business Development","Account Management","Sales Engineering","Inside Sales","Channel Partnerships","Revenue Operations","Customer Success","Retail Sales","Real Estate Sales","Financial Sales","Pharmaceutical Sales","Recruiting Sales"],
  "Human Resources and Recruitment": ["Talent Acquisition","HR Business Partner","Compensation and Benefits","People Operations","Learning and Development","DEI and Culture","HR Technology","Payroll","Employee Relations","Organizational Development","Executive Recruiting","HR Analytics","Workforce Planning","Labour Relations","HR Compliance"],
  "Operations and Logistics": ["Supply Chain Management","Warehouse Operations","Procurement","Inventory Management","Fulfillment and Distribution","Fleet Management","Import and Export","Operations Management","Project Operations","Facilities Management","Food and Beverage Operations","Healthcare Operations","Retail Operations","Customer Operations","Business Operations"],
  "Data and Analytics": ["Data Science","Data Engineering","Data Analysis","Business Intelligence","Machine Learning Engineering","Data Architecture","Analytics Engineering","Data Governance","Database Administration","Quantitative Research","Market Research","Sports Analytics","Product Analytics","Revenue Analytics","AI Research"],
  "Media and Journalism": ["News Reporting","Investigative Journalism","Broadcast Media","Podcast Production","Documentary Film","Magazine and Editorial","Sports Media","Political Journalism","Science Journalism","Digital Media","Newsletter and Publishing","Photography and Photojournalism","Media Strategy","Content Strategy","Copywriting"],
  "Construction and Real Estate": ["General Contracting","Architecture","Construction Management","Real Estate Development","Property Management","Real Estate Brokerage","Urban Planning","Estimating and Bidding","HVAC and Mechanical","Electrical Contracting","Plumbing","Structural Engineering","Interior Architecture","Land Development","Facilities Management"],
  "Retail and eCommerce": ["Store Management","Buying and Merchandising","eCommerce Management","Category Management","Visual Merchandising","Retail Operations","Customer Experience","Loss Prevention","Inventory Planning","Wholesale","Direct to Consumer","Marketplace Selling","Retail Analytics","Fashion Retail","Luxury Retail"],
  "Hospitality and Tourism": ["Hotel Management","Restaurant Management","Event Planning","Travel and Tourism","Front of House","Culinary and Chefs","Revenue Management","Concierge and Guest Services","Catering","Bar and Beverage","Spa and Wellness","Cruise and Maritime","Theme Park Operations","Travel Agency","Airline Operations"],
  "Non-Profit and Government": ["Program Management","Policy Analysis","Community Organizing","Grant Writing","Non-Profit Leadership","Government Affairs","Public Administration","Social Services","International Development","Advocacy","Fundraising and Development","Civic Technology","Environmental Policy","Healthcare Policy","Education Policy"],
  "Science and Research": ["Biology and Life Sciences","Chemistry","Physics","Neuroscience","Environmental Science","Clinical Research","Epidemiology","Geology and Earth Science","Astronomy","Materials Science","Biotechnology","Pharmaceuticals","Food Science","Agricultural Science","Marine Science"],
};

var BOARDS = [
  { id:"indeed", name:"Indeed", desc:"Largest US job board. Best for volume and breadth across all industries.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("q",q); if(l)p.set("l",l); if(r)p.set("radius",r); p.set("fromage","14"); p.set("sort","date"); return "https://www.indeed.com/jobs?"+p; }},
  { id:"linkedin", name:"LinkedIn", desc:"Best for professional roles. Company info and recruiter contacts on every listing.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("keywords",q); if(l)p.set("location",l); p.set("f_TPR","r604800"); p.set("sortBy","DD"); if(r)p.set("distance",r); return "https://www.linkedin.com/jobs/search/?"+p; }},
  { id:"wellfound", name:"Wellfound", desc:"Startup-focused board with high hiring intent. Companies post because they're actively hiring — less ghost job noise than the big boards.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("query",q); if(l)p.set("location",l); return "https://wellfound.com/jobs?"+p; }},
  { id:"ziprecruiter", name:"ZipRecruiter", desc:"Strong AI matching. Good for roles that fit your profile across employer networks.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("search",q); if(l)p.set("location",l); p.set("days","14"); if(r)p.set("radius",r); return "https://www.ziprecruiter.com/jobs-search?"+p; }},
  { id:"monster", name:"Monster", desc:"Strong presence in mid-market and trade sectors. Good for non-tech roles.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("q",q); if(l)p.set("where",l); p.set("tm","14"); if(r)p.set("rad",r); return "https://www.monster.com/jobs/search?"+p; }},
  { id:"simplyhired", name:"SimplyHired", desc:"Aggregates from hundreds of sources. Finds listings not on the bigger boards.", buildUrl: function(q,l,r){ var p=new URLSearchParams(); if(q)p.set("q",q); if(l)p.set("l",l); p.set("date","14"); p.set("sb","dd"); if(r)p.set("radius",r); return "https://www.simplyhired.com/search?"+p; }},
];

var SEARCH_TIPS = [
  "Filter by 'Last 14 days' on every platform — older listings are ghost jobs 80% of the time.",
  "No salary range + no recruiter name + vague requirements = run it through the Verify tab first.",
  "Same listing on 4+ boards with identical text is likely resume harvesting, not real hiring.",
  "Cross-check: open the company LinkedIn page. No recent posts + under 10 employees = red flag.",
];

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
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: messages }),
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

/* ================================================================
   STYLES (SearchTab-specific)
================================================================ */
var STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');

  /* INNER TABS */
  .inner-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); background: var(--void); margin-bottom: 24px; }
  .inner-tab { padding: 10px 24px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.08em; color: var(--muted); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s; }
  .inner-tab:hover { color: var(--paper); }
  .inner-tab.active { color: var(--blood); border-bottom-color: var(--blood); }
  .inner-tab .tab-count { background: var(--blood-dim); padding: 1px 7px; border-radius: 8px; font-size: 12px; margin-left: 6px; }

  .panel { padding: 32px 0; }
  .tab-intro { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); letter-spacing: 0.03em; line-height: 1.6; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .tab-intro strong { color: var(--paper); font-weight: 400; }
  .search-streak { display: flex; align-items: center; gap: 10px; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--signal); letter-spacing: 0.06em; margin-bottom: 16px; }
  .search-streak-num { font-family: 'Bebas Neue', sans-serif; font-size: 22px; line-height: 1; }
  .saved-nudge { display: flex; align-items: center; justify-content: space-between; background: rgba(201,154,0,0.06); border: 1px solid rgba(201,154,0,0.12); border-radius: 4px; padding: 10px 14px; margin-bottom: 16px; cursor: pointer; transition: background 0.15s; }
  .saved-nudge:hover { background: rgba(201,154,0,0.1); }
  .saved-nudge-text { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--bile); letter-spacing: 0.04em; }
  .saved-nudge-arrow { font-family: 'Bebas Neue', sans-serif; font-size: 14px; color: var(--bile); }

  /* SEARCH — COMPACT ROW */
  .search-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .search-header-left { display: flex; align-items: center; gap: 10px; }
  .search-header-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.06em; color: var(--paper); }
  .search-header-ghost { opacity: 0.2; }
  .search-board-dots { display: flex; gap: 6px; align-items: center; }
  .search-board-dot { width: 6px; height: 6px; border-radius: 50%; }
  .search-row { display: flex; gap: 1px; border-radius: 6px; overflow: hidden; margin-bottom: 2px; }
  .search-row-cell { flex: 1; background: var(--surface); padding: 12px 16px; }
  .search-row-cell.primary { flex: 1.2; }
  .search-row-cell.narrow { flex: 0.6; }
  .search-row-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
  .search-row-label.accent { color: var(--blood); }
  .search-row-input { background: none; border: none; color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 0; outline: none; width: 100%; }
  .search-row-input::placeholder { color: var(--ghost); }
  .search-row-select { background: none; border: none; color: var(--paper); font-family: 'Space Mono', monospace; font-size: 13px; padding: 0; outline: none; width: 100%; appearance: none; cursor: pointer; }
  .search-row-select option { background: var(--surface2); color: var(--paper); }
  .search-row-btn { background: var(--blood); border: none; color: var(--paper); padding: 0 24px; cursor: pointer; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.06em; white-space: nowrap; transition: background 0.15s; }
  .search-row-btn:hover:not(:disabled) { background: #e52600; }
  .search-row-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .search-filters { display: flex; gap: 10px; align-items: center; padding: 10px 0; flex-wrap: wrap; }
  .search-filters-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); }
  .search-filter-pill { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); background: rgba(255,255,255,0.04); border: 1px solid var(--border); padding: 0; border-radius: 3px; cursor: pointer; display: flex; align-items: center; overflow: hidden; }
  .search-filter-pill select { background: none; border: none; color: var(--muted); font-family: 'Space Mono', monospace; font-size: 12px; padding: 5px 12px; outline: none; appearance: none; cursor: pointer; }
  .search-filter-pill select option { background: var(--surface2); color: var(--paper); }
  .search-filter-pill:hover { border-color: var(--border-hi); }
  .search-save-link { margin-left: auto; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); cursor: pointer; border: none; background: none; border-bottom: 1px solid var(--border); transition: color 0.15s; padding: 0; }
  .search-save-link:hover:not(:disabled) { color: var(--paper); }
  .search-save-link:disabled { opacity: 0.4; cursor: not-allowed; }

  /* SEARCH BOARDS */
  .boards-section { margin-top: 32px; }
  .boards-header { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-end; }
  .boards-title { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; }
  .boards-sub { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ghost); letter-spacing: 0.1em; margin-top: 4px; }
  .board-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .board-card { background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--ghost); padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: background 0.18s, box-shadow 0.18s; border-radius: 4px; }
  .board-card:hover { background: var(--surface2); box-shadow: 0 2px 12px rgba(0,0,0,0.2); }
  .board-card.indeed { border-top-color: #2557a7; }
  .board-card.linkedin { border-top-color: #0a66c2; }
  .board-card.wellfound { border-top-color: #ff6154; }
  .board-card.ziprecruiter { border-top-color: #4a90d9; }
  .board-card.monster { border-top-color: #6e44ff; }
  .board-card.simplyhired { border-top-color: #ff6b35; }
  .board-name { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.04em; }
  .board-name.indeed { color: #2557a7; }
  .board-name.linkedin { color: #0a66c2; }
  .board-name.wellfound { color: #ff6154; }
  .board-name.ziprecruiter { color: #4a90d9; }
  .board-name.monster { color: #6e44ff; }
  .board-name.simplyhired { color: #ff6b35; }
  .board-desc { font-size: 12px; color: var(--muted); line-height: 1.6; flex: 1; }
  .board-link { display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--paper); text-decoration: none; background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 9px; transition: background 0.15s; }
  .board-link:hover { background: rgba(255,255,255,0.1); }
  .search-tips { margin-top: 24px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 18px; }
  .search-tips-title { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--paper); margin-bottom: 12px; }
  .tip-row { display: flex; gap: 10px; font-size: 13px; color: rgba(238,234,224,0.7); padding: 4px 0; line-height: 1.6; }
  .tip-n { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ghost); flex-shrink: 0; margin-top: 2px; }

  .board-card-actions { display: flex; flex-direction: column; gap: 6px; }
  .track-role-btn { display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); background: none; border: 1px solid var(--border-hi); padding: 8px; cursor: pointer; transition: background 0.15s, color 0.15s; width: 100%; }
  .track-role-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--paper); }
  .track-role-btn.saved { color: var(--ghost); background: rgba(255,255,255,0.03); border-color: var(--border); cursor: default; }

  /* AI REFINE */
  .ai-refine-btn { width: 100%; margin-top: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 19px; letter-spacing: 0.08em; border: 1px solid var(--border-hi); padding: 12px; cursor: pointer; background: none; color: var(--muted); transition: background 0.15s, color 0.15s; }
  .ai-refine-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--paper); }
  .ai-refine-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .ai-refine-section { margin-top: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-hi); border-top: 3px solid var(--border-hi); padding: 20px 22px; }
  .ai-refine-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 16px; }
  .ai-refine-group { margin-bottom: 18px; }
  .ai-refine-group:last-child { margin-bottom: 0; }
  .ai-refine-group-label { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); margin-bottom: 10px; }
  .ai-refine-pill-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .ai-refine-pill { font-family: 'Space Mono', monospace; font-size: 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-hi); color: var(--muted); padding: 6px 13px; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .ai-refine-pill:hover { background: rgba(255,255,255,0.09); color: var(--paper); }
  .ai-refine-row { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12px; color: rgba(238,234,224,0.65); line-height: 1.55; }
  .ai-refine-row:last-child { border-bottom: none; }
  .ai-refine-key { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--paper); flex-shrink: 0; min-width: 94px; }

  /* SAVED SEARCHES */
  .saved-searches-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
  .saved-searches-title { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ghost); margin-bottom: 10px; }
  .saved-search-list { display: flex; flex-direction: column; gap: 6px; }
  .saved-search-item { display: flex; align-items: center; gap: 10px; background: var(--surface2); border: 1px solid var(--border); padding: 9px 12px; cursor: pointer; transition: background 0.15s; }
  .saved-search-item:hover { background: var(--surface3); }
  .saved-search-label { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--paper); flex: 1; }
  .saved-search-meta { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ghost); }
  .saved-search-del { background: none; border: none; color: var(--ghost); font-size: 13px; cursor: pointer; padding: 0 4px; transition: color 0.15s; flex-shrink: 0; }
  .saved-search-del:hover { color: var(--blood); }

  .scan-history-empty { text-align: center; padding: 48px 24px; color: var(--ghost); font-family: 'Space Mono', monospace; font-size: 12px; }

  @media (max-width: 720px) {
    .board-grid { grid-template-columns: 1fr; }
    .search-row { flex-direction: column; border-radius: 6px; }
    .search-row-btn { padding: 14px; }
    .search-filters { gap: 8px; }
  }
  @media (max-width: 480px) {
    .board-grid { grid-template-columns: 1fr 1fr; }
  }
`;

/* ================================================================
   SEARCH TAB COMPONENT
================================================================ */
function SearchTab({ session, addApp }) {
  // Restore last search from localStorage
  var lastSearch = null;
  try { lastSearch = JSON.parse(localStorage.getItem("ghostbust-last-search-params")); } catch(e) {}

  var [innerTab, setInnerTab] = useState("search");
  var [jobTitle, setJobTitle] = useState(lastSearch&&lastSearch.jobTitle||"");
  var [industry, setIndustry] = useState(lastSearch&&lastSearch.industry||"");
  var [subfield, setSubfield] = useState(lastSearch&&lastSearch.subfield||"");
  var [jobType, setJobType] = useState(lastSearch&&lastSearch.jobType||"");
  var [city, setCity] = useState(lastSearch&&lastSearch.city||"");
  var [usState, setUsState] = useState(lastSearch&&lastSearch.usState||"");
  var [radius, setRadius] = useState(lastSearch&&lastSearch.radius||"25");
  var [results, setResults] = useState(null);
  var [trackedBoards, setTrackedBoards] = useState({});

  // AI Refine
  var [aiRefining, setAiRefining] = useState(false);
  var [aiRefinement, setAiRefinement] = useState(null);
  var [aiRefineError, setAiRefineError] = useState(null);

  // Saved searches
  var [savedSearches, setSavedSearches] = useState([]);
  var [saving, setSaving] = useState(false);

  var userId = session ? session.user.id : null;
  var subfields = industry ? (INDUSTRY_MAP[industry] || []) : [];

  // Load saved searches on login
  useEffect(function() {
    if (!userId) { setSavedSearches([]); return; }
    supabase.from("saved_searches")
      .select("id, label, query, location, radius, job_type, industry, subfield, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false })
      .then(function(res) {
        if (res.error) { console.error("[saved_searches] load failed:", res.error.message); return; }
        setSavedSearches(res.data || []);
      });
  }, [userId]);

  // Search streak — count distinct days searched this week (Mon-Sun)
  var streak = 0;
  try {
    var streakData = JSON.parse(localStorage.getItem("ghostbust-search-days") || "[]");
    var now = new Date();
    var weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
    weekStart.setHours(0,0,0,0);
    streak = streakData.filter(function(d){ return new Date(d) >= weekStart; }).length;
  } catch(e) {}

  function handleIndustryChange(e) {
    setIndustry(e.target.value);
    setSubfield("");
    setResults(null);
  }

  function buildResults(q, loc, r) {
    setResults({ q: q, loc: loc, radius: r, boards: BOARDS.map(function(b) { return { id: b.id, name: b.name, desc: b.desc, url: b.buildUrl(q, loc, r) }; }) });
    setTrackedBoards({});
    // Store last search params for pre-fill on return
    try {
      localStorage.setItem("ghostbust-last-search-params", JSON.stringify({ jobTitle:jobTitle, industry:industry, subfield:subfield, jobType:jobType, city:city, usState:usState, radius:radius }));
    } catch(e) {}
    // Track search streak days
    try {
      var today = new Date().toISOString().slice(0,10);
      var days = JSON.parse(localStorage.getItem("ghostbust-search-days") || "[]");
      if (days.indexOf(today) === -1) days.push(today);
      // Keep only last 14 days
      var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
      days = days.filter(function(d){ return new Date(d) >= cutoff; });
      localStorage.setItem("ghostbust-search-days", JSON.stringify(days));
    } catch(e) {}
  }

  function handleSearch() {
    var q = [jobTitle.trim(), subfield || industry, jobType].filter(Boolean).join(" ");
    var loc = [city.trim(), usState.trim()].filter(Boolean).join(", ");
    buildResults(q, loc, radius);
    setAiRefinement(null);
    setAiRefineError(null);
  }

  // Feature 3: Log board click to search_history
  function handleBoardClick(board) {
    if (!userId || !results) return;
    supabase.from("search_history").insert({
      user_id: userId,
      query: results.q || "",
      location: results.loc || "",
      radius: results.radius || "",
      job_type: jobType,
      industry: industry,
      board_id: board.id,
      board_name: board.name,
    }).then(function() {}).catch(function(err) { console.warn("[search_history] log failed:", err); });
  }

  // Feature 1: Track this role
  function handleTrackRole(board) {
    if (!addApp || !results) return;
    var title = jobTitle.trim() || subfield || industry || results.q || "Job";
    addApp({
      title: title,
      company: "",
      status: "Researching",
      ghostScore: 0,
      verdict: "UNKNOWN",
      signalFlags: [],
      notes: "Saved from " + board.name + " search: " + (results.q || ""),
      url: board.url,
      sourceBoard: board.name,
      appliedDate: "",
      followupDate: "",
    });
    setTrackedBoards(function(prev) { return Object.assign({}, prev, { [board.id]: true }); });
  }

  // Feature 2: AI-powered search refinement
  function handleAiRefine() {
    setAiRefining(true);
    setAiRefineError(null);
    var q = results ? results.q : [jobTitle.trim(), subfield || industry, jobType].filter(Boolean).join(" ");
    var loc = results ? results.loc : [city.trim(), usState.trim()].filter(Boolean).join(", ");
    var prompt = 'You are a job search strategist. The user is searching for: "' + q + '" in "' + (loc || "USA") + '".\n\nProvide targeted search refinement as JSON with exactly these keys:\n{\n  "alternative_titles": ["title1", "title2", "title3"],\n  "board_priorities": [\n    {"board": "Indeed", "reason": "one sentence why this board suits this search"},\n    {"board": "LinkedIn", "reason": "..."},\n    {"board": "Wellfound", "reason": "..."}\n  ],\n  "search_tips": ["tip1", "tip2", "tip3"]\n}\n\nalternative_titles: 3 related job titles that often yield hidden results for this role.\nboard_priorities: top 3 boards for this specific query and location with a brief reason each.\nsearch_tips: 3 specific actionable tips for this exact role and location — not generic advice.\n\nReturn only the JSON object.';
    apiCall([{ role: "user", content: prompt }], session?.access_token)
      .then(function(text) {
        var parsed = parseJSON(text);
        setAiRefinement(parsed);
        setAiRefining(false);
      })
      .catch(function(err) {
        if (err.message === "RATE_LIMIT") {
          setAiRefineError("You've reached your limit of 20 analyses per hour. Please try again later.");
        } else {
          setAiRefineError(err.message);
        }
        setAiRefining(false);
      });
  }

  // Feature 5: Save current search
  function handleSaveSearch() {
    if (!userId || !canSearch) return;
    setSaving(true);
    var q = [jobTitle.trim(), subfield || industry, jobType].filter(Boolean).join(" ");
    var loc = [city.trim(), usState.trim()].filter(Boolean).join(", ");
    var label = [jobTitle.trim() || subfield || industry, jobType, loc].filter(Boolean).join(" · ") || "Search";
    supabase.from("saved_searches").insert({
      user_id: userId,
      label: label,
      query: q,
      location: loc,
      radius: radius,
      job_type: jobType,
      industry: industry,
      subfield: subfield,
    }).select("id, label, query, location, radius, job_type, industry, subfield, saved_at").single()
      .then(function(res) {
        setSaving(false);
        if (!res.error && res.data) setSavedSearches(function(prev) { return [res.data].concat(prev); });
      });
  }

  function handleLoadSaved(s) {
    setInnerTab("search");
    setIndustry(s.industry || "");
    setSubfield(s.subfield || "");
    setJobType(s.job_type || "");
    var locParts = (s.location || "").split(", ");
    setCity(locParts[0] || "");
    setUsState(locParts[1] || "");
    setRadius(s.radius || "25");
    setResults(null);
    setAiRefinement(null);
  }

  function handleDeleteSaved(e, id) {
    e.stopPropagation();
    supabase.from("saved_searches").delete().eq("id", id).then(function() {});
    setSavedSearches(function(prev) { return prev.filter(function(s) { return s.id !== id; }); });
  }

  var canSearch = jobTitle.trim().length > 0 || industry.length > 0 || city.length > 0 || usState.length > 0 || jobType.length > 0;

  return (
    <div className="panel">
      <style>{STYLE}</style>
      <div className="inner-tabs">
        <button className={"inner-tab"+(innerTab==="search"?" active":"")} onClick={function(){setInnerTab("search");}}>Search</button>
        <button className={"inner-tab"+(innerTab==="saved"?" active":"")} onClick={function(){setInnerTab("saved");}}>
          Saved Searches{savedSearches.length>0&&<span className="tab-count">{savedSearches.length}</span>}
        </button>
      </div>

      {innerTab==="search"&&<>
      <div className="tab-intro">Indeed, LinkedIn, ZipRecruiter, Wellfound, Monster, SimplyHired — <strong>searched and saved all at once.</strong></div>

      {streak>0&&(
        <div className="search-streak">
          <span className="search-streak-num">{streak}</span>
          <span>{streak===1?"day searching this week":"days searching this week"}</span>
        </div>
      )}

      {savedSearches.length>0&&innerTab==="search"&&(
        <div className="saved-nudge" onClick={function(){setInnerTab("saved");}}>
          <span className="saved-nudge-text">You have {savedSearches.length} saved search{savedSearches.length>1?"es":""} — run one</span>
          <span className="saved-nudge-arrow">&rarr;</span>
        </div>
      )}

      <div className="search-header">
        <div className="search-header-left">
          <svg className="search-header-ghost" width="18" height="18" viewBox="0 0 32 32"><path d="M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z" fill="#eeeae0" opacity="0.25"/><circle cx="13" cy="14" r="2" fill="#d42200" opacity="0.4"/><circle cx="19" cy="14" r="2" fill="#d42200" opacity="0.4"/></svg>
          <span className="search-header-title">MULTI-BOARD SEARCH</span>
        </div>
        <div className="search-board-dots">
          <span className="search-board-dot" style={{background:"#2557a7"}} title="Indeed" />
          <span className="search-board-dot" style={{background:"#0a66c2"}} title="LinkedIn" />
          <span className="search-board-dot" style={{background:"#4a90d9"}} title="ZipRecruiter" />
          <span className="search-board-dot" style={{background:"#ff6154"}} title="Wellfound" />
          <span className="search-board-dot" style={{background:"#6e44ff"}} title="Monster" />
          <span className="search-board-dot" style={{background:"#ff6b35"}} title="SimplyHired" />
        </div>
      </div>

      <div className="search-row">
        <div className="search-row-cell primary">
          <div className="search-row-label accent">Job Title</div>
          <input className="search-row-input" placeholder="e.g. Software Engineer" value={jobTitle} onChange={function(e){setJobTitle(e.target.value);}} />
        </div>
        <div className="search-row-cell">
          <div className="search-row-label">Industry</div>
          <select className="search-row-select" value={industry} onChange={handleIndustryChange}>
            <option value="">Any Industry</option>
            {Object.keys(INDUSTRY_MAP).map(function(ind) { return <option key={ind} value={ind}>{ind}</option>; })}
          </select>
        </div>
        <div className="search-row-cell">
          <div className="search-row-label">City</div>
          <input className="search-row-input" placeholder="e.g. Austin" value={city} onChange={function(e){setCity(e.target.value);}} />
        </div>
        <div className="search-row-cell narrow">
          <div className="search-row-label">State</div>
          <input className="search-row-input" placeholder="e.g. TX" value={usState} onChange={function(e){setUsState(e.target.value);}} />
        </div>
        <button className="search-row-btn" onClick={handleSearch} disabled={!canSearch}>SEARCH →</button>
      </div>

      <div className="search-filters">
        <span className="search-filters-label">Filters:</span>
        <span className="search-filter-pill">
          <select value={subfield} onChange={function(e){setSubfield(e.target.value);}} disabled={subfields.length===0}>
            <option value="">{subfields.length>0?"Specialisation ▾":"Specialisation"}</option>
            {subfields.map(function(s){return <option key={s} value={s}>{s}</option>;})}
          </select>
        </span>
        <span className="search-filter-pill">
          <select value={jobType} onChange={function(e){setJobType(e.target.value);}}>
            <option value="">Job Type ▾</option>
            <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Remote">Remote</option>
          </select>
        </span>
        <span className="search-filter-pill">
          <select value={radius} onChange={function(e){setRadius(e.target.value);}}>
            <option value="5">5 miles</option><option value="10">10 miles</option><option value="25">25 miles</option><option value="50">50 miles</option><option value="100">100 miles</option>
          </select>
        </span>
        {userId&&<button className="search-save-link" onClick={handleSaveSearch} disabled={saving||!canSearch}>{saving?"Saving...":"Save Search"}</button>}
      </div>

      {results && (
        <div className="boards-section">
          <div className="boards-header">
            <div>
              <div className="boards-title">6 Boards — Pre-Filtered</div>
              <div className="boards-sub">{results.q ? results.q.toUpperCase() : "ALL JOBS"}{results.loc ? " · " + results.loc.toUpperCase() + (results.radius ? " +" + results.radius + "MI" : "") : " · USA"} · LAST 14 DAYS · DATE SORTED</div>
            </div>
          </div>
          <div className="board-grid">
            {results.boards.map(function(b) {
              return (
                <div key={b.id} className={"board-card " + b.id}>
                  <div className={"board-name " + b.id}>{b.name}</div>
                  <p className="board-desc">{b.desc}</p>
                  <div className="board-card-actions">
                    {/* Feature 3: log click; Feature link */}
                    <a className="board-link" href={b.url} target="_blank" rel="noreferrer" onClick={function() { handleBoardClick(b); }}>Search {b.name} ↗</a>
                    {/* Feature 1: Track this role */}
                    <button
                      className={"track-role-btn" + (trackedBoards[b.id] ? " saved" : "")}
                      onClick={function() { if (!trackedBoards[b.id]) handleTrackRole(b); }}
                      disabled={!!trackedBoards[b.id]}
                    >
                      {trackedBoards[b.id] ? "✓ Added to Tracker" : "+ Track This Role"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature 2: AI Refine */}
          <button className="ai-refine-btn" onClick={handleAiRefine} disabled={aiRefining}>
            {aiRefining ? "ANALYZING YOUR SEARCH..." : "✦ AI REFINE MY SEARCH"}
          </button>
          {aiRefineError && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "var(--blood)", marginTop: 8 }}>{aiRefineError}</div>}
          {aiRefinement && (
            <div className="ai-refine-section">
              <div className="ai-refine-title">AI Search Refinement</div>
              {aiRefinement.alternative_titles && aiRefinement.alternative_titles.length > 0 && (
                <div className="ai-refine-group">
                  <div className="ai-refine-group-label">Also Search These Titles</div>
                  <div className="ai-refine-pill-row">
                    {aiRefinement.alternative_titles.map(function(t, i) {
                      return (
                        <button key={i} className="ai-refine-pill" title="Search with this title" onClick={function() {
                          var loc = results ? results.loc : [city.trim(), usState.trim()].filter(Boolean).join(", ");
                          buildResults(t, loc, radius);
                          setAiRefinement(null);
                        }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {aiRefinement.board_priorities && aiRefinement.board_priorities.length > 0 && (
                <div className="ai-refine-group">
                  <div className="ai-refine-group-label">Top Boards for This Search</div>
                  {aiRefinement.board_priorities.map(function(bp, i) {
                    return (
                      <div key={i} className="ai-refine-row">
                        <span className="ai-refine-key">{bp.board}</span>
                        <span>{bp.reason}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {aiRefinement.search_tips && aiRefinement.search_tips.length > 0 && (
                <div className="ai-refine-group">
                  <div className="ai-refine-group-label">Tips for This Search</div>
                  {aiRefinement.search_tips.map(function(tip, i) {
                    return (
                      <div key={i} className="ai-refine-row">
                        <span className="ai-refine-key">{String(i + 1).padStart(2, "0")}</span>
                        <span>{tip}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="search-tips">
            <div className="search-tips-title">Ghost-Proof Your Search</div>
            {SEARCH_TIPS.map(function(t, i) { return <div key={i} className="tip-row"><span className="tip-n">{String(i + 1).padStart(2, "0")}</span><span>{t}</span></div>; })}
          </div>
        </div>
      )}
      </>}

      {innerTab==="saved"&&(
        <div>
          {savedSearches.length===0?(
            <div className="scan-history-empty">
              No saved searches yet. Use the Search tab to find jobs, then click "Save Search" to save your filters for quick reuse.
            </div>
          ):(
            <div className="saved-search-list">
              {savedSearches.map(function(s) {
                return (
                  <div key={s.id} className="saved-search-item" onClick={function() { handleLoadSaved(s); }}>
                    <span className="saved-search-label">{s.label}</span>
                    <span className="saved-search-meta">{s.location || "USA"}</span>
                    <button className="saved-search-del" onClick={function(e) { handleDeleteSaved(e, s.id); }} title="Remove">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchTab;
