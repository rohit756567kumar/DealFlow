// src/screens/InvoicesScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Lists all invoices, create invoice modal, mark as paid, delete draft.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useInvoices } from "../hooks/useInvoices.js";
import { useDeals }    from "../hooks/useDeals.js";
import { useAsync }    from "../hooks/useAsync.js";

const fmt     = (n) => `$${Number(n ?? 0).toLocaleString()}`;
const dateStr = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const STATUS_COLORS = {
  draft:   { bg: "#F1EFE8", text: "#444441", border: "#D9D5CC" },
  sent:    { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  paid:    { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
  overdue: { bg: "#FFF0F0", text: "#B91C1C", border: "#FCA5A5" },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: "capitalize" }}>
      {status}
    </span>
  );
};

// ── Create Invoice Modal ──────────────────────────────────────────────────────

function CreateInvoiceModal({ deals, onSave, onClose, saving, error }) {
  const [form, setForm] = useState({ dealId: deals[0]?.id ?? "", amount: "", dueDate: "", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill amount when deal changes
  const handleDealChange = (id) => {
    const deal = deals.find(d => d.id === id);
    setForm(f => ({ ...f, dealId: id, amount: deal?.amount ?? "" }));
  };

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 14, color: "#1a1035", background: "#FAFAFA", outline: "none", boxSizing: "border-box" };
  const lbl = { fontSize: 12, fontWeight: 600, color: "#7B76A0", marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(80,60,160,0.18)" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1035", margin: "0 0 20px" }}>Create Invoice</h2>

        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={lbl}>DEAL</label>
            <select style={inp} value={form.dealId} onChange={e => handleDealChange(e.target.value)}>
              {deals.map(d => <option key={d.id} value={d.id}>{d.brand} — {d.platform} ({fmt(d.amount)})</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>INVOICE AMOUNT ($)</label>
            <input style={inp} type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="1500" />
          </div>
          <div>
            <label style={lbl}>DUE DATE</label>
            <input style={inp} type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>NOTES</label>
            <input style={inp} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="e.g. Net 30" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving} style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: saving ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Row ───────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, onPay, onDelete, paying }) {
  const isOverdue = invoice.status === "sent" && invoice.due_date && new Date(invoice.due_date) < new Date();
  const status    = isOverdue ? "overdue" : invoice.status;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "1px solid #F0EEFF" }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1035" }}>{invoice.brand ?? "—"}</div>
        <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{invoice.platform} · {dateStr(invoice.created_at)}</div>
        {invoice.notes && <div style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>{invoice.notes}</div>}
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#5B4BD8" }}>{fmt(invoice.amount)}</div>
      <div style={{ fontSize: 13, color: "#9B96B8" }}>Due {dateStr(invoice.due_date)}</div>
      <StatusBadge status={status} />
      <div style={{ display: "flex", gap: 8 }}>
        {(status === "sent" || status === "overdue") && (
          <button onClick={() => onPay(invoice.id)} disabled={paying} style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: "#F0FDF4", color: "#166534", fontSize: 12, fontWeight: 600, cursor: paying ? "not-allowed" : "pointer", border: "1px solid #86EFAC" }}>
            Mark paid
          </button>
        )}
        {status === "draft" && (
          <button onClick={() => onDelete(invoice.id)} style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid #E8E6F0", background: "#fff", color: "#9B96B8", fontSize: 12, cursor: "pointer" }}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function InvoicesScreen() {
  const { invoices, loading, error, addInvoice, payInvoice, removeInvoice } = useInvoices();
  const { deals } = useDeals();
  const { run, loading: saving, error: saveError } = useAsync();
  const { run: paying, loading: isPaying } = useAsync();

  const [showModal, setShowModal] = useState(false);

  const eligibleDeals = deals.filter(d => !["paid"].includes(d.stage?.toLowerCase()));

  const totalPending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);

  const handleCreate = async (form) => {
    await run(async () => {
      await addInvoice({ dealId: form.dealId, amount: Number(form.amount), dueDate: form.dueDate, notes: form.notes });
      setShowModal(false);
    });
  };

  const handlePay = async (id) => {
    await paying(() => payInvoice(id));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this draft invoice?")) return;
    await removeInvoice(id);
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: 0 }}>Invoices</h2>
          <div style={{ fontSize: 13, color: "#9B96B8", marginTop: 4 }}>
            {fmt(totalPending)} pending · {fmt(totalPaid)} collected
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + New Invoice
        </button>
      </div>

      {error && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#B91C1C", marginBottom: 16 }}>{error}</div>}

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 16, padding: "12px 20px", background: "#F8F7FF", borderBottom: "1px solid #E8E6F0" }}>
          {["Brand", "Amount", "Due Date", "Status", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#9B96B8", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {loading && <div style={{ textAlign: "center", padding: 40, color: "#9B96B8" }}>Loading invoices…</div>}

        {!loading && invoices.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: "#C4C0D8" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#9B96B8" }}>No invoices yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Create your first invoice from a live deal</div>
          </div>
        )}

        {!loading && invoices.map(inv => (
          <InvoiceRow key={inv.id} invoice={inv} onPay={handlePay} onDelete={handleDelete} paying={isPaying} />
        ))}
      </div>

      {showModal && (
        <CreateInvoiceModal
          deals={eligibleDeals}
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
          saving={saving}
          error={saveError}
        />
      )}
    </div>
  );
}
