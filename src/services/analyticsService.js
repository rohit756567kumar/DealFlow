// src/services/analyticsService.js
// ─────────────────────────────────────────────────────────────────────────────
// Analytics API calls. All return plain objects ready to drop into charts.
// ─────────────────────────────────────────────────────────────────────────────

import { api } from "./api.js";

/**
 * Dashboard summary metrics.
 * Returns { total_deals, pipeline_value, avg_deal_size, total_earned, pending_payment, active_deals }
 */
export async function getSummary() {
  const data = await api.get("/analytics/summary");
  return data.summary;
}

/**
 * Deal count + value grouped by pipeline stage.
 * Returns [{ stage, count, total }]
 */
export async function getByStage() {
  const data = await api.get("/analytics/by-stage");
  return data.byStage;
}

/**
 * Deal count + value grouped by platform.
 * Returns [{ platform, count, total, avg_deal }]
 */
export async function getByPlatform() {
  const data = await api.get("/analytics/by-platform");
  return data.byPlatform;
}

/**
 * Monthly earned + pipeline for the last 6 months.
 * Returns [{ month, earned, pipeline }]
 */
export async function getRevenueTrend() {
  const data = await api.get("/analytics/revenue-trend");
  return data.trend;
}

/**
 * Deals silent for 5+ days — the nudge candidates list.
 * Returns Deal[] with extra field `days_silent`.
 */
export async function getNudgeCandidates() {
  const data = await api.get("/analytics/nudge-candidates");
  return data.nudgeCandidates;
}
