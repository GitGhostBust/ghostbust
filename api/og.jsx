import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://awhqwqhntgxjvvawzkog.supabase.co";

function colorFor(gs) {
  return gs > 60 ? "#d42200" : gs > 35 ? "#c99a00" : "#00e67a";
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return new Response("Misconfigured", { status: 500 });

  let scan;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ghost_scans?id=eq.${id}&share_enabled=eq.true&select=ghost_score,assessment,title,company,confidence,scores`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const rows = await res.json();
    if (!rows || !rows.length) return new Response("Not found", { status: 404 });
    scan = rows[0];
  } catch {
    return new Response("Error fetching scan", { status: 500 });
  }

  const gs = scan.ghost_score || 0;
  const color = colorFor(gs);
  const sc = scan.scores || {};
  const v = scan.assessment || "UNKNOWN";
  const verdictLabel = v === "LEGIT" ? "Appears Legitimate" : v === "SUSPICIOUS" ? "Suspicious" : "Ghost Listing Detected";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#070709",
        padding: "56px 72px",
        fontFamily: "monospace",
      }}
    >
      {/* Score hero */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 28, marginBottom: 36 }}>
        <span style={{ fontSize: 168, fontWeight: 900, color, lineHeight: 0.82 }}>{gs}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: 6, color: "#4a4a60", textTransform: "uppercase" }}>
            Ghost Score
          </span>
          <span style={{ fontSize: 38, fontWeight: 700, color, lineHeight: 1 }}>{verdictLabel}</span>
          {(scan.title || scan.company) && (
            <span style={{ fontSize: 16, color: "rgba(238,234,224,0.55)", marginTop: 6 }}>
              {[scan.title, scan.company].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </div>

      {/* Sub-scores */}
      <div style={{ display: "flex", gap: 48, marginBottom: "auto" }}>
        {[
          ["Specificity", sc.specificityScore],
          ["Transparency", sc.transparencyScore],
          ["Process", sc.processScore],
          ["Confidence", scan.confidence],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#eeeae0" }}>{val ?? "—"}</span>
            <span style={{ fontSize: 10, color: "#4a4a60", letterSpacing: 4, textTransform: "uppercase" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: 24,
          marginTop: 24,
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 700, color: "#eeeae0", letterSpacing: 2 }}>
          Ghost<span style={{ color: "#d42200" }}>Bust</span>
        </span>
        <span style={{ fontSize: 13, color: "#4a4a60", letterSpacing: 3 }}>ghostbust.us · verify before you apply</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
