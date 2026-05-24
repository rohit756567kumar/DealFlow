// src/hooks/useAnalytics.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetches all analytics data for the dashboard. Each endpoint is fetched
// independently so a single failure doesn't block the rest.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  getSummary,
  getByStage,
  getByPlatform,
  getRevenueTrend,
  getNudgeCandidates,
} from "../services/analyticsService.js";

/**
 * useAnalytics()
 *
 * Returns:
 *   summary          — { total_deals, pipeline_value, avg_deal_size, total_earned, pending_payment, active_deals }
 *   byStage          — [{ stage, count, total }]
 *   byPlatform       — [{ platform, count, total, avg_deal }]
 *   revenueTrend     — [{ month, earned, pipeline }]
 *   nudgeCandidates  — Deal[] with days_silent field
 *   loading          — boolean
 *   error            — string | null
 *   refetch          — () => void
 */
export function useAnalytics() {
  const [summary,         setSummary]         = useState(null);
  const [byStage,         setByStage]         = useState([]);
  const [byPlatform,      setByPlatform]      = useState([]);
  const [revenueTrend,    setRevenueTrend]     = useState([]);
  const [nudgeCandidates, setNudgeCandidates] = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);

  const fetchAll = useCallback(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fire all requests in parallel
        const [sum, stage, platform, trend, nudges] = await Promise.allSettled([
          getSummary(),
          getByStage(),
          getByPlatform(),
          getRevenueTrend(),
          getNudgeCandidates(),
        ]);

        if (sum.status       === "fulfilled") setSummary(sum.value);
        if (stage.status     === "fulfilled") setByStage(stage.value);
        if (platform.status  === "fulfilled") setByPlatform(platform.value);
        if (trend.status     === "fulfilled") setRevenueTrend(trend.value);
        if (nudges.status    === "fulfilled") setNudgeCandidates(nudges.value);

        // Surface first error if any
        const firstFailed = [sum, stage, platform, trend, nudges].find(r => r.status === "rejected");
        if (firstFailed) setError(firstFailed.reason?.message ?? "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    summary,
    byStage,
    byPlatform,
    revenueTrend,
    nudgeCandidates,
    loading,
    error,
    refetch: fetchAll,
  };
}
