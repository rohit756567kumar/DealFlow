// src/components/ErrorBoundary.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Catches any JS error in child components and shows a friendly fallback UI
// instead of a blank white screen.
// Usage: wrap any screen with <ErrorBoundary> in App.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to Sentry / LogRocket
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message ?? "Something went wrong";

    return (
      <div style={{
        minHeight: "100vh", background: "#0F0A2E",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 24,
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "48px 40px",
          width: 440, maxWidth: "100%", textAlign: "center",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}>
          {/* Broken icon */}
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>

          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1035", margin: "0 0 10px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#9B96B8", lineHeight: 1.6, margin: "0 0 24px" }}>
            An unexpected error occurred. Your data is safe — this is just a display issue.
          </p>

          {/* Error detail (collapsible) */}
          <details style={{ textAlign: "left", marginBottom: 24 }}>
            <summary style={{ fontSize: 12, color: "#C4C0D8", cursor: "pointer", marginBottom: 8 }}>
              Error details
            </summary>
            <pre style={{
              fontSize: 11, color: "#B91C1C", background: "#FFF0F0",
              border: "1px solid #FCA5A5", borderRadius: 8, padding: 12,
              whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6,
            }}>
              {msg}
            </pre>
          </details>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                border: "1px solid #E8E6F0", background: "#F8F7FF",
                color: "#7B76A0", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Reload page
            </button>
            <button
              onClick={this.handleReset}
              style={{
                flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#7B6EE8,#5B4BD8)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
