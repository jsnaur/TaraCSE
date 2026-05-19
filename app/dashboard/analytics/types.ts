// ============================================================================
// Screen-shaped analytics view models.
//
// These are plain types only. They live OUTSIDE actions.ts because a
// "use server" file may export nothing but async functions — exporting types
// from it makes Next.js' server-action transform emit broken runtime code.
// ============================================================================

import type { CategoryStat, RecentSession } from "@/lib/analytics/types";

export interface AnalyticsData {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  totalTimeSeconds: number;
  sessionCount: number;
  averageScore: number;
  categoryStats: CategoryStat[];
  streak: number;
  recentSessions: RecentSession[];
}

export interface DashboardStats {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  streak: number;
  categoryStats: CategoryStat[];
  recentSessions: RecentSession[];
}
