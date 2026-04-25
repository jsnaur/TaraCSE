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

export async function createPracticeSession(categories: string[], itemCount: string) {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const { user, accessToken } = authContext;
  const dbCategories = categories.map(cat => CATEGORY_MAP[cat] || cat);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      categories: dbCategories,
      item_count: itemCount,
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

/**
 * 3. NEW: Just-In-Time grading to fetch the explanation without exposing it early
 */
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