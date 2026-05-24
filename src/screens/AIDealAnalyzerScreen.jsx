// src/screens/AIDealAnalyzerScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Paste a brand DM or email → AI extracts deal details + negotiation tips
// and pre-fills the deal form automatically.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { groqChat, parseJsonResponse } from "../services/groqService.js";
import { useDeals } from "../hooks/useDeals.js";
import { useAsync } from "../hooks/useAsync.js";

const PLATFORMS  = ["Instagram", "YouTube", "TikTok", "LinkedIn", "Twitter/X", "Newsletter", "Podcast"];
const DEAL_TYPES = ["Sponsored Post", "UGC", "Ambassador", "Affiliate", "Integration", "Mention"];

const SYSTEM_PROMPT = `You are a brand deal analyst for content creators. 
Analyze brand outreach messages and extract structured deal information.

Always respond with ONLY valid JSON in this exact format:
{
  "brand": "brand name or company",
  "dealType": "one of: Sponsored Post, UGC, Ambassador, Affiliate, Integration, Mention",
  "platform": "one of: Instagram, YouTube, TikTok, LinkedIn, Twitter/X, Newsletter, Podcast",
  "estimatedAmount": number (your best estimate in USD, 0 if unclear),
  "confidence": "high|medium|low",
  "redFlags": ["array of concerning things in the message"],
  "positives": ["array of good signs"],
  "negotiationTips": ["2-3 specific tips to get a better deal"],
  "suggestedResponse": "a short professional reply to send back",
  "summary": "one sentence summary of this opportunity",
  "shouldPursue": true or false,
  "reasoning": "2-3 sentences explaining your recommendation"
}`;

// ── Result Card ───────────────────────────────────────────────────────────────

