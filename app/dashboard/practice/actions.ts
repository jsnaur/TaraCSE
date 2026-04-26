"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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

export async function createPracticeSession(categories: string[], itemCount: string) {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const { user, accessToken } = authContext;
  let dbCategories = categories.map(cat => CATEGORY_MAP[cat] || cat);

  const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey);

  // FETCH TIER STATUS TO PREVENT API ABUSE
  const { data: profile } = await adminAuthClient
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium ?? false;
  let finalItemCount = itemCount;

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
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  return { practiceId: data.id };
}

export async function getPracticeQuestions(practiceId: string) {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };
  const { user } = authContext;

  const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: session, error: sessionError } = await adminAuthClient
    .from("practice_sessions")
    .select("user_id, categories, item_count")
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

  let query = adminAuthClient
    .from("questions")
    .select("id, level, category, difficulty, question_text, options") 
    .in("category", session.categories)
    .eq("level", profile.exam_category)
    .eq("is_active", true);

  if (session.item_count !== "endless") {
    query = query.limit(parseInt(session.item_count, 10));
  }

  const { data: questions, error: questionsError } = await query;
  if (questionsError) return { error: questionsError.message };

  // ANTI-CHEAT: Scrub the 'is_correct' flag and map options to a safe format
  const safeQuestions = questions.map(q => {
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

  return { questions: safeQuestions, config: session };
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