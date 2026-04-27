"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export interface AdminUser {
  id: string;
  username: string;
  created_at: string;
  exam_category: string | null;
  is_premium: boolean;
  free_kot_ai_uses_remaining: number;
  is_admin: boolean;
}

/**
 * Fetches all users from the profiles table.
 */
export async function fetchAllUsers(): Promise<AdminUser[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { data, error } = await adminDb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch users");
  return data as AdminUser[];
}

/**
 * Toggles a user's premium status.
 */
export async function togglePremiumStatus(userId: string, currentStatus: boolean) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("profiles")
    .update({ is_premium: !currentStatus })
    .eq("id", userId);

  if (error) throw new Error("Failed to update premium status");
  revalidatePath("/admin/users");
}

/**
 * Resets a user's KOT AI uses to the default (3).
 */
export async function resetAiUses(userId: string) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("profiles")
    .update({ free_kot_ai_uses_remaining: 3 })
    .eq("id", userId);

  if (error) throw new Error("Failed to reset AI uses");
  revalidatePath("/admin/users");
}