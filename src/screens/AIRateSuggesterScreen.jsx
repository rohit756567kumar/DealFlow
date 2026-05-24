// src/screens/AIRateSuggesterScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Creator inputs their stats → AI suggests what they should charge
// per platform and deal type, with reasoning and negotiation range.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { groqChat, parseJsonResponse } from "../services/groqService.js";
import { useAsync } from "../hooks/useAsync.js";
import { useRateCard } from "../hooks/useInvoices.js";

const PLATFORMS  = ["Instagram", "YouTube", "TikTok", "LinkedIn", "Twitter/X", "Newsletter", "Podcast"];
const NICHES     = ["Tech & Productivity", "Finance & Business", "Health & Fitness", "Beauty & Fashion", "Food & Cooking", "Travel & Lifestyle", "Gaming", "Education", "Parenting", "Sustainability", "Other"];
const DEAL_TYPES = ["Sponsored Post", "UGC", "Ambassador", "Affiliate", "Integration", "Mention"];

const SYSTEM_PROMPT = `You are an expert influencer marketing analyst with deep knowledge of creator economy rates across all platforms and niches.

Give accurate, research-based rate recommendations. Be specific and realistic — not too low (don't undersell creators) and not too high (keep it achievable).

Always respond with ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence overall assessment of this creator's market position",
  "rates": [
    {
      "dealType": "Sponsored Post",
      "platform": "Instagram",
      "minRate": number,
      "maxRate": number,
      "sweetSpot": number,
      "reasoning": "one sentence why this rate",
      "currentlyCharging": null
    }
  ],
  "insights": [
    "specific insight about their pricing power"
  ],
  "underchargedFor": ["deal types where they could charge significantly more"],
  "marketPosition": "budget|mid-tier|premium|top-tier",
  "marketPositionReason": "one sentence explanation",
  "negotiationAdvice": "2-3 sentences on how to negotiate rates",
  "rateCardTips": ["2-3 tips for presenting rates to brands"],
  "growthRate": "what rate increase they could justify in 6 months with consistent posting"
}`;

const fmt = (n) => `$${Number(n ?? 0).toLocaleString()}`;

// ── Rate Result Card ──────────────────────────────────────────────────────────

function RateCard({ rate, currentRates, onSaveRate, saving }) {
  const current = currentRates.find(r =>
    r.platform?.toLowerCase() === rate.platform?.toLowerCase() &&
    r.deal_type?.toLowerCase() === rate.dealType?.toLowerCase()
  );
  const currentAmount = current?.rate ? Number(current.rate) : null;
  const isUndercharging = currentAmount && currentAmount < rate.minRate;
  const isOvercharging  = currentAmount && currentAmount > rate.maxRate;

  return (
    <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1035" }}>{rate.dealType}</div>
          <div style={{ fontSize: 12, color: "#9B96B8", marginTop: 2 }}>{rate.platform}</div>
        </div>
        {currentAmount && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#9B96B8" }}>Currently charging</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: isUndercharging ? "#B91C1C" : isOvercharging ? "#B45309" : "#15803D" }}>
              {fmt(currentAmount)}
              {isUndercharging && " ↓ too low"}
              {isOvercharging  && " ↑ check market"}
            </div>
          </div>
        )}
      </div>

      {/* Rate range bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#9B96B8" }}>Min {fmt(rate.minRate)}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#5B4BD8" }}>Sweet spot {fmt(rate.sweetSpot)}</span>
          <span style={{ fontSize: 11, color: "#9B96B8" }}>Max {fmt(rate.maxRate)}</span>
        </div>
        <div style={{ position: "relative", height: 8, background: "#F0EEFF", borderRadius: 10 }}>
          {/* Range fill */}
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: "10%", right: "10%",
            background: "linear-gradient(90deg, #C9C2F7, #7B6EE8)",
            borderRadius: 10,
          }} />
          {/* Sweet spot marker */}
          <div style={{
            position: "absolute", top: "50%", left: "55%",
            transform: "translate(-50%, -50%)",
            width: 16, height: 16, borderRadius: "50%",
            background: "#5B4BD8", border: "3px solid #fff",
            boxShadow: "0 0 0 2px #7B6EE8",
          }} />
          {/* Current rate marker */}
          {currentAmount && (
            <div style={{
              position: "absolute", top: "50%",
              left: `${Math.min(90, Math.max(10, ((currentAmount - rate.minRate) / (rate.maxRate - rate.minRate)) * 80 + 10))}%`,
              transform: "translate(-50%, -50%)",
              width: 12, height: 12, borderRadius: "50%",
              background: isUndercharging ? "#B91C1C" : "#15803D",
              border: "2px solid #fff",
            }} />
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#7B76A0", lineHeight: 1.6, marginBottom: 14 }}>
        💡 {rate.reasoning}
      </div>

      {/* Save to rate card button */}
      <button
        onClick={() => onSaveRate({ platform: rate.platform, dealType: rate.dealType, rate: rate.sweetSpot })}
        disabled={saving}
        style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: "1px solid #C9C2F7", background: "#F3F0FF", color: "#5B4BD8", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}
      >
        {saving ? "Saving…" : `Save ${fmt(rate.sweetSpot)} to rate card`}
      </button>
    </div>
  );
}

