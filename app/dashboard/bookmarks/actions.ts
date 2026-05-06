"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SavedQuestion = {
  bookmarkId: string;
  bookmarkedAt: string;
  questionId: string;
  questionText: string;
  category: string;
  difficulty: string;
  level: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
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

  return { user };
}

const QuestionIdSchema = z.string().uuid();

const QuestionIdsSchema = z
  .array(z.string().uuid())
  .min(1)
  .max(200);

export async function toggleBookmark(
  questionId: string,
): Promise<{ bookmarked: boolean } | { error: string }> {
  const parsed = QuestionIdSchema.safeParse(questionId);
  if (!parsed.success) return { error: "Invalid question ID" };

  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const { user } = authContext;
  const adminClient = createAdminClient();

  const { data: existing, error: fetchError } = await adminClient
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", parsed.data)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };

  if (existing) {
    const { error: deleteError } = await adminClient
      .from("bookmarks")
      .delete()
      .eq("id", existing.id);

    if (deleteError) return { error: deleteError.message };

    return { bookmarked: false };
  }

  const { error: insertError } = await adminClient
    .from("bookmarks")
    .insert({ user_id: user.id, question_id: parsed.data });

  if (insertError) return { error: insertError.message };

  return { bookmarked: true };
}

export async function getBookmarkStatus(
  questionIds: string[],
): Promise<{ bookmarkedIds: string[] } | { error: string }> {
  const parsed = QuestionIdsSchema.safeParse(questionIds);
  if (!parsed.success) return { error: "Invalid question IDs" };

  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const { user } = authContext;
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("bookmarks")
    .select("question_id")
    .eq("user_id", user.id)
    .in("question_id", parsed.data);

  if (error) return { error: error.message };

  const bookmarkedIds = ((data ?? []) as { question_id: string }[]).map(
    (row) => row.question_id,
  );

  return { bookmarkedIds };
}

export async function getSavedQuestions(): Promise<
  { questions: SavedQuestion[] } | { error: string }
> {
  const authContext = await getAuthUser();
  if (!authContext) return { error: "Not authenticated" };

  const { user } = authContext;
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("bookmarks")
    .select(`
      id,
      created_at,
      question_id,
      questions (
        id,
        question_text,
        options,
        explanation,
        category,
        difficulty,
        level
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  const questions = ((data ?? []) as any[])
    .map((row): SavedQuestion | null => {
      const q = row.questions as any;
      if (!q) return null;

      const rawOptions = (q.options ?? []) as any[];
      const correctIndex = rawOptions.findIndex(
        (o: any) => o.is_correct === true,
      );
      const correctOptionId = correctIndex >= 0 ? String(correctIndex) : "0";
      const options = rawOptions.map((opt: any, idx: number) => ({
        id: String(idx),
        text: opt.text as string,
      }));

      return {
        bookmarkId: row.id as string,
        bookmarkedAt: row.created_at as string,
        questionId: row.question_id as string,
        questionText: q.question_text as string,
        category: q.category as string,
        difficulty: q.difficulty as string,
        level: q.level as string,
        options,
        correctOptionId,
        explanation: q.explanation as string,
      };
    })
    .filter(Boolean) as SavedQuestion[];

  return { questions };
}
