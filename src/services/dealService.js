// src/services/dealService.js
// ─────────────────────────────────────────────────────────────────────────────
// All deal-related API calls + data normalisation.
// Frontend uses Title Case stages; backend uses snake_case keys.
// This module is the single place that knows about both shapes.
// ─────────────────────────────────────────────────────────────────────────────

import { api } from "./api.js";

// ── Stage mapping ─────────────────────────────────────────────────────────────

export const STAGE_MAP = {
  inbound:       "Inbound",
  negotiating:   "Negotiating",
  contract_sent: "Contract Sent",
  content_live:  "Content Live",
  invoiced:      "Invoiced",
  paid:          "Paid",
};

export const STAGE_KEY_MAP = Object.fromEntries(
  Object.entries(STAGE_MAP).map(([k, v]) => [v, k])
);

export const STAGE_LABELS = Object.values(STAGE_MAP);
export const STAGE_KEYS   = Object.keys(STAGE_MAP);

// ── Normalisers ───────────────────────────────────────────────────────────────

/**
 * Backend deal → frontend deal shape.
 * Use everywhere you receive a deal from the API.
 */
export function normaliseDeal(d) {
  return {
    id:        d.id,
    brand:     d.brand,
    type:      d.deal_type,
    platform:  d.platform,
    amount:    Number(d.amount),
    stage:     STAGE_MAP[d.stage] ?? d.stage,
    dueDate:   d.due_date   ?? "",
    note:      d.note       ?? "",
    brandEmail:   d.brand_email   ?? "",
    brandContact: d.brand_contact ?? "",
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

/**
 * Frontend form shape → backend request body.
 * Use before any POST / PATCH deal call.
 */
export function serialiseDeal(form) {
  return {
    brand:         form.brand,
    deal_type:     form.type,
    platform:      form.platform,
    amount:        Number(form.amount),
    stage:         STAGE_KEY_MAP[form.stage] ?? "inbound",
    due_date:      form.dueDate       || null,
    note:          form.note          || null,
    brand_email:   form.brandEmail    || null,
    brand_contact: form.brandContact  || null,
  };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetch all deals for the current user.
 * Optionally filter: { stage, platform }
 * Returns Deal[].
 */
export async function getDeals(filters = {}) {
  const params = new URLSearchParams();
  if (filters.stage)    params.set("stage",    STAGE_KEY_MAP[filters.stage] ?? filters.stage);
  if (filters.platform) params.set("platform", filters.platform);
  const qs   = params.toString();
  const data = await api.get(`/deals${qs ? `?${qs}` : ""}`);
  return data.deals.map(normaliseDeal);
}

/**
 * Fetch a single deal by id.
 * Returns Deal.
 */
export async function getDeal(id) {
  const data = await api.get(`/deals/${id}`);
  return normaliseDeal(data.deal);
}

/**
 * Create a new deal.
 * Accepts frontend form shape. Returns created Deal.
 */
export async function createDeal(form) {
  const data = await api.post("/deals", serialiseDeal(form));
  return normaliseDeal(data.deal);
}

/**
 * Update an existing deal.
 * Accepts partial frontend form shape. Returns updated Deal.
 */
export async function updateDeal(id, form) {
  const data = await api.patch(`/deals/${id}`, serialiseDeal(form));
  return normaliseDeal(data.deal);
}

/**
 * Move a deal to a new stage.
 * Accepts a frontend stage label e.g. "Contract Sent".
 * Returns updated Deal.
 */
export async function moveDealStage(id, stageLabel) {
  const stageKey = STAGE_KEY_MAP[stageLabel];
  if (!stageKey) throw new Error(`Unknown stage: ${stageLabel}`);
  const data = await api.patch(`/deals/${id}/stage`, { stage: stageKey });
  return normaliseDeal(data.deal);
}

/**
 * Delete a deal by id.
 */
export async function deleteDeal(id) {
  return api.delete(`/deals/${id}`);
}

/**
 * Log a follow-up nudge for a deal.
 * message is optional — backend provides a default.
 * Returns { nudge }.
 */
export async function sendNudge(dealId, message = "") {
  return api.post(`/deals/${dealId}/nudge`, message ? { message } : {});
}

/**
 * Fetch all nudges logged for a deal.
 * Returns Nudge[].
 */
export async function getDealNudges(dealId) {
  const data = await api.get(`/deals/${dealId}/nudges`);
  return data.nudges;
}
