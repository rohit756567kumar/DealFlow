// src/screens/AIContractReviewerScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Paste a brand contract → AI flags risky clauses, missing terms, gives score
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { groqChat, parseJsonResponse } from "../services/groqService.js";
import { useAsync } from "../hooks/useAsync.js";

const SYSTEM_PROMPT = `You are an expert contract lawyer specializing in influencer and creator contracts.
Review brand collaboration contracts and identify issues that could harm the creator.

Always respond with ONLY valid JSON in this exact format:
{
  "riskScore": number from 1-10 (1=very safe, 10=very risky),
  "riskLevel": "low|medium|high|critical",
  "summary": "2-3 sentence overall assessment",
  "criticalIssues": [
    { "clause": "quote or description", "issue": "why this is problematic", "recommendation": "what to ask for instead" }
  ],
  "warnings": [
    { "clause": "quote or description", "issue": "potential concern", "recommendation": "suggested fix" }
  ],
  "positives": ["list of fair or creator-friendly clauses"],
  "missingClauses": ["important clauses that should be there but aren't"],
  "negotiationPoints": ["specific things to push back on with suggested language"],
  "redLines": ["absolute deal-breakers that should not be accepted"],
  "verdict": "sign|negotiate|reject",
  "verdictReason": "one sentence explanation"
}`;

const RISK_CONFIG = {
  low:      { color: "#15803D", bg: "#F0FDF4", border: "#86EFAC", label: "Low Risk",      emoji: "🟢" },
  medium:   { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "Medium Risk",   emoji: "🟡" },
  high:     { color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA", label: "High Risk",     emoji: "🟠" },
  critical: { color: "#B91C1C", bg: "#FFF0F0", border: "#FCA5A5", label: "Critical Risk", emoji: "🔴" },
};

const VERDICT_CONFIG = {
  sign:      { color: "#15803D", bg: "#F0FDF4", border: "#86EFAC", label: "✅ Safe to sign" },
  negotiate: { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "⚠️ Negotiate first" },
  reject:    { color: "#B91C1C", bg: "#FFF0F0", border: "#FCA5A5", label: "❌ Do not sign" },
};

function ScoreMeter({ score }) {
  const color = score <= 3 ? "#15803D" : score <= 6 ? "#B45309" : "#B91C1C";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 8px" }}>
        <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#F0EEFF" strokeWidth="10"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 10) * 251} 251`} strokeLinecap="round"/>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: "#9B96B8" }}>/ 10</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color }}>Risk Score</div>
    </div>
  );
}

function IssueCard({ item, type }) {
  const colors = {
    critical: { bg: "#FFF0F0", border: "#FCA5A5", title: "#B91C1C", text: "#991B1B", rec: "#166534", recBg: "#F0FDF4" },
    warning:  { bg: "#FFFBEB", border: "#FDE68A", title: "#B45309", text: "#92400E", rec: "#166534", recBg: "#F0FDF4" },
  };
  const c = colors[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.title, marginBottom: 6 }}>
        {type === "critical" ? "🚨" : "⚠️"} {item.clause}
      </div>
      <div style={{ fontSize: 13, color: c.text, marginBottom: 8, lineHeight: 1.6 }}>{item.issue}</div>
      <div style={{ background: c.recBg, borderRadius: 6, padding: "8px 12px", fontSize: 12, color: c.rec }}>
        💡 <strong>Fix:</strong> {item.recommendation}
      </div>
    </div>
  );
}

