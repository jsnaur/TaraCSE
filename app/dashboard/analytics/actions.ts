"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getAuthedClient() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) return { client: null, user: null };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser(accessToken);
  if (!user) return { client: null, user: null };

  return { client: supabase, user };
}

function computeStreak(completedDates: string[]): number {
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

// Build a map of session_id → { total, correct } from response rows
function buildSessionScoreMap(
  responses: { session_id: string | null; is_correct: boolean }[]
): Map<string, { total: number; correct: number }> {
  const map = new Map<string, { total: number; correct: number }>();
  for (const r of responses) {
    if (!r.session_id) continue;
    const s = map.get(r.session_id) ?? { total: 0, correct: 0 };
    s.total++;
    if (r.is_correct) s.correct++;
    map.set(r.session_id, s);
  }
  return map;
}

export interface CategoryStat {
  category: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface RecentSession {
  id: string;
  mode: string;
  level: string;
  // From exam_sessions — may be null for practice sessions
  score: number | null;
  total_questions: number | null;
  time_spent_seconds: number | null;
  completed_at: string;
  // Computed from user_responses — always available when questions were answered
  computed_score_pct: number | null;
  computed_total: number;
}

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

export async function getAnalyticsData(): Promise<{
  data: AnalyticsData | null;
  error: string | null;
}> {
  const { client: supabase, user } = await getAuthedClient();
  if (!supabase || !user) return { data: null, error: "Not authenticated" };

  const ninetyDaysAgo = new Date(Date.now() - 90 * 864e5).toISOString();

  const [responsesRes, sessionsRes, streakRes] = await Promise.all([
    // Include session_id so we can compute per-session scores
    supabase
      .from("user_responses")
      .select("session_id, category, is_correct")
      .eq("user_id", user.id),
    supabase
      .from("exam_sessions")
      .select("id, mode, level, score, total_questions, time_spent_seconds, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(10),
    supabase
      .from("exam_sessions")
      .select("completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", ninetyDaysAgo),
  ]);

  if (responsesRes.error) return { data: null, error: responsesRes.error.message };
  if (sessionsRes.error) return { data: null, error: sessionsRes.error.message };

  const responses = responsesRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const streakDates = (streakRes.data ?? []).map(
    (s: { completed_at: string }) => s.completed_at.split("T")[0]
  );

  // Overall totals
  const totalAnswered = responses.length;
  const totalCorrect = responses.filter((r) => r.is_correct).length;
  const overallAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Category stats
  const catMap = new Map<string, { total: number; correct: number }>();
  for (const r of responses) {
    const s = catMap.get(r.category) ?? { total: 0, correct: 0 };
    s.total++;
    if (r.is_correct) s.correct++;
    catMap.set(r.category, s);
  }
  const categoryStats: CategoryStat[] = Array.from(catMap.entries())
    .map(([category, s]) => ({
      category,
      total: s.total,
      correct: s.correct,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  // Per-session scores derived from user_responses (fallback when exam_sessions.score is null)
  const sessionScoreMap = buildSessionScoreMap(responses);

  // Enrich each session with computed score
  const recentSessions: RecentSession[] = sessions.map((s) => {
    const computed = sessionScoreMap.get(s.id);
    const computed_score_pct =
      computed && computed.total > 0
        ? Math.round((computed.correct / computed.total) * 100)
        : null;
    return {
      ...s,
      computed_score_pct,
      computed_total: computed?.total ?? 0,
    };
  });

  // Average session score — prefer computed when exam_sessions.score is missing
  const sessionCount = recentSessions.length;
  const totalTimeSeconds = sessions.reduce(
    (acc, s) => acc + (s.time_spent_seconds ?? 0),
    0
  );
  const scoredSessions = recentSessions.filter(
    (s) => s.computed_score_pct !== null
  );
  const averageScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((acc, s) => acc + s.computed_score_pct!, 0) /
            scoredSessions.length
        )
      : 0;

  return {
    data: {
      totalAnswered,
      totalCorrect,
      overallAccuracy,
      totalTimeSeconds,
      sessionCount,
      averageScore,
      categoryStats,
      streak: computeStreak(streakDates),
      recentSessions,
    },
    error: null,
  };
}

export interface DashboardStats {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  streak: number;
  categoryStats: CategoryStat[];
  recentSessions: RecentSession[];
}

export async function getDashboardStats(): Promise<{
  data: DashboardStats | null;
  error: string | null;
}> {
  const { client: supabase, user } = await getAuthedClient();
  if (!supabase || !user) return { data: null, error: "Not authenticated" };

  const ninetyDaysAgo = new Date(Date.now() - 90 * 864e5).toISOString();

  const [responsesRes, recentRes, streakRes] = await Promise.all([
    supabase
      .from("user_responses")
      .select("session_id, category, is_correct")
      .eq("user_id", user.id),
    supabase
      .from("exam_sessions")
      .select("id, mode, level, score, total_questions, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(3),
    supabase
      .from("exam_sessions")
      .select("completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", ninetyDaysAgo),
  ]);

  const responses = responsesRes.data ?? [];
  const rawSessions = recentRes.data ?? [];
  const streakDates = (streakRes.data ?? []).map(
    (s: { completed_at: string }) => s.completed_at.split("T")[0]
  );

  const totalAnswered = responses.length;
  const totalCorrect = responses.filter((r) => r.is_correct).length;
  const overallAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const catMap = new Map<string, { total: number; correct: number }>();
  for (const r of responses) {
    const s = catMap.get(r.category) ?? { total: 0, correct: 0 };
    s.total++;
    if (r.is_correct) s.correct++;
    catMap.set(r.category, s);
  }
  const categoryStats: CategoryStat[] = Array.from(catMap.entries()).map(
    ([category, s]) => ({
      category,
      total: s.total,
      correct: s.correct,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    })
  );

  const sessionScoreMap = buildSessionScoreMap(responses);

  const recentSessions: RecentSession[] = rawSessions.map((s) => {
    const computed = sessionScoreMap.get(s.id);
    const computed_score_pct =
      computed && computed.total > 0
        ? Math.round((computed.correct / computed.total) * 100)
        : null;
    return {
      ...s,
      time_spent_seconds: null,
      computed_score_pct,
      computed_total: computed?.total ?? 0,
    };
  });

  return {
    data: {
      totalAnswered,
      totalCorrect,
      overallAccuracy,
      streak: computeStreak(streakDates),
      categoryStats,
      recentSessions,
    },
    error: null,
  };
}
