// ============================================================================
// Server-only analytics data layer.
//
// This module is the ONLY place that reads the raw analytics tables. Every
// screen-specific server action (Dashboard, Analytics, Mock, Achievements,
// Sidebar) calls getUserStats() and projects the result — so the aggregation
// logic lives in exactly one place.
//
// `import "server-only"` guarantees this file can never be bundled into client
// code, keeping the access token and service-role-adjacent logic server-side.
// ============================================================================

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  computeXp,
  computeStreak,
  computeRankProgress,
  computeReadiness,
} from "./config";
import type {
  CategoryStat,
  RecentSession,
  UserStats,
  PracticeSessionSummary,
} from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface AuthedContext {
  client: SupabaseClient;
  userId: string;
}

/**
 * Builds a Supabase client bound to the caller's access token. All reads then
 * run under that user's RLS context — a user can only ever see their own rows.
 * Returns null when there is no valid session.
 */
export async function getAuthedContext(): Promise<AuthedContext | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
  } = await client.auth.getUser(accessToken);
  if (!user) return null;

  return { client, userId: user.id };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

interface ResponseRow {
  session_id: string | null;
  category: string;
  is_correct: boolean;
  time_taken_seconds: number | null;
}

interface SessionRow {
  id: string;
  mode: string;
  level: string;
  score: number | null;
  total_questions: number | null;
  time_spent_seconds: number | null;
  completed_at: string;
  exam_type: string | null;
}

/** Aggregates per-session { total, correct } directly from response rows. */
function buildSessionScoreMap(
  responses: ResponseRow[]
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

/** True if the ISO timestamp falls between 00:00 and 04:59 Manila time. */
function isNightOwl(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const hour = Number(
    d.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      hour12: false,
    })
  );
  return hour >= 0 && hour < 5;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the full derived performance snapshot for the authenticated user.
 * Returns null when unauthenticated; throws only on a hard database error.
 */
export async function getUserStats(): Promise<UserStats | null> {
  const ctx = await getAuthedContext();
  if (!ctx) return null;
  const { client: supabase, userId } = ctx;

  const [profileRes, responsesRes, sessionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, exam_category, is_premium")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_responses")
      .select("session_id, category, is_correct, time_taken_seconds")
      .eq("user_id", userId),
    supabase
      .from("exam_sessions")
      .select("id, mode, level, score, total_questions, time_spent_seconds, completed_at, exam_type")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }),
  ]);

  if (responsesRes.error) throw new Error(responsesRes.error.message);
  if (sessionsRes.error) throw new Error(sessionsRes.error.message);

  const profile = profileRes.data;
  const responses = (responsesRes.data ?? []) as ResponseRow[];
  const sessions = (sessionsRes.data ?? []) as SessionRow[];

  // ── Volume totals ──
  const totalAnswered = responses.length;
  const totalCorrect = responses.filter((r) => r.is_correct).length;
  const overallAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // ── Per-category stats ──
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

  // ── Per-session enrichment ──
  const sessionScoreMap = buildSessionScoreMap(responses);
  const enrichedSessions: RecentSession[] = sessions.map((s) => {
    const computed = sessionScoreMap.get(s.id);
    const computed_score_pct =
      computed && computed.total > 0
        ? Math.round((computed.correct / computed.total) * 100)
        : null;
    return {
      id: s.id,
      mode: s.mode,
      level: s.level,
      exam_type: s.exam_type,
      score: s.score,
      total_questions: s.total_questions,
      time_spent_seconds: s.time_spent_seconds,
      completed_at: s.completed_at,
      computed_score_pct,
      computed_total: computed?.total ?? 0,
    };
  });

  // ── Session-derived figures ──
  const sessionCount = sessions.length;
  const mockCount = sessions.filter((s) => s.mode === "Mock").length;
  const totalTimeSeconds = sessions.reduce(
    (acc, s) => acc + (s.time_spent_seconds ?? 0),
    0
  );

  const scoredSessions = enrichedSessions.filter((s) => s.computed_score_pct !== null);
  const averageScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((acc, s) => acc + (s.computed_score_pct ?? 0), 0) /
            scoredSessions.length
        )
      : 0;

  // ── Behavioural flags for achievements ──
  const hadPerfectSession = enrichedSessions.some(
    (s) => s.computed_total > 0 && s.computed_score_pct === 100
  );
  const hadNightOwlSession = sessions.some((s) => isNightOwl(s.completed_at));

  // ── Gamification ──
  const xp = computeXp(totalCorrect, sessionCount);
  const rank = computeRankProgress(xp);
  const streak = computeStreak(
    sessions.map((s) => (s.completed_at ?? "").split("T")[0]).filter(Boolean)
  );

  return {
    userId,
    username: profile?.username ?? "Student",
    examCategory: profile?.exam_category ?? null,
    isPremium: profile?.is_premium ?? false,

    totalAnswered,
    totalCorrect,
    overallAccuracy,
    totalTimeSeconds,
    sessionCount,
    mockCount,

    averageScore,

    xp,
    rank,
    streak,

    hadPerfectSession,
    hadNightOwlSession,

    categoryStats,
    recentSessions: enrichedSessions.slice(0, 10),
    readiness: computeReadiness(categoryStats, profile?.exam_category ?? null),
  };
}

