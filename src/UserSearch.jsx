import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  .us-wrap { position: relative; display: flex; align-items: center; }

  /* Desktop: always visible input */
  .us-input-wrap { position: relative; display: flex; align-items: center; }
  .us-icon {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    color: rgba(255,255,255,0.35); pointer-events: none; display: flex; align-items: center;
    transition: color 0.2s;
  }
  .us-input {
    width: 200px; background: var(--surface2, #13131a); border: 1px solid rgba(255,255,255,0.18);
    color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 13px;
    padding: 7px 12px 7px 32px; outline: none; border-radius: 2px;
    transition: border-color 0.2s, width 0.25s ease;
  }
  .us-input:focus { border-color: rgba(255,255,255,0.38); width: 240px; }
  .us-input::placeholder { color: rgba(255,255,255,0.35); }
  .us-input:focus ~ .us-icon, .us-input-wrap:focus-within .us-icon { color: rgba(255,255,255,0.55); }

  /* Mobile toggle button (hidden on desktop) */
  .us-toggle-btn {
    display: none; background: none; border: 1px solid transparent;
    color: var(--ghost); width: 32px; height: 32px;
    align-items: center; justify-content: center; cursor: pointer;
    border-radius: 2px; transition: color 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }
  .us-toggle-btn:hover { color: var(--paper); border-color: var(--border); }

  /* Mobile: expanded overlay input */
  .us-mobile-overlay {
    display: none; position: fixed; top: 0; left: 0; right: 0;
    background: var(--void); border-bottom: 1px solid var(--border-md);
    z-index: 2000; padding: 10px 16px; gap: 10px; align-items: center;
  }
  .us-mobile-overlay.open { display: flex; }
  .us-mobile-input {
    flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border-md);
    color: var(--paper); font-family: "DM Sans", sans-serif; font-size: 14px;
    padding: 9px 14px; outline: none; border-radius: 2px;
  }
  .us-mobile-input::placeholder { color: var(--ghost); }
  .us-mobile-cancel {
    background: none; border: none; color: var(--ghost);
    font-family: "Space Mono", monospace; font-size: 10px;
    letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
    padding: 0; flex-shrink: 0; transition: color 0.15s;
  }
  .us-mobile-cancel:hover { color: var(--paper); }

  /* Shared dropdown */
  .us-dropdown {
    position: absolute; top: calc(100% + 6px); left: 0;
    min-width: 260px; max-width: 320px;
    background: var(--surface2); border: 1px solid var(--border-md);
    box-shadow: 0 8px 28px rgba(0,0,0,0.55); z-index: 2001;
    max-height: 300px; overflow-y: auto;
  }
  .us-dropdown::-webkit-scrollbar { width: 4px; }
  .us-dropdown::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 2px; }

  /* Mobile dropdown is anchored to the overlay bar */
  .us-mobile-overlay .us-dropdown {
    top: calc(100% + 2px); left: 16px; right: 16px;
    min-width: unset; max-width: unset;
  }

  .us-dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; cursor: pointer; background: none; border: none;
    width: 100%; text-align: left; border-bottom: 1px solid var(--border);
    transition: background 0.12s; text-decoration: none;
  }
  .us-dropdown-item:last-child { border-bottom: none; }
  .us-dropdown-item:hover, .us-dropdown-item.focused { background: rgba(255,255,255,0.05); }
  .us-dropdown-username {
    font-family: "Space Mono", monospace; font-size: 11px;
    color: var(--paper); letter-spacing: 0.04em;
  }
  .us-dropdown-fullname { font-size: 11px; color: var(--ghost); margin-top: 1px; }
  .us-dropdown-status {
    padding: 12px 14px; font-family: "Space Mono", monospace;
    font-size: 10px; color: var(--ghost); letter-spacing: 0.1em;
    text-align: center;
  }
  .us-searching { animation: us-pulse 1s ease-in-out infinite; }
  @keyframes us-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

  @media (max-width: 600px) {
    .us-input-wrap { display: none; }
    .us-toggle-btn { display: flex; }
  }
