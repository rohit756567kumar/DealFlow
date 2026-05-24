// src/screens/AdminScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin dashboard — only visible to emails listed in ADMIN_EMAILS (.env)
// Shows all users, usage stats, and lets you upgrade/downgrade plans.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const fmt     = (n) => `$${Number(n ?? 0).toLocaleString()}`;
const dateStr = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const timeAgo = (d) => {
  if (!d) return "Never";
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  return dateStr(d);
};

const PLAN_COLORS = {
  free:   { bg: "#F1EFE8", text: "#444441", border: "#D9D5CC" },
  pro:    { bg: "#F3F0FF", text: "#5B4BD8", border: "#C9C2F7" },
  studio: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
};

// ── Stat tile ─────────────────────────────────────────────────────────────────

const StatTile = ({ label, value, sub, accent }) => (
  <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 12, padding: "16px 20px", borderTop: `3px solid ${accent}` }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#9B96B8", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: "#1a1035" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 4 }}>{sub}</div>}
  </div>
);

// ── Plan badge ────────────────────────────────────────────────────────────────

const PlanBadge = ({ plan }) => {
  const c = PLAN_COLORS[plan] ?? PLAN_COLORS.free;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: "capitalize" }}>
      {plan}
    </span>
  );
};

// ── Upgrade modal ─────────────────────────────────────────────────────────────

