"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { QUESTIONS_PAGE_SIZE } from "./constants";

export type QualityStatus = "unreviewed" | "flagged" | "approved";

export interface QualityFlags {
  codes: string[];
  reason: string;
}

export interface Question {
  id: string;
  level: "Professional" | "Subprofessional";
  category: "Verbal Ability" | "Numerical Ability" | "Analytical Ability" | "General Information" | "Clerical Operations";
  difficulty: "Easy" | "Medium" | "Hard";
  question_text: string;
  options: { text: string; is_correct: boolean }[];
  explanation: string;
  is_active: boolean;
  created_at: string;
  quality_status?: QualityStatus;
  quality_score?: number | null;
  quality_flags?: QualityFlags | null;
  source?: "manual" | "ai_generated";
}

// ─── Filtering / Pagination Types ─────────────────────────────────────────────

export interface QuestionFilters {
  /** Free-text match against question_text and category. */
  search: string;
  level: "All" | "Professional" | "Subprofessional";
  status: "All" | "Active" | "Inactive";
  quality: "All" | "Flagged" | "Unreviewed" | "Approved";
  /** "All" or an exact category name. */
  category: string;
  /** "All" | "Easy" | "Medium" | "Hard". */
  difficulty: string;
}

/** One page of results plus the total count matching the active filter. */
export interface QuestionPage {
  questions: Question[];
  total: number;
  page: number;
}

/** Aggregate counts shown in the dashboard stat cards. */
export interface QuestionStats {
  total: number;
  active: number;
  prof: number;
  subprof: number;
  flagged: number;
  unreviewed: number;
}

// ─── Zod Schemas for Security Validation ──────────────────────────────────────

const optionSchema = z.object({
  text: z.string().min(1, "Option text cannot be empty").max(1000, "Option text is too long"),
  is_correct: z.boolean(),
});

const questionSchema = z.object({
  level: z.enum(["Professional", "Subprofessional"]),
  category: z.enum(["Verbal Ability", "Numerical Ability", "Analytical Ability", "General Information", "Clerical Operations"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  question_text: z.string().min(1, "Question text is required").max(10000, "Question text exceeds maximum length"),
  options: z.array(optionSchema).length(4, "Exactly 4 options are required"),
  explanation: z.string().min(1, "Explanation is required").max(10000, "Explanation exceeds maximum length"),
});

// ─── Filter Helper ────────────────────────────────────────────────────────────

/**
 * Applies a QuestionFilters set to any Supabase filter builder (select, update,
 * or delete). The generic keeps the builder's concrete type so chained `.order`
 * / `.range` calls stay available afterwards.
 */
function applyQuestionFilters<Q extends {
  eq(column: string, value: unknown): Q;
  or(filters: string): Q;
}>(query: Q, f: QuestionFilters): Q {
  const term = f.search.trim().replace(/[,()]/g, " ").trim();
  if (term) {
    // ilike is case-insensitive; the OR covers both the prompt and its category.
    query = query.or(`question_text.ilike.%${term}%,category.ilike.%${term}%`);
  }
  if (f.level !== "All") query = query.eq("level", f.level);
  if (f.category !== "All") query = query.eq("category", f.category);
  if (f.difficulty !== "All") query = query.eq("difficulty", f.difficulty);
  if (f.status === "Active") query = query.eq("is_active", true);
  if (f.status === "Inactive") query = query.eq("is_active", false);
  if (f.quality === "Flagged") query = query.eq("quality_status", "flagged");
  if (f.quality === "Approved") query = query.eq("quality_status", "approved");
  // Un-scanned questions have either no quality_status or "unreviewed".
  if (f.quality === "Unreviewed") query = query.or("quality_status.is.null,quality_status.eq.unreviewed");
  return query;
}

/** Counts the questions matching a filter without transferring any rows. */
async function countMatching(
  adminDb: ReturnType<typeof createAdminClient>,
  filters: QuestionFilters,
): Promise<number> {
  let query = adminDb.from("questions").select("*", { count: "exact", head: true });
  query = applyQuestionFilters(query, filters);
  const { count, error } = await query;
  if (error) throw new Error("Failed to count questions");
  return count ?? 0;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Fetches a single page of questions matching the given filters, plus the
 * total count of matching rows. Server-side paging keeps the payload small no
 * matter how large the bank grows.
 */
export async function fetchQuestions(params: {
  page: number;
  filters: QuestionFilters;
}): Promise<QuestionPage> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const page = Math.max(1, Math.floor(params.page) || 1);
  const from = (page - 1) * QUESTIONS_PAGE_SIZE;
  const to = from + QUESTIONS_PAGE_SIZE - 1;

  // Filters must be applied before .order/.range — those return a transform
  // builder that no longer exposes .eq/.or.
  let query = adminDb.from("questions").select("*", { count: "exact" });
  query = applyQuestionFilters(query, params.filters);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, to);

  if (error) throw new Error("Failed to fetch questions");

  return { questions: (data ?? []) as Question[], total: count ?? 0, page };
}

/**
 * Returns aggregate counts for the dashboard stat cards. Uses head-only count
 * queries so no question rows are transferred.
 */
export async function fetchQuestionStats(): Promise<QuestionStats> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const head = () => adminDb.from("questions").select("*", { count: "exact", head: true });

  const [total, active, prof, subprof, flagged, unreviewed] = await Promise.all([
    head(),
    head().eq("is_active", true),
    head().eq("level", "Professional"),
    head().eq("level", "Subprofessional"),
    head().eq("quality_status", "flagged"),
    head().or("quality_status.is.null,quality_status.eq.unreviewed"),
  ]);

  const num = (r: { count: number | null; error: unknown }) => {
    if (r.error) throw new Error("Failed to fetch question stats");
    return r.count ?? 0;
  };

  return {
    total: num(total),
    active: num(active),
    prof: num(prof),
    subprof: num(subprof),
    flagged: num(flagged),
    unreviewed: num(unreviewed),
  };
}

