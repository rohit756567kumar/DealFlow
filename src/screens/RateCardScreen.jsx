// src/screens/RateCardScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Two tabs: Rate Card (manage rates) + Media Kit (shareable preview).
// Uses useRateCard() hook from useInvoices.js.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRateCard } from "../hooks/useInvoices.js";
import { useAsync }    from "../hooks/useAsync.js";

const PLATFORMS  = ["Instagram", "YouTube", "TikTok", "LinkedIn", "Twitter/X", "Newsletter", "Podcast"];
const DEAL_TYPES = ["Sponsored Post", "UGC", "Ambassador", "Affiliate", "Integration", "Mention"];

const PLATFORM_EMOJI = {
  instagram: "📸", youtube: "▶️", tiktok: "🎵", linkedin: "💼",
  "twitter/x": "𝕏", newsletter: "📧", podcast: "🎙️",
};
const emoji = (p) => PLATFORM_EMOJI[(p ?? "").toLowerCase()] ?? "📱";

const fmt = (n) => `$${Number(n ?? 0).toLocaleString()}`;

// ── Add / Edit Rate Modal ─────────────────────────────────────────────────────

function RateModal({ entry, onSave, onClose, saving, error }) {
  const [form, setForm] = useState(
    entry
      ? { platform: entry.platform, dealType: entry.deal_type, rate: entry.rate, notes: entry.notes ?? "" }
      : { platform: PLATFORMS[0], dealType: DEAL_TYPES[0], rate: "", notes: "" }
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 14, color: "#1a1035", background: "#FAFAFA", outline: "none", boxSizing: "border-box" };
  const lbl = { fontSize: 12, fontWeight: 600, color: "#7B76A0", marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(80,60,160,0.18)" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1035", margin: "0 0 20px" }}>{entry ? "Edit Rate" : "Add Rate"}</h2>

        {error && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>PLATFORM</label>
              <select style={inp} value={form.platform} onChange={e => set("platform", e.target.value)}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>DEAL TYPE</label>
              <select style={inp} value={form.dealType} onChange={e => set("dealType", e.target.value)}>
                {DEAL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>RATE ($)</label>
            <input style={inp} type="number" value={form.rate} onChange={e => set("rate", e.target.value)} placeholder="1500" />
          </div>
          <div>
            <label style={lbl}>NOTES (optional)</label>
            <input style={inp} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="e.g. Includes 1 revision" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave({ ...form, id: entry?.id })} disabled={saving} style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: saving ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : entry ? "Save changes" : "Add rate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rate Card Tab ─────────────────────────────────────────────────────────────

function RateCardTab({ rates, loading, onAdd, onEdit, onDelete }) {
  const grouped = rates.reduce((acc, r) => {
    const key = r.platform;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={onAdd} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Add Rate
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#9B96B8" }}>Loading rates…</div>}

      {!loading && rates.length === 0 && (
        <div style={{ textAlign: "center", padding: 50, background: "#fff", borderRadius: 14, border: "1px solid #E8E6F0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#9B96B8" }}>No rates added yet</div>
          <div style={{ fontSize: 13, color: "#C4C0D8", marginTop: 4 }}>Add your rates so brands know what to expect</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Object.entries(grouped).map(([platform, entries]) => (
          <div key={platform} style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", background: "#F8F7FF", borderBottom: "1px solid #E8E6F0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{emoji(platform)}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1035", textTransform: "capitalize" }}>{platform}</span>
            </div>
            {entries.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #F0EEFF" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1035" }}>{r.deal_type}</div>
                  {r.notes && <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{r.notes}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#5B4BD8" }}>{fmt(r.rate)}</span>
                  <button onClick={() => onEdit(r)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E8E6F0", background: "#fff", color: "#7B76A0", fontSize: 12, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => onDelete(r.id)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FFF0F0", color: "#B91C1C", fontSize: 12, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Media Kit Tab ─────────────────────────────────────────────────────────────

function MediaKitTab({ rates }) {
  const [creatorName, setCreatorName] = useState("Your Name");
  const [niche,       setNiche]       = useState("Tech & Productivity");
  const [bio,         setBio]         = useState("I create content about productivity, tools, and the creator economy. Helping 100K+ followers work smarter every week.");
  const [copied,      setCopied]      = useState(false);

  const mediaKitUrl = `${window.location.origin}/media-kit/me`;

  const copyLink = () => {
    navigator.clipboard.writeText(mediaKitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [...new Set(rates.map(r => r.platform))];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

      {/* Editor panel */}
      <div>
        <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1035", marginBottom: 14 }}>Customize your kit</div>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              ["Name / Handle", creatorName, setCreatorName, "Your Name"],
              ["Niche",         niche,       setNiche,       "Tech & Productivity"],
            ].map(([label, val, setter, ph]) => (
              <div key={label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#7B76A0", display: "block", marginBottom: 4 }}>{label.toUpperCase()}</label>
                <input value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 14, color: "#1a1035", background: "#FAFAFA", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#7B76A0", display: "block", marginBottom: 4 }}>BIO</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 13, color: "#1a1035", background: "#FAFAFA", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        {/* Share link */}
        <div style={{ background: "#F3F0FF", border: "1px solid #C9C2F7", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5B4BD8", marginBottom: 8 }}>SHAREABLE LINK</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "1px solid #C9C2F7", background: "#fff", fontSize: 12, color: "#7B76A0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mediaKitUrl}
            </div>
            <button onClick={copyLink} style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: copied ? "#15803D" : "#5B4BD8", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.2s" }}>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#9B96B8", marginTop: 8 }}>
            Connect a custom domain under Settings → Media Kit.
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg,#0F0A2E,#1a1260)", padding: "28px 24px 20px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>
            {creatorName[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{creatorName}</div>
          <div style={{ fontSize: 13, color: "#A99EF0", marginTop: 4 }}>{niche}</div>
          <div style={{ fontSize: 12, color: "#6B67A0", marginTop: 10, lineHeight: 1.6, maxWidth: 280, margin: "10px auto 0" }}>{bio}</div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {platforms.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9B96B8", marginBottom: 10, letterSpacing: "0.06em" }}>PLATFORMS</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {platforms.map(p => (
                  <span key={p} style={{ padding: "4px 12px", borderRadius: 20, background: "#F3F0FF", color: "#5B4BD8", fontSize: 12, fontWeight: 600, border: "1px solid #C9C2F7" }}>
                    {emoji(p)} {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9B96B8", marginBottom: 10, letterSpacing: "0.06em" }}>RATES</div>
            {rates.length === 0 && <div style={{ fontSize: 13, color: "#C4C0D8" }}>Add rates to display them here</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rates.map(r => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#F8F7FF", borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1035" }}>{r.deal_type}</span>
                    <span style={{ fontSize: 12, color: "#9B96B8", marginLeft: 6 }}>· {r.platform}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#5B4BD8" }}>{fmt(r.rate)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#15803D", fontWeight: 600 }}>📬 Interested in collaborating?</div>
            <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>Reach out via dealflow to get started</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RateCardScreen() {
  const { rates, loading, error, addEntry, editEntry, removeEntry } = useRateCard();
  const { run, loading: saving, error: saveError } = useAsync();

  const [tab,   setTab]   = useState("rates");   // "rates" | "mediakit"
  const [modal, setModal] = useState(null);       // null | "new" | rate entry object

  const handleSave = async (form) => {
    await run(async () => {
      if (form.id) await editEntry(form.id, { rate: Number(form.rate), notes: form.notes });
      else         await addEntry({ platform: form.platform, dealType: form.dealType, rate: Number(form.rate), notes: form.notes });
      setModal(null);
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this rate?")) return;
    await removeEntry(id);
  };

  const tabStyle = (active) => ({
    padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
    cursor: "pointer", background: active ? "#5B4BD8" : "transparent", color: active ? "#fff" : "#7B76A0",
    transition: "all 0.15s",
  });

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 4px" }}>Rate Card & Media Kit</h2>
          <div style={{ fontSize: 13, color: "#9B96B8" }}>Set your rates · share your media kit with brands</div>
        </div>
        <div style={{ background: "#F8F7FF", borderRadius: 10, padding: 4, display: "flex", gap: 2 }}>
          <button style={tabStyle(tab === "rates")}    onClick={() => setTab("rates")}>   Rate Card</button>
          <button style={tabStyle(tab === "mediakit")} onClick={() => setTab("mediakit")}>Media Kit</button>
        </div>
      </div>

      {error && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#B91C1C", marginBottom: 16 }}>{error}</div>}

      {tab === "rates"
        ? <RateCardTab rates={rates} loading={loading} onAdd={() => setModal("new")} onEdit={setModal} onDelete={handleDelete} />
        : <MediaKitTab rates={rates} />
      }

      {modal && (
        <RateModal
          entry={modal === "new" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
          error={saveError}
        />
      )}
    </div>
  );
}
