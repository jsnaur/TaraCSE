// ============================================================================
// Analytics configuration + pure computation helpers.
//
// Everything here is deterministic and side-effect free, so it can be unit
// tested and imported from any environment (client, server, RPC mirror).
// ============================================================================

import { RANKS, getRank } from "@/lib/ranks";
import type {
  CategoryStat,
  ReadinessResult,
  ReadinessBreakdownItem,
  RankProgress,
} from "./types";

// ── XP economy ───────────────────────────────────────────────────────────────
// IMPORTANT: these two constants are mirrored in the SQL leaderboard functions
// (supabase/migrations/0005_leaderboard_functions.sql). Change both together.
export const XP_PER_CORRECT = 10;
export const XP_PER_SESSION = 20;

/** Derive a user's lifetime XP. No XP is ever stored — it is always computed. */
export function computeXp(totalCorrect: number, sessionCount: number): number {
  return totalCorrect * XP_PER_CORRECT + sessionCount * XP_PER_SESSION;
}

// ── CSE subject weighting ────────────────────────────────────────────────────
// Approximate item distribution of the real Civil Service Exam. Used to weight
// the readiness projection so that a strong-but-minor area cannot mask a weak
// major one.
export const CSE_PASSING_SCORE = 80;

const PROFESSIONAL_WEIGHTS: ReadinessBreakdownItem[] = [
  { area: "Verbal Ability", pct: 0, weight: 30 },
  { area: "Numerical Ability", pct: 0, weight: 25 },
  { area: "Analytical Ability", pct: 0, weight: 25 },
  { area: "General Information", pct: 0, weight: 20 },
];

const SUBPROFESSIONAL_WEIGHTS: ReadinessBreakdownItem[] = [
  { area: "Verbal Ability", pct: 0, weight: 30 },
  { area: "Numerical Ability", pct: 0, weight: 25 },
  { area: "Clerical Operations", pct: 0, weight: 25 },
  { area: "General Information", pct: 0, weight: 20 },
];

/** Returns the weighted subject template for the given exam category. */
export function weightsForCategory(examCategory: string | null): ReadinessBreakdownItem[] {
  const isSub = (examCategory ?? "").toLowerCase().includes("sub");
  // Clone so callers can never mutate the shared template.
  return (isSub ? SUBPROFESSIONAL_WEIGHTS : PROFESSIONAL_WEIGHTS).map((w) => ({ ...w }));
}

// ── Streak ───────────────────────────────────────────────────────────────────
/**
 * Counts consecutive days (ending today or yesterday) with at least one
 * completed session. Accepts ISO date strings (YYYY-MM-DD).
 */
export function computeStreak(completedDates: string[]): number {
  const unique = [...new Set(completedDates)].sort().reverse();
  if (!unique.length) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const gap = Math.round(
      (new Date(unique[i - 1]).getTime() - new Date(unique[i]).getTime()) / 864e5
    );
    if (gap === 1) streak++;
    else break;
  }
  return streak;
}

// ── Rank progression ─────────────────────────────────────────────────────────
/** Maps an XP value to its rank tier plus progress toward the next tier. */
export function computeRankProgress(xp: number): RankProgress {
  const current = getRank(xp);
  const next = RANKS.find((r) => r.minXp > current.minXp) ?? null;

  const xpIntoRank = xp - current.minXp;
  const bandSize = next ? next.minXp - current.minXp : 0;

  return {
    xp,
    current,
    next,
    xpToNext: next ? Math.max(next.minXp - xp, 0) : 0,
    pct: next && bandSize > 0
      ? Math.min(100, Math.round((xpIntoRank / bandSize) * 100))
      : 100,
  };
}

// ── Readiness projection ─────────────────────────────────────────────────────
function readinessTier(score: number, hasData: boolean): { label: string; verdict: string } {
  if (!hasData) {
    return {
      label: "Not Started",
      verdict: "Complete a few practice sessions to unlock your readiness score.",
    };
  }
  if (score >= CSE_PASSING_SCORE) {
    return {
      label: "Exam Ready",
      verdict: "You're tracking above the CSE passing mark. Keep your edge sharp before exam day.",
    };
  }
  if (score >= 60) {
    return {
      label: "Developing",
      verdict: "You're making progress, but key areas need reinforcement before exam day.",
    };
  }
  if (score >= 40) {
    return {
      label: "Building Up",
      verdict: "Foundations are forming. Focus your reps on your weakest subject areas.",
    };
  }
  return {
    label: "Getting Started",
    verdict: "Early days. Consistent daily practice is what moves this number.",
  };
}

/**
 * Projects an exam-readiness score by weighting per-category accuracy against
 * the CSE item distribution. Categories with no attempts count as 0% — an
 * untouched subject genuinely lowers readiness.
 */
export function computeReadiness(
  categoryStats: CategoryStat[],
  examCategory: string | null
): ReadinessResult {
  const accuracyByCategory = new Map(
    categoryStats.map((c) => [c.category, c.accuracy])
  );

  const breakdown: ReadinessBreakdownItem[] = weightsForCategory(examCategory).map(
    (w) => ({ ...w, pct: accuracyByCategory.get(w.area) ?? 0 })
  );

  const totalWeight = breakdown.reduce((sum, b) => sum + b.weight, 0);
  const weightedScore = breakdown.reduce((sum, b) => sum + b.pct * b.weight, 0);
  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  const hasData = categoryStats.some((c) => c.total > 0);
  const tier = readinessTier(score, hasData);

  return {
    score,
    label: tier.label,
    verdict: tier.verdict,
    breakdown,
    hasData,
    pointsToPassing: Math.max(CSE_PASSING_SCORE - score, 0),
  };
}