function ResultCard({ result, onCreateDeal, creating }) {
  const [copied, setCopied] = useState(false);

  const copyResponse = () => {
    navigator.clipboard.writeText(result.suggestedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = result.shouldPursue ? "#15803D" : "#B91C1C";
  const scoreBg    = result.shouldPursue ? "#F0FDF4" : "#FFF0F0";
  const scoreBorder= result.shouldPursue ? "#86EFAC" : "#FCA5A5";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Recommendation */}
      <div style={{ background: scoreBg, border: `1px solid ${scoreBorder}`, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: scoreColor }}>
            {result.shouldPursue ? "✅ Pursue this deal" : "⚠️ Proceed with caution"}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#fff", color: scoreColor, border: `1px solid ${scoreBorder}` }}>
            {result.confidence} confidence
          </span>
        </div>
        <p style={{ fontSize: 14, color: "#1a1035", margin: 0, lineHeight: 1.7 }}>{result.reasoning}</p>
      </div>

      {/* Extracted deal details */}
      <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#9B96B8", marginBottom: 14, letterSpacing: "0.04em" }}>EXTRACTED DEAL INFO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Brand",       result.brand],
            ["Deal Type",   result.dealType],
            ["Platform",    result.platform],
            ["Est. Value",  result.estimatedAmount > 0 ? `$${result.estimatedAmount.toLocaleString()}` : "Not mentioned"],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#F8F7FF", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9B96B8", marginBottom: 4 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1035" }}>{value}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onCreateDeal(result)}
          disabled={creating}
          style={{ width: "100%", marginTop: 14, padding: "11px 0", borderRadius: 10, border: "none", background: creating ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer" }}
        >
          {creating ? "Adding to pipeline…" : "➕ Add to pipeline"}
        </button>
      </div>

      {/* Red flags */}
      {result.redFlags?.length > 0 && (
        <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#B91C1C", marginBottom: 10 }}>🚩 Red Flags</div>
          {result.redFlags.map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: "#991B1B", padding: "6px 0", borderBottom: i < result.redFlags.length - 1 ? "1px solid #FEE2E2" : "none" }}>• {f}</div>
          ))}
        </div>
      )}

      {/* Positives */}
      {result.positives?.length > 0 && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 10 }}>✅ Positives</div>
          {result.positives.map((p, i) => (
            <div key={i} style={{ fontSize: 13, color: "#166534", padding: "6px 0", borderBottom: i < result.positives.length - 1 ? "1px solid #D1FAE5" : "none" }}>• {p}</div>
          ))}
        </div>
      )}

      {/* Negotiation tips */}
      {result.negotiationTips?.length > 0 && (
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", marginBottom: 10 }}>💡 Negotiation Tips</div>
          {result.negotiationTips.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: "#1E40AF", padding: "6px 0", borderBottom: i < result.negotiationTips.length - 1 ? "1px solid #DBEAFE" : "none" }}>
              {i + 1}. {t}
            </div>
          ))}
        </div>
      )}

      {/* Suggested reply */}
      {result.suggestedResponse && (
        <div style={{ background: "#F8F7FF", border: "1px solid #C9C2F7", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#5B4BD8" }}>✍️ Suggested Reply</div>
            <button onClick={copyResponse} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #C9C2F7", background: copied ? "#5B4BD8" : "#fff", color: copied ? "#fff" : "#5B4BD8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p style={{ fontSize: 13, color: "#1a1035", margin: 0, lineHeight: 1.7, fontStyle: "italic" }}>"{result.suggestedResponse}"</p>
        </div>
      )}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AIDealAnalyzerScreen() {
  const [message, setMessage] = useState("");
  const [result,  setResult]  = useState(null);
  const { run, loading, error } = useAsync();
  const { addDeal } = useDeals();
  const { run: createRun, loading: creating } = useAsync();

  const analyze = async () => {
    if (!message.trim()) return;
    setResult(null);
    await run(async () => {
      const text = await groqChat({
        system: SYSTEM_PROMPT,
        user:   `Analyze this brand outreach message:\n\n${message}`,
      });
      const parsed = parseJsonResponse(text);
      setResult(parsed);
    });
  };

  const handleCreateDeal = async (r) => {
    await createRun(async () => {
      await addDeal({
        brand:   r.brand || "Unknown Brand",
        type:    DEAL_TYPES.includes(r.dealType) ? r.dealType : DEAL_TYPES[0],
        platform: PLATFORMS.includes(r.platform) ? r.platform : PLATFORMS[0],
        amount:  r.estimatedAmount || 0,
        stage:   "Inbound",
        dueDate: "",
        note:    `AI analyzed: ${r.summary}`,
      });
      alert("✅ Deal added to your pipeline!");
    });
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 4px" }}>
          🤖 AI Deal Analyzer
        </h2>
        <div style={{ fontSize: 13, color: "#9B96B8" }}>
          Paste a brand DM or email → AI extracts deal details, flags red flags, and suggests how to negotiate.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: 20 }}>

        {/* Input panel */}
        <div>
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#9B96B8", display: "block", marginBottom: 10, letterSpacing: "0.04em" }}>
              PASTE BRAND MESSAGE
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={`Example:\n\nHi! I'm Sarah from NordVPN. We love your content and would love to partner with you for a sponsored post on Instagram. We're looking for a 60-second mention in your next post. Our budget is around $500-800. Let me know if you're interested!`}
              rows={12}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8E6F0", fontSize: 13, color: "#1a1035", background: "#FAFAFA", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.7, fontFamily: "inherit" }}
            />
            <button
              onClick={analyze}
              disabled={loading || !message.trim()}
              style={{ width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 10, border: "none", background: (loading || !message.trim()) ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (loading || !message.trim()) ? "not-allowed" : "pointer" }}
            >
              {loading ? "🤖 Analyzing…" : "🔍 Analyze deal"}
            </button>

            {error && (
              <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginTop: 12 }}>
                {error}
              </div>
            )}
          </div>

          {/* Tips */}
          <div style={{ background: "#F8F7FF", border: "1px solid #E8E6F0", borderRadius: 14, padding: "16px 20px", marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9B96B8", marginBottom: 10 }}>WHAT AI WILL EXTRACT</div>
            {["Brand name and deal type", "Estimated budget (even if vague)", "Red flags like missing payment terms", "Negotiation tips specific to this deal", "A suggested reply you can send immediately"].map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: "#7B76A0", padding: "5px 0", display: "flex", gap: 8 }}>
                <span style={{ color: "#7B6EE8" }}>→</span> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Results panel */}
        {result && (
          <div>
            <ResultCard result={result} onCreateDeal={handleCreateDeal} creating={creating} />
          </div>
        )}
      </div>
    </div>
  );
}
