// src/components/Animations.jsx
// ─────────────────────────────────────────────────────────────────────────────
// All animation components in one file:
//   1. AnimatedCounter   — numbers count up on mount
//   2. ParticleBackground — floating particles for login screen
//   3. Confetti          — burst when deal hits Paid
//   4. SpringModal       — bouncy modal entrance
//   5. PageTransition    — fade+slide between screens
//   6. PulsingBadge      — nudge count pulses red
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";

// ── Inject global keyframes once ──────────────────────────────────────────────

if (typeof document !== "undefined" && !document.getElementById("df-animations")) {
  const style = document.createElement("style");
  style.id = "df-animations";
  style.textContent = `
    @keyframes df-fadeSlideIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes df-fadeSlideOut {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(-16px); }
    }
    @keyframes df-springIn {
      0%   { opacity: 0; transform: scale(0.85) translateY(20px); }
      60%  { opacity: 1; transform: scale(1.03) translateY(-4px); }
      80%  { transform: scale(0.98) translateY(2px); }
      100% { transform: scale(1) translateY(0); }
    }
    @keyframes df-overlayIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes df-confettiFall {
      0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    @keyframes df-particleFloat {
      0%   { transform: translateY(0px) translateX(0px); opacity: 0.4; }
      33%  { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
      66%  { transform: translateY(-15px) translateX(-10px); opacity: 0.5; }
      100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
    }
    @keyframes df-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
      70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
      100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
    }
    @keyframes df-cardLift {
      from { transform: translateY(0) scale(1); box-shadow: 0 1px 3px rgba(80,60,160,0.06); }
      to   { transform: translateY(-3px) scale(1.01); box-shadow: 0 8px 24px rgba(80,60,160,0.18); }
    }
    @keyframes df-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes df-countUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes df-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes df-bounceIn {
      0%   { transform: scale(0); opacity: 0; }
      50%  { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); }
    }

    .df-card-hover {
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease !important;
    }
    .df-card-hover:hover {
      transform: translateY(-3px) scale(1.01) !important;
      box-shadow: 0 8px 24px rgba(80,60,160,0.18) !important;
    }
    .df-btn-press {
      transition: transform 0.1s ease, opacity 0.1s ease !important;
    }
    .df-btn-press:active {
      transform: scale(0.96) !important;
      opacity: 0.9 !important;
    }
    .df-input-focus input:focus,
    .df-input-focus select:focus,
    .df-input-focus textarea:focus {
      border-color: #7B6EE8 !important;
      box-shadow: 0 0 0 3px rgba(123,110,232,0.15) !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
    }
  `;
  document.head.appendChild(style);
}

// ── 1. Animated Counter ───────────────────────────────────────────────────────

/**
 * Counts from 0 to `value` over `duration` ms with easing.
 * Prefix/suffix support for $, %, etc.
 *
 * Usage: <AnimatedCounter value={12200} prefix="$" duration={1200} />
 */
export function AnimatedCounter({ value, prefix = "", suffix = "", duration = 1000, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  const startTime = useRef(null);
  const frameRef = useRef(null);

  const numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]/g, ""))
      : Number(value ?? 0);

  const animate = useCallback(() => {
    const step = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * numValue);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
  }, [numValue, duration]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setTimeout(() => {
            setAnimated(true);
            animate();
          }, 0);
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [animate, animated]);

  // Re-animate when value changes
  useEffect(() => {
    if (!animated) return;
    const t = setTimeout(() => {
      startTime.current = null;
      setDisplay(0);
      animate();
    }, 0);
    return () => clearTimeout(t);
  }, [numValue, animate]); // eslint-disable-line

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <span
      ref={ref}
      style={{
        animation: animated ? "df-countUp 0.3s ease" : "none",
        display: "inline-block",
      }}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ── 2. Particle Background ────────────────────────────────────────────────────

/**
 * Floating particles for the login screen.
 * Pure CSS — no canvas, no dependencies.
 *
 * Usage: wrap AuthScreen content with <ParticleBackground>
 */
// Generated once outside component — Math.random() not allowed during render
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id:       i,
  size:     Math.random() * 4 + 2,
  x:        Math.random() * 100,
  y:        Math.random() * 100,
  duration: Math.random() * 8 + 6,
  delay:    Math.random() * 6,
  opacity:  Math.random() * 0.4 + 0.1,
}));

