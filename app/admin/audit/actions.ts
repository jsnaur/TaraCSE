"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";

export interface AuditLogRow {
  id: string;
  admin_id: string | null;
  admin_username: string | null;
  action_type: string;
  target_resource: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export async function fetchAuditLogs(limit = 200): Promise<AuditLogRow[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { data: logs, error } = await adminDb
    .from("audit_logs")
    .select("id, admin_id, action_type, target_resource, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("Failed to fetch audit logs");
  if (!logs || logs.length === 0) return [];

  // Resolve admin usernames in a single follow-up query.
  const ids = Array.from(new Set(logs.map((l) => l.admin_id).filter(Boolean))) as string[];
  let usernameMap = new Map<string, string>();
  if (ids.length) {
    const { data: profiles } = await adminDb
      .from("profiles")
      .select("id, username")
      .in("id", ids);
    if (profiles) usernameMap = new Map(profiles.map((p) => [p.id, p.username]));
  }

  return logs.map((l) => ({
    ...l,
    admin_username: l.admin_id ? usernameMap.get(l.admin_id) ?? null : null,
    details: (l.details as Record<string, unknown> | null) ?? null,
  }));
}