`;

const GhostIcon = ({ size = 24, color = "#e8e4da" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
    <path d="M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z" fill={color} opacity="0.9"/>
    <circle cx="13" cy="14" r="2" fill="#d42200"/>
    <circle cx="19" cy="14" r="2" fill="#d42200"/>
  </svg>
);

function UserAvatar({ profile, size = 28 }) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        alt=""
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: profile?.avatar_color || "#1c1c22",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <GhostIcon size={size * 0.68} color={profile?.ghost_color || "#e8e4da"} />
    </div>
  );
}

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // "idle" | "searching" | "done"
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [mobileOpen, setMobileOpen] = useState(false);

  const timerRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Close mobile overlay on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") closeMobile(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus mobile input when overlay opens
  useEffect(() => {
    if (mobileOpen) setTimeout(() => mobileInputRef.current?.focus(), 50);
  }, [mobileOpen]);

  function search(q) {
    setQuery(q);
    setFocusedIdx(-1);
    clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setStatus("idle"); return; }
    setStatus("searching");
    timerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, avatar_color, ghost_color")
        .ilike("username", `${q.trim()}%`)
        .limit(8);
      setResults(data || []);
      setStatus("done");
    }, 220);
  }

  function navigate(username) {
    window.location.href = `/profile.html?user=${encodeURIComponent(username)}`;
  }

  function handleKeyDown(e) {
    if (status !== "done" || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && focusedIdx >= 0) { e.preventDefault(); navigate(results[focusedIdx].username); }
    else if (e.key === "Escape") { clearSearch(); }
  }

  function clearSearch() {
    setQuery(""); setResults([]); setStatus("idle"); setFocusedIdx(-1);
    clearTimeout(timerRef.current);
  }

  function closeMobile() {
    setMobileOpen(false);
    clearSearch();
  }

  const showDropdown = status === "searching" || (status === "done");

  const Dropdown = ({ forMobile = false }) => (
    showDropdown ? (
      <div className="us-dropdown" style={forMobile ? { position: "fixed", top: 57, left: 0, right: 0, maxWidth: "unset", minWidth: "unset" } : {}}>
        {status === "searching" && (
          <div className="us-dropdown-status us-searching">Searching…</div>
        )}
        {status === "done" && results.length === 0 && (
          <div className="us-dropdown-status">No users found</div>
        )}
        {status === "done" && results.map((r, i) => (
          <button
            key={r.id}
            className={`us-dropdown-item${i === focusedIdx ? " focused" : ""}`}
            onMouseDown={() => navigate(r.username)}
            onMouseEnter={() => setFocusedIdx(i)}
          >
            <UserAvatar profile={r} size={28} />
            <div>
              <div className="us-dropdown-username">@{r.username}</div>
              {r.full_name && <div className="us-dropdown-fullname">{r.full_name}</div>}
            </div>
          </button>
        ))}
      </div>
    ) : null
  );

  return (
    <>
    <style>{STYLE}</style>
    <div className="us-wrap" style={{flexGrow:1, maxWidth:"240px"}}>
      {/* Desktop: inline input */}
      <div className="us-input-wrap">
        <input
          ref={desktopInputRef}
          className="us-input"
          placeholder="Search users…"
          value={query}
          autoComplete="off"
          style={{background:"#13131a",border:"1px solid rgba(255,255,255,0.25)",color:"#ffffff",minWidth:180,borderRadius:6,padding:"6px 12px"}}
          onChange={e => search(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(clearSearch, 150)}
        />
        <span className="us-icon">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
        </span>
        <Dropdown />
      </div>

      {/* Mobile: icon button */}
      <button className="us-toggle-btn" onClick={() => setMobileOpen(true)} title="Search users">
        <svg width="15" height="15" viewBox="0 0 13 13" fill="none">
          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.25"/>
          <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Mobile: full-width overlay */}
      {mobileOpen && (
        <div className={`us-mobile-overlay open`}>
          <input
            ref={mobileInputRef}
            className="us-mobile-input"
            placeholder="Search users…"
            value={query}
            autoComplete="off"
            onChange={e => search(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="us-mobile-cancel" onClick={closeMobile}>Cancel</button>
          <Dropdown forMobile />
        </div>
      )}
    </div>
    </>
  );
}
