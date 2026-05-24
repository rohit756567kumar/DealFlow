// src/hooks/useInvoices.js
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  getInvoices,
  createInvoice,
  markInvoicePaid,
  deleteInvoice,
} from "../services/invoiceService.js";

/**
 * useInvoices()
 *
 * Returns:
 *   invoices      — Invoice[]
 *   loading       — boolean
 *   error         — string | null
 *   refetch       — () => void
 *   addInvoice    — (payload) => Promise<Invoice>
 *   payInvoice    — (id) => Promise<Invoice>
 *   removeInvoice — (id) => Promise<void>
 */
export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchInvoices = useCallback(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        setInvoices(await getInvoices());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const addInvoice = useCallback(async (payload) => {
    const invoice = await createInvoice(payload);
    setInvoices(inv => [invoice, ...inv]);
    return invoice;
  }, []);

  const payInvoice = useCallback(async (id) => {
    const updated = await markInvoicePaid(id);
    setInvoices(inv => inv.map(i => i.id === id ? updated : i));
    return updated;
  }, []);

  const removeInvoice = useCallback(async (id) => {
    const backup = invoices.find(i => i.id === id);
    setInvoices(inv => inv.filter(i => i.id !== id));
    try {
      await deleteInvoice(id);
    } catch (e) {
      if (backup) setInvoices(inv => [...inv, backup]);
      throw e;
    }
  }, [invoices]);

  return { invoices, loading, error, refetch: fetchInvoices, addInvoice, payInvoice, removeInvoice };
}


// src/hooks/useRateCard.js
// ─────────────────────────────────────────────────────────────────────────────

import { getRateCard, addRate, updateRate, deleteRate } from "../services/invoiceService.js";

/**
 * useRateCard()
 *
 * Returns:
 *   rates       — RateEntry[]
 *   loading     — boolean
 *   error       — string | null
 *   refetch     — () => void
 *   addEntry    — (payload) => Promise<RateEntry>
 *   editEntry   — (id, payload) => Promise<RateEntry>
 *   removeEntry — (id) => Promise<void>
 */
export function useRateCard() {
  const [rates,   setRates]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchRates = useCallback(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        setRates(await getRateCard());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const addEntry = useCallback(async (payload) => {
    const entry = await addRate(payload);
    setRates(r => [...r, entry]);
    return entry;
  }, []);

  const editEntry = useCallback(async (id, payload) => {
    const updated = await updateRate(id, payload);
    setRates(r => r.map(e => e.id === id ? updated : e));
    return updated;
  }, []);

  const removeEntry = useCallback(async (id) => {
    const backup = rates.find(r => r.id === id);
    setRates(r => r.filter(e => e.id !== id));
    try {
      await deleteRate(id);
    } catch (e) {
      if (backup) setRates(r => [...r, backup]);
      throw e;
    }
  }, [rates]);

  return { rates, loading, error, refetch: fetchRates, addEntry, editEntry, removeEntry };
}
