"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { getUserStats } from "@/lib/analytics/server";
import type { SidebarIdentity } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getProfile() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) return { error: "Not authenticated" };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) return { error: "User not found" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("exam_category, username")
    .eq("id", user.id)
    .single();

  if (error) return { error: error.message };

  return { profile };
}

export async function saveExamCategory(category: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) return { error: "Not authenticated" };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) return { error: "User not found" };

  const { error } = await supabase
    .from("profiles")
    .update({ exam_category: category })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return { success: true };
}

export async function checkAdminStatus(): Promise<boolean> {
  return verifyAdminStatus();
}

/** Derives a user's username, initials and gamification rank for the sidebar. */
function deriveInitials(username: string): string {
  const parts = username.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.trim().slice(0, 2).toUpperCase() || "??";
}

/** Live identity block (name, rank, XP) shown at the bottom of the sidebar. */
export async function getSidebarIdentity(): Promise<SidebarIdentity | null> {
  try {
    const stats = await getUserStats();
    if (!stats) return null;
    return {
      username: stats.username,
      initials: deriveInitials(stats.username),
      xp: stats.xp,
      rankName: stats.rank.current.name,
    };
  } catch (err) {
    console.error("getSidebarIdentity failed:", err);
    return null;
  }
}