function UpgradeModal({ user, onSave, onClose, saving }) {
  const [plan, setPlan] = useState(user.plan);
  const plans = [
    { key: "free",   label: "Free",   desc: "3 deal limit, basic features" },
    { key: "pro",    label: "Pro",    desc: "Unlimited deals, all features" },
    { key: "studio", label: "Studio", desc: "Pro + team access" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1035", margin: "0 0 6px" }}>Change Plan</h2>
        <div style={{ fontSize: 13, color: "#9B96B8", marginBottom: 20 }}>
          {user.name} · {user.email}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {plans.map(p => (
            <div
              key={p.key}
              onClick={() => setPlan(p.key)}
              style={{ padding: "14px 16px", borderRadius: 10, border: `2px solid ${plan === p.key ? "#7B6EE8" : "#E8E6F0"}`, background: plan === p.key ? "#F3F0FF" : "#FAFAFA", cursor: "pointer", transition: "all 0.15s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1035" }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{p.desc}</div>
                </div>
                {plan === p.key && (
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#7B6EE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#7B76A0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave(user.id, plan)} disabled={saving || plan === user.plan} style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: (saving || plan === user.plan) ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (saving || plan === user.plan) ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : plan === user.plan ? "No change" : `Set to ${plan}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────

function UserRow({ user, onUpgrade, onDelete }) {
  return (
    <tr style={{ borderBottom: "1px solid #F0EEFF" }}>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1035" }}>{user.name}</div>
        <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{user.email}</div>
      </td>
      <td style={{ padding: "14px 16px" }}><PlanBadge plan={user.plan} /></td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#1a1035", fontWeight: 600 }}>{user.deal_count ?? 0}</td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#5B4BD8", fontWeight: 700 }}>{fmt(user.total_earned)}</td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#9B96B8" }}>{timeAgo(user.last_deal_at)}</td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#9B96B8" }}>{dateStr(user.created_at)}</td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onUpgrade(user)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            {user.plan === "free" ? "⬆ Upgrade" : "Change plan"}
          </button>
          <button onClick={() => onDelete(user)} style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid #FCA5A5", background: "#FFF0F0", color: "#B91C1C", fontSize: 12, cursor: "pointer" }}>
            🗑
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { user: adminUser } = useAuth();

  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [modal,    setModal]    = useState(null);   // user object
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState("users"); // users | stats | deals

  // Load stats + users
  const loadData = useCallback(() => {
    const fetch = async () => {
      setLoading(true); setError(null);
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get(`/admin/users?search=${search}&plan=${planFilter}`),
        ]);
        setStats(statsRes.stats);
        setUsers(usersRes.users);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search, planFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Upgrade / downgrade plan
  const handleSavePlan = async (userId, plan) => {
    setSaving(true);
    try {
      const data = await api.patch(`/admin/users/${userId}/plan`, { plan });
      setUsers(us => us.map(u => u.id === userId ? { ...u, plan: data.user.plan } : u));
      setModal(null);
      alert(`✅ ${data.message}`);
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete user
  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name} (${user.email}) and ALL their data? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers(us => us.filter(u => u.id !== user.id));
      alert("User deleted.");
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  const tabStyle = (active) => ({
    padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
    cursor: "pointer", background: active ? "#5B4BD8" : "transparent",
    color: active ? "#fff" : "#7B76A0", transition: "all 0.15s",
  });

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 4px" }}>
            🛡 Admin Dashboard
          </h2>
          <div style={{ fontSize: 13, color: "#9B96B8" }}>Signed in as {adminUser?.email}</div>
        </div>
        <button onClick={loadData} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#5B4BD8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#B91C1C", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Stats tiles */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <StatTile label="TOTAL USERS"    value={stats.total_users}       sub={`+${stats.new_users_7d} this week`}  accent="#7B6EE8" />
          <StatTile label="PRO USERS"      value={stats.pro_users}         sub={`${stats.free_users} on free`}        accent="#5B4BD8" />
          <StatTile label="TOTAL DEALS"    value={stats.total_deals}       sub="Across all users"                      accent="#2563EB" />
          <StatTile label="PIPELINE VALUE" value={fmt(stats.total_pipeline_value)} sub="All users combined"           accent="#15803D" />
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: "#F8F7FF", borderRadius: 10, padding: 4, display: "inline-flex", gap: 4, marginBottom: 20 }}>
        <button style={tabStyle(tab === "users")} onClick={() => setTab("users")}>👥 Users</button>
        <button style={tabStyle(tab === "upgrade")} onClick={() => setTab("upgrade")}>⬆ Quick Upgrade</button>
      </div>

      {tab === "users" && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 14, color: "#1a1035", background: "#fff", outline: "none" }}
            />
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 14, color: "#1a1035", background: "#fff", outline: "none" }}
            >
              <option value="">All plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="studio">Studio</option>
            </select>
          </div>

          {/* Users table */}
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F7FF", borderBottom: "1px solid #E8E6F0" }}>
                  {["User", "Plan", "Deals", "Earned", "Last deal", "Joined", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9B96B8", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9B96B8" }}>Loading users…</td></tr>
                )}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#C4C0D8" }}>No users found</td></tr>
                )}
                {users.map(user => (
                  <UserRow key={user.id} user={user} onUpgrade={setModal} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: "#C4C0D8", marginTop: 10 }}>
            Showing {users.length} user{users.length !== 1 ? "s" : ""}
          </div>
        </>
      )}

      {tab === "upgrade" && (
        <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1035", marginBottom: 6 }}>Quick upgrade by email</div>
          <div style={{ fontSize: 13, color: "#9B96B8", marginBottom: 20 }}>
            Enter the user's email and select their new plan. Use this when someone pays you directly.
          </div>
          <QuickUpgrade onSuccess={loadData} />
        </div>
      )}

      {modal && (
        <UpgradeModal
          user={modal}
          onSave={handleSavePlan}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

// ── Quick upgrade by email ────────────────────────────────────────────────────

function QuickUpgrade({ onSuccess }) {
  const [email,  setEmail]  = useState("");
  const [plan,   setPlan]   = useState("pro");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!email.trim()) return;
    setLoading(true); setStatus(null);
    try {
      // Find user by email then upgrade
      const res = await api.get(`/admin/users?search=${encodeURIComponent(email)}`);
      const user = res.users?.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) { setStatus({ type: "error", msg: `No user found with email: ${email}` }); return; }

      const data = await api.patch(`/admin/users/${user.id}/plan`, { plan });
      setStatus({ type: "success", msg: `✅ ${data.message}` });
      setEmail("");
      onSuccess();
    } catch (e) {
      setStatus({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 14, color: "#1a1035", background: "#FAFAFA", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 400 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#7B76A0", display: "block", marginBottom: 6 }}>USER EMAIL</label>
        <input style={inp} type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleUpgrade()} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#7B76A0", display: "block", marginBottom: 6 }}>NEW PLAN</label>
        <select style={inp} value={plan} onChange={e => setPlan(e.target.value)}>
          <option value="free">Free</option>
          <option value="pro">Pro ($29/mo)</option>
          <option value="studio">Studio ($79/mo)</option>
        </select>
      </div>
      <button onClick={handleUpgrade} disabled={loading || !email.trim()} style={{ padding: "11px 0", borderRadius: 8, border: "none", background: (loading || !email.trim()) ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (loading || !email.trim()) ? "not-allowed" : "pointer" }}>
        {loading ? "Upgrading…" : `Set to ${plan}`}
      </button>
      {status && (
        <div style={{ background: status.type === "success" ? "#F0FDF4" : "#FFF0F0", border: `1px solid ${status.type === "success" ? "#86EFAC" : "#FCA5A5"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: status.type === "success" ? "#166534" : "#B91C1C" }}>
          {status.msg}
        </div>
      )}
    </div>
  );
}
