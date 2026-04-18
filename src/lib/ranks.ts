export interface RankTier {
  level: number;
  name: string;
  minXp: number;
  maxXp: number | null;
}

export const RANKS: RankTier[] = [
  { level: 1, name: "Mag-aaral I", minXp: 0, maxXp: 199 },
  { level: 2, name: "Mag-aaral II", minXp: 200, maxXp: 499 },
  { level: 3, name: "Dalubhasa I", minXp: 500, maxXp: 999 },
  { level: 4, name: "Dalubhasa II", minXp: 1000, maxXp: 1999 },
  { level: 5, name: "Bayani", minXp: 2000, maxXp: null },
];

/**
 * Returns the corresponding gamification rank based on a user's XP.
 */
export function getRank(xp: number): RankTier {
  // Find the highest rank where the minimum XP has been met
  const currentRank = [...RANKS].reverse().find((rank) => xp >= rank.minXp);
  // Fallback to the lowest rank if something goes wrong
  return currentRank || RANKS[0];
}