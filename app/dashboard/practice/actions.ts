"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CATEGORY_MAP: Record<string, string> = {
  "verbal": "Verbal Ability",
  "numerical": "Numerical Ability",
  "analytical": "Analytical Ability",
  "clerical": "Clerical Operations",
  "general": "General Information"
};

const DifficultySchema = z.enum(["Easy", "Medium", "Hard", "Mixed"]);

const CreatePracticeInputSchema = z.object({
  categories: z.array(z.string().min(1)).min(1),
  itemCount: z.string().min(1),
  difficulty: DifficultySchema,
});

const SaveAnswerInputSchema = z.object({
  examSessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedAnswerId: z.string().min(1).max(8),
  timeTakenSeconds: z.number().int().nonnegative(),
});

const CompleteSessionInputSchema = z.object({
  examSessionId: z.string().uuid(),
  totalQuestions: z.number().int().nonnegative(),
  timeSpentSeconds: z.number().int().nonnegative(),
});

async function getAuthUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  
  return { user, accessToken };
}

/**
 * 1. Monetization Status: Used by frontend to trigger paywalls & UI locks
 */
export async function getUserMonetizationStatus() {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await adminAuthClient
    .from("profiles")
    .select("is_premium, free_kot_ai_uses_remaining")
    .eq("id", authContext.user.id)
    .single();

  if (error || !data) return { error: "Could not fetch monetization status" };

  return { 
    isPremium: data.is_premium, 
    remainingAiUses: data.free_kot_ai_uses_remaining 
  };
}

export async function createPracticeSession(
  categories: string[],
  itemCount: string,
  difficulty: string,
) {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const parsed = CreatePracticeInputSchema.safeParse({ categories, itemCount, difficulty });
  if (!parsed.success) return { error: "Invalid input" };

  const { user, accessToken } = authContext;
  let dbCategories = parsed.data.categories.map(cat => CATEGORY_MAP[cat] || cat);

  const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey);

  // FETCH TIER STATUS TO PREVENT API ABUSE
  const { data: profile } = await adminAuthClient
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium ?? false;
  let finalItemCount = parsed.data.itemCount;

  // APPLY FREE TIER RESTRICTIONS ON THE BACKEND
  if (!isPremium) {
    // Force 30 items
    if (finalItemCount !== "30" && parseInt(finalItemCount) > 30 || finalItemCount === "endless") {
      finalItemCount = "30"; 
    }
    // Scrub locked categories
    dbCategories = dbCategories.filter(
      cat => cat !== "Numerical Ability" && cat !== "Analytical Ability"
    );
    
    if (dbCategories.length === 0) {
      return { error: "Selected categories are locked for free users." };
    }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      categories: dbCategories,
      item_count: finalItemCount,
      difficulty: parsed.data.difficulty,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Fetch user's exam track for the exam_sessions row
  const { data: examProfile } = await adminAuthClient
    .from("profiles")
    .select("exam_category")
    .eq("id", user.id)
    .single();

  const { data: examSession, error: examSessionError } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      mode: "Practice",
      level: examProfile?.exam_category ?? null,
    })
    .select("id")
    .single();

  if (examSessionError || !examSession) {
    return { error: examSessionError?.message ?? "Failed to create exam session" };
  }

  const { error: linkError } = await supabase
    .from("practice_sessions")
    .update({ exam_session_id: examSession.id })
    .eq("id", data.id);

  if (linkError) return { error: linkError.message };

  return { practiceId: data.id, examSessionId: examSession.id };
}

export async function getPracticeQuestions(practiceId: string) {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };
  const { user } = authContext;

  const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: session, error: sessionError } = await adminAuthClient
    .from("practice_sessions")
    .select("user_id, categories, item_count, exam_session_id, difficulty")
    .eq("id", practiceId)
    .single();

  if (sessionError || !session) return { error: "Session not found" };
  if (session.user_id !== user.id) return { error: "Unauthorized" };

  const { data: profile } = await adminAuthClient
    .from("profiles")
    .select("exam_category")
    .eq("id", user.id)
    .single();

  if (!profile?.exam_category) return { error: "User exam track not found" };

  // Validate stored difficulty server-side; fall back to 'Mixed' if a row predates Phase 2
  const difficultyParsed = z
    .enum(["Easy", "Medium", "Hard", "Mixed"])
    .safeParse(session.difficulty);
  const pDifficulty = difficultyParsed.success ? difficultyParsed.data : "Mixed";

  const pLimit =
    session.item_count === "endless"
      ? 500
      : Math.max(1, parseInt(session.item_count, 10) || 1);

  const { data: questions, error: questionsError } = await adminAuthClient.rpc(
    "get_random_practice_questions",
    {
      p_level: profile.exam_category,
      p_categories: session.categories,
      p_difficulty: pDifficulty,
      p_limit: pLimit,
    },
  );
  if (questionsError) return { error: questionsError.message };
  if (!questions) return { error: "No questions returned" };

  // ANTI-CHEAT: Scrub the 'is_correct' flag and map options to a safe format
  const safeQuestions = (questions as any[]).map(q => {
    // Note: TypeScript might complain if it doesn't know the exact JSONB structure
    const rawOptions = q.options as any[];
    const safeOptions = rawOptions.map((opt, idx) => ({
      id: String.fromCharCode(97 + idx), // Maps to 'a', 'b', 'c', 'd'
      text: opt.text
    }));

    return {
      id: q.id,
      category: q.category,
      text: q.question_text,
      options: safeOptions
    };
  });

  return { questions: safeQuestions, config: session, examSessionId: session.exam_session_id };
}

