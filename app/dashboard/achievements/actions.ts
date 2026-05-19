"use server";

// ============================================================================
// Achievements server action.
//
// Achievements are evaluated live against the user's derived stats — nothing
// is stored, so the catalogue and a user's progress can never drift apart.
// ============================================================================

import { getUserStats } from "@/lib/analytics/server";
import { getMyLeaderboardPercentile } from "@/lib/analytics/leaderboard";
import { evaluateAchievements } from "@/lib/analytics/achievements";
import type { AchievementsData } from "./types";

/** Evaluated achievement catalogue + rank summary for the Achievements page. */
export async function getAchievementsData(): Promise<{
  data: AchievementsData | null;
  error: string | null;
}> {
  try {
    const stats = await getUserStats();
    if (!stats) return { data: null, error: "Not authenticated" };

    // Percentile is only needed for the "Top Gun" achievement; a failed read
    // simply leaves that one locked rather than breaking the page.
    const leaderboardPercentile = await getMyLeaderboardPercentile();

    const achievements = evaluateAchievements({
      sessionCount: stats.sessionCount,
      mockCount: stats.mockCount,
      totalAnswered: stats.totalAnswered,
      totalCorrect: stats.totalCorrect,
      overallAccuracy: stats.overallAccuracy,
      streak: stats.streak,
      totalTimeSeconds: stats.totalTimeSeconds,
      hadPerfectSession: stats.hadPerfectSession,
      hadNightOwlSession: stats.hadNightOwlSession,
      categoryStats: stats.categoryStats,
      leaderboardPercentile,
    });

    return {
      data: {
        username: stats.username,
        xp: stats.xp,
        rank: stats.rank,
        streak: stats.streak,
        achievements,
        unlockedCount: achievements.filter((a) => a.unlocked).length,
        inProgressCount: achievements.filter((a) => !a.unlocked && a.progress > 0).length,
      },
      error: null,
    };
  } catch (err) {
    console.error("getAchievementsData failed:", err);
    return { data: null, error: "Could not load achievements." };
  }
}
