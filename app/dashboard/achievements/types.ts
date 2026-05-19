// ============================================================================
// Screen-shaped achievements view model.
//
// Plain types only — kept out of actions.ts because a "use server" file may
// export nothing but async functions.
// ============================================================================

import type { EvaluatedAchievement } from "@/lib/analytics/achievements";
import type { RankProgress } from "@/lib/analytics/types";

export interface AchievementsData {
  username: string;
  xp: number;
  rank: RankProgress;
  streak: number;
  achievements: EvaluatedAchievement[];
  unlockedCount: number;
  inProgressCount: number;
}