// ── Recent practice sessions ─────────────────────────────────────────────────

interface PracticeSessionRow {
  id: string;
  categories: string[] | null;
  item_count: string | null;
  created_at: string;
  exam_session_id: string | null;
  // Supabase embeds the related row as an object (or, in some versions, a
  // one-element array) — getExam() below normalises both shapes.
  exam_sessions:
    | { score: number | null; total_questions: number | null }
    | { score: number | null; total_questions: number | null }[]
    | null;
}

/** Returns the Manila-day key (YYYY-MM-DD) for a Date. */
function manilaDayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

/** Builds a "Today, 9:42 AM" / "Yesterday, …" / "May 17, …" label in Manila time. */
function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const time = d.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  });

  const dayKey = manilaDayKey(d);
  if (dayKey === manilaDayKey(now)) return `Today, ${time}`;
  if (dayKey === manilaDayKey(new Date(now.getTime() - 864e5))) {
    return `Yesterday, ${time}`;
  }

  const date = d.toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  });
  return `${date}, ${time}`;
}

/**
 * Returns the caller's most recent practice-mode sessions, summarised for the
 * Practice hub. Sessions abandoned before answering anything are dropped.
 * Returns [] when unauthenticated.
 */
export async function getRecentPracticeSessions(
  limit = 6
): Promise<PracticeSessionSummary[]> {
  const ctx = await getAuthedContext();
  if (!ctx) return [];
  const { client: supabase, userId } = ctx;

  // practice_sessions carries the chosen categories; the embedded exam_sessions
  // row carries the score/total once the session has been completed.
  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      "id, categories, item_count, created_at, exam_session_id, exam_sessions(score, total_questions)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit * 3); // over-fetch — abandoned (0-answer) rows are filtered out
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as PracticeSessionRow[]).filter(
    (r) => r.exam_session_id
  );
  if (rows.length === 0) return [];

  // Live answered/correct tallies, derived from user_responses.
  const examIds = rows.map((r) => r.exam_session_id as string);
  const { data: respData, error: respError } = await supabase
    .from("user_responses")
    .select("session_id, is_correct")
    .eq("user_id", userId)
    .in("session_id", examIds);
  if (respError) throw new Error(respError.message);

  const tally = new Map<string, { answered: number; correct: number }>();
  for (const r of (respData ?? []) as {
    session_id: string | null;
    is_correct: boolean;
  }[]) {
    if (!r.session_id) continue;
    const t = tally.get(r.session_id) ?? { answered: 0, correct: 0 };
    t.answered++;
    if (r.is_correct) t.correct++;
    tally.set(r.session_id, t);
  }

  const summaries: PracticeSessionSummary[] = [];
  for (const row of rows) {
    const examSessionId = row.exam_session_id as string;
    const exam = Array.isArray(row.exam_sessions)
      ? row.exam_sessions[0]
      : row.exam_sessions;
    const { answered, correct } = tally.get(examSessionId) ?? {
      answered: 0,
      correct: 0,
    };

    // A session is "completed" once completeSession() has stamped a
    // total_questions value — completed_at is unreliable (it has a now()
    // default, so it is set the moment the row is created).
    const completed = exam?.total_questions != null;

    // Drop sessions abandoned before a single answer was recorded.
    if (answered === 0 && !completed) continue;

    let total = answered;
    if (completed && exam?.total_questions != null) {
      total = exam.total_questions;
    } else if (row.item_count && row.item_count !== "endless") {
      const parsed = parseInt(row.item_count, 10);
      if (Number.isFinite(parsed) && parsed > 0) total = parsed;
    }
    total = Math.max(total, answered);

    summaries.push({
      practiceId: row.id,
      examSessionId,
      categories: row.categories ?? [],
      completed,
      answered,
      correct,
      total,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
      dateLabel: formatSessionDate(row.created_at),
      createdAt: row.created_at,
    });

    if (summaries.length >= limit) break;
  }

  return summaries;
}
