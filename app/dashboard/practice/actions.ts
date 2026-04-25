"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Map frontend category IDs to exact Database ENUM values
const CATEGORY_MAP: Record<string, string> = {
  "verbal": "Verbal Ability",
  "numerical": "Numerical Ability",
  "analytical": "Analytical Ability",
  "clerical": "Clerical Operations",
  "general": "General Information"
};

// Helper to authenticate the server action caller
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
  
  return { user, accessToken }; // <-- Also return the token so we can reuse it
}

/**
 * 1. Creates a new Practice Session in the Database.
 * Maps short IDs to exact ENUM strings to prevent Postgres type errors.
 */
export async function createPracticeSession(categories: string[], itemCount: string) {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const { user, accessToken } = authContext;

  // Translate frontend IDs to strict DB Enums
  const dbCategories = categories.map(cat => CATEGORY_MAP[cat] || cat);

  // CRITICAL FIX: Create an AUTHENTICATED client so Postgres RLS knows who is inserting
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

/**
 * 2. Securely fetches questions matching the session's categories AND the user's exam track level.
 */
export async function getPracticeQuestions(practiceId: string) {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };
  const { user } = authContext;

  const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey);

  // A. Read the practice session configuration
  const { data: session, error: sessionError } = await adminAuthClient
    .from("practice_sessions")
    .select("user_id, categories, item_count")
    .eq("id", practiceId)
    .single();

  if (sessionError || !session) return { error: "Session not found" };

  // MANDATORY SECURITY CHECK: Does this user own this session?
  if (session.user_id !== user.id) {
    return { error: "Unauthorized access to practice session" };
  }

  // B. Fetch the user's exam_category (Professional or Subprofessional)
  const { data: profile, error: profileError } = await adminAuthClient
    .from("profiles")
    .select("exam_category")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.exam_category) {
    return { error: "User exam track not found in profile" };
  }

  // C. Build the query to filter by mapped ENUM categories AND the correct exam level
  let query = adminAuthClient
    .from("questions")
    .select("id, level, category, difficulty, question_text, options") // Excludes correct_answer / explanation
    .in("category", session.categories)
    .eq("level", profile.exam_category) // ENFORCES BUSINESS LOGIC: Professional vs Subprofessional
    .eq("is_active", true);

  // Apply row limit if not endless mode
  if (session.item_count !== "endless") {
    query = query.limit(parseInt(session.item_count, 10));
  }

  const { data: questions, error: questionsError } = await query;

  if (questionsError) return { error: questionsError.message };

  return { 
    questions, 
    config: session,
    userLevel: profile.exam_category
  };
}