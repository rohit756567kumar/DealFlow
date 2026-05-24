// src/hooks/useDeals.js
// ─────────────────────────────────────────────────────────────────────────────
// Everything the pipeline board needs:
//   deals, loading, error, and all mutating actions.
//
// Optimistic updates: UI changes instantly; API confirms in background.
// On API failure the state reverts and an error is surfaced.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  moveDealStage,
  sendNudge,
  STAGE_LABELS,
} from "../services/dealService.js";

/**
 * useDeals(filters?)
 *
 * filters: { stage?, platform? }
 *
 * Returns:
 *   deals       — Deal[]
 *   loading     — boolean
 *   error       — string | null
 *   refetch     — () => void
 *   addDeal     — (form) => Promise<Deal>
 *   editDeal    — (id, form) => Promise<Deal>
 *   removeDeal  — (id) => Promise<void>
 *   moveDeal    — (id, direction: +1 | -1) => Promise<void>
 *   nudgeDeal   — (id, message?) => Promise<void>
 */
export function useDeals(filters = {}) {
  const [deals,   setDeals]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchDeals = useCallback(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDeals(filters);
        setDeals(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.stage, filters.platform]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  // ── Add ──────────────────────────────────────────────────────────────────
  const addDeal = useCallback(async (form) => {
    const created = await createDeal(form);
    setDeals(ds => [created, ...ds]);
    return created;
  }, []);

  // ── Edit ─────────────────────────────────────────────────────────────────
  const editDeal = useCallback(async (id, form) => {
    const updated = await updateDeal(id, form);
    setDeals(ds => ds.map(d => d.id === id ? updated : d));
    return updated;
  }, []);

  // ── Remove (optimistic) ──────────────────────────────────────────────────
  const removeDeal = useCallback(async (id) => {
    const backup = deals.find(d => d.id === id);
    setDeals(ds => ds.filter(d => d.id !== id));
    try {
      await deleteDeal(id);
    } catch (e) {
      if (backup) setDeals(ds => [...ds, backup]);
      throw e;
    }
  }, [deals]);

  // ── Move stage (optimistic) ──────────────────────────────────────────────
  const moveDeal = useCallback(async (id, direction) => {
    const deal = deals.find(d => d.id === id);
    if (!deal) return;

    const currentIdx  = STAGE_LABELS.indexOf(deal.stage);
    const nextIdx     = currentIdx + direction;
    if (nextIdx < 0 || nextIdx >= STAGE_LABELS.length) return;

    const nextStage = STAGE_LABELS[nextIdx];

    // Optimistic
    setDeals(ds => ds.map(d => d.id === id ? { ...d, stage: nextStage } : d));

    try {
      const updated = await moveDealStage(id, nextStage);
      // Reconcile with server truth
      setDeals(ds => ds.map(d => d.id === id ? updated : d));
    } catch (e) {
      // Revert
      setDeals(ds => ds.map(d => d.id === id ? { ...d, stage: deal.stage } : d));
      setError(e.message);
    }
  }, [deals]);

  // ── Nudge ────────────────────────────────────────────────────────────────
  const nudgeDeal = useCallback(async (id, message = "") => {
    await sendNudge(id, message);
    // Bump updatedAt locally so the deal no longer shows as "silent"
    setDeals(ds => ds.map(d => d.id === id ? { ...d, updatedAt: new Date().toISOString() } : d));
  }, []);

  return {
    deals,
    loading,
    error,
    refetch:    fetchDeals,
    addDeal,
    editDeal,
    removeDeal,
    moveDeal,
    nudgeDeal,
  };
}
