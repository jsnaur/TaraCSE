"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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