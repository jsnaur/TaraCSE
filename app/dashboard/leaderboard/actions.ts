"use server";

// ============================================================================
// Leaderboard server action — projects the shared leaderboard layer for the
// Leaderboard page.
// ============================================================================

import { getLeaderboard } from "@/lib/analytics/leaderboard";
import type { LeaderboardData } from "@/lib/analytics/types";

/** Top XP-ranked users plus the caller's own standing. */
export async function getLeaderboardData(limit = 25): Promise<{
  data: LeaderboardData | null;
  error: string | null;
}> {
  try {
    const data = await getLeaderboard(limit);
    if (!data) return { data: null, error: "Not authenticated" };
    return { data, error: null };
  } catch (err) {
    console.error("getLeaderboardData failed:", err);
    return { data: null, error: "Could not load leaderboard." };
  }
}