export async function saveAnswer(
  examSessionId: string,
  questionId: string,
  selectedAnswerId: string,
  timeTakenSeconds: number,
) {
  const authContext = await getAuthUser();
  if (!authContext) return { success: false, error: "Not authenticated" };

  const parsed = SaveAnswerInputSchema.safeParse({
    examSessionId,
    questionId,
    selectedAnswerId,
    timeTakenSeconds,
  });
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { user, accessToken } = authContext;
  const adminAuthClient = createAdminClient();

  // Verify the exam_sessions row belongs to the authenticated user
  const { data: examSession, error: examSessionError } = await adminAuthClient
    .from("exam_sessions")
    .select("user_id")
    .eq("id", parsed.data.examSessionId)
    .single();

  if (examSessionError || !examSession) {
    return { success: false, error: "Session not found" };
  }
  if (examSession.user_id !== user.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Re-derive correctness server-side from the question's options
  const { data: question, error: questionError } = await adminAuthClient
    .from("questions")
    .select("options, category")
    .eq("id", parsed.data.questionId)
    .single();

  if (questionError || !question) {
    return { success: false, error: "Question not found" };
  }

  const rawOptions = question.options as any[];
  const correctIndex = rawOptions.findIndex(o => o.is_correct === true);
  const correctId = String.fromCharCode(97 + correctIndex);
  const isCorrect = parsed.data.selectedAnswerId === correctId;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { error: insertError } = await supabase
    .from("user_responses")
    .upsert(
      {
        session_id: parsed.data.examSessionId,
        question_id: parsed.data.questionId,
        user_id: user.id,
        selected_answer: parsed.data.selectedAnswerId,
        is_correct: isCorrect,
        time_taken_seconds: parsed.data.timeTakenSeconds,
        category: question.category,
      },
      { onConflict: "session_id,question_id", ignoreDuplicates: true },
    );

  if (insertError) return { success: false, error: insertError.message };

  return { success: true };
}

export async function completeSession(
  examSessionId: string,
  totalQuestions: number,
  timeSpentSeconds: number,
) {
  const authContext = await getAuthUser();
  if (!authContext) return { success: false, score: 0, error: "Not authenticated" };

  const parsed = CompleteSessionInputSchema.safeParse({
    examSessionId,
    totalQuestions,
    timeSpentSeconds,
  });
  if (!parsed.success) return { success: false, score: 0, error: "Invalid input" };

  const { user } = authContext;
  const adminAuthClient = createAdminClient();

  const { data: examSession, error: examSessionError } = await adminAuthClient
    .from("exam_sessions")
    .select("user_id")
    .eq("id", parsed.data.examSessionId)
    .single();

  if (examSessionError || !examSession) {
    return { success: false, score: 0, error: "Session not found" };
  }
  if (examSession.user_id !== user.id) {
    return { success: false, score: 0, error: "Unauthorized" };
  }

  // Authoritative score: count is_correct rows for this session
  const { count, error: countError } = await adminAuthClient
    .from("user_responses")
    .select("id", { count: "exact", head: true })
    .eq("session_id", parsed.data.examSessionId)
    .eq("is_correct", true);

  if (countError) return { success: false, score: 0, error: countError.message };

  const score = count ?? 0;

  const { error: updateError } = await adminAuthClient
    .from("exam_sessions")
    .update({
      score,
      total_questions: parsed.data.totalQuestions,
      time_spent_seconds: parsed.data.timeSpentSeconds,
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.examSessionId);

  if (updateError) return { success: false, score: 0, error: updateError.message };

  return { success: true, score };
}

export async function checkPracticeAnswer(questionId: string) {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await adminAuthClient
    .from("questions")
    .select("options, explanation")
    .eq("id", questionId)
    .single();

  if (error || !data) return { error: "Question not found" };

  const rawOptions = data.options as any[];
  const correctIndex = rawOptions.findIndex(o => o.is_correct === true);
  const correctId = String.fromCharCode(97 + correctIndex);

  return { correctId, explanation: data.explanation };
}

/**
 * 2. KOT AI Teaser Strategy: Deduct uses for non-premium users
 */
export async function decrementKotAiUsage() {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch current status
  const { data: profile, error: fetchError } = await adminAuthClient
    .from("profiles")
    .select("is_premium, free_kot_ai_uses_remaining")
    .eq("id", authContext.user.id)
    .single();

  if (fetchError || !profile) return { error: "Could not fetch profile" };

  // If premium, no decrement needed
  if (profile.is_premium) return { success: true, remaining: "unlimited" };

  // Check if they are out of uses
  if (profile.free_kot_ai_uses_remaining <= 0) {
    return { error: "exhausted" };
  }

  const newRemaining = profile.free_kot_ai_uses_remaining - 1;

  // Deduct one use
  const { error: updateError } = await adminAuthClient
    .from("profiles")
    .update({ free_kot_ai_uses_remaining: newRemaining })
    .eq("id", authContext.user.id);

  if (updateError) return { error: updateError.message };

  return { success: true, remaining: newRemaining };
}