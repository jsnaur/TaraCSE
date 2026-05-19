"use server";

// ============================================================================
// Analytics server actions.
//
// These are thin projections over the shared analytics layer (lib/analytics).
// All aggregation lives in lib/analytics/server.ts — these actions only shape
// the snapshot for a specific screen and keep their long-standing return
// signatures so existing callers (analytics page, dashboard page) are stable.
// ============================================================================

import { getUserStats } from "@/lib/analytics/server";
import type { AnalyticsData, DashboardStats } from "./types";

/** Full analytics snapshot for the Analytics page. */
export async function getAnalyticsData(): Promise<{
  data: AnalyticsData | null;
  error: string | null;
}> {
  try {
    const stats = await getUserStats();
    if (!stats) return { data: null, error: "Not authenticated" };

    return {
      data: {
        totalAnswered: stats.totalAnswered,
        totalCorrect: stats.totalCorrect,
        overallAccuracy: stats.overallAccuracy,
        totalTimeSeconds: stats.totalTimeSeconds,
        sessionCount: stats.sessionCount,
        averageScore: stats.averageScore,
        categoryStats: stats.categoryStats,
        streak: stats.streak,
        recentSessions: stats.recentSessions,
      },
      error: null,
    };
  } catch (err) {
    console.error("getAnalyticsData failed:", err);
    return { data: null, error: "Could not load analytics." };
  }
}

/** Condensed snapshot for the Dashboard landing page. */
export async function getDashboardStats(): Promise<{
  data: DashboardStats | null;
  error: string | null;
}> {
  try {
    const stats = await getUserStats();
    if (!stats) return { data: null, error: "Not authenticated" };

    return {
      data: {
        totalAnswered: stats.totalAnswered,
        totalCorrect: stats.totalCorrect,
        overallAccuracy: stats.overallAccuracy,
        streak: stats.streak,
        categoryStats: stats.categoryStats,
        recentSessions: stats.recentSessions.slice(0, 3),
      },
      error: null,
    };
  } catch (err) {
    console.error("getDashboardStats failed:", err);
    return { data: null, error: "Could not load dashboard stats." };
  }
}
