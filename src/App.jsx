// src/App.jsx — launch-ready
// New vs previous version:
//   ✅ Password reset flow (forgot + reset screens)
//   ✅ Public media kit URL routing (/media-kit/:userId)
//   ✅ Free plan deal limit banner + upgrade prompt
//   ✅ All previous features retained

import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { useDeals } from "./hooks/useDeals.js";
import { useAsync } from "./hooks/useAsync.js";
import { STAGE_LABELS } from "./services/dealService.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { FreePlanBanner, UpgradePrompt } from "./components/FreePlanBanner.jsx";
import { useIsMobile } from "./hooks/useIsMobile.js";
import { MobileNav } from "./components/MobileNav.jsx";
import { MobilePipeline } from "./components/MobilePipeline.jsx";
import {
  AnimatedMetricCard,
  ParticleBackground,
  SpringModal,
  PageTransition,
  PulsingBadge,
  ConfettiCanvas,
  useConfetti,
  useToast,
} from "./components/Animations.jsx";
import {
  PipelineSkeleton,
  TableSkeleton,
  AnalyticsSkeleton,
  RateCardSkeleton,
} from "./components/Skeletons.jsx";
import {
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from "./screens/PasswordResetScreens.jsx";
import PublicMediaKitScreen from "./screens/PublicMediaKitScreen.jsx";

import AIPitchGeneratorScreen from "./screens/AIPitchGeneratorScreen.jsx";
import AIRateSuggesterScreen from "./screens/AIRateSuggesterScreen.jsx";
import AnalyticsScreen from "./screens/AnalyticsScreen.jsx";
import InvoicesScreen from "./screens/InvoicesScreen.jsx";
import NudgesScreen from "./screens/NudgesScreen.jsx";
import RateCardScreen from "./screens/RateCardScreen.jsx";
import ContractsScreen from "./screens/ContractsScreen.jsx";
import AIDealAnalyzerScreen from "./screens/AIDealAnalyzerScreen.jsx";
import AIContractReviewerScreen from "./screens/AIContractReviewerScreen.jsx";
import AINudgeWriterScreen from "./screens/AINudgeWriterScreen.jsx";
import AdminScreen from "./screens/AdminScreen.jsx";

// ── URL-based routing (no React Router needed) ────────────────────────────────

function getRoute() {
  const path = window.location.pathname;
  if (path.startsWith("/media-kit/"))
    return { type: "mediakit", userId: path.split("/")[2] };
  if (path === "/reset-password")
    return {
      type: "reset",
      token: new URLSearchParams(window.location.search).get("token"),
    };
  return { type: "app" };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES = STAGE_LABELS;
const STAGE_COLORS = {
  Inbound: { bg: "#F3F0FF", text: "#5B4BD8", border: "#C9C2F7" },
  Negotiating: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  "Contract Sent": { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "Content Live": { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  Invoiced: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  Paid: { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
};
const PLATFORMS = [
  "Instagram",
  "YouTube",
  "TikTok",
  "LinkedIn",
  "Twitter/X",
  "Newsletter",
  "Podcast",
];
const DEAL_TYPES = [
  "Sponsored Post",
  "UGC",
  "Ambassador",
  "Affiliate",
  "Integration",
  "Mention",
];
const FREE_LIMIT = 3;

const NAV = [
  { icon: "briefcase", label: "Pipeline",          key: "pipeline",        screen: null,                    skeleton: null                    },
  { icon: "file",      label: "Contracts",          key: "contracts",       screen: ContractsScreen,         skeleton: <TableSkeleton />        },
  { icon: "dollar",    label: "Invoices",           key: "invoices",        screen: InvoicesScreen,          skeleton: <TableSkeleton />        },
  { icon: "chart",     label: "Analytics",          key: "analytics",       screen: AnalyticsScreen,         skeleton: <AnalyticsSkeleton />    },
  { icon: "bell",      label: "Nudges",             key: "nudges",          screen: NudgesScreen,            skeleton: <TableSkeleton rows={3}/> },
  { icon: "card",      label: "Rate Card",          key: "ratecard",        screen: RateCardScreen,          skeleton: <RateCardSkeleton />     },
  // ── AI Features ──────────────────────────────────────────────────
  { icon: "ai",        label: "Deal Analyzer",      key: "ai-deals",        screen: AIDealAnalyzerScreen,    skeleton: null                    },
  { icon: "ai",        label: "Contract AI",        key: "ai-contracts",    screen: AIContractReviewerScreen, skeleton: null                   },
  { icon: "ai",        label: "Nudge Writer",       key: "ai-nudges",       screen: AINudgeWriterScreen,     skeleton: null                    },
  { icon: "ai", label: "Pitch Generator", key: "ai-pitch", screen: AIPitchGeneratorScreen, skeleton: null },
  { icon: "ai", label: "Rate Suggester",  key: "ai-rates", screen: AIRateSuggesterScreen,  skeleton: null },
  { icon: "shield", label: "Admin", key: "admin", screen: AdminScreen, skeleton: null },
];

// ── Validation ────────────────────────────────────────────────────────────────

const validators = {
  email: (v) =>
    !v
      ? "Email is required"
      : !/\S+@\S+\.\S+/.test(v)
        ? "Enter a valid email"
        : null,
  password: (v) =>
    !v
      ? "Password is required"
      : v.length < 8
        ? "Must be at least 8 characters"
        : null,
  name: (v) =>
    !v?.trim() ? "Name is required" : v.trim().length < 2 ? "Too short" : null,
  brand: (v) => (!v?.trim() ? "Brand name is required" : null),
  amount: (v) =>
    !v
      ? "Amount is required"
      : isNaN(v) || Number(v) <= 0
        ? "Must be greater than 0"
        : null,
};
const validate = (form, fields) => {
  const errs = {};
  fields.forEach((f) => {
    const e = validators[f]?.(form[f]);
    if (e) errs[f] = e;
  });
  return errs;
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    plus: (
      <path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
    x: (
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
    dollar: (
      <path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
    chart: (
      <>
        <rect x="3" y="12" width="4" height="9" rx="1" fill={color} />
        <rect x="10" y="7" width="4" height="14" rx="1" fill={color} />
        <rect x="17" y="3" width="4" height="18" rx="1" fill={color} />
      </>
    ),
    briefcase: (
      <>
        <rect
          x="2"
          y="7"
          width="20"
          height="14"
          rx="2"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
          stroke={color}
          strokeWidth="2"
        />
        shield:{" "}
        <>
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      </>
    ),
    file: (
      <>
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          stroke={color}
          strokeWidth="2"
        />
        <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="2" />
      </>
    ),
    bell: (
      <>
        <path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke={color}
          strokeWidth="2"
        />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" />
      </>
    ),
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2" />
        <path
          d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
          stroke={color}
          strokeWidth="2"
        />
        <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" />
      </>
    ),
    edit: (
      <>
        <path
          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke={color}
          strokeWidth="2"
        />
      </>
    ),
    menu: (
      <>
        <line
          x1="3"
          y1="6"
          x2="21"
          y2="6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="3"
          y1="12"
          x2="21"
          y2="12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="3"
          y1="18"
          x2="21"
          y2="18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
    lock: (
      <>
        <rect
          x="3"
          y="11"
          width="18"
          height="11"
          rx="2"
          stroke={color}
          strokeWidth="2"
        />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" />
      </>
    ),
    mail: (
      <>
        <rect
          x="2"
          y="4"
          width="20"
          height="16"
          rx="2"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
          stroke={color}
          strokeWidth="2"
        />
      </>
    ),
    user: (
      <>
        <path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          stroke={color}
          strokeWidth="2"
        />
        <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
      </>
    ),
    card: (
      <>
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          stroke={color}
          strokeWidth="2"
        />
        <line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" />
      </>
    ),
    eye: (
      <>
        <path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke={color}
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      </>
    ),
    eyeoff: (
      <>
        <path
          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
          stroke={color}
          strokeWidth="2"
        />
        <line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="2" />
      </>
    ),
    check: (
      <polyline
        points="20 6 9 17 4 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    ai: (
      <>
        <path
          d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1H1a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M9 14h.01M12 14h.01M15 14h.01"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
};

// ── Shared ────────────────────────────────────────────────────────────────────

const FieldError = ({ error }) =>
  error ? (
    <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 4 }}>
      ⚠ {error}
    </div>
  ) : null;

const inpStyle = (hasError) => ({
  width: "100%",
  padding: "11px 14px 11px 40px",
  borderRadius: 10,
  border: `1.5px solid ${hasError ? "#FCA5A5" : "#E8E6F0"}`,
  fontSize: 14,
  color: "#1a1035",
  background: hasError ? "#FFF8F8" : "#FAFAFA",
  outline: "none",
  boxSizing: "border-box",
});

// ── Auth Screen ───────────────────────────────────────────────────────────────

function AuthScreen() {
  const { login, register } = useAuth();
  const { run, loading, error: apiError } = useAsync();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
  };
  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setForm({ name: "", email: "", password: "", confirmPassword: "" });
    setSuccess("");
  };

  if (showForgot)
    return <ForgotPasswordScreen onBack={() => setShowForgot(false)} />;

  const handleSubmit = async () => {
    const fields =
      mode === "login" ? ["email", "password"] : ["name", "email", "password"];
    const errs = validate(form, fields);
    if (mode === "register" && form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await run(async () => {
      if (mode === "login")
        await login({ email: form.email, password: form.password });
      else {
        await register({
          name: form.name.trim(),
          email: form.email,
          password: form.password,
        });
        setSuccess("Account created! Signing you in…");
      }
    });
  };

  const pwStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 8)
      return { label: "Too short", color: "#EF4444", width: "25%" };
    if (p.length < 10) return { label: "Weak", color: "#F59E0B", width: "50%" };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p))
      return { label: "Fair", color: "#F59E0B", width: "65%" };
    return { label: "Strong", color: "#10B981", width: "100%" };
  };
  const strength = mode === "register" ? pwStrength() : null;

  const inp = (hasError) => ({
    width: "100%",
    padding: "11px 12px 11px 38px",
    borderRadius: 10,
    border: `1.5px solid ${hasError ? "#FCA5A5" : "#E8E6F0"}`,
    fontSize: 14,
    color: "#1a1035",
    background: hasError ? "#FFF8F8" : "#FAFAFA",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  });

  const FEATURES = [
    {
      emoji: "🤝",
      title: "Deal Pipeline",
      desc: "Track every deal from DM to payment",
    },
    {
      emoji: "🤖",
      title: "5 AI Features",
      desc: "Analyze deals, write pitches, review contracts",
    },
    {
      emoji: "🧾",
      title: "Invoices & Contracts",
      desc: "Generate, send, and get paid faster",
    },
    {
      emoji: "💰",
      title: "Rate Card & Media Kit",
      desc: "Share your rates with brands instantly",
    },
  ];

  const AVATARS = ["R", "A", "S", "M", "K"];

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        background: "#0A0720",
      }}
    >
      {/* ── Left panel — branding ── */}
      <div
        style={{
          padding: "48px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(123,110,232,0.22),transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(91,75,216,0.18),transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "30%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(139,92,246,0.1),transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(123,110,232,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(123,110,232,0.05) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.5px",
              marginBottom: 6,
            }}
          >
            deal<span style={{ color: "#7B6EE8" }}>flow</span>
          </div>
          <div style={{ fontSize: 13, color: "#5E5A85" }}>
            Creator brand deal management
          </div>
        </div>

        {/* Feature list */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#3D3870",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}
          >
            EVERYTHING YOU NEED
          </div>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 14 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(123,110,232,0.15)",
                  border: "1px solid rgba(123,110,232,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {f.emoji}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#E8E6FF",
                    marginBottom: 2,
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{ fontSize: 11, color: "#5E5A85", lineHeight: 1.4 }}
                >
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex" }}>
              {AVATARS.map((l, i) => (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg,${["#7B6EE8", "#5B4BD8", "#8B5CF6", "#6D28D9", "#7C3AED"][i]},${["#5B4BD8", "#4338CA", "#7C3AED", "#5B21B6", "#6D28D9"][i]})`,
                    border: "2px solid #0A0720",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    marginLeft: i > 0 ? -8 : 0,
                    zIndex: 5 - i,
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#5E5A85" }}>
              Join 500+ creators managing deals
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{ color: "#F59E0B", fontSize: 13 }}>
                ★
              </span>
            ))}
            <span style={{ fontSize: 11, color: "#5E5A85", marginLeft: 4 }}>
              4.9 / 5 from early users
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div
        style={{
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 44px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#1a1035",
                margin: "0 0 6px",
              }}
            >
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p style={{ fontSize: 13, color: "#9B96B8", margin: 0 }}>
              {mode === "login"
                ? "Sign in to your dealflow account"
                : "Start managing your brand deals for free"}
            </p>
          </div>

          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              background: "#F8F7FF",
              borderRadius: 10,
              padding: 4,
              marginBottom: 24,
            }}
          >
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: mode === m ? "#fff" : "transparent",
                  color: mode === m ? "#5B4BD8" : "#9B96B8",
                  boxShadow:
                    mode === m ? "0 1px 4px rgba(80,60,160,0.12)" : "none",
                }}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Errors + success */}
          {apiError && (
            <div
              style={{
                background: "#FFF0F0",
                border: "1px solid #FCA5A5",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#B91C1C",
                marginBottom: 16,
              }}
            >
              {apiError}
            </div>
          )}
          {success && (
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #86EFAC",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#166534",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="check" size={14} color="#166534" />
              {success}
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: "grid", gap: 14 }}>
            {/* Name */}
            {mode === "register" && (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9B96B8",
                    display: "block",
                    marginBottom: 5,
                    letterSpacing: "0.04em",
                  }}
                >
                  YOUR NAME
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <Icon
                      name="user"
                      size={16}
                      color={errors.name ? "#FCA5A5" : "#C4C0D8"}
                    />
                  </span>
                  <input
                    style={inp(errors.name)}
                    placeholder="Rohit Kumar"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <FieldError error={errors.name} />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9B96B8",
                  display: "block",
                  marginBottom: 5,
                  letterSpacing: "0.04em",
                }}
              >
                EMAIL
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <Icon
                    name="mail"
                    size={16}
                    color={errors.email ? "#FCA5A5" : "#C4C0D8"}
                  />
                </span>
                <input
                  style={inp(errors.email)}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
              <FieldError error={errors.email} />
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9B96B8",
                  display: "block",
                  marginBottom: 5,
                  letterSpacing: "0.04em",
                }}
              >
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <Icon
                    name="lock"
                    size={16}
                    color={errors.password ? "#FCA5A5" : "#C4C0D8"}
                  />
                </span>
                <input
                  style={{ ...inp(errors.password), paddingRight: 40 }}
                  type={showPw ? "text" : "password"}
                  placeholder={
                    mode === "login" ? "Your password" : "Min 8 characters"
                  }
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <Icon
                    name={showPw ? "eyeoff" : "eye"}
                    size={16}
                    color="#C4C0D8"
                  />
                </button>
              </div>
              {strength && (
                <div style={{ marginTop: 6 }}>
                  <div
                    style={{
                      height: 3,
                      background: "#E8E6F0",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: strength.width,
                        height: "100%",
                        background: strength.color,
                        borderRadius: 3,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: strength.color,
                      marginTop: 3,
                    }}
                  >
                    {strength.label}
                  </div>
                </div>
              )}
              <FieldError error={errors.password} />
            </div>

            {/* Confirm password */}
            {mode === "register" && (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9B96B8",
                    display: "block",
                    marginBottom: 5,
                    letterSpacing: "0.04em",
                  }}
                >
                  CONFIRM PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <Icon
                      name="lock"
                      size={16}
                      color={errors.confirmPassword ? "#FCA5A5" : "#C4C0D8"}
                    />
                  </span>
                  <input
                    style={inp(errors.confirmPassword)}
                    type={showPw ? "text" : "password"}
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                  {form.confirmPassword &&
                    form.password === form.confirmPassword && (
                      <span
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      >
                        <Icon name="check" size={16} color="#10B981" />
                      </span>
                    )}
                </div>
                <FieldError error={errors.confirmPassword} />
              </div>
            )}

            {/* Forgot password link */}
            {mode === "login" && (
              <div style={{ textAlign: "right", marginTop: -6 }}>
                <button
                  onClick={() => setShowForgot(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7B6EE8",
                    fontSize: 12,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "13px 0",
                borderRadius: 10,
                border: "none",
                background: loading
                  ? "#C4C0D8"
                  : "linear-gradient(135deg,#7B6EE8,#5B4BD8)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
                transition: "opacity 0.15s",
              }}
            >
              {loading
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign in →"
                  : "Create account →"}
            </button>

            {/* Divider + demo */}
            {mode === "login" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: "#E8E6F0" }} />
                  <span style={{ fontSize: 12, color: "#C4C0D8" }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "#E8E6F0" }} />
                </div>
                <button
                  onClick={() => {
                    set("email", "demo@dealflow.app");
                    set("password", "demo1234");
                  }}
                  style={{
                    padding: "11px 0",
                    borderRadius: 10,
                    border: "1.5px solid #E8E6F0",
                    background: "#F8F7FF",
                    color: "#5B4BD8",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Try demo account
                </button>
              </>
            )}
          </div>

          {/* Terms */}
          {mode === "register" && (
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "#C4C0D8",
                marginTop: 16,
              }}
            >
              By creating an account you agree to our{" "}
              <span style={{ color: "#7B6EE8" }}>Terms of Service</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Pipeline components ───────────────────────────────────────────────────────

const Badge = ({ stage }) => {
  const c = STAGE_COLORS[stage] || STAGE_COLORS["Inbound"];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {stage}
    </span>
  );
};

function DealCard({ deal, onMove, onDelete, onEdit }) {
  const stageIdx = STAGES.indexOf(deal.stage);
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E8E6F0",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        boxShadow: "0 1px 3px rgba(80,60,160,0.06)",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(80,60,160,0.13)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(80,60,160,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1035" }}>
          {deal.brand}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onEdit(deal)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 2,
            }}
          >
            <Icon name="edit" size={13} color="#9B96B8" />
          </button>
          <button
            onClick={() => onDelete(deal.id)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 2,
            }}
          >
            <Icon name="trash" size={13} color="#9B96B8" />
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#7B76A0", marginBottom: 10 }}>
        {deal.type} · {deal.platform}
      </div>
      {deal.note && (
        <div
          style={{
            fontSize: 11,
            color: "#B45309",
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 6,
            padding: "4px 8px",
            marginBottom: 8,
          }}
        >
          {deal.note}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: "#5B4BD8" }}>
          ${deal.amount.toLocaleString()}
        </span>
        <Badge stage={deal.stage} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {stageIdx > 0 && (
          <button
            onClick={() => onMove(deal.id, -1)}
            style={{
              flex: 1,
              fontSize: 11,
              padding: "5px 0",
              borderRadius: 6,
              border: "1px solid #E8E6F0",
              background: "#F8F7FF",
              color: "#7B76A0",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        )}
        {stageIdx < STAGES.length - 1 && (
          <button
            onClick={() => onMove(deal.id, 1)}
            style={{
              flex: 2,
              fontSize: 11,
              padding: "5px 0",
              borderRadius: 6,
              border: "1px solid #C9C2F7",
              background: "#F3F0FF",
              color: "#5B4BD8",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Move forward →
          </button>
        )}
      </div>
    </div>
  );
}

function DealModal({ deal, onSave, onClose, saving }) {
  const [form, setForm] = useState(
    deal || {
      brand: "",
      type: DEAL_TYPES[0],
      platform: PLATFORMS[0],
      amount: "",
      stage: STAGES[0],
      dueDate: "",
      note: "",
    },
  );
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
  };
  const handleSave = () => {
    const errs = validate(form, ["brand", "amount"]);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(form);
  };
  const inp = (f) => ({
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: `1px solid ${errors[f] ? "#FCA5A5" : "#E8E6F0"}`,
    fontSize: 14,
    color: "#1a1035",
    background: errors[f] ? "#FFF8F8" : "#FAFAFA",
    outline: "none",
    boxSizing: "border-box",
  });
  const lbl = {
    fontSize: 12,
    fontWeight: 600,
    color: "#7B76A0",
    marginBottom: 4,
    display: "block",
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,10,40,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
    <SpringModal onClose={onClose} maxWidth={420}>
      <div
        style={{
          padding: 28,
          width: 420,
          maxWidth: "95vw",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#1a1035",
              margin: 0,
            }}
          >
            {deal?.id ? "Edit deal" : "Add new deal"}
          </h2>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <Icon name="x" size={20} color="#9B96B8" />
          </button>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={lbl}>BRAND NAME *</label>
            <input
              style={inp("brand")}
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="e.g. Notion"
            />
            <FieldError error={errors.brand} />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={lbl}>DEAL TYPE</label>
              <select
                style={inp()}
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                {DEAL_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>PLATFORM</label>
              <select
                style={inp()}
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={lbl}>AMOUNT ($) *</label>
              <input
                style={inp("amount")}
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="1500"
                min="1"
              />
              <FieldError error={errors.amount} />
            </div>
            <div>
              <label style={lbl}>STAGE</label>
              <select
                style={inp()}
                value={form.stage}
                onChange={(e) => set("stage", e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>DUE DATE</label>
            <input
              style={inp()}
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>
          <div>
            <label style={lbl}>NOTE</label>
            <input
              style={inp()}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. Follow up on Friday"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid #E8E6F0",
              background: "#F8F7FF",
              color: "#7B76A0",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: saving
                ? "#C4C0D8"
                : "linear-gradient(135deg,#7B6EE8,#5B4BD8)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving…" : deal?.id ? "Save changes" : "Add deal"}
          </button>
        </div>
      </div>
    </SpringModal>
    </div>
  );
}

function EmptyPipeline({ onAdd }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#1a1035",
          marginBottom: 8,
        }}
      >
        No deals yet
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#9B96B8",
          marginBottom: 24,
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        Add your first brand deal to start tracking your pipeline and revenue.
      </div>
      <button
        onClick={onAdd}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 24px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <Icon name="plus" size={16} color="#fff" /> Add your first deal
      </button>
    </div>
  );
}

function Sidebar({ active, onNav, collapsed, user, onLogout, nudgeCount, isAdmin }) {
  return (
    <div
      style={{
        width: collapsed ? 60 : 190,
        background: "#0F0A2E",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        transition: "width 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: collapsed ? "0 0 24px" : "0 20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 8,
          textAlign: collapsed ? "center" : "left",
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
            deal<span style={{ color: "#7B6EE8" }}>flow</span>
          </span>
        )}
        {collapsed && (
          <span style={{ fontSize: 18, fontWeight: 800, color: "#7B6EE8" }}>
            d
          </span>
        )}
      </div>
      {NAV.filter((n) => n.key !== "admin" || isAdmin).map((n, idx) => (
        <>
          {/* AI section divider */}
          {n.key === "ai-deals" && !collapsed && (
            <div
              style={{
                padding: "8px 20px 4px",
                fontSize: 10,
                fontWeight: 700,
                color: "#3D3870",
                letterSpacing: "0.08em",
                marginTop: 4,
              }}
            >
              ✨ AI FEATURES
            </div>
          )}
          {n.key === "ai-deals" && collapsed && (
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.06)",
                margin: "8px 0",
              }}
            />
          )}
          <button
            key={n.key}
            onClick={() => onNav(n.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 20px",
              justifyContent: collapsed ? "center" : "flex-start",
              background: active === n.key ? "rgba(123,110,232,0.18)" : "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              color:
                active === n.key ? "#A99EF0" : idx >= 6 ? "#6B67A0" : "#5E5A85",
              fontSize: 14,
              fontWeight: active === n.key ? 600 : 400,
              borderLeft:
                active === n.key
                  ? "3px solid #7B6EE8"
                  : "3px solid transparent",
              transition: "all 0.15s",
              position: "relative",
            }}
          >
            <Icon
              name={n.icon}
              size={17}
              color={
                active === n.key ? "#A99EF0" : idx >= 6 ? "#6B67A0" : "#5E5A85"
              }
            />
            {!collapsed && n.label}
            {n.key === "nudges" && <PulsingBadge count={nudgeCount} />}
          </button>
        </>
      ))}
      <div
        style={{
          marginTop: "auto",
          padding: collapsed ? "16px 0 0" : "16px 20px 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E6FF" }}>
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#7B6EE8",
                  textTransform: "capitalize",
                }}
              >
                {user?.plan} plan
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onLogout}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "6px 0",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "none",
              color: "#5E5A85",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}

const PipelineView = ({ deals, onMove, onDelete, onEdit }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 14,
      paddingBottom: 8,
      minWidth: 0,
    }}
  >
    {STAGES.map((stage) => {
      const col = deals.filter((d) => d.stage === stage);
      const total = col.reduce((s, d) => s + d.amount, 0);
      const c = STAGE_COLORS[stage];
      return (
        <div key={stage} style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1035" }}>
                {stage}
              </div>
              <div style={{ fontSize: 11, color: "#9B96B8" }}>
                ${total.toLocaleString()} · {col.length} deal
                {col.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: c.text,
              }}
            />
          </div>
          <div
            style={{
              background: "#F8F7FF",
              borderRadius: 10,
              padding: 10,
              minHeight: 120,
            }}
          >
            {col.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#C4C0D8",
                  fontSize: 12,
                  paddingTop: 20,
                }}
              >
                No deals
              </div>
            )}
            {col.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onMove={onMove}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user, logout } = useAuth();
  const {
    deals,
    loading,
    error,
    refetch,
    addDeal,
    editDeal,
    removeDeal,
    moveDeal,
  } = useDeals();
  const confetti = useConfetti();
  const toast = useToast();
  const isMobile = useIsMobile();
  const { run: saving, loading: isSaving } = useAsync();

  const [modal, setModal] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [nav, setNav] = useState("pipeline");
  const [collapsed, setCollapsed] = useState(false);

  const pipelineValue = deals.reduce((s, d) => s + d.amount, 0);
  const pendingPayment = deals
    .filter((d) => d.stage === "Invoiced")
    .reduce((s, d) => s + d.amount, 0);
  const activeDeals = deals.filter((d) => d.stage !== "Paid").length;
  const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  const isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");
  const nudgeCount = deals.filter((d) => {
    if (!["Inbound", "Negotiating"].includes(d.stage) || !d.updatedAt)
      return false;
    return Math.floor((new Date() - new Date(d.updatedAt)) / 86400000) >= 5;
  }).length;

  const isFreePlan = user?.plan === "free";
  const activeCount = deals.filter((d) => d.stage !== "Paid").length;
  const atFreeLimit = isFreePlan && activeCount >= FREE_LIMIT;

  const handleAddDeal = () => {
    if (atFreeLimit) {
      setShowUpgrade(true);
      return;
    }
    setModal("new");
  };

  const handleSave = async (form) => {
    await saving(async () => {
      if (form.id) await editDeal(form.id, form);
      else await addDeal(form);
      setModal(null);
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this deal?")) return;
    try {
      await removeDeal(id);
    } catch (e) {
      alert(e.message);
    }
  };

  const activeNav = NAV.find((n) => n.key === nav);
  const ActiveScreen = activeNav?.screen ?? null;

   return (
     <div
       style={{
         display: "flex",
         height: "100vh",
         fontFamily: "'DM Sans','Segoe UI',sans-serif",
         background: "#F4F3FA",
         overflow: "hidden",
       }}
     >
       {/* Sidebar — desktop only */}
       {!isMobile && (
         <Sidebar
           active={nav}
           onNav={setNav}
           collapsed={collapsed}
           user={user}
           onLogout={logout}
           nudgeCount={nudgeCount}
           isAdmin={isAdmin}
         />
       )}

       <div
         style={{
           flex: 1,
           display: "flex",
           flexDirection: "column",
           overflow: "hidden",
         }}
       >
         {/* Topbar */}
         <div
           style={{
             background: "#fff",
             borderBottom: "1px solid #E8E6F0",
             padding: isMobile ? "12px 16px" : "14px 24px",
             display: "flex",
             alignItems: "center",
             justifyContent: "space-between",
             flexShrink: 0,
           }}
         >
           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
             {/* Hamburger — desktop only */}
             {!isMobile && (
               <button
                 onClick={() => setCollapsed((c) => !c)}
                 style={{
                   border: "none",
                   background: "none",
                   cursor: "pointer",
                   padding: 4,
                 }}
               >
                 <Icon name="menu" size={20} color="#9B96B8" />
               </button>
             )}
             {/* Logo — mobile only */}
             {isMobile && (
               <span
                 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035" }}
               >
                 deal<span style={{ color: "#7B6EE8" }}>flow</span>
               </span>
             )}
             {!isMobile && (
               <h1
                 style={{
                   fontSize: 16,
                   fontWeight: 700,
                   color: "#1a1035",
                   margin: 0,
                   textTransform: "capitalize",
                 }}
               >
                 {activeNav?.label ?? nav}
               </h1>
             )}
           </div>

           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
             {nav === "pipeline" && (
               <button
                 onClick={handleAddDeal}
                 style={{
                   display: "flex",
                   alignItems: "center",
                   gap: 6,
                   padding: isMobile ? "8px 14px" : "8px 16px",
                   borderRadius: 8,
                   border: "none",
                   background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)",
                   color: "#fff",
                   fontSize: 13,
                   fontWeight: 700,
                   cursor: "pointer",
                 }}
               >
                 <Icon name="plus" size={15} color="#fff" />
                 {!isMobile && "Add deal"}
               </button>
             )}
             {/* Mobile user avatar */}
             {isMobile && (
               <div
                 style={{
                   width: 32,
                   height: 32,
                   borderRadius: "50%",
                   background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   fontSize: 13,
                   fontWeight: 700,
                   color: "#fff",
                 }}
               >
                 {user?.name?.[0]?.toUpperCase() ?? "?"}
               </div>
             )}
           </div>
         </div>

         {/* Screen content */}
         <div style={{ flex: 1, overflow: "auto" }}>
           {nav === "pipeline" ? (
             loading ? (
               <PipelineSkeleton />
             ) : (
               <div
                 style={{
                   display: "flex",
                   flexDirection: "column",
                   height: "100%",
                 }}
               >
                 {error && (
                   <div
                     style={{
                       background: "#FFF0F0",
                       border: "1px solid #FCA5A5",
                       borderRadius: 10,
                       padding: "12px 16px",
                       fontSize: 13,
                       color: "#B91C1C",
                       margin: "16px 16px 0",
                       display: "flex",
                       justifyContent: "space-between",
                     }}
                   >
                     {error}{" "}
                     <button
                       onClick={refetch}
                       style={{
                         background: "none",
                         border: "none",
                         color: "#B91C1C",
                         cursor: "pointer",
                         fontWeight: 700,
                       }}
                     >
                       Retry
                     </button>
                   </div>
                 )}

                 <FreePlanBanner dealCount={activeCount} plan={user?.plan} />

                 {deals.length === 0 ? (
                   <EmptyPipeline onAdd={handleAddDeal} />
                 ) : isMobile ? (
                   // ── Mobile: vertical stage list ──
                   <>
                     {/* Mobile metrics — horizontal scroll */}
                     <div
                       style={{
                         display: "flex",
                         gap: 10,
                         padding: "16px 16px 0",
                         overflowX: "auto",
                         scrollbarWidth: "none",
                       }}
                     >
                       {[
                         {
                           label: "Pipeline",
                           value: `$${pipelineValue.toLocaleString()}`,
                           accent: "#7B6EE8",
                         },
                         {
                           label: "Active",
                           value: activeDeals,
                           accent: "#2563EB",
                         },
                         {
                           label: "Pending",
                           value: `$${pendingPayment.toLocaleString()}`,
                           accent: "#C2410C",
                         },
                       ].map((m) => (
                         <div
                           key={m.label}
                           style={{
                             flexShrink: 0,
                             background: "#fff",
                             border: "1px solid #E8E6F0",
                             borderRadius: 12,
                             padding: "12px 16px",
                             borderTop: `3px solid ${m.accent}`,
                             minWidth: 110,
                           }}
                         >
                           <div
                             style={{
                               fontSize: 10,
                               color: "#9B96B8",
                               fontWeight: 600,
                               marginBottom: 4,
                             }}
                           >
                             {m.label}
                           </div>
                           <div
                             style={{
                               fontSize: 18,
                               fontWeight: 800,
                               color: "#1a1035",
                             }}
                           >
                             {m.value}
                           </div>
                         </div>
                       ))}
                     </div>
                     <MobilePipeline
                       deals={deals}
                       stages={STAGES}
                       onMove={moveDeal}
                       onDelete={handleDelete}
                       onEdit={(deal) => setModal(deal)}
                     />
                   </>
                 ) : (
                   // ── Desktop: Kanban board ──
                   <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
                     <div
                       style={{
                         display: "grid",
                         gridTemplateColumns: "repeat(4,1fr)",
                         gap: 14,
                         marginBottom: 24,
                       }}
                     >
                       <AnimatedMetricCard
                         label="PIPELINE VALUE"
                         value={pipelineValue}
                         prefix="$"
                         sub="Total across all stages"
                         accent="#7B6EE8"
                       />
                       <AnimatedMetricCard
                         label="ACTIVE DEALS"
                         value={activeDeals}
                         sub="Excluding paid"
                         accent="#2563EB"
                       />
                       <AnimatedMetricCard
                         label="AVG. DEAL SIZE"
                         value={
                           deals.length
                             ? Math.round(pipelineValue / deals.length)
                             : 0
                         }
                         prefix="$"
                         sub="Per deal"
                         accent="#15803D"
                       />
                       <AnimatedMetricCard
                         label="PENDING PAYMENT"
                         value={pendingPayment}
                         prefix="$"
                         sub={`${deals.filter((d) => d.stage === "Invoiced").length} invoice(s) due`}
                         accent="#C2410C"
                       />
                     </div>
                     <PipelineView
                       deals={deals}
                       onMove={async (id, dir) => {
                         const deal = deals.find((d) => d.id === id);
                         const newLabel =
                           STAGES[STAGES.indexOf(deal?.stage) + dir];
                         if (newLabel === "Paid") {
                           confetti.trigger();
                           toast.show(
                             `🎉 ${deal.brand} deal marked as paid!`,
                             "success",
                           );
                         } else {
                           toast.show(`Moved to ${newLabel}`, "success", 1500);
                         }
                         await moveDeal(id, dir);
                       }}
                       onDelete={handleDelete}
                       onEdit={(deal) => setModal(deal)}
                     />
                   </div>
                 )}
               </div>
             )
           ) : ActiveScreen ? (
             <ErrorBoundary key={nav}>
               <PageTransition navKey={nav}>
                 <div
                   style={{ paddingBottom: isMobile ? 80 : 0, height: "100%" }}
                 >
                   <ActiveScreen />
                 </div>
               </PageTransition>
             </ErrorBoundary>
           ) : null}
         </div>
       </div>

       {/* Mobile bottom nav */}
       {isMobile && (
         <MobileNav
           nav={nav}
           onNav={setNav}
           nudgeCount={nudgeCount}
           navItems={NAV}
         />
       )}

       {modal && (
         <DealModal
           deal={modal === "new" ? null : modal}
           onSave={handleSave}
           onClose={() => setModal(null)}
           saving={isSaving}
         />
       )}
       {showUpgrade && <UpgradePrompt onClose={() => setShowUpgrade(false)} />}
       <ConfettiCanvas canvasRef={confetti.canvasRef} />
       <toast.ToastContainer />
     </div>
   );
}

// ── Root with URL routing ─────────────────────────────────────────────────────

function AppInner() {
  const { user, loading } = useAuth();
  const route = getRoute();

  // Public media kit — no auth needed
  if (route.type === "mediakit")
    return <PublicMediaKitScreen userId={route.userId} />;

  // Password reset — no auth needed
  if (route.type === "reset")
    return (
      <ResetPasswordScreen
        token={route.token}
        onSuccess={() => (window.location.href = "/")}
      />
    );

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0F0A2E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 12,
            }}
          >
            deal<span style={{ color: "#7B6EE8" }}>flow</span>
          </div>
          <div style={{ color: "#5E5A85", fontSize: 13 }}>Loading…</div>
        </div>
      </div>
    );

  return user ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}
