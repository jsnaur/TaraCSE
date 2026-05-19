// ============================================================================
// Achievement catalogue + evaluator.
//
// Achievements are DERIVED, not stored: each definition carries an `evaluate`
// predicate that runs against a user's live stats. Adding an achievement means
// adding one entry here — no migration, no trigger, nothing for a client to
// fake. Every achievement below is computable from real data the app records.
// ============================================================================

import type { CategoryStat } from "./types";

export type AchievementCategory =
  | "Milestone"
  | "Mastery"
  | "Dedication"
  | "Consistency"
  | "Competition";

/** How a progress value should be rendered (count vs. yes/no vs. time). */
export type AchievementUnit = "count" | "boolean" | "duration";

/** Everything the evaluator needs to grade every achievement. */
export interface AchievementContext {
  sessionCount: number;
  mockCount: number;
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  streak: number;
  totalTimeSeconds: number;
  hadPerfectSession: boolean;
  hadNightOwlSession: boolean;
  categoryStats: CategoryStat[];
  /** Caller's leaderboard percentile, 0-100, lower is better. null if unknown. */
  leaderboardPercentile: number | null;
}

interface RawProgress {
  progress: number;
  total: number;
}

export interface AchievementDef {
  id: number;
  iconName: string; // lucide-react icon name, mapped to a component in the UI
  title: string;
  description: string;
  lore: string;
  category: AchievementCategory;
  xp: number;
  requirement: string;
  unit: AchievementUnit;
  evaluate: (ctx: AchievementContext) => RawProgress;
}

/** An achievement definition graded against a concrete user. */
export interface EvaluatedAchievement {
  id: number;
  iconName: string;
  title: string;
  description: string;
  lore: string;
  category: AchievementCategory;
  xp: number;
  requirement: string;
  unit: AchievementUnit;
  progress: number;
  total: number;
  pct: number; // 0-100
  unlocked: boolean;
}

// ── Small helpers ────────────────────────────────────────────────────────────
function categoryStat(ctx: AchievementContext, name: string): CategoryStat | undefined {
  return ctx.categoryStats.find((c) => c.category === name);
}

function bool(value: boolean): RawProgress {
  return { progress: value ? 1 : 0, total: 1 };
}

const THREE_HOURS_SECONDS = 3 * 60 * 60;
const SUBJECT_AREAS = [
  "Verbal Ability",
  "Numerical Ability",
  "Analytical Ability",
  "General Information",
  "Clerical Operations",
];