// ── Market position badge ─────────────────────────────────────────────────────

const POSITION_COLORS = {
  "budget":    { bg: "#F1EFE8", text: "#444441", border: "#D9D5CC", emoji: "🌱" },
  "mid-tier":  { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", emoji: "⭐" },
  "premium":   { bg: "#F3F0FF", text: "#5B4BD8", border: "#C9C2F7", emoji: "💎" },
  "top-tier":  { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", emoji: "🏆" },
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AIRateSuggesterScreen() {
  const { rates: currentRates, addEntry } = useRateCard();
  const { run, loading, error } = useAsync();
  const { run: saveRun, loading: saving } = useAsync();

  const [form, setForm] = useState({
    platforms:      [PLATFORMS[0]],
    niche:          NICHES[0],
    followers:      "",
    engagementRate: "",
    avgViews:       "",
    yearsActive:    "",
    pastBrands:     "",
    location:       "",
    audienceAge:    "18-34",
    dealTypes:      [DEAL_TYPES[0], DEAL_TYPES[1]],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p],
    }));
  };

  const toggleDealType = (t) => {
    setForm(f => ({
      ...f,
      dealTypes: f.dealTypes.includes(t)
        ? f.dealTypes.filter(x => x !== t)
        : [...f.dealTypes, t],
    }));
  };

  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!form.followers) { alert("Enter your follower count first"); return; }
    setResult(null);

    await run(async () => {
      const text = await groqChat({
        system: SYSTEM_PROMPT,
        user: `Suggest rates for this creator:

Platforms: ${form.platforms.join(", ")}
Content niche: ${form.niche}
Follower count: ${form.followers}
Average engagement rate: ${form.engagementRate || "not provided"}
Average views per post: ${form.avgViews || "not provided"}
Years active: ${form.yearsActive || "not provided"}
Past brand collaborations: ${form.pastBrands || "none"}
Creator location: ${form.location || "not provided"}
Audience age range: ${form.audienceAge}
Deal types interested in: ${form.dealTypes.join(", ")}

Current rates they charge (if any):
${currentRates.length > 0
  ? currentRates.map(r => `${r.platform} ${r.deal_type}: $${r.rate}`).join("\n")
  : "No rates set yet"}

Give specific dollar amounts for each platform + deal type combination. Use current 2024-2025 market rates.`,
        maxTokens: 2500,
      });
      setResult(parseJsonResponse(text));
    });
  };

  const handleSaveRate = async ({ platform, dealType, rate }) => {
    await saveRun(async () => {
      await addEntry({ platform, dealType, rate });
      alert(`✅ $${rate.toLocaleString()} saved to your rate card for ${platform} ${dealType}!`);
    });
  };

  const inp = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #E8E6F0", fontSize: 13, color: "#1a1035",
    background: "#FAFAFA", outline: "none", boxSizing: "border-box",
  };
  const lbl = { fontSize: 11, fontWeight: 700, color: "#9B96B8", display: "block", marginBottom: 6, letterSpacing: "0.04em" };

  const posConfig = result ? (POSITION_COLORS[result.marketPosition] ?? POSITION_COLORS["mid-tier"]) : null;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 4px" }}>
          💰 AI Rate Suggester
        </h2>
        <div style={{ fontSize: 13, color: "#9B96B8" }}>
          Enter your stats → AI tells you exactly what to charge based on real market rates. Stop undercharging.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "380px 1fr" : "580px", gap: 24 }}>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Platforms */}
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px" }}>
            <label style={lbl}>YOUR PLATFORMS (select all that apply)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  style={{ padding: "7px 14px", borderRadius: 20, border: `2px solid ${form.platforms.includes(p) ? "#7B6EE8" : "#E8E6F0"}`, background: form.platforms.includes(p) ? "#F3F0FF" : "#FAFAFA", color: form.platforms.includes(p) ? "#5B4BD8" : "#9B96B8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1035", marginBottom: 14 }}>📊 Your Stats</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={lbl}>NICHE</label>
                <select style={inp} value={form.niche} onChange={e => set("niche", e.target.value)}>
                  {NICHES.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>TOTAL FOLLOWERS *</label>
                  <input style={inp} value={form.followers} onChange={e => set("followers", e.target.value)} placeholder="e.g. 85K or 85000" />
                </div>
                <div>
                  <label style={lbl}>ENGAGEMENT RATE</label>
                  <input style={inp} value={form.engagementRate} onChange={e => set("engagementRate", e.target.value)} placeholder="e.g. 4.2%" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>AVG VIEWS / POST</label>
                  <input style={inp} value={form.avgViews} onChange={e => set("avgViews", e.target.value)} placeholder="e.g. 25K" />
                </div>
                <div>
                  <label style={lbl}>YEARS ACTIVE</label>
                  <input style={inp} value={form.yearsActive} onChange={e => set("yearsActive", e.target.value)} placeholder="e.g. 3" />
                </div>
              </div>
              <div>
                <label style={lbl}>AUDIENCE AGE RANGE</label>
                <select style={inp} value={form.audienceAge} onChange={e => set("audienceAge", e.target.value)}>
                  {["13-17", "18-24", "18-34", "25-34", "25-44", "35-54", "45+", "Mixed"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>LOCATION</label>
                <input style={inp} value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. India, USA, UK" />
              </div>
              <div>
                <label style={lbl}>PAST BRAND COLLABS</label>
                <input style={inp} value={form.pastBrands} onChange={e => set("pastBrands", e.target.value)} placeholder="e.g. Notion, NordVPN, Skillshare" />
              </div>
            </div>
          </div>

          {/* Deal types */}
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "18px 20px" }}>
            <label style={lbl}>DEAL TYPES TO PRICE (select all you offer)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DEAL_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => toggleDealType(t)}
                  style={{ padding: "7px 14px", borderRadius: 20, border: `2px solid ${form.dealTypes.includes(t) ? "#7B6EE8" : "#E8E6F0"}`, background: form.dealTypes.includes(t) ? "#F3F0FF" : "#FAFAFA", color: form.dealTypes.includes(t) ? "#5B4BD8" : "#9B96B8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={loading || !form.followers.trim() || form.platforms.length === 0}
            style={{ padding: "14px 0", borderRadius: 12, border: "none", background: (loading || !form.followers.trim()) ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: (loading || !form.followers.trim()) ? "not-allowed" : "pointer" }}
          >
            {loading ? "💰 Analyzing market rates…" : "🔍 Suggest my rates"}
          </button>

          {error && (
            <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#B91C1C" }}>
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Market position + summary */}
            <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1035" }}>Your Market Position</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: posConfig.bg, border: `1px solid ${posConfig.border}` }}>
                  <span>{posConfig.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: posConfig.text, textTransform: "capitalize" }}>{result.marketPosition}</span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#1a1035", margin: "0 0 10px", lineHeight: 1.7 }}>{result.summary}</p>
              <div style={{ fontSize: 13, color: "#9B96B8", fontStyle: "italic" }}>📈 In 6 months: {result.growthRate}</div>
            </div>

            {/* Undercharged alert */}
            {result.underchargedFor?.length > 0 && (
              <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 14, padding: "14px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#B91C1C", marginBottom: 8 }}>
                  ⚠️ You're leaving money on the table for:
                </div>
                {result.underchargedFor.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#991B1B", display: "flex", gap: 8, padding: "3px 0" }}>
                    <span>•</span> {item}
                  </div>
                ))}
              </div>
            )}

            {/* Rate cards */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#9B96B8", letterSpacing: "0.04em" }}>
              SUGGESTED RATES — click "Save to rate card" on any to update your profile
            </div>

            {result.rates?.map((rate, i) => (
              <RateCard
                key={i}
                rate={rate}
                currentRates={currentRates}
                onSaveRate={handleSaveRate}
                saving={saving}
              />
            ))}

            {/* Negotiation advice */}
            {result.negotiationAdvice && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", marginBottom: 8 }}>🤝 How to negotiate your rates</div>
                <p style={{ fontSize: 13, color: "#1E40AF", margin: 0, lineHeight: 1.7 }}>{result.negotiationAdvice}</p>
              </div>
            )}

            {/* Rate card tips */}
            {result.rateCardTips?.length > 0 && (
              <div style={{ background: "#F3F0FF", border: "1px solid #C9C2F7", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#5B4BD8", marginBottom: 10 }}>💡 Rate card presentation tips</div>
                {result.rateCardTips.map((tip, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#4C1D95", padding: "5px 0", display: "flex", gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>{i + 1}.</span> {tip}
                  </div>
                ))}
              </div>
            )}

            {/* Insights */}
            {result.insights?.length > 0 && (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 10 }}>✅ Your pricing strengths</div>
                {result.insights.map((ins, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#166534", padding: "5px 0", display: "flex", gap: 8 }}>
                    <span>•</span> {ins}
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
