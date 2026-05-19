// ============================================================================
// Practice hub view model.
//
// Plain types only — kept out of actions.ts because a "use server" file may
// export nothing but async functions.
// ============================================================================

import type { CategoryStat, PracticeSessionSummary } from "@/lib/analytics/types";

export interface PracticeHubData {
  totalAnswered: number;
  overallAccuracy: number; // 0-100
  streak: number;
  xp: number;
  categoryStats: CategoryStat[];
  weakest: CategoryStat | null;   // lowest-accuracy attempted category
  strongest: CategoryStat | null; // highest-accuracy attempted category
  recentSessions: PracticeSessionSummary[];
  passingGap: number; // CSE passing score minus overall accuracy, floored at 0
}
