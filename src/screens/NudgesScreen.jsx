// src/screens/NudgesScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shows all deals that have gone silent for 5+ days.
// Creator can send a follow-up nudge with a custom or default message.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { getNudgeCandidates }  from "../services/analyticsService.js";
import { sendNudge, getDealNudges } from "../services/dealService.js";
import { useAsync } from "../hooks/useAsync.js";

const fmt     = (n) => `$${Number(n ?? 0).toLocaleString()}`;
const daysAgo = (d) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "today" : `${diff}d ago`;
};

const URGENCY_COLOR = (days) => {
  if (days >= 14) return { bg: "#FFF0F0", border: "#FCA5A5", text: "#B91C1C", label: "Urgent" };
  if (days >= 7)  return { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309", label: "Follow up" };
  return              { bg: "#F3F0FF", border: "#C9C2F7", text: "#5B4BD8", label: "Check in"  };
};

// ── Nudge Send Modal ──────────────────────────────────────────────────────────

function NudgeModal({ deal, onSend, onClose, sending }) {
  const defaultMsg = `Hi! Just following up on our potential collaboration — wanted to check if you're still interested in partnering with me. Happy to chat details whenever works for you!`;
  const [message, setMessage] = useState(defaultMsg);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 460, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(80,60,160,0.18)" }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1035", margin: "0 0 4px" }}>Send nudge to {deal.brand}</h2>
          <div style={{ fontSize: 13, color: "#9B96B8" }}>{deal.platform} · last activity {daysAgo(deal.updated_at)}</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#7B76A0", display: "block", marginBottom: 6 }}>MESSAGE</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 13, color: "#1a1035", background: "#FAFAFA", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
          />
          <div style={{ fontSize: 11, color: "#C4C0D8", marginTop: 4 }}>This is logged in the app. When Resend is connected, it will email the brand contact.</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSend(deal.id, message)} disabled={sending} style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: sending ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer" }}>
            {sending ? "Sending…" : "Log nudge →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Nudge History Panel ───────────────────────────────────────────────────────

function NudgeHistory({ dealId }) {
  const [nudges,  setNudges]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDealNudges(dealId)
      .then(setNudges)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealId]);

  if (loading) return <div style={{ fontSize: 12, color: "#C4C0D8", padding: "8px 0" }}>Loading history…</div>;
  if (!nudges.length) return <div style={{ fontSize: 12, color: "#C4C0D8", padding: "8px 0" }}>No nudges sent yet</div>;

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {nudges.map(n => (
        <div key={n.id} style={{ fontSize: 12, color: "#7B76A0", background: "#F8F7FF", borderRadius: 6, padding: "6px 10px" }}>
          <span style={{ color: "#9B96B8" }}>{new Date(n.sent_at).toLocaleDateString()} — </span>
          {n.message.slice(0, 80)}{n.message.length > 80 ? "…" : ""}
        </div>
      ))}
    </div>
  );
}

// ── Deal Card ─────────────────────────────────────────────────────────────────

function NudgeCard({ deal, onOpenModal }) {
  const [expanded, setExpanded] = useState(false);
  const u = URGENCY_COLOR(deal.days_silent ?? 0);

  return (
    <div style={{ background: "#fff", border: `1px solid ${u.border}`, borderRadius: 14, padding: "18px 20px", borderLeft: `4px solid ${u.text}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1035" }}>{deal.brand}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: u.bg, color: u.text, border: `1px solid ${u.border}` }}>{u.label}</span>
          </div>
          <div style={{ fontSize: 13, color: "#9B96B8" }}>
            {deal.platform} · {deal.deal_type} · {fmt(deal.amount)} · silent {deal.days_silent ?? "?"} days
          </div>
          {deal.note && <div style={{ fontSize: 12, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 5, padding: "3px 8px", marginTop: 6, display: "inline-block" }}>{deal.note}</div>}
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
          <button onClick={() => setExpanded(e => !e)} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            {expanded ? "Hide history" : "History"}
          </button>
          <button onClick={() => onOpenModal(deal)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Send nudge
          </button>
        </div>
      </div>

      {expanded && <NudgeHistory dealId={deal.id} />}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NudgesScreen() {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeModal, setActiveModal] = useState(null);   // deal object
  const [nudgedIds,   setNudgedIds]   = useState(new Set());
  const { run, loading: sending } = useAsync();

  const load = useCallback(() => {
    const fetch = async () => {
      setLoading(true); setError(null);
      try { setCandidates(await getNudgeCandidates()); }
      catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (dealId, message) => {
    await run(async () => {
      await sendNudge(dealId, message);
      setNudgedIds(s => new Set([...s, dealId]));
      setActiveModal(null);
    });
  };

  const visible = candidates.filter(d => !nudgedIds.has(d.id));

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 4px" }}>Nudge Queue</h2>
        <div style={{ fontSize: 13, color: "#9B96B8" }}>
          Deals that have gone quiet — follow up before they go cold.
        </div>
      </div>

      {error && (
        <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#B91C1C", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          {error} <button onClick={load} style={{ background: "none", border: "none", color: "#B91C1C", cursor: "pointer", fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 60, color: "#9B96B8" }}>Loading nudge queue…</div>}

      {!loading && visible.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 14, border: "1px solid #E8E6F0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1035" }}>You're all caught up!</div>
          <div style={{ fontSize: 13, color: "#9B96B8", marginTop: 6 }}>No deals have gone silent. Keep it up.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map(deal => (
          <NudgeCard key={deal.id} deal={deal} onOpenModal={setActiveModal} />
        ))}
      </div>

      {activeModal && (
        <NudgeModal
          deal={activeModal}
          onSend={handleSend}
          onClose={() => setActiveModal(null)}
          sending={sending}
        />
      )}
    </div>
  );
}
