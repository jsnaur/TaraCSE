"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

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

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("questions")
    .insert([{ ...question, is_active: true }]);

  if (error) throw new Error("Failed to add question");
  revalidatePath("/admin/questions");
}

/**
 * Updates an existing question
 */
export async function updateQuestion(id: string, question: Omit<Question, "id" | "created_at" | "is_active">) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("questions")
    .update(question)
    .eq("id", id);

  if (error) throw new Error("Failed to update question");
  revalidatePath("/admin/questions");
}