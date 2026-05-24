// src/services/invoiceService.js
// ─────────────────────────────────────────────────────────────────────────────

import { api } from "./api.js";

/**
 * Fetch all invoices for the current user.
 * Returns Invoice[] (includes deal.brand and deal.platform).
 */
export async function getInvoices() {
  const data = await api.get("/invoices");
  return data.invoices;
}

/**
 * Create an invoice for a deal.
 * Automatically moves the deal to "Invoiced" stage on the backend.
 * { deal_id, amount, due_date?, notes?, currency? }
 */
export async function createInvoice({ dealId, amount, dueDate, notes, currency = "USD" }) {
  const data = await api.post("/invoices", {
    deal_id:  dealId,
    amount,
    due_date: dueDate || null,
    notes:    notes   || null,
    currency,
  });
  return data.invoice;
}

/**
 * Mark an invoice as paid.
 * Also moves the linked deal to "Paid" stage on the backend.
 */
export async function markInvoicePaid(invoiceId) {
  const data = await api.patch(`/invoices/${invoiceId}/mark-paid`, {});
  return data.invoice;
}

/**
 * Delete a draft invoice (cannot delete sent/paid invoices).
 */
export async function deleteInvoice(invoiceId) {
  return api.delete(`/invoices/${invoiceId}`);
}


// src/services/rateCardService.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the current user's full rate card.
 * Returns RateEntry[] — [{ id, platform, deal_type, rate, currency, notes }]
 */
export async function getRateCard() {
  const data = await api.get("/rate-card");
  return data.rates;
}

/**
 * Add a new rate entry.
 * { platform, deal_type, rate, currency?, notes? }
 */
export async function addRate({ platform, dealType, rate, currency = "USD", notes }) {
  const data = await api.post("/rate-card", {
    platform,
    deal_type: dealType,
    rate,
    currency,
    notes: notes || null,
  });
  return data.rate;
}

/**
 * Update an existing rate entry.
 * { rate?, notes? }
 */
export async function updateRate(id, { rate, notes }) {
  const data = await api.patch(`/rate-card/${id}`, { rate, notes });
  return data.rate;
}

/**
 * Remove a rate entry.
 */
export async function deleteRate(id) {
  return api.delete(`/rate-card/${id}`);
}
