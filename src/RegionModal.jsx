import { useState } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  .rm-overlay {
    position: fixed; inset: 0; background: rgba(7,7,9,0.96);
    z-index: 10000; display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .rm-card {
    background: #0e0e12; border: 1px solid rgba(255,255,255,0.1);
    border-top: 4px solid #d42200; max-width: 480px; width: 100%;
    padding: 36px; position: relative;
  }
  .rm-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.4em;
    text-transform: uppercase; color: #d42200; margin-bottom: 8px;
  }
  .rm-heading {
    font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 0.03em;
    color: #eeeae0; line-height: 1; margin-bottom: 10px;
  }
  .rm-sub {
    font-size: 13px; color: rgba(238,234,224,0.55); line-height: 1.65;
    margin-bottom: 28px;
  }
  .rm-field { margin-bottom: 16px; position: relative; }
  .rm-label {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em;
    text-transform: uppercase; color: #00e67a; margin-bottom: 6px; display: block;
  }
  .rm-input {
    width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12);
    color: #eeeae0; font-family: 'DM Sans', sans-serif; font-size: 14px;
    padding: 10px 14px; outline: none; transition: border-color 0.2s;
  }
  .rm-input:focus { border-color: rgba(255,255,255,0.3); }
  .rm-input::placeholder { color: rgba(255,255,255,0.25); }
  .rm-input:disabled { opacity: 0.35; cursor: not-allowed; }
  .rm-select { appearance: none; cursor: pointer; }
  .rm-select option { background: #13131a; color: #eeeae0; }

  .rm-dropdown {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 100;
    background: #13131a; border: 1px solid rgba(255,255,255,0.15);
    border-top: none; max-height: 220px; overflow-y: auto;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  }
  .rm-dropdown::-webkit-scrollbar { width: 4px; }
  .rm-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
  .rm-dropdown-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; cursor: pointer; background: none; border: none;
    width: 100%; text-align: left; color: #eeeae0; font-family: 'DM Sans', sans-serif;
    font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: background 0.1s;
  }
  .rm-dropdown-item:last-child { border-bottom: none; }
  .rm-dropdown-item:hover { background: rgba(255,255,255,0.06); }
  .rm-dropdown-state {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: rgba(255,255,255,0.35); flex-shrink: 0;
  }
  .rm-dropdown-empty {
    padding: 12px 14px; font-size: 12px; color: rgba(255,255,255,0.35);
    font-style: italic;
  }

  .rm-checkbox-row {
    display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
    margin-bottom: 24px; margin-top: 4px;
  }
  .rm-checkbox-row input[type="checkbox"] {
    width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px;
    accent-color: #d42200; cursor: pointer;
  }
  .rm-checkbox-row span {
    font-size: 13px; color: rgba(238,234,224,0.75); line-height: 1.5;
  }

  .rm-save-btn {
    width: 100%; background: #d42200; color: #eeeae0;
    font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.08em;
    border: none; padding: 14px; cursor: pointer; transition: background 0.15s;
    margin-bottom: 14px;
  }
  .rm-save-btn:hover:not(:disabled) { background: #e52600; }
  .rm-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .rm-skip {
    display: block; width: 100%; background: none; border: none;
    color: rgba(255,255,255,0.3); font-family: 'Space Mono', monospace;
    font-size: 10px; letter-spacing: 0.1em; text-align: center;
    cursor: pointer; padding: 4px 0; transition: color 0.15s;
  }
  .rm-skip:hover { color: rgba(255,255,255,0.55); }

  .rm-done {
    text-align: center; padding: 32px 0;
  }
  .rm-done-icon {
    font-size: 48px; color: #00e67a; margin-bottom: 12px;
  }
  .rm-done-text {
    font-family: 'Bebas Neue', sans-serif; font-size: 28px;
    letter-spacing: 0.06em; color: #eeeae0;
  }
`;

const METRO_REGIONS = [
  { metro: "New York Metro",       state: "New York" },
  { metro: "Los Angeles Metro",    state: "California" },
  { metro: "Chicago Metro",        state: "Illinois" },
  { metro: "Dallas Metro",         state: "Texas" },
  { metro: "Houston Metro",        state: "Texas" },
  { metro: "Washington DC Metro",  state: "District of Columbia" },
  { metro: "Miami Metro",          state: "Florida" },
  { metro: "Atlanta Metro",        state: "Georgia" },
  { metro: "Boston Metro",         state: "Massachusetts" },
  { metro: "San Francisco Metro",  state: "California" },
  { metro: "Seattle Metro",        state: "Washington" },
  { metro: "Austin Metro",         state: "Texas" },
  { metro: "Denver Metro",         state: "Colorado" },
  { metro: "Phoenix Metro",        state: "Arizona" },
  { metro: "Philadelphia Metro",   state: "Pennsylvania" },
];

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "New Zealand",
  "Ireland",
  "South Africa",
  "Other",
];

export default function RegionModal({ userId, onClose }) {
  const [metroSearch, setMetroSearch] = useState("");
  const [metro, setMetro] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("United States");
  const [openRegion, setOpenRegion] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const filtered = METRO_REGIONS.filter(r =>
    r.metro.toLowerCase().includes(metroSearch.toLowerCase())
  );

  function handleMetroInput(val) {
    setMetroSearch(val);
    setMetro("");
    setState("");
    setShowDropdown(true);
  }

  function handleMetroSelect(r) {
    setMetro(r.metro);
    setState(r.state);
    setMetroSearch(r.metro);
    setShowDropdown(false);
  }

  function handleOpenRegion(checked) {
    setOpenRegion(checked);
    if (checked) {
      setMetroSearch("");
      setMetro("");
      setState("");
      setShowDropdown(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("profiles").update({
      job_market_region:  openRegion ? null : (metro || null),
      job_market_state:   openRegion ? null : (state || null),
      job_market_country: country,
      job_market_open:    openRegion,
      region_set:         true,
    }).eq("id", userId);
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1400);
  }

  function handleSkip() {
    try { sessionStorage.setItem("gb_region_skipped", "1"); } catch(e) {}
    onClose();
  }

  const canSave = openRegion || metro;

  return (
    <>
      <style>{STYLE}</style>
      <div className="rm-overlay" onMouseDown={e => e.stopPropagation()}>
        <div className="rm-card">
          {done ? (
            <div className="rm-done">
              <div className="rm-done-icon">✓</div>
              <div className="rm-done-text">Region Saved</div>
            </div>
          ) : (
            <>
              <div className="rm-eyebrow">Job Market Setup</div>
              <h2 className="rm-heading">Where are you job hunting?</h2>
              <p className="rm-sub">We use this to show you the most relevant ghost job data for your market</p>

              <div className="rm-field">
                <label className="rm-label">Metro Area</label>
                <div style={{position:"relative"}}>
                  <input
                    className="rm-input"
                    placeholder="Search metro areas…"
                    value={metroSearch}
                    disabled={openRegion}
                    onChange={e => handleMetroInput(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    autoComplete="off"
                  />
                  {showDropdown && metroSearch && !openRegion && (
                    <div className="rm-dropdown">
                      {filtered.length > 0 ? filtered.map(r => (
                        <button key={r.metro} className="rm-dropdown-item" onMouseDown={() => handleMetroSelect(r)}>
                          <span>{r.metro}</span>
                          <span className="rm-dropdown-state">{r.state}</span>
                        </button>
                      )) : (
                        <div className="rm-dropdown-empty">No matches — type your city or enter manually below</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rm-field">
                <label className="rm-label">State / Province</label>
                <input
                  className="rm-input"
                  placeholder="Auto-filled from metro, or type manually"
                  value={state}
                  disabled={openRegion}
                  onChange={e => setState(e.target.value)}
                />
              </div>

              <div className="rm-field">
                <label className="rm-label">Country</label>
                <select className="rm-input rm-select" value={country} onChange={e => setCountry(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <label className="rm-checkbox-row">
                <input
                  type="checkbox"
                  checked={openRegion}
                  onChange={e => handleOpenRegion(e.target.checked)}
                />
                <span>I'm open to multiple regions / remote — don't lock me to one metro</span>
              </label>

              <button className="rm-save-btn" onClick={handleSave} disabled={saving || !canSave}>
                {saving ? "Saving…" : "Save My Region →"}
              </button>
              <button className="rm-skip" onClick={handleSkip}>Skip for now</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
