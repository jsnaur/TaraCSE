"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { User } from "./VerificationsClient";

const AVATAR_COLORS = [
  "bg-violet-500", "bg-sky-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-indigo-500",
  "bg-teal-500", "bg-pink-500", "bg-cyan-500"
];

export async function fetchAdminUsers(): Promise<User[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await adminDb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (profilesError) throw new Error("Failed to fetch profiles");

  // Fetch all pending payment verifications
  const { data: verifications, error: verifError } = await adminDb
    .from("payment_verifications")
    .select("*")
    .eq("status", "Pending");

  if (verifError) throw new Error("Failed to fetch verifications");

  // Merge the data for the UI
  return profiles.map((p, index) => {
    const pendingVerif = verifications.find((v) => v.user_id === p.id);
    
    let status: "premium" | "free" | "pending" = p.is_premium ? "premium" : "free";
    if (pendingVerif) status = "pending";

    return {
      id: p.id,
      name: p.username || "Unknown User",
      email: "Hidden for privacy", // auth.users email requires strict joins, omitted for UI cleanliness
      gcashRef: pendingVerif?.reference_number || null,
      verificationId: pendingVerif?.id || null,
      dateRegistered: p.created_at,
      status,
      avatarInitials: (p.username || "U").substring(0, 2).toUpperCase(),
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    };
  });
}

export async function processUserAction(userId: string, actionType: "upgrade" | "revoke", verificationId?: string | null) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();

  if (actionType === "upgrade") {
    // 1. Upgrade profile to premium (bypasses standard RLS/Triggers via Service Role)
    const { error: profileError } = await adminDb
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", userId);
      
    if (profileError) throw new Error("Failed to upgrade user");

    // 2. Mark the pending GCash receipt as Approved
    if (verificationId) {
      await adminDb
        .from("payment_verifications")
        .update({ status: "Approved", reviewed_at: new Date().toISOString() })
        .eq("id", verificationId);
    }
  } else if (actionType === "revoke") {
    // Revoke premium access manually
    const { error: profileError } = await adminDb
      .from("profiles")
      .update({ is_premium: false })
      .eq("id", userId);
      
    if (profileError) throw new Error("Failed to revoke user access");
  }

  // Tell Next.js to refresh the page data
  revalidatePath("/admin/verifications");
}