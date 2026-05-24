// src/services/groqService.js
// ─────────────────────────────────────────────────────────────────────────────
// Groq API client — free, fast, Llama 3.1 70B
// Used for all AI features: deal analysis, contract review, nudge writing
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

/**
 * Call Groq API with a system prompt + user message.
 * Returns the text response as a string.
 */
export async function groqChat({ system, user, temperature = 0.3, maxTokens = 1500 }) {
  if (!GROQ_API_KEY) {
    throw new Error("VITE_GROQ_API_KEY is not set in your .env file.");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      model:       MODEL,
      temperature,
      max_tokens:  maxTokens,
      messages: [
        { role: "system",    content: system },
        { role: "user",      content: user   },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Groq API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Parse JSON from AI response safely.
 * Strips markdown code fences if present.
 */
export function parseJsonResponse(text) {
  const cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/gi, "")
    .trim();
  return JSON.parse(cleaned);
}
