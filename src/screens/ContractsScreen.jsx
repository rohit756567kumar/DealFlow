// src/screens/ContractsScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Lists all contracts. Create from a deal using a template.
// Shows status: draft → sent → signed.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api.js";
import { useDeals } from "../hooks/useDeals.js";
import { useAsync }  from "../hooks/useAsync.js";

const STATUS_COLORS = {
  draft:  { bg: "#F1EFE8", text: "#444441", border: "#D9D5CC" },
  sent:   { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  signed: { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
};

const TEMPLATES = [
  { key: "sponsored_post", label: "Sponsored Post",  icon: "📸" },
  { key: "ugc",            label: "UGC",             icon: "🎬" },
  { key: "ambassador",     label: "Ambassador",      icon: "🤝" },
  { key: "affiliate",      label: "Affiliate",       icon: "🔗" },
];

// Contract boilerplate generator (in production this would be server-rendered)
const generateContract = (deal, templateKey, creatorName) => {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const typeLabel = TEMPLATES.find(t => t.key === templateKey)?.label ?? templateKey;
  return `INFLUENCER COLLABORATION AGREEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: ${today}

PARTIES
Creator: ${creatorName}
Brand:   ${deal.brand}

DELIVERABLES
Type:     ${typeLabel}
Platform: ${deal.platform}
Amount:   $${Number(deal.amount).toLocaleString()}

SCOPE OF WORK
The Creator agrees to produce one (1) ${typeLabel} for ${deal.brand} on ${deal.platform},
in accordance with the brief provided by the Brand. Content must be original,
authentic, and comply with FTC disclosure guidelines.

PAYMENT TERMS
${deal.brand} agrees to pay the Creator $${Number(deal.amount).toLocaleString()} USD within 30 days
of content going live. Payment will be made via the agreed method.

USAGE RIGHTS
${deal.brand} may repost, share, and repurpose the content for a period of 6 months
from the publish date across their owned channels only.

REVISIONS
Creator will provide up to two (2) rounds of revisions at no additional cost.

EXCLUSIVITY
No exclusivity applies unless separately agreed in writing.

GOVERNING LAW
This agreement is governed by the laws of the Creator's jurisdiction.

SIGNATURES
Creator: _________________________ Date: ____________
Brand:   _________________________ Date: ____________`;
};

// ── Create Contract Modal ─────────────────────────────────────────────────────

function CreateContractModal({ deals, creatorName, onSave, onClose, saving, error }) {
  const [form, setForm] = useState({ dealId: deals[0]?.id ?? "", templateType: TEMPLATES[0].key });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedDeal = deals.find(d => d.id === form.dealId);
  const preview      = selectedDeal ? generateContract(selectedDeal, form.templateType, creatorName) : "";

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 14, color: "#1a1035", background: "#FAFAFA", outline: "none", boxSizing: "border-box" };
  const lbl = { fontSize: 12, fontWeight: 600, color: "#7B76A0", marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 620, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(80,60,160,0.18)" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1035", margin: "0 0 20px" }}>Generate Contract</h2>

        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={lbl}>DEAL</label>
            <select style={inp} value={form.dealId} onChange={e => set("dealId", e.target.value)}>
              {deals.map(d => <option key={d.id} value={d.id}>{d.brand} — {d.platform}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>TEMPLATE</label>
            <select style={inp} value={form.templateType} onChange={e => set("templateType", e.target.value)}>
              {TEMPLATES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>PREVIEW</label>
          <pre style={{ background: "#F8F7FF", border: "1px solid #E8E6F0", borderRadius: 8, padding: 16, fontSize: 11, color: "#1a1035", fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.7, maxHeight: 300, overflow: "auto" }}>
            {preview}
          </pre>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave({ ...form, content: preview })} disabled={saving} style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: saving ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Contract Modal ───────────────────────────────────────────────────────

function ViewContractModal({ contract, onMarkSent, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 620, maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(80,60,160,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1035", margin: 0 }}>Contract</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#9B96B8" }}>✕</button>
        </div>
        <pre style={{ flex: 1, background: "#F8F7FF", border: "1px solid #E8E6F0", borderRadius: 8, padding: 16, fontSize: 11, color: "#1a1035", fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.7, overflow: "auto", marginBottom: 16 }}>
          {contract.content}
        </pre>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
          {contract.status === "draft" && (
            <button onClick={() => onMarkSent(contract.id)} style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Mark as Sent →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Contract Row ──────────────────────────────────────────────────────────────

function ContractRow({ contract, onView }) {
  const c = STATUS_COLORS[contract.status] ?? STATUS_COLORS.draft;
  const tmpl = TEMPLATES.find(t => t.key === contract.template_type);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "1px solid #F0EEFF" }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1035" }}>{contract.brand ?? "—"}</div>
        <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{tmpl?.icon} {tmpl?.label ?? contract.template_type}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: "capitalize", display: "inline-block" }}>
        {contract.status}
      </span>
      <div style={{ fontSize: 13, color: "#9B96B8" }}>{new Date(contract.created_at).toLocaleDateString()}</div>
      <button onClick={() => onView(contract)} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#5B4BD8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        View
      </button>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ContractsScreen() {
  const [contracts, setContracts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewing,    setViewing]   = useState(null);

  const { deals, loading: dealsLoading } = useDeals();
  const { run, loading: saving, error: saveError } = useAsync();

  const creatorName = JSON.parse(localStorage.getItem("df_user") ?? "{}")?.name ?? "Creator";

  const loadContracts = useCallback(() => {
    const fetch = async () => {
      setLoading(true); setError(null);
      try {
        const data = await api.get("/contracts");
        setContracts(data.contracts ?? []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const handleCreate = async (form) => {
    await run(async () => {
      const data = await api.post("/contracts", {
        deal_id:       form.dealId,
        template_type: form.templateType,
        content:       form.content,
      });
      setContracts(cs => [data.contract, ...cs]);
      setShowCreate(false);
    });
  };

  const handleMarkSent = async (id) => {
    await run(async () => {
      const data = await api.patch(`/contracts/${id}`, { status: "sent" });
      setContracts(cs => cs.map(c => c.id === id ? data.contract : c));
      setViewing(null);
    });
  };

  const activeDealsList = deals;
  const sentCount    = contracts.filter(c => c.status === "sent").length;
  const signedCount  = contracts.filter(c => c.status === "signed").length;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#1a1035",
              margin: "0 0 4px",
            }}
          >
            Contracts
          </h2>
          <div style={{ fontSize: 13, color: "#9B96B8" }}>
            {sentCount} awaiting signature · {signedCount} signed
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={dealsLoading || deals.length === 0}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "none",
            background:
              dealsLoading || deals.length === 0
                ? "#C4C0D8"
                : "linear-gradient(135deg,#7B6EE8,#5B4BD8)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor:
              dealsLoading || deals.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {dealsLoading
            ? "Loading deals…"
            : deals.length === 0
              ? "Add deals first"
              : "+ Generate Contract"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#FFF0F0",
            border: "1px solid #FCA5A5",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            color: "#B91C1C",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #E8E6F0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: 16,
            padding: "12px 20px",
            background: "#F8F7FF",
            borderBottom: "1px solid #E8E6F0",
          }}
        >
          {["Brand", "Status", "Created", ""].map((h, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9B96B8",
                letterSpacing: "0.06em",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#9B96B8" }}>
            Loading contracts…
          </div>
        )}

        {!loading && contracts.length === 0 && (
          <div style={{ textAlign: "center", padding: 50 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#9B96B8" }}>
              No contracts yet
            </div>
            <div style={{ fontSize: 13, color: "#C4C0D8", marginTop: 4 }}>
              Generate one from a deal in the pipeline
            </div>
          </div>
        )}

        {!loading &&
          contracts.map((c) => (
            <ContractRow key={c.id} contract={c} onView={setViewing} />
          ))}
      </div>

      {showCreate && (
        <CreateContractModal
          deals={activeDealsList}
          creatorName={creatorName}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
          saving={saving}
          error={saveError}
        />
      )}

      {viewing && (
        <ViewContractModal
          contract={viewing}
          onMarkSent={handleMarkSent}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
