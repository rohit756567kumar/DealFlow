// src/screens/AIPitchGeneratorScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Creator fills in brand + details → AI generates cold outreach pitches
// in 3 formats: Instagram DM, Email, LinkedIn message
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { groqChat, parseJsonResponse } from "../services/groqService.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDeals } from "../hooks/useDeals.js";

const PLATFORMS  = ["Instagram", "YouTube", "TikTok", "LinkedIn", "Twitter/X", "Newsletter", "Podcast"];
const DEAL_TYPES = ["Sponsored Post", "UGC", "Ambassador", "Affiliate", "Integration", "Mention"];
const NICHES     = ["Tech & Productivity", "Finance & Business", "Health & Fitness", "Beauty & Fashion", "Food & Cooking", "Travel & Lifestyle", "Gaming", "Education", "Parenting", "Sustainability", "Other"];

const SYSTEM_PROMPT = `You are an expert influencer marketing consultant who writes cold outreach pitches for content creators.

Write compelling, personalized cold outreach pitches that get responses. Keep them concise, confident, and focused on value for the brand — not just the creator's stats.

Always respond with ONLY valid JSON in this exact format:
{
  "pitches": [
    {
      "format": "dm",
      "label": "Instagram / TikTok DM",
      "emoji": "📱",
      "subject": null,
      "message": "the full DM message — max 150 words, conversational, no formal sign-off"
    },
    {
      "format": "email",
      "label": "Email",
      "emoji": "📧",
      "subject": "compelling subject line",
      "message": "the full email — 150-200 words, professional but warm, include subject"
    },
    {
      "format": "linkedin",
      "label": "LinkedIn",
      "emoji": "💼",
      "subject": null,
      "message": "LinkedIn connection message — max 100 words, professional, reference mutual value"
    }
  ],
  "talkingPoints": ["3-4 key things to emphasize in follow-up conversations"],
  "bestFormat": "dm|email|linkedin",
  "bestFormatReason": "one sentence why this format works best for this brand",
  "doNots": ["2-3 things to avoid saying to this brand"],
  "followUpTiming": "when and how to follow up if no response"
}`;

// ── Pitch Card ────────────────────────────────────────────────────────────────

