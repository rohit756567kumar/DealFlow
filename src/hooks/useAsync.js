// src/hooks/useAsync.js
// ─────────────────────────────────────────────────────────────────────────────
// Generic hook for any one-off async action (form submit, button click, etc.)
// that needs loading + error state without a full data-fetching hook.
//
// Usage:
//   const { run, loading, error } = useAsync();
//   await run(() => createDeal(form));
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";

/**
 * useAsync()
 *
 * Returns:
 *   run     — (asyncFn) => Promise<result | undefined>
 *   loading — boolean
 *   error   — string | null
 *   clear   — () => void  (clears the error)
 */
export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      return await asyncFn();
    } catch (e) {
      setError(e.message ?? "Something went wrong");
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setError(null), []);

  return { run, loading, error, clear };
}
