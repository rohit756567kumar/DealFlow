// src/components/MobilePipeline.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Mobile pipeline — vertical stage list instead of horizontal Kanban.
// Stages collapse/expand. Deal cards are touch-friendly.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

const STAGE_COLORS = {
  "Inbound":       { bg: "#F3F0FF", text: "#5B4BD8", border: "#C9C2F7" },
  "Negotiating":   { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  "Contract Sent": { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "Content Live":  { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "Invoiced":      { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  "Paid":          { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
};

const fmt = (n) => `$${Number(n ?? 0).toLocaleString()}`;

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    edit:  <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2"/></>,
    trash: <><polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth="2"/><path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2"/></>,
    chevron: <polyline points={name === "chevron-up" ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">{icons[name] ?? null}</svg>;
};

const Badge = ({ stage }) => {
  const c = STAGE_COLORS[stage] || STAGE_COLORS["Inbound"];
  return <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>{stage}</span>;
};

function MobileDealCard({ deal, onMove, onDelete, onEdit, stages }) {
  const stageIdx = stages.indexOf(deal.stage);
  return (
    <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 4px rgba(80,60,160,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1035" }}>{deal.brand}</div>
          <div style={{ fontSize: 12, color: "#7B76A0", marginTop: 2 }}>{deal.type} · {deal.platform}</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
          <button onClick={() => onEdit(deal)} style={{ border: "none", background: "#F8F7FF", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}>
            <Icon name="edit" size={14} color="#7B76A0" />
          </button>
          <button onClick={() => onDelete(deal.id)} style={{ border: "none", background: "#FFF0F0", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}>
            <Icon name="trash" size={14} color="#B91C1C" />
          </button>
        </div>
      </div>

      {deal.note && (
        <div style={{ fontSize: 12, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 6, padding: "5px 10px", marginBottom: 10 }}>
          {deal.note}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: "#5B4BD8" }}>{fmt(deal.amount)}</span>
        <Badge stage={deal.stage} />
      </div>

      {/* Move buttons — full width touch targets */}
      <div style={{ display: "flex", gap: 8 }}>
        {stageIdx > 0 && (
          <button
            onClick={() => onMove(deal.id, -1)}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            ← Back
          </button>
        )}
        {stageIdx < stages.length - 1 && (
          <button
            onClick={() => onMove(deal.id, 1)}
            style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "1px solid #C9C2F7", background: "#F3F0FF", color: "#5B4BD8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Move forward →
          </button>
        )}
      </div>
    </div>
  );
}

function StageSection({ stage, deals, onMove, onDelete, onEdit, stages }) {
  const [open, setOpen] = useState(stage !== "Paid");
  const c     = STAGE_COLORS[stage];
  const total = deals.reduce((s, d) => s + d.amount, 0);

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, border: "none", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer", marginBottom: open ? 8 : 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1035" }}>{stage}</span>
          <span style={{ fontSize: 12, color: "#9B96B8" }}>{deals.length} deal{deals.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{fmt(total)}</span>
          <Icon name={open ? "chevron-up" : "chevron-down"} size={16} color="#9B96B8" />
        </div>
      </button>

      {open && (
        <div style={{ paddingLeft: 4 }}>
          {deals.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#C4C0D8", fontSize: 13, background: "#F8F7FF", borderRadius: 10 }}>
              No deals in this stage
            </div>
          )}
          {deals.map(deal => (
            <MobileDealCard key={deal.id} deal={deal} onMove={onMove} onDelete={onDelete} onEdit={onEdit} stages={stages} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MobilePipeline({ deals, stages, onMove, onDelete, onEdit }) {
  return (
    <div style={{ padding: "16px 16px 80px" }}>
      {stages.map(stage => (
        <StageSection
          key={stage}
          stage={stage}
          deals={deals.filter(d => d.stage === stage)}
          onMove={onMove}
          onDelete={onDelete}
          onEdit={onEdit}
          stages={stages}
        />
      ))}
    </div>
  );
}
