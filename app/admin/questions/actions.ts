"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Fetches questions with optional filtering
 */
export async function fetchQuestions(): Promise<Question[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { data, error } = await adminDb
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch questions");
  return data as Question[];
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
 * Deletes a question (Soft delete recommended, but this performs a hard delete)
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
  const { error } = await adminDb
    .from("questions")
    .update(validatedData)
    .eq("id", id);

  if (error) throw new Error("Failed to update question");
  revalidatePath("/admin/questions");
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
  revalidatePath("/admin/questions");
}