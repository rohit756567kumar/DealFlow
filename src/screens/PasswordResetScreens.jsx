// src/screens/PasswordResetScreens.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Two screens:
//   ForgotPasswordScreen — user enters email, gets reset link
//   ResetPasswordScreen  — user enters new password using token from URL
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useAsync } from "../hooks/useAsync.js";
import { api }      from "../services/api.js";

// ── Shared ────────────────────────────────────────────────────────────────────

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    mail:  <><rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} strokeWidth="2"/></>,
    lock:  <><rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2"/></>,
    check: <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    eye:   <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/></>,
    eyeoff:<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={color} strokeWidth="2"/><line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">{icons[name]}</svg>;
};

const Card = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "#0F0A2E", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 20 }}>
    <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: 400, maxWidth: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1035" }}>deal<span style={{ color: "#7B6EE8" }}>flow</span></div>
      </div>
      {children}
    </div>
  </div>
);

const inp = (hasError) => ({
  width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10,
  border: `1.5px solid ${hasError ? "#FCA5A5" : "#E8E6F0"}`,
  fontSize: 14, color: "#1a1035", background: hasError ? "#FFF8F8" : "#FAFAFA",
  outline: "none", boxSizing: "border-box",
});

const PrimaryBtn = ({ onClick, disabled, loading, children }) => (
  <button onClick={onClick} disabled={disabled || loading} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: (disabled || loading) ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (disabled || loading) ? "not-allowed" : "pointer", marginTop: 4 }}>
    {children}
  </button>
);

// ── Forgot Password Screen ────────────────────────────────────────────────────

export function ForgotPasswordScreen({ onBack }) {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const { run, loading } = useAsync();

  const handleSubmit = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setError("");
    await run(async () => {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    });
  };

  if (sent) return (
    <Card>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Icon name="check" size={28} color="#15803D" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1035", margin: "0 0 10px" }}>Check your email</h2>
        <p style={{ fontSize: 14, color: "#9B96B8", lineHeight: 1.7, margin: "0 0 24px" }}>
          If <strong>{email}</strong> is registered, you'll receive a reset link within a few minutes. Check your spam folder too.
        </p>
        <button onClick={onBack} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#5B4BD8", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Back to sign in
        </button>
      </div>
    </Card>
  );

  return (
    <Card>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1035", margin: "0 0 8px", textAlign: "center" }}>Forgot your password?</h2>
      <p style={{ fontSize: 13, color: "#9B96B8", textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 }}>
        Enter your email and we'll send you a link to reset it.
      </p>

      {error && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: 14 }}>{error}</div>}

      <div style={{ marginBottom: 14 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="mail" size={16} color="#9B96B8" /></span>
          <input style={inp(!!error)} type="email" placeholder="you@example.com" value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
      </div>

      <PrimaryBtn onClick={handleSubmit} loading={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </PrimaryBtn>

      <button onClick={onBack} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "none", background: "none", color: "#9B96B8", fontSize: 13, cursor: "pointer", marginTop: 12 }}>
        ← Back to sign in
      </button>
    </Card>
  );
}

// ── Reset Password Screen ─────────────────────────────────────────────────────

export function ResetPasswordScreen({ token, onSuccess }) {
  const [form,   setForm]   = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [done,   setDone]   = useState(false);
  const { run, loading, error: apiError } = useAsync();
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: null })); };

  const pwStrength = (p) => {
    if (!p) return null;
    if (p.length < 8)  return { label: "Too short", color: "#EF4444", width: "25%" };
    if (p.length < 10) return { label: "Weak",      color: "#F59E0B", width: "50%" };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: "Fair", color: "#F59E0B", width: "65%" };
    return { label: "Strong", color: "#10B981", width: "100%" };
  };
  const strength = pwStrength(form.password);

  const handleSubmit = async () => {
    const errs = {};
    if (!form.password || form.password.length < 8) errs.password = "Must be at least 8 characters";
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    await run(async () => {
      await api.post("/auth/reset-password", { token, password: form.password });
      setDone(true);
    });
  };

  if (!token) return (
    <Card>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⛔</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 10px" }}>Invalid reset link</h2>
        <p style={{ fontSize: 14, color: "#9B96B8", margin: "0 0 20px" }}>This link is missing a reset token. Please request a new one.</p>
        <button onClick={onSuccess} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back to sign in</button>
      </div>
    </Card>
  );

  if (done) return (
    <Card>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Icon name="check" size={28} color="#15803D" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1035", margin: "0 0 10px" }}>Password updated!</h2>
        <p style={{ fontSize: 14, color: "#9B96B8", margin: "0 0 24px" }}>You can now sign in with your new password.</p>
        <button onClick={onSuccess} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Sign in →
        </button>
      </div>
    </Card>
  );

  return (
    <Card>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1035", margin: "0 0 8px", textAlign: "center" }}>Set new password</h2>
      <p style={{ fontSize: 13, color: "#9B96B8", textAlign: "center", margin: "0 0 24px" }}>Choose a strong password for your account.</p>

      {apiError && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: 14 }}>{apiError}</div>}

      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="lock" size={16} color={errors.password ? "#FCA5A5" : "#9B96B8"} /></span>
            <input style={{ ...inp(!!errors.password), paddingRight: 40 }} type={showPw ? "text" : "password"} placeholder="New password (min 8 characters)" value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <button onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
              <Icon name={showPw ? "eyeoff" : "eye"} size={16} color="#9B96B8" />
            </button>
          </div>
          {strength && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 3, background: "#E8E6F0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: strength.width, height: "100%", background: strength.color, borderRadius: 3, transition: "width 0.3s" }} />
              </div>
              <div style={{ fontSize: 11, color: strength.color, marginTop: 3 }}>{strength.label}</div>
            </div>
          )}
          {errors.password && <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 4 }}>⚠ {errors.password}</div>}
        </div>

        <div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="lock" size={16} color={errors.confirm ? "#FCA5A5" : "#9B96B8"} /></span>
            <input style={inp(!!errors.confirm)} type={showPw ? "text" : "password"} placeholder="Confirm new password" value={form.confirm} onChange={e => set("confirm", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            {form.confirm && form.password === form.confirm && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="check" size={16} color="#10B981" /></span>
            )}
          </div>
          {errors.confirm && <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 4 }}>⚠ {errors.confirm}</div>}
        </div>

        <PrimaryBtn onClick={handleSubmit} loading={loading}>
          {loading ? "Updating…" : "Set new password"}
        </PrimaryBtn>
      </div>
    </Card>
  );
}
