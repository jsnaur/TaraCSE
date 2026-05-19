// ============================================================================
// Shared analytics types — the single source of truth for every screen that
// renders user performance data (Dashboard, Analytics, Mock readiness,
// Achievements, Leaderboard, Sidebar).
//
// These are plain interfaces only — safe to import from client or server code.
// ============================================================================

import type { RankTier } from "@/lib/ranks";

/** Per-subject-area performance, aggregated from user_responses. */
export interface CategoryStat {
  category: string;
  total: number;
  correct: number;
  accuracy: number; // 0-100, rounded
}

/** One completed exam/practice session, enriched with a computed score. */
export interface RecentSession {
  id: string;
  mode: string;
  level: string;
  exam_type: string | null;
  // Stored on exam_sessions — may be null for practice sessions.
  score: number | null;
  total_questions: number | null;
  time_spent_seconds: number | null;
  completed_at: string;
  // Derived from user_responses — always available when questions were answered.
  computed_score_pct: number | null;
  computed_total: number;
}

/** One weighted subject row inside an exam-readiness breakdown. */
export interface ReadinessBreakdownItem {
  area: string;
  pct: number;    // accuracy 0-100
  weight: number; // CSE item-distribution weight, percent
}

/** Weighted "exam readiness" projection for the Mock Exams hub. */
export interface ReadinessResult {
  score: number;   // 0-100, weighted across subject areas
  label: string;   // human verdict tier, e.g. "Developing"
  verdict: string; // one-line coaching sentence
  breakdown: ReadinessBreakdownItem[];
  hasData: boolean;
  pointsToPassing: number; // CSE passing score minus `score`, floored at 0
}

/** Gamification standing derived from XP. */
export interface RankProgress {
  xp: number;
  current: RankTier;
  next: RankTier | null;
  xpToNext: number; // XP still needed to reach `next` (0 at max rank)
  pct: number;      // 0-100 progress through the current rank band
}

/**
 * The complete, derived performance snapshot for one user. Every analytics
 * surface is a projection of this object — compute it once, reuse everywhere.
 */
export interface UserStats {
  // Identity
  userId: string;
  username: string;
  examCategory: string | null;
  isPremium: boolean;

  // Volume
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number; // 0-100
  totalTimeSeconds: number;
  sessionCount: number;
  mockCount: number;

  // Scores
  averageScore: number; // 0-100, mean of per-session computed scores

  // Gamification
  xp: number;
  rank: RankProgress;
  streak: number;

  // Behavioural flags (for achievements)
  hadPerfectSession: boolean;
  hadNightOwlSession: boolean;

  // Breakdowns
  categoryStats: CategoryStat[];
  recentSessions: RecentSession[];
  readiness: ReadinessResult;
}

/** One row of the global XP leaderboard. */
export interface LeaderboardEntry {
  userId: string;
  username: string;
  xp: number;
  rankName: string; // gamification tier name for this XP
  position: number; // 1-based leaderboard rank
  isCurrentUser: boolean;
}

/** Leaderboard payload: the top window plus the caller's own standing. */
export interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  totalUsers: number;
}

/** One practice-mode session, summarised for the Practice hub. */
export interface PracticeSessionSummary {
  practiceId: string;      // practice_sessions.id — used by the resume route
  examSessionId: string;   // exam_sessions.id — used by the review route
  categories: string[];    // subject areas chosen for this session
  completed: boolean;      // true once the session was finished & scored
  answered: number;        // questions answered so far
  correct: number;         // of those, how many were correct
  total: number;           // planned item count (never below `answered`)
  accuracy: number | null; // 0-100; null when nothing has been answered
  dateLabel: string;       // pre-formatted Manila-time label, e.g. "Today, 9:42 AM"
  createdAt: string;       // raw ISO timestamp
}