// ── Catalogue ────────────────────────────────────────────────────────────────
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 1,
    iconName: "Swords",
    title: "First Blood",
    description: "Complete your first practice or mock session.",
    lore: "Every Civil Servant begins their journey with a single step — and a single test. You've drawn first blood in the battle for excellence.",
    category: "Milestone",
    xp: 50,
    requirement: "Complete 1 session",
    unit: "count",
    evaluate: (c) => ({ progress: Math.min(c.sessionCount, 1), total: 1 }),
  },
  {
    id: 2,
    iconName: "Brain",
    title: "Math Wizard",
    description: "Reach 90%+ accuracy in Numerical Ability (min. 10 answered).",
    lore: "Numbers bow to your will. Where others see chaos in figures and formulas, you see order and patterns.",
    category: "Mastery",
    xp: 200,
    requirement: "90%+ in Numerical Ability over at least 10 questions",
    unit: "boolean",
    evaluate: (c) => {
      const s = categoryStat(c, "Numerical Ability");
      return bool(!!s && s.total >= 10 && s.accuracy >= 90);
    },
  },
  {
    id: 3,
    iconName: "Moon",
    title: "Night Owl",
    description: "Finish a review session between midnight and 5 AM.",
    lore: "While others slept, you studied. In the quiet hours between dusk and dawn, you sharpened your mind against the grindstone of knowledge.",
    category: "Dedication",
    xp: 75,
    requirement: "Complete a session after 12:00 AM (Manila time)",
    unit: "boolean",
    evaluate: (c) => bool(c.hadNightOwlSession),
  },
  {
    id: 4,
    iconName: "Clock",
    title: "Marathoner",
    description: "Accumulate 3 hours of total review time.",
    lore: "The mind is a muscle, and you have pushed it past the point of comfort — into the realm where champions are forged.",
    category: "Dedication",
    xp: 150,
    requirement: "Log 3 hours of total active review time",
    unit: "duration",
    evaluate: (c) => ({
      progress: Math.min(c.totalTimeSeconds, THREE_HOURS_SECONDS),
      total: THREE_HOURS_SECONDS,
    }),
  },
  {
    id: 5,
    iconName: "Target",
    title: "Perfect Score",
    description: "Score 100% on any completed session.",
    lore: "Perfection. Not a near-miss, not 99% — a flawless, unblemished score. Excellence isn't your goal; it is your standard.",
    category: "Mastery",
    xp: 500,
    requirement: "Finish a session with every answer correct",
    unit: "boolean",
    evaluate: (c) => bool(c.hadPerfectSession),
  },
  {
    id: 6,
    iconName: "Flame",
    title: "On Fire",
    description: "Maintain a 7-day study streak.",
    lore: "Seven days. Seven sunrises faced with resolve. Your streak burns like a signal fire that tells the world you do not give up.",
    category: "Consistency",
    xp: 300,
    requirement: "Practice 7 days in a row",
    unit: "count",
    evaluate: (c) => ({ progress: Math.min(c.streak, 7), total: 7 }),
  },
  {
    id: 7,
    iconName: "BookOpen",
    title: "Centurion",
    description: "Answer 100 questions across all subject areas.",
    lore: "One hundred questions met head-on. Volume builds instinct, and instinct is what carries you through the examination hall.",
    category: "Milestone",
    xp: 250,
    requirement: "Answer 100 questions total",
    unit: "count",
    evaluate: (c) => ({ progress: Math.min(c.totalAnswered, 100), total: 100 }),
  },
  {
    id: 8,
    iconName: "Calculator",
    title: "Analytical Engine",
    description: "Answer 500 Analytical Ability questions.",
    lore: "Logic is the skeleton of the mind. Five hundred moments of structured thought have built a mind that can dissect any problem.",
    category: "Mastery",
    xp: 400,
    requirement: "Answer 500 Analytical Ability questions",
    unit: "count",
    evaluate: (c) => ({
      progress: Math.min(categoryStat(c, "Analytical Ability")?.total ?? 0, 500),
      total: 500,
    }),
  },
  {
    id: 9,
    iconName: "Trophy",
    title: "Top Gun",
    description: "Rank in the top 5% of the global leaderboard.",
    lore: "Competition sharpens the blade. To sit atop the leaderboard is to prove your preparation was not just sufficient, but exceptional.",
    category: "Competition",
    xp: 600,
    requirement: "Reach the top 5% by XP",
    unit: "boolean",
    evaluate: (c) =>
      bool(c.leaderboardPercentile !== null && c.leaderboardPercentile <= 5),
  },
  {
    id: 10,
    iconName: "Shield",
    title: "Fortress of Knowledge",
    description: "Complete 5 full mock exams.",
    lore: "Five times you have sat down, cleared your mind, and faced the full breadth of the exam. Your mind is now a fortress.",
    category: "Milestone",
    xp: 350,
    requirement: "Complete 5 mock exams",
    unit: "count",
    evaluate: (c) => ({ progress: Math.min(c.mockCount, 5), total: 5 }),
  },
  {
    id: 11,
    iconName: "Crosshair",
    title: "Sharpshooter",
    description: "Hold 80%+ overall accuracy (min. 20 answered).",
    lore: "Precision under pressure. A high average is not luck — it is the quiet evidence of a mind that has been trained well.",
    category: "Mastery",
    xp: 300,
    requirement: "Keep overall accuracy at 80%+ over at least 20 questions",
    unit: "boolean",
    evaluate: (c) => bool(c.totalAnswered >= 20 && c.overallAccuracy >= 80),
  },
  {
    id: 12,
    iconName: "Sparkles",
    title: "Renaissance Reviewer",
    description: "Reach 80%+ accuracy in every subject area you've practised.",
    lore: "The true civil servant is a generalist — versed in numbers, words, logic, and law alike. To conquer every pillar is to become unstoppable.",
    category: "Mastery",
    xp: 750,
    requirement: "Score 80%+ in all 4 of your subject areas",
    unit: "count",
    evaluate: (c) => {
      const practised = c.categoryStats.filter(
        (s) => SUBJECT_AREAS.includes(s.category) && s.total >= 5
      );
      const mastered = practised.filter((s) => s.accuracy >= 80).length;
      // Total is fixed at 4 (the CSE subject count) so the bar reflects a real
      // goal even before the user has touched all four areas.
      return { progress: Math.min(mastered, 4), total: 4 };
    },
  },
];

/** Grades the whole catalogue against one user's stats. */
export function evaluateAchievements(ctx: AchievementContext): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map((def) => {
    const { evaluate, ...rest } = def;
    const { progress, total } = evaluate(ctx);
    const pct = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;
    return { ...rest, progress, total, pct, unlocked: progress >= total };
  });
}

/** Sum of XP from every unlocked achievement (a bonus on top of activity XP). */
export function achievementBonusXp(evaluated: EvaluatedAchievement[]): number {
  return evaluated
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.xp, 0);
}
