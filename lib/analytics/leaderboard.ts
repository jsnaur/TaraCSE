// ============================================================================
// Server-only leaderboard data layer.
//
// The leaderboard is the one place the app needs cross-user data. Direct reads
// of other users' profiles are (correctly) blocked by RLS, so this goes through
// the SECURITY DEFINER functions get_leaderboard() / get_my_rank(), which
// expose ONLY username + derived XP. See 0005_leaderboard_functions.sql.
// ============================================================================

import "server-only";
import { getRank } from "@/lib/ranks";
import { getAuthedContext } from "./server";
import type { LeaderboardData, LeaderboardEntry } from "./types";

interface LeaderboardRow {
  user_id: string;
  username: string;
  xp: number | string;
  correct_count: number | string;
  session_count: number | string;
  rank: number | string;
}

interface MyRankRow {
  rank: number | string;
  xp: number | string;
  total_users: number | string;
  username: string;
}

/**
 * Fetches the global XP leaderboard: the top `limit` users plus the caller's
 * own standing (synthesised from get_my_rank() when they fall outside the
 * visible window). Returns null when unauthenticated.
 */
export async function getLeaderboard(limit = 50): Promise<LeaderboardData | null> {
  const ctx = await getAuthedContext();
  if (!ctx) return null;
  const { client, userId } = ctx;

  const [boardRes, myRankRes] = await Promise.all([
    client.rpc("get_leaderboard", { p_limit: limit }),
    client.rpc("get_my_rank"),
  ]);

  if (boardRes.error) throw new Error(boardRes.error.message);

  const rows = (boardRes.data ?? []) as LeaderboardRow[];
  const entries: LeaderboardEntry[] = rows.map((r) => {
    const xp = Number(r.xp);
    return {
      userId: r.user_id,
      username: r.username,
      xp,
      rankName: getRank(xp).name,
      position: Number(r.rank),
      isCurrentUser: r.user_id === userId,
    };
  });

  // get_my_rank() returns a single-row table.
  const myRow = (
    Array.isArray(myRankRes.data) ? myRankRes.data[0] : myRankRes.data
  ) as MyRankRow | undefined;

  let currentUser = entries.find((e) => e.isCurrentUser) ?? null;
  let totalUsers = entries.length;

  if (myRow) {
    totalUsers = Number(myRow.total_users);
    // Caller ranked below the visible window — build their row explicitly so
    // the UI can always show "Your Standing".
    if (!currentUser) {
      const xp = Number(myRow.xp);
      currentUser = {
        userId,
        username: myRow.username,
        xp,
        rankName: getRank(xp).name,
        position: Number(myRow.rank),
        isCurrentUser: true,
      };
    }
  }

  return { entries, currentUser, totalUsers };
}

/**
 * Returns the caller's leaderboard percentile (0-100, lower is better) — used
 * by the "Top Gun" achievement. null when unauthenticated or no users exist.
 */
export async function getMyLeaderboardPercentile(): Promise<number | null> {
  const ctx = await getAuthedContext();
  if (!ctx) return null;

  const { data, error } = await ctx.client.rpc("get_my_rank");
  if (error) return null;

  const row = (Array.isArray(data) ? data[0] : data) as MyRankRow | undefined;
  if (!row) return null;

  const total = Number(row.total_users);
  if (total <= 0) return null;

  return Math.round((Number(row.rank) / total) * 100);
}
