import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Append an immutable audit_logs row.
 *
 * Resolves the calling admin via the `sb-access-token` cookie (the same
 * scheme used by lib/admin-auth.ts), then writes through the service-role
 * client so the row is captured even if RLS evaluation hiccups.
 *
 * Failures are intentionally swallowed: audit logging must never block
 * the primary admin action it is observing.
 */
export async function logAudit(params: {
  action_type: string;
  target_resource?: string | null;
  details?: Record<string, unknown> | null;
}) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    if (!accessToken) return;

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data: { user } } = await anon.auth.getUser(accessToken);
    if (!user) return;

    const adminDb = createAdminClient();
    await adminDb.from("audit_logs").insert({
      admin_id: user.id,
      action_type: params.action_type,
      target_resource: params.target_resource ?? null,
      details: params.details ?? null,
    });
  } catch (e) {
    console.error("[audit] failed to record event:", e);
  }
}