export default function AIContractReviewerScreen() {
  const [contract, setContract] = useState("");
  const [result,   setResult]   = useState(null);
  const { run, loading, error } = useAsync();

  const review = async () => {
    if (!contract.trim()) return;
    setResult(null);
    await run(async () => {
      const text = await groqChat({
        system:    SYSTEM_PROMPT,
        user:      `Review this brand collaboration contract:\n\n${contract}`,
        maxTokens: 2000,
      });
      setResult(parseJsonResponse(text));
    });
  };

  const risk    = result ? RISK_CONFIG[result.riskLevel]    ?? RISK_CONFIG.medium    : null;
  const verdict = result ? VERDICT_CONFIG[result.verdict]   ?? VERDICT_CONFIG.negotiate : null;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 4px" }}>
          ⚖️ AI Contract Reviewer
        </h2>
        <div style={{ fontSize: 13, color: "#9B96B8" }}>
          Paste any brand contract → AI flags risky clauses, missing terms, and tells you what to negotiate.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1.3fr" : "1fr", gap: 20 }}>

        {/* Input */}
        <div>
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#9B96B8", display: "block", marginBottom: 10 }}>PASTE CONTRACT TEXT</label>
            <textarea
              value={contract}
              onChange={e => setContract(e.target.value)}
              placeholder="Paste the full contract text here — or just the key sections you're unsure about..."
              rows={14}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8E6F0", fontSize: 13, color: "#1a1035", background: "#FAFAFA", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.7, fontFamily: "inherit" }}
            />
            <button
              onClick={review}
              disabled={loading || !contract.trim()}
              style={{ width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 10, border: "none", background: (loading || !contract.trim()) ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (loading || !contract.trim()) ? "not-allowed" : "pointer" }}
            >
              {loading ? "⚖️ Reviewing…" : "🔍 Review contract"}
            </button>
            {error && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginTop: 12 }}>{error}</div>}
          </div>

          <div style={{ background: "#F8F7FF", border: "1px solid #E8E6F0", borderRadius: 14, padding: "16px 20px", marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9B96B8", marginBottom: 10 }}>AI CHECKS FOR</div>
            {[
              "Unfair exclusivity periods",
              "Missing payment terms and timelines",
              "Overly broad usage rights",
              "Unlimited revision clauses",
              "IP ownership red flags",
              "Termination without cause clauses",
              "Missing kill fee provisions",
            ].map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: "#7B76A0", padding: "4px 0", display: "flex", gap: 8 }}>
                <span style={{ color: "#7B6EE8" }}>→</span> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Score + verdict */}
            <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <ScoreMeter score={result.riskScore} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: risk.bg, border: `1px solid ${risk.border}`, marginBottom: 10 }}>
                    <span>{risk.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: risk.color }}>{risk.label}</span>
                  </div>
                  <div style={{ fontSize: 14, color: "#1a1035", lineHeight: 1.7 }}>{result.summary}</div>
                </div>
              </div>

              {/* Verdict */}
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: verdict.bg, border: `1px solid ${verdict.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: verdict.color }}>{verdict.label}</span>
                <span style={{ fontSize: 13, color: verdict.color }}>{result.verdictReason}</span>
              </div>
            </div>

            {/* Critical issues */}
            {result.criticalIssues?.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#B91C1C", marginBottom: 12 }}>🚨 Critical Issues ({result.criticalIssues.length})</div>
                {result.criticalIssues.map((item, i) => <IssueCard key={i} item={item} type="critical" />)}
              </div>
            )}

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#B45309", marginBottom: 12 }}>⚠️ Warnings ({result.warnings.length})</div>
                {result.warnings.map((item, i) => <IssueCard key={i} item={item} type="warning" />)}
              </div>
            )}

            {/* Missing clauses */}
            {result.missingClauses?.length > 0 && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", marginBottom: 10 }}>📋 Missing Clauses</div>
                {result.missingClauses.map((c, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#1E40AF", padding: "5px 0", display: "flex", gap: 8 }}>
                    <span>•</span> {c}
                  </div>
                ))}
              </div>
            )}

            {/* Positives */}
            {result.positives?.length > 0 && (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 10 }}>✅ Creator-Friendly Clauses</div>
                {result.positives.map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#166534", padding: "5px 0", display: "flex", gap: 8 }}>
                    <span>•</span> {p}
                  </div>
                ))}
              </div>
            )}

            {/* Negotiation points */}
            {result.negotiationPoints?.length > 0 && (
              <div style={{ background: "#F8F7FF", border: "1px solid #C9C2F7", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#5B4BD8", marginBottom: 10 }}>💬 What to Negotiate</div>
                {result.negotiationPoints.map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#4C1D95", padding: "7px 0", borderBottom: i < result.negotiationPoints.length - 1 ? "1px solid #EDE9FE" : "none" }}>
                    {i + 1}. {p}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
