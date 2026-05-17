"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { targetBuckets } from "@/services/ai/generation";
import type { Question } from "../questions/actions";

export interface QuestionStyle {
  id: string;
  level: string;
  category: string;
  style_name: string;
  description: string | null;
  is_enabled: boolean;
}

export interface BucketStat {
  level: string;
  category: string;
  difficulty: string;
  target: number;
  current: number;
}

export interface GenerationStats {
  buckets: BucketStat[];
  totalCurrent: number;
  totalTarget: number;
  reviewQueueCount: number;
  styleCount: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────

export async function fetchStyles(): Promise<QuestionStyle[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { data, error } = await adminDb
    .from("question_styles")
    .select("id, level, category, style_name, description, is_enabled")
    .order("level")
    .order("category")
    .order("style_name");

  if (error) throw new Error("Failed to fetch question styles");
  return (data ?? []) as QuestionStyle[];
}

export async function toggleStyleEnabled(id: string, isEnabled: boolean) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("question_styles")
    .update({ is_enabled: isEnabled })
    .eq("id", id);

  if (error) throw new Error("Failed to update style");
  revalidatePath("/admin/generate");
}

export async function deleteStyle(id: string) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { error } = await adminDb.from("question_styles").delete().eq("id", id);
  if (error) throw new Error("Failed to delete style");
  revalidatePath("/admin/generate");
}

// ─── Generation stats (gap analysis) ────────────────────────────────────────

export async function fetchGenerationStats(): Promise<GenerationStats> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();

  const { data: rows, error } = await adminDb
    .from("questions")
    .select("level, category, difficulty");
  if (error) throw new Error("Failed to fetch question counts");

  const counts = new Map<string, number>();
  for (const r of rows ?? []) {
    const key = `${r.level}|${r.category}|${r.difficulty}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const buckets: BucketStat[] = targetBuckets().map((b) => ({
    ...b,
    current: counts.get(`${b.level}|${b.category}|${b.difficulty}`) ?? 0,
  }));

  const totalTarget = buckets.reduce((sum, b) => sum + b.target, 0);
  const totalCurrent = rows?.length ?? 0;

  const { count: reviewQueueCount } = await adminDb
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("source", "ai_generated")
    .eq("is_active", false);

  const { count: styleCount } = await adminDb
    .from("question_styles")
    .select("id", { count: "exact", head: true });

  return {
    buckets,
    totalCurrent,
    totalTarget,
    reviewQueueCount: reviewQueueCount ?? 0,
    styleCount: styleCount ?? 0,
  };
}

// ─── Review queue ───────────────────────────────────────────────────────────

export async function fetchReviewQueue(): Promise<Question[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { data, error } = await adminDb
    .from("questions")
    .select("*")
    .eq("source", "ai_generated")
    .eq("is_active", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch review queue");
  return (data ?? []) as Question[];
}

export async function approveGeneratedQuestions(ids: string[]) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");
  if (!ids || ids.length === 0) return;

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("questions")
    .update({ is_active: true })
    .in("id", ids);

  if (error) throw new Error("Failed to approve questions");
  await logAudit({
    action_type: "question.generated.approved",
    target_resource: "questions",
    details: { count: ids.length, question_ids: ids },
  });
  revalidatePath("/admin/generate");
  revalidatePath("/admin/questions");
}

export async function rejectGeneratedQuestions(ids: string[]) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");
  if (!ids || ids.length === 0) return;

  const adminDb = createAdminClient();
  const { error } = await adminDb.from("questions").delete().in("id", ids);

  if (error) throw new Error("Failed to reject questions");
  await logAudit({
    action_type: "question.generated.rejected",
    target_resource: "questions",
    details: { count: ids.length, question_ids: ids },
  });
  revalidatePath("/admin/generate");
}