function PitchCard({ pitch, isSelected, onSelect }) {
  const [copied, setCopied] = useState(false);

  const copy = (e) => {
    e.stopPropagation();
    const text = pitch.format === "email" && pitch.subject
      ? `Subject: ${pitch.subject}\n\n${pitch.message}`
      : pitch.message;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(pitch)}
      style={{
        background: "#fff",
        border: `2px solid ${isSelected ? "#7B6EE8" : "#E8E6F0"}`,
        borderRadius: 14, padding: "18px 20px",
        cursor: "pointer", transition: "all 0.15s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{pitch.emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1035" }}>{pitch.label}</span>
        </div>
        <button
          onClick={copy}
          style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${copied ? "#86EFAC" : "#E8E6F0"}`, background: copied ? "#F0FDF4" : "#F8F7FF", color: copied ? "#166534" : "#5B4BD8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>

      {pitch.subject && (
        <div style={{ background: "#F8F7FF", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12 }}>
          <span style={{ fontWeight: 700, color: "#9B96B8" }}>Subject: </span>
          <span style={{ color: "#1a1035" }}>{pitch.subject}</span>
        </div>
      )}

      <p style={{
        fontSize: 13, color: "#1a1035", margin: 0, lineHeight: 1.8,
        background: isSelected ? "#F8F7FF" : "#FAFAFA",
        padding: "12px 14px", borderRadius: 10, fontStyle: "italic",
        whiteSpace: "pre-wrap",
      }}>
        "{pitch.message}"
      </p>

      <div style={{ fontSize: 11, color: "#C4C0D8", marginTop: 10, textAlign: "right" }}>
        {pitch.message.split(" ").length} words
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AIPitchGeneratorScreen() {
  const { addDeal } = useDeals();
  const { run, loading, error } = useAsync();
  const { run: addRun, loading: adding } = useAsync();

  const [form, setForm] = useState({
    brandName:    "",
    brandNiche:   "",
    platform:     PLATFORMS[0],
    dealType:     DEAL_TYPES[0],
    creatorNiche: NICHES[0],
    followers:    "",
    engagementRate: "",
    rate:         "",
    uniqueAngle:  "",
    pastBrands:   "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [result,   setResult]   = useState(null);
  const [selected, setSelected] = useState(null);

  const generate = async () => {
    if (!form.brandName.trim()) { alert("Enter a brand name first"); return; }
    setResult(null);

    await run(async () => {
      const text = await groqChat({
        system: SYSTEM_PROMPT,
        user: `Write cold outreach pitches for this creator:

Brand to pitch: ${form.brandName}
What the brand does / their niche: ${form.brandNiche || "not specified"}
My platform: ${form.platform}
Deal type I want: ${form.dealType}
My content niche: ${form.creatorNiche}
My follower count: ${form.followers || "not specified"}
My engagement rate: ${form.engagementRate || "not specified"}
My rate for this deal: ${form.rate ? `$${form.rate}` : "not specified — don't mention rate in pitch"}
My unique angle / why I'm different: ${form.uniqueAngle || "not specified"}
Brands I've worked with before: ${form.pastBrands || "none mentioned"}

Write pitches that focus on VALUE for the brand, not just my stats. Make them feel like they were written by a real person, not a template.`,
        maxTokens: 2000,
      });
      const parsed = parseJsonResponse(text);
      setResult(parsed);
      setSelected(parsed.pitches.find(p => p.format === parsed.bestFormat) ?? parsed.pitches[0]);
    });
  };

  const handleAddToPipeline = async () => {
    if (!form.brandName) return;
    await addRun(async () => {
      await addDeal({
        brand:    form.brandName,
        type:     form.dealType,
        platform: form.platform,
        amount:   Number(form.rate) || 0,
        stage:    "Inbound",
        dueDate:  "",
        note:     "Added from AI Pitch Generator",
      });
      alert(`✅ ${form.brandName} added to your pipeline!`);
    });
  };

  const inp = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #E8E6F0", fontSize: 13, color: "#1a1035",
    background: "#FAFAFA", outline: "none", boxSizing: "border-box",
  };
  const lbl = { fontSize: 11, fontWeight: 700, color: "#9B96B8", display: "block", marginBottom: 5, letterSpacing: "0.04em" };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1035", margin: "0 0 4px" }}>
          🎯 AI Pitch Generator
        </h2>
        <div style={{ fontSize: 13, color: "#9B96B8" }}>
          Fill in the brand details → AI writes a cold outreach pitch in 3 formats ready to send.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1.3fr" : "700px", gap: 24 }}>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Brand info */}
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1035", marginBottom: 16 }}>🏢 Brand Info</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={lbl}>BRAND NAME *</label>
                <input style={inp} value={form.brandName} onChange={e => set("brandName", e.target.value)} placeholder="e.g. Notion, NordVPN, Skillshare" />
              </div>
              <div>
                <label style={lbl}>WHAT THEY DO (optional but helps)</label>
                <input style={inp} value={form.brandNiche} onChange={e => set("brandNiche", e.target.value)} placeholder="e.g. Project management app for teams" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>DEAL TYPE</label>
                  <select style={inp} value={form.dealType} onChange={e => set("dealType", e.target.value)}>
                    {DEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>PLATFORM</label>
                  <select style={inp} value={form.platform} onChange={e => set("platform", e.target.value)}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Creator info */}
          <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1035", marginBottom: 16 }}>👤 Your Info</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={lbl}>YOUR NICHE</label>
                <select style={inp} value={form.creatorNiche} onChange={e => set("creatorNiche", e.target.value)}>
                  {NICHES.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>FOLLOWERS</label>
                  <input style={inp} value={form.followers} onChange={e => set("followers", e.target.value)} placeholder="e.g. 85K" />
                </div>
                <div>
                  <label style={lbl}>ENGAGEMENT RATE</label>
                  <input style={inp} value={form.engagementRate} onChange={e => set("engagementRate", e.target.value)} placeholder="e.g. 4.2%" />
                </div>
              </div>
              <div>
                <label style={lbl}>YOUR RATE (optional — leave blank to not mention in pitch)</label>
                <input style={inp} type="number" value={form.rate} onChange={e => set("rate", e.target.value)} placeholder="e.g. 1500" />
              </div>
              <div>
                <label style={lbl}>YOUR UNIQUE ANGLE (what makes you different)</label>
                <input style={inp} value={form.uniqueAngle} onChange={e => set("uniqueAngle", e.target.value)} placeholder="e.g. My audience is 80% developers who buy SaaS tools" />
              </div>
              <div>
                <label style={lbl}>PAST BRAND COLLABS (optional — builds credibility)</label>
                <input style={inp} value={form.pastBrands} onChange={e => set("pastBrands", e.target.value)} placeholder="e.g. Notion, Raycast, Linear" />
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !form.brandName.trim()}
            style={{ padding: "14px 0", borderRadius: 12, border: "none", background: (loading || !form.brandName.trim()) ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: (loading || !form.brandName.trim()) ? "not-allowed" : "pointer" }}
          >
            {loading ? "🎯 Generating pitches…" : "✨ Generate pitches"}
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

            {/* AI recommendation */}
            <div style={{ background: "#F3F0FF", border: "1px solid #C9C2F7", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 12 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#5B4BD8", marginBottom: 4 }}>Best format for {form.brandName}</div>
                <div style={{ fontSize: 13, color: "#4C1D95", lineHeight: 1.6 }}>{result.bestFormatReason}</div>
                <div style={{ fontSize: 12, color: "#7B6EE8", marginTop: 6 }}>📅 Follow-up: {result.followUpTiming}</div>
              </div>
            </div>

            {/* Pitch options */}
            {result.pitches?.map(pitch => (
              <PitchCard
                key={pitch.format}
                pitch={pitch}
                isSelected={selected?.format === pitch.format}
                onSelect={setSelected}
              />
            ))}

            {/* Talking points */}
            {result.talkingPoints?.length > 0 && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", marginBottom: 10 }}>💡 Key talking points for follow-up</div>
                {result.talkingPoints.map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#1E40AF", padding: "5px 0", display: "flex", gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>{i + 1}.</span> {p}
                  </div>
                ))}
              </div>
            )}

            {/* Do nots */}
            {result.doNots?.length > 0 && (
              <div style={{ background: "#FFF0F0", border: "1px solid #FCA5A5", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#B91C1C", marginBottom: 10 }}>🚫 Don't say this to {form.brandName}</div>
                {result.doNots.map((d, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#991B1B", padding: "5px 0", display: "flex", gap: 8 }}>
                    <span>•</span> {d}
                  </div>
                ))}
              </div>
            )}

            {/* Add to pipeline */}
            <div style={{ background: "#fff", border: "1px solid #E8E6F0", borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1035", marginBottom: 6 }}>
                Ready to reach out?
              </div>
              <div style={{ fontSize: 13, color: "#9B96B8", marginBottom: 12 }}>
                Add {form.brandName} to your pipeline to track this outreach.
              </div>
              <button
                onClick={handleAddToPipeline}
                disabled={adding}
                style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: adding ? "#C4C0D8" : "linear-gradient(135deg,#7B6EE8,#5B4BD8)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: adding ? "not-allowed" : "pointer" }}
              >
                {adding ? "Adding…" : `➕ Add ${form.brandName} to pipeline`}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
