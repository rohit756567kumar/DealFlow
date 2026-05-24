// src/screens/AINudgeWriterScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Select a silent deal → AI writes personalized follow-up messages
// in different tones. One click to log the nudge.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { groqChat, parseJsonResponse } from "../services/groqService.js";
import { useDeals } from "../hooks/useDeals.js";
import { useAsync } from "../hooks/useAsync.js";
import { sendNudge } from "../services/dealService.js";

const SYSTEM_PROMPT = `You are an expert at writing professional, friendly follow-up messages for content creators reaching out to brands.

Write follow-up messages that are concise, warm, and professional. Never desperate or pushy.

Always respond with ONLY valid JSON in this exact format:
{
  "messages": [
    {
      "tone": "friendly",
      "label": "Friendly & Casual",
      "emoji": "😊",
      "message": "the full message text"
    },
    {
      "tone": "professional",
      "label": "Professional",
      "emoji": "💼",
      "message": "the full message text"
    },
    {
      "tone": "direct",
      "label": "Direct & Confident",
      "emoji": "🎯",
      "message": "the full message text"
    }
  ],
  "bestTone": "friendly|professional|direct",
  "bestToneReason": "one sentence why this tone fits this situation",
  "subjectLine": "suggested email subject line",
  "timing": "best time to send this follow-up"
}`;

const daysAgo = (d) => {
  if (!d) return "unknown";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "today" : diff === 1 ? "yesterday" : `${diff} days ago`;
};

