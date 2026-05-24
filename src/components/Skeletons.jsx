// src/components/Skeletons.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Skeleton placeholder components shown while data is loading.
// Replaces the plain "Loading…" text with animated card outlines.
// ─────────────────────────────────────────────────────────────────────────────

// ── Base pulse animation ──────────────────────────────────────────────────────

const pulseStyle = {
  background: "linear-gradient(90deg, #F0EEFF 25%, #E8E4FD 50%, #F0EEFF 75%)",
  backgroundSize: "200% 100%",
  animation: "skeleton-pulse 1.4s ease-in-out infinite",
  borderRadius: 6,
};

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("skeleton-style")) {
  const style = document.createElement("style");
  style.id    = "skeleton-style";
  style.textContent = `
    @keyframes skeleton-pulse {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

const Bone = ({ width = "100%", height = 14, style = {} }) => (
  <div style={{ ...pulseStyle, width, height, borderRadius: 6, ...style }} />
);

// ── Metric card skeleton ──────────────────────────────────────────────────────

const MetricSkeleton = ({ accent = "#E8E4FD" }) => (
  <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 12, padding: "16px 18px", borderTop: `3px solid ${accent}` }}>
    <Bone width="60%" height={11} style={{ marginBottom: 10 }} />
    <Bone width="45%" height={28} style={{ marginBottom: 8 }} />
    <Bone width="70%" height={11} />
  </div>
);

// ── Deal card skeleton ────────────────────────────────────────────────────────

const DealCardSkeleton = () => (
  <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <Bone width="55%" height={14} />
      <Bone width={40} height={14} />
    </div>
    <Bone width="70%" height={11} style={{ marginBottom: 12 }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Bone width={60} height={16} />
      <Bone width={80} height={20} style={{ borderRadius: 20 }} />
    </div>
    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
      <Bone height={28} style={{ flex: 2, borderRadius: 6 }} />
    </div>
  </div>
);

// ── Pipeline column skeleton ──────────────────────────────────────────────────

const ColumnSkeleton = ({ cards = 2 }) => (
  <div style={{ minWidth: 210, flex: "0 0 210px" }}>
    <div style={{ marginBottom: 10 }}>
      <Bone width="50%" height={12} style={{ marginBottom: 6 }} />
      <Bone width="70%" height={11} />
    </div>
    <div style={{ background: "#F8F7FF", borderRadius: 10, padding: 10, minHeight: 120 }}>
      {Array.from({ length: cards }).map((_, i) => <DealCardSkeleton key={i} />)}
    </div>
  </div>
);

// ── Full pipeline skeleton ────────────────────────────────────────────────────

export function PipelineSkeleton() {
  const ACCENT_COLORS = ["#7B6EE8", "#2563EB", "#B45309", "#15803D", "#C2410C", "#166534"];
  const CARD_COUNTS   = [2, 2, 1, 1, 1, 0];

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
      {/* Metric skeletons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {ACCENT_COLORS.slice(0, 4).map((a, i) => <MetricSkeleton key={i} accent={a} />)}
      </div>

      {/* Column skeletons */}
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {CARD_COUNTS.map((n, i) => <ColumnSkeleton key={i} cards={n} />)}
      </div>
    </div>
  );
}

// ── Table row skeleton (Invoices / Contracts) ─────────────────────────────────

const TableRowSkeleton = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", borderBottom: "1px solid #F0EEFF" }}>
    <div style={{ flex: 2 }}>
      <Bone width="60%" height={14} style={{ marginBottom: 6 }} />
      <Bone width="40%" height={11} />
    </div>
    <Bone width={80} height={14} style={{ flex: 1 }} />
    <Bone width={90} height={14} style={{ flex: 1 }} />
    <Bone width={60} height={24} style={{ borderRadius: 20, flex: "0 0 60px" }} />
    <Bone width={70} height={30} style={{ borderRadius: 8, flex: "0 0 70px" }} />
  </div>
);

export function TableSkeleton({ rows = 4 }) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Bone width={140} height={20} style={{ marginBottom: 8 }} />
          <Bone width={200} height={13} />
        </div>
        <Bone width={130} height={36} style={{ borderRadius: 8 }} />
      </div>

      <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ padding: "12px 20px", background: "#F8F7FF", borderBottom: "1px solid #E8E6F0", display: "flex", gap: 20 }}>
          {[2, 1, 1, 1, 0.5].map((f, i) => <Bone key={i} width="60%" height={11} style={{ flex: f }} />)}
        </div>
        {Array.from({ length: rows }).map((_, i) => <TableRowSkeleton key={i} />)}
      </div>
    </div>
  );
}

// ── Analytics skeleton ────────────────────────────────────────────────────────

const ChartSkeleton = ({ height = 140 }) => (
  <div style={{ background: "#F8F7FF", borderRadius: 10, height, display: "flex", alignItems: "flex-end", gap: 6, padding: "12px 12px 0" }}>
    {[60, 80, 50, 90, 70, 100].map((h, i) => (
      <div key={i} style={{ ...pulseStyle, flex: 1, height: `${h}%`, borderRadius: "4px 4px 0 0", animationDelay: `${i * 0.1}s` }} />
    ))}
  </div>
);

export function AnalyticsSkeleton() {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {["#166534","#7B6EE8","#C2410C","#2563EB","#B45309","#8B5CF6"].map((a, i) => (
          <MetricSkeleton key={i} accent={a} />
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[0,1].map(i => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
            <Bone width="55%" height={14} style={{ marginBottom: 16 }} />
            <ChartSkeleton />
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[0,1].map(i => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
            <Bone width="45%" height={14} style={{ marginBottom: 16 }} />
            {[1,0.8,0.6,0.4].map((w, j) => (
              <div key={j} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                <Bone width={80} height={11} />
                <Bone width={`${w * 100}%`} height={28} style={{ flex: 1, borderRadius: 6 }} />
                <Bone width={55} height={11} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rate card skeleton ────────────────────────────────────────────────────────

export function RateCardSkeleton() {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div><Bone width={180} height={20} style={{ marginBottom: 8 }} /><Bone width={240} height={13} /></div>
        <Bone width={120} height={36} style={{ borderRadius: 10 }} />
      </div>
      {[1,2].map(i => (
        <div key={i} style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "12px 20px", background: "#F8F7FF", borderBottom: "1px solid #E8E6F0" }}>
            <Bone width={100} height={14} />
          </div>
          {[1,2].map(j => (
            <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #F0EEFF" }}>
              <div><Bone width={120} height={14} style={{ marginBottom: 6 }} /><Bone width={80} height={11} /></div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Bone width={60} height={20} /><Bone width={50} height={28} style={{ borderRadius: 6 }} /><Bone width={32} height={28} style={{ borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
