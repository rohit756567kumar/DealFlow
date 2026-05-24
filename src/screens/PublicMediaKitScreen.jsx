// src/screens/PublicMediaKitScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Public page at /media-kit/:userId
// No auth required — this is what brands see when a creator shares their link.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

const fmt = (n) => `$${Number(n ?? 0).toLocaleString()}`;

const PLATFORM_EMOJI = {
  instagram: "📸", youtube: "▶️", tiktok: "🎵", linkedin: "💼",
  "twitter/x": "𝕏", newsletter: "📧", podcast: "🎙️",
};
const emoji = (p) => PLATFORM_EMOJI[(p ?? "").toLowerCase()] ?? "📱";

export default function PublicMediaKitScreen({ userId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
    fetch(`${API}/media-kit/${userId}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0F0A2E", display: "flex", alignItems: "center", justifyContent: "center", color: "#7B6EE8", fontFamily: "sans-serif" }}>
      Loading media kit…
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: "100vh", background: "#0F0A2E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", color: "#fff", textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>Media kit not found</h1>
      <p style={{ color: "#5E5A85", fontSize: 14 }}>This link may be invalid or the creator hasn't set up their media kit yet.</p>
    </div>
  );

  const { profile, rates, stats } = data;
  const platforms = [...new Set(rates.map(r => r.platform))];

  return (
    <div style={{ minHeight: "100vh", background: "#F4F3FA", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0F0A2E,#1a1260)", padding: "60px 20px 40px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#fff" }}>
          {profile.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{profile.name}</h1>
        {profile.handle && <div style={{ fontSize: 15, color: "#A99EF0", marginBottom: 6 }}>@{profile.handle}</div>}
        {profile.niche  && <div style={{ fontSize: 14, color: "#6B67A0", marginBottom: 16 }}>{profile.niche}</div>}
        {profile.bio    && (
          <p style={{ fontSize: 14, color: "#7B77A8", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>{profile.bio}</p>
        )}

        {/* Stats */}
        {(stats?.total_deals > 0) && (
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{stats.total_deals}</div>
              <div style={{ fontSize: 12, color: "#6B67A0" }}>Deals completed</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{fmt(stats.total_earned)}</div>
              <div style={{ fontSize: 12, color: "#6B67A0" }}>Total earned</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>

        {/* Platforms */}
        {platforms.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 20, border: "1px solid #E8E6F0" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#9B96B8", letterSpacing: "0.06em", margin: "0 0 14px" }}>PLATFORMS</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {platforms.map(p => (
                <span key={p} style={{ padding: "6px 14px", borderRadius: 20, background: "#F3F0FF", color: "#5B4BD8", fontSize: 13, fontWeight: 600, border: "1px solid #C9C2F7" }}>
                  {emoji(p)} {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rates */}
        {rates.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 20, border: "1px solid #E8E6F0" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#9B96B8", letterSpacing: "0.06em", margin: "0 0 14px" }}>RATES</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rates.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#F8F7FF", borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1035" }}>{r.deal_type}</div>
                    <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{emoji(r.platform)} {r.platform}{r.notes ? ` · ${r.notes}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#5B4BD8" }}>{fmt(r.rate)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Interested in collaborating?</div>
          <div style={{ fontSize: 14, color: "#C4BBFF", marginBottom: 20, lineHeight: 1.6 }}>
            Reach out to start a conversation. All deals are managed through dealflow.
          </div>
          <a href={`mailto:?subject=Collaboration with ${profile.name}`}
            style={{ display: "inline-block", padding: "12px 28px", borderRadius: 10, background: "#fff", color: "#5B4BD8", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Get in touch →
          </a>
        </div>

        {/* Powered by */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#C4C0D8" }}>
          Powered by <strong style={{ color: "#9B96B8" }}>dealflow</strong>
        </div>
      </div>
    </div>
  );
}
