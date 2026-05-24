// src/screens/AnalyticsScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full analytics dashboard — summary cards, revenue trend, platform breakdown,
// stage funnel, and nudge candidates list.
// Uses useAnalytics() hook which fires all 5 endpoints in parallel.
// ─────────────────────────────────────────────────────────────────────────────

import { useAnalytics } from "../hooks/useAnalytics.js";

const fmt  = (n)  => `$${Number(n ?? 0).toLocaleString()}`;
const pct  = (n)  => `${Number(n ?? 0).toFixed(1)}%`;

const PLATFORM_COLORS = {
  instagram:  "#E1306C", youtube: "#FF0000", tiktok: "#000000",
  linkedin:   "#0A66C2", "twitter/x": "#1DA1F2", newsletter: "#F59E0B", podcast: "#8B5CF6",
};
const platformColor = (p) => PLATFORM_COLORS[(p ?? "").toLowerCase()] ?? "#7B6EE8";

// ── Sub-components ────────────────────────────────────────────────────────────

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px", ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1035", marginBottom: 16, letterSpacing: "0.03em" }}>
    {children}
  </div>
);

// Summary metric card
const MetricTile = ({ label, value, sub, accent }) => (
  <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px", borderTop: `3px solid ${accent}` }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#9B96B8", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: "#1a1035" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#15803D", marginTop: 4 }}>{sub}</div>}
  </div>
);

// Simple horizontal bar chart
const BarChart = ({ data, valueKey, labelKey, colorFn, formatValue }) => {
  const max = Math.max(...data.map(d => Number(d[valueKey] ?? 0)), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((row, i) => {
        const val   = Number(row[valueKey] ?? 0);
        const width = (val / max) * 100;
        const color = colorFn ? colorFn(row[labelKey]) : "#7B6EE8";
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "#1a1035", fontWeight: 500, textTransform: "capitalize" }}>{row[labelKey]}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1035" }}>{formatValue ? formatValue(val) : val}</span>
            </div>
            <div style={{ background: "#F0EEFF", borderRadius: 6, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${width}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.6s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Revenue trend — simple area-style bar chart
const TrendChart = ({ data }) => {
  if (!data.length) return <EmptyState text="No trend data yet" />;
  const maxVal = Math.max(...data.map(d => Number(d.pipeline ?? 0)), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 4px" }}>
      {data.map((row, i) => {
        const earned   = Number(row.earned   ?? 0);
        const pipeline = Number(row.pipeline ?? 0);
        const earnedH  = (earned   / maxVal) * 110;
        const pipeH    = (pipeline / maxVal) * 110;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", display: "flex", alignItems: "flex-end", gap: 2, height: 110, justifyContent: "center" }}>
              <div title={`Pipeline: ${fmt(pipeline)}`} style={{ width: "42%", height: pipeH, background: "#E8E4FD", borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} />
              <div title={`Earned: ${fmt(earned)}`}    style={{ width: "42%", height: earnedH, background: "#7B6EE8", borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 10, color: "#9B96B8", textAlign: "center", whiteSpace: "nowrap" }}>{row.month}</div>
          </div>
        );
      })}
    </div>
  );
};

// Stage funnel
const StageFunnel = ({ data }) => {
  if (!data.length) return <EmptyState text="No stage data yet" />;
  const COLORS = ["#7B6EE8","#2563EB","#B45309","#15803D","#C2410C","#166534"];
  const LABELS = { inbound:"Inbound", negotiating:"Negotiating", contract_sent:"Contract Sent", content_live:"Content Live", invoiced:"Invoiced", paid:"Paid" };
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 90, fontSize: 12, color: "#7B76A0", textAlign: "right", flexShrink: 0 }}>
            {LABELS[row.stage] ?? row.stage}
          </div>
          <div style={{ flex: 1, background: "#F0EEFF", borderRadius: 6, height: 28, overflow: "hidden", position: "relative" }}>
            <div style={{ width: `${(row.count / maxCount) * 100}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 10, transition: "width 0.6s ease", minWidth: row.count ? 40 : 0 }}>
              {row.count > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{row.count}</span>}
            </div>
          </div>
          <div style={{ width: 60, fontSize: 12, fontWeight: 700, color: "#1a1035", textAlign: "right", flexShrink: 0 }}>
            {fmt(row.total)}
          </div>
        </div>
      ))}
    </div>
  );
};

// Nudge candidate row
const NudgeRow = ({ deal, onNudge }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F0EEFF" }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1035" }}>{deal.brand}</div>
      <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{deal.platform} · {deal.deal_type} · silent {deal.days_silent}d</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#5B4BD8" }}>{fmt(deal.amount)}</span>
      <button onClick={() => onNudge(deal.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #C9C2F7", background: "#F3F0FF", color: "#5B4BD8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        Send nudge
      </button>
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ textAlign: "center", padding: "30px 0", color: "#C4C0D8", fontSize: 13 }}>{text}</div>
);

const LoadingState = () => (
  <div style={{ textAlign: "center", padding: 60, color: "#9B96B8", fontSize: 14 }}>Loading analytics…</div>
);

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { summary, byStage, byPlatform, revenueTrend, nudgeCandidates, loading, error, refetch } = useAnalytics();

  if (loading) return <LoadingState />;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

      {error && (
        <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#B91C1C", display: "flex", justifyContent: "space-between" }}>
          {error} <button onClick={refetch} style={{ background: "none", border: "none", color: "#B91C1C", cursor: "pointer", fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {/* Summary tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <MetricTile label="TOTAL EARNED"    value={fmt(summary?.total_earned)}    sub="All paid deals"          accent="#166534" />
        <MetricTile label="PIPELINE VALUE"  value={fmt(summary?.pipeline_value)}  sub="Active + pending"        accent="#7B6EE8" />
        <MetricTile label="PENDING PAYMENT" value={fmt(summary?.pending_payment)} sub="Invoiced not yet paid"   accent="#C2410C" />
        <MetricTile label="TOTAL DEALS"     value={summary?.total_deals ?? "—"}   sub="All time"                accent="#2563EB" />
        <MetricTile label="ACTIVE DEALS"    value={summary?.active_deals ?? "—"}  sub="Excluding paid"          accent="#B45309" />
        <MetricTile label="AVG. DEAL SIZE"  value={fmt(summary?.avg_deal_size)}   sub="Per deal"                accent="#8B5CF6" />
      </div>

      {/* Revenue trend + Platform breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <SectionTitle>Revenue Trend — Last 6 Months</SectionTitle>
          <TrendChart data={revenueTrend} />
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9B96B8" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#7B6EE8" }} /> Earned
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9B96B8" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#E8E4FD" }} /> Pipeline
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Revenue by Platform</SectionTitle>
          {byPlatform.length
            ? <BarChart data={byPlatform} valueKey="total" labelKey="platform" colorFn={platformColor} formatValue={fmt} />
            : <EmptyState text="No platform data yet" />}
        </Card>
      </div>

      {/* Stage funnel + Nudge candidates */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <SectionTitle>Pipeline Funnel</SectionTitle>
          <StageFunnel data={byStage} />
        </Card>

        <Card>
          <SectionTitle>🔔 Nudge Candidates — Silent 5+ Days</SectionTitle>
          {nudgeCandidates.length
            ? nudgeCandidates.map(d => <NudgeRow key={d.id} deal={d} onNudge={(id) => alert(`Nudge logged for deal ${id}`)} />)
            : <EmptyState text="No silent deals — you're on top of it! 🎉" />}
        </Card>
      </div>

    </div>
  );
}