export function ParticleBackground({ children }) {
  const particles = PARTICLES;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(123,110,232,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "8%",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(91,75,216,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: "40%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `rgba(123, 110, 232, ${p.opacity})`,
            animation: `df-particleFloat ${p.duration}s ${p.delay}s ease-in-out infinite`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(123,110,232,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(123,110,232,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {children}
    </div>
  );
}

// ── 3. Confetti ───────────────────────────────────────────────────────────────

/**
 * Burst of confetti — call trigger() to fire.
 * Auto-cleans up after animation.
 *
 * Usage:
 *   const confetti = useConfetti();
 *   <ConfettiCanvas ref={confetti.ref} />
 *   onClick={() => confetti.trigger()}
 */

const CONFETTI_COLORS = ["#7B6EE8","#5B4BD8","#10B981","#F59E0B","#EF4444","#3B82F6","#EC4899","#14B8A6"];

export function ConfettiCanvas({ canvasRef }) {
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }}
    />
  );
}
/* eslint-disable react-refresh/only-export-components */
export function useConfetti() { 
  const canvasRef = useRef(null);

  const trigger = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    const pieces = Array.from({ length: 120 }, () => ({
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height * 0.3 - 50,
      w:      Math.random() * 10 + 5,
      h:      Math.random() * 6 + 3,
      color:  CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vx:     (Math.random() - 0.5) * 6,
      vy:     Math.random() * 4 + 2,
      angle:  Math.random() * Math.PI * 2,
      spin:   (Math.random() - 0.5) * 0.2,
      alpha:  1,
    }));

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x     += p.vx;
        p.y     += p.vy;
        p.vy    += 0.1;
        p.angle += p.spin;
        p.alpha -= 0.008;

        if (p.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (pieces.some(p => p.alpha > 0)) {
        frame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return { canvasRef, trigger };
}

// ── 4. Spring Modal ───────────────────────────────────────────────────────────

/**
 * Drop-in replacement for your modal overlay.
 * Adds spring entrance animation and smooth backdrop.
 *
 * Usage: replace your modal's outermost div with <SpringModal onClose={...}>
 */
export function SpringModal({ children, onClose, maxWidth = 420 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        background: "rgba(15,10,40,0.55)",
        backdropFilter: "blur(4px)",
        animation: "df-overlayIn 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20,
          width: "100%", maxWidth,
          boxShadow: "0 24px 80px rgba(80,60,160,0.25)",
          animation: "df-springIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── 5. Page Transition ────────────────────────────────────────────────────────

/**
 * Wraps screen content with fade+slide animation on mount.
 * Key it by the current nav to re-trigger on screen change.
 *
 * Usage: <PageTransition navKey={nav}><ActiveScreen /></PageTransition>
 */
export function PageTransition({ children, navKey }) {
  const [visible, setVisible] = useState(false);

useEffect(() => {
  const t1 = setTimeout(() => setVisible(false), 0);
  const t2 = setTimeout(() => setVisible(true), 20);
  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
  };
}, [navKey]);

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      opacity:   visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      height: "100%",
    }}>
      {children}
    </div>
  );
}

// ── 6. Pulsing Badge ──────────────────────────────────────────────────────────

/**
 * Animated badge that pulses — used for nudge count in sidebar.
 *
 * Usage: <PulsingBadge count={nudgeCount} />
 */
export function PulsingBadge({ count }) {
  if (!count || count === 0) return null;
  return (
    <span style={{
      marginLeft: "auto",
      background: "#EF4444", color: "#fff",
      fontSize: 10, fontWeight: 700,
      borderRadius: 10, padding: "1px 6px",
      minWidth: 16, textAlign: "center",
      animation: "df-pulse 1.5s ease-in-out infinite",
      display: "inline-block",
    }}>
      {count}
    </span>
  );
}

// ── 7. Animated Metric Card ───────────────────────────────────────────────────

/**
 * Metric card with animated counter.
 * Drop-in replacement for your existing MetricCard component.
 */
export function AnimatedMetricCard({ label, value, sub, accent, prefix = "", suffix = "" }) {
  // Extract numeric value from strings like "$12,200"
  const numericValue = typeof value === "number"
    ? value
    : parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;

  const hasPrefix = String(value).startsWith("$") ? "$" : prefix;

  return (
    <div style={{
      background: "#fff", border: "1px solid #E8E6F0", borderRadius: 12,
      padding: "16px 18px", borderTop: `3px solid ${accent}`,
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(80,60,160,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ fontSize: 12, color: "#9B96B8", fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1035" }}>
        <AnimatedCounter value={numericValue} prefix={hasPrefix} suffix={suffix} duration={1000} />
      </div>
      <div style={{ fontSize: 12, color: "#15803D", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ── 8. Move Animation for Deal Cards ─────────────────────────────────────────

/**
 * Wraps a deal card with a slide-in animation when it mounts.
 * Use key={deal.id + deal.stage} to re-trigger on stage change.
 */
export function AnimatedDealCard({ children, stageChanged }) {
  const [anim, setAnim] = useState(stageChanged);

useEffect(() => {
  if (!stageChanged) return;
  const t1 = setTimeout(() => setAnim(true), 0);
  const t2 = setTimeout(() => setAnim(false), 400);
  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
  };
}, [stageChanged]);

  return (
    <div style={{
      animation: anim ? "df-springIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" : "df-fadeSlideIn 0.3s ease",
    }}>
      {children}
    </div>
  );
}

// ── 9. Success Toast ──────────────────────────────────────────────────────────

/**
 * A toast notification that appears from the bottom and fades out.
 * Usage: const toast = useToast(); toast.show("Deal added! 🎉");
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const ToastContainer = () => (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9998, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{
          padding: "12px 20px", borderRadius: 12,
          background: toast.type === "success" ? "#1a1035" : toast.type === "error" ? "#B91C1C" : "#B45309",
          color: "#fff", fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          animation: "df-springIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex", alignItems: "center", gap: 10,
          maxWidth: 320,
        }}>
          <span>{toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "⚠️"}</span>
          {toast.message}
        </div>
      ))}
    </div>
  );

  return { show, ToastContainer };
}