/**
 * Fetches every question matching a filter — used only for the explicit
 * "Export Filtered" action, where the admin opts into a full transfer.
 */
export async function fetchAllQuestionsForExport(filters: QuestionFilters): Promise<Question[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();

  // Supabase caps a single response at its `max-rows` limit (1000 by default),
  // so we page until a short page signals the end.
  const PAGE = 1000;
  const all: Question[] = [];
  for (let from = 0; from < 200_000; from += PAGE) {
    let query = adminDb.from("questions").select("*");
    query = applyQuestionFilters(query, filters);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + PAGE - 1);

    if (error) throw new Error("Failed to export questions");
    if (!data || data.length === 0) break;
    all.push(...(data as Question[]));
    if (data.length < PAGE) break;
  }
  return all;
}

/**
 * Toggles a question's active status
 */
export async function toggleQuestionStatus(id: string, currentStatus: boolean) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("questions")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) throw new Error("Failed to update status");
  revalidatePath("/admin/questions");
}

/**
 * Hard-deletes a question. Its student history (user_responses, bookmarks)
 * is removed too via ON DELETE CASCADE — see migration 0002.
 */
export async function deleteQuestion(id: string) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("questions")
    .delete()
    .eq("id", id);

  if (error) throw new Error("Failed to delete question");
  await logAudit({
    action_type: "question.deleted",
    target_resource: `questions/${id}`,
    details: { question_id: id },
  });
  revalidatePath("/admin/questions");
}

/**
 * Adds a single question
 */
export async function addQuestion(question: Omit<Question, "id" | "created_at" | "is_active">) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  // SECURITY: Validate payload before hitting the database
  const validatedData = questionSchema.parse(question);

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("questions")
    .insert([{ ...validatedData, is_active: true }]);

  if (error) throw new Error("Failed to add question");
  revalidatePath("/admin/questions");
}

/**
 * Updates an existing question
 */
export async function updateQuestion(id: string, question: Omit<Question, "id" | "created_at" | "is_active">) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  // SECURITY: Validate payload before hitting the database
  const validatedData = questionSchema.parse(question);

  const adminDb = createAdminClient();
  // An edited question is re-queued for the AI quality scan so the audit
  // reflects the new content rather than the stale flagged version.
  // The cached KOT AI explanation is also cleared — it described the old
  // content and would be stale; the next user request regenerates it.
  const { error } = await adminDb
    .from("questions")
    .update({
      ...validatedData,
      quality_status: "unreviewed",
      quality_score: null,
      quality_flags: [],
      kot_ai_explanation: null,
      kot_ai_generated_at: null,
    })
    .eq("id", id);

  if (error) throw new Error("Failed to update question");
  revalidatePath("/admin/questions");
}

/**
 * Marks every flagged question matching the active filter as approved (keeps
 * them, clears them from the flagged list without deleting). Returns the count
 * affected. Guarded to the Flagged view so it can never touch the whole bank.
 */
export async function approveFilteredQuestions(filters: QuestionFilters): Promise<number> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");
  if (filters.quality !== "Flagged") {
    throw new Error("Bulk approve is only available on the Flagged view");
  }

  const adminDb = createAdminClient();
  const count = await countMatching(adminDb, filters);
  if (count === 0) return 0;

  let query = adminDb.from("questions").update({ quality_status: "approved" });
  query = applyQuestionFilters(query, filters);
  const { error } = await query;

  if (error) throw new Error("Failed to approve questions");
  await logAudit({
    action_type: "question.quality.approved",
    target_resource: "questions",
    details: { count, filters },
  });
  revalidatePath("/admin/questions");
  return count;
}

/**
 * Hard-deletes every flagged question matching the active filter. Returns the
 * count removed. Guarded to the Flagged view so it can never touch the whole
 * bank.
 */
export async function deleteFilteredQuestions(filters: QuestionFilters): Promise<number> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");
  if (filters.quality !== "Flagged") {
    throw new Error("Bulk delete is only available on the Flagged view");
  }

  const adminDb = createAdminClient();
  const count = await countMatching(adminDb, filters);
  if (count === 0) return 0;

  let query = adminDb.from("questions").delete();
  query = applyQuestionFilters(query, filters);
  const { error } = await query;

  if (error) throw new Error("Failed to delete questions");
  await logAudit({
    action_type: "question.bulk_deleted",
    target_resource: "questions",
    details: { count, filters },
  });
  revalidatePath("/admin/questions");
  return count;
}

/**
 * Reverts an ingestion by deleting multiple IDs at once
 */
export async function revertIngestion(ids: string[]) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  if (!ids || ids.length === 0) return;

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("questions")
    .delete()
    .in("id", ids);

  if (error) throw new Error("Failed to revert ingestion");
  await logAudit({
    action_type: "question.ingestion.reverted",
    target_resource: "questions",
    details: { count: ids.length, question_ids: ids },
  });
  revalidatePath("/admin/questions");
}