export default function AINudgeWriterScreen() {
  const { deals } = useDeals();
  const { run, loading, error } = useAsync();
  const { run: sendRun, loading: sending } = useAsync();

  const [selectedDealId, setSelectedDealId] = useState("");
  const [context,        setContext]         = useState("");
  const [result,         setResult]          = useState(null);
  const [selected,       setSelected]        = useState(null);
  const [copied,         setCopied]          = useState(null);
  const [sent,           setSent]            = useState(false);

  const silentDeals = deals.filter(d =>
    ["Inbound", "Negotiating"].includes(d.stage)
  );

  const selectedDeal = deals.find(d => d.id === selectedDealId);

  const generate = async () => {
    if (!selectedDeal) return;
    setResult(null); setSent(false); setSelected(null);

    await run(async () => {
      const text = await groqChat({
        system: SYSTEM_PROMPT,
        user: `Write follow-up messages for this situation:

Brand: ${selectedDeal.brand}
Platform: ${selectedDeal.platform}
Deal type: ${selectedDeal.type}
Deal value: $${selectedDeal.amount.toLocaleString()}
Current stage: ${selectedDeal.stage}
Last contact: ${daysAgo(selectedDeal.updatedAt)}
${context ? `Additional context: ${context}` : ""}

Write 3 follow-up messages in different tones. Keep them under 80 words each. Natural and human-sounding.`,
      });
      const parsed = parseJsonResponse(text);
      setResult(parsed);
      setSelected(parsed.messages.find(m => m.tone === parsed.bestTone) ?? parsed.messages[0]);
    });
  };

  const copyMessage = (msg, tone) => {
    navigator.clipboard.writeText(msg);
    setCopied(tone);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendNudge = async () => {
    if (!selected || !selectedDeal) return;
    await sendRun(async () => {
      await sendNudge(selectedDeal.id, selected.message);
      setSent(true);
    });
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 4px" }}>
          ✍️ AI Nudge Writer
        </h2>
        <div style={{ fontSize: 13, color: "#9B96B8" }}>
          Select a deal → AI writes 3 personalized follow-ups in different tones. Pick your favourite and log it.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1.2fr" : "1fr", gap: 20 }}>

        {/* Input panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Deal selector */}
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#9B96B8", display: "block", marginBottom: 10 }}>SELECT DEAL</label>

            {silentDeals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#C4C0D8", fontSize: 13 }}>
                No active deals in Inbound or Negotiating stage.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {silentDeals.map(deal => {
                  const daysSilent = deal.updatedAt ? Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / 86400000) : 0;
                  const isSelected = selectedDealId === deal.id;
                  return (
                    <div
                      key={deal.id}
                      onClick={() => { setSelectedDealId(deal.id); setResult(null); setSent(false); }}
                      style={{ padding: "12px 14px", borderRadius: 10, border: `2px solid ${isSelected ? "#7B6EE8" : "#E8E6F0"}`, background: isSelected ? "#F3F0FF" : "#FAFAFA", cursor: "pointer", transition: "all 0.15s" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1035" }}>{deal.brand}</div>
                          <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{deal.platform} · {deal.type} · ${deal.amount.toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: daysSilent >= 7 ? "#B91C1C" : daysSilent >= 3 ? "#B45309" : "#9B96B8" }}>
                            {daysSilent >= 1 ? `${daysSilent}d silent` : "Active today"}
                          </div>
                          <div style={{ fontSize: 11, color: "#9B96B8", textTransform: "capitalize" }}>{deal.stage}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Context input */}
          {selectedDealId && (
            <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#9B96B8", display: "block", marginBottom: 10 }}>
                EXTRA CONTEXT <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="e.g. They seemed really interested but went quiet after I sent rates. Their Q4 campaign starts next month..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E8E6F0", fontSize: 13, color: "#1a1035", background: "#FAFAFA", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
              />
              <button
                onClick={generate}
                disabled={loading || !selectedDealId}
                style={{ width: "100%", marginTop: 12, padding: "13px 0", borderRadius: 10, border: "none", background: (loading || !selectedDealId) ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (loading || !selectedDealId) ? "not-allowed" : "pointer" }}
              >
                {loading ? "✍️ Writing messages…" : "✨ Generate nudges"}
              </button>

              {error && <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginTop: 12 }}>{error}</div>}
            </div>
          )}
        </div>

        {/* Results panel */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* AI recommendation */}
            <div style={{ background: "#F3F0FF", border: "1px solid #C9C2F7", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#5B4BD8", marginBottom: 4 }}>AI Recommendation</div>
                <div style={{ fontSize: 13, color: "#4C1D95", lineHeight: 1.6 }}>{result.bestToneReason}</div>
                {result.timing && <div style={{ fontSize: 12, color: "#7B6EE8", marginTop: 6 }}>⏰ Best time: {result.timing}</div>}
              </div>
            </div>

            {/* Subject line */}
            {result.subjectLine && (
              <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9B96B8", marginBottom: 3 }}>SUGGESTED SUBJECT LINE</div>
                  <div style={{ fontSize: 14, color: "#1a1035", fontWeight: 500 }}>{result.subjectLine}</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(result.subjectLine); }} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E8E6F0", background: "#F8F7FF", color: "#5B4BD8", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Copy</button>
              </div>
            )}

            {/* Message options */}
            {result.messages?.map(msg => {
              const isSelected = selected?.tone === msg.tone;
              const isBest     = result.bestTone === msg.tone;
              return (
                <div
                  key={msg.tone}
                  onClick={() => setSelected(msg)}
                  style={{ background: "#fff", border: `2px solid ${isSelected ? "#7B6EE8" : "#E8E6F0"}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s", position: "relative" }}
                >
                  {isBest && (
                    <div style={{ position: "absolute", top: -10, right: 14, background: "#7B6EE8", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>RECOMMENDED</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{msg.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1035" }}>{msg.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={(e) => { e.stopPropagation(); copyMessage(msg.message, msg.tone); }} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E8E6F0", background: copied === msg.tone ? "#5B4BD8" : "#F8F7FF", color: copied === msg.tone ? "#fff" : "#5B4BD8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {copied === msg.tone ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#1a1035", margin: 0, lineHeight: 1.7, fontStyle: "italic", background: isSelected ? "#F8F7FF" : "#FAFAFA", padding: "10px 12px", borderRadius: 8 }}>
                    "{msg.message}"
                  </p>
                </div>
              );
            })}

            {/* Send nudge button */}
            {selected && (
              <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "16px 18px" }}>
                {sent ? (
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>Nudge logged!</div>
                    <div style={{ fontSize: 13, color: "#9B96B8", marginTop: 4 }}>Visible in the deal's nudge history.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: "#9B96B8", marginBottom: 10 }}>
                      Using: <strong style={{ color: "#1a1035" }}>{selected.label}</strong> tone
                    </div>
                    <button
                      onClick={handleSendNudge}
                      disabled={sending}
                      style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: sending ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer" }}
                    >
                      {sending ? "Logging…" : `📩 Log nudge for ${selectedDeal?.brand}`}
                    </button>
                    <div style={{ fontSize: 11, color: "#C4C0D8", marginTop: 8, textAlign: "center" }}>
                      Logs in deal history. Connect Resend to also email the brand.
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
