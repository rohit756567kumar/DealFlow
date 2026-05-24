// src/components/FreePlanBanner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shows a warning banner when free plan users hit the 3-deal limit.
// Import and use in the Pipeline section of App.jsx.
// ─────────────────────────────────────────────────────────────────────────────

export function FreePlanBanner({ dealCount, plan }) {
  const FREE_LIMIT = 3;

  if (plan !== "free") return null;

  const remaining = FREE_LIMIT - dealCount;
  const atLimit   = dealCount >= FREE_LIMIT;
  const nearLimit = remaining === 1;

  if (!atLimit && !nearLimit) return null;

  return (
    <div style={{
      background:    atLimit ? "#FFF0F0" : "#FFFBEB",
      border:        `1px solid ${atLimit ? "#FCA5A5" : "#FDE68A"}`,
      borderRadius:  12,
      padding:       "14px 18px",
      marginBottom:  16,
      display:       "flex",
      alignItems:    "center",
      justifyContent:"space-between",
      gap:           16,
      flexWrap:      "wrap",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: atLimit ? "#B91C1C" : "#B45309", marginBottom: 2 }}>
          {atLimit
            ? "⛔ Free plan limit reached"
            : "⚠️ Almost at your free plan limit"}
        </div>
        <div style={{ fontSize: 13, color: atLimit ? "#991B1B" : "#92400E" }}>
          {atLimit
            ? `You've used all ${FREE_LIMIT} deals on the free plan. Upgrade to Pro for unlimited deals.`
            : `1 deal slot remaining. Upgrade to Pro before you run out.`}
        </div>
      </div>
      <button
        onClick={() => alert("Stripe integration coming soon! For now, contact hello@dealflow.app to upgrade.")}
        style={{
          padding:    "8px 18px",
          borderRadius: 8,
          border:     "none",
          background: atLimit ? "#B91C1C" : "#B45309",
          color:      "#fff",
          fontSize:   13,
          fontWeight: 700,
          cursor:     "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Upgrade to Pro →
      </button>
    </div>
  );
}

// ── Plan badge shown in modal when limit is hit ───────────────────────────────

export function UpgradePrompt({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: 400, maxWidth: "95vw", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1035", margin: "0 0 10px" }}>Upgrade to Pro</h2>
        <p style={{ fontSize: 14, color: "#9B96B8", lineHeight: 1.7, margin: "0 0 8px" }}>
          You've hit the 3-deal limit on the free plan.
        </p>
        <p style={{ fontSize: 14, color: "#9B96B8", lineHeight: 1.7, margin: "0 0 24px" }}>
          Upgrade to <strong style={{ color: "#5B4BD8" }}>Pro ($29/mo)</strong> for unlimited deals, contracts, invoicing, and analytics.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "✅ Unlimited deals",
            "✅ Contracts & e-sign",
            "✅ Invoice generation",
            "✅ Full analytics",
            "✅ Nudge automation",
          ].map(f => (
            <div key={f} style={{ fontSize: 14, color: "#1a1035", textAlign: "left", padding: "8px 14px", background: "#F3F0FF", borderRadius: 8 }}>{f}</div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Maybe later
          </button>
          <button
            onClick={() => alert("Contact hello@dealflow.app to upgrade to Pro!")}
            style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Upgrade now →
          </button>
        </div>
      </div>
    </div>
  );
}
