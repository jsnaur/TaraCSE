"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "knowledge-base";
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

export interface KnowledgeDoc {
  id: string;
  filename: string;
  storage_path: string;
  status: "pending" | "processing" | "embedded" | "failed";
  uploaded_by: string | null;
  uploaded_by_username: string | null;
  created_at: string;
}

async function currentAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) return null;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user } } = await sb.auth.getUser(accessToken);
  return user?.id ?? null;
}

export async function fetchKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  const { data: docs, error } = await adminDb
    .from("knowledge_base_docs")
    .select("id, filename, storage_path, status, uploaded_by, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch knowledge docs");
  if (!docs || docs.length === 0) return [];

  const ids = Array.from(new Set(docs.map((d) => d.uploaded_by).filter(Boolean))) as string[];
  let usernames = new Map<string, string>();
  if (ids.length) {
    const { data: profiles } = await adminDb.from("profiles").select("id, username").in("id", ids);
    if (profiles) usernames = new Map(profiles.map((p) => [p.id, p.username]));
  }

  return docs.map((d) => ({
    ...d,
    status: d.status as KnowledgeDoc["status"],
    uploaded_by_username: d.uploaded_by ? usernames.get(d.uploaded_by) ?? null : null,
  }));
}

export async function uploadKnowledgeDoc(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) return { ok: false, error: "Unauthorized" };

  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, error: "No file provided" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "File exceeds 25 MB limit" };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, error: `Unsupported file type: ${file.type || "unknown"}. Allowed: PDF, plain text, markdown.` };

  const adminId = await currentAdminId();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  const storagePath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;

  const adminDb = createAdminClient();

  const { error: uploadError } = await adminDb.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { ok: false, error: `Storage upload failed: ${uploadError.message}` };
  }

  const { error: insertError } = await adminDb.from("knowledge_base_docs").insert({
    filename: file.name,
    storage_path: storagePath,
    status: "pending",
    uploaded_by: adminId,
  });

  if (insertError) {
    // best-effort cleanup so the bucket and table don't drift
    await adminDb.storage.from(STORAGE_BUCKET).remove([storagePath]);
    return { ok: false, error: `DB insert failed: ${insertError.message}` };
  }

  await logAudit({
    action_type: "knowledge.document.uploaded",
    target_resource: `knowledge_base_docs/${storagePath}`,
    details: { filename: file.name, size: file.size, mime: file.type },
  });

  revalidatePath("/admin/knowledge");
  return { ok: true };
}

export async function deleteKnowledgeDoc(id: string, storagePath: string) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) throw new Error("Unauthorized");

  const adminDb = createAdminClient();
  await adminDb.storage.from(STORAGE_BUCKET).remove([storagePath]);
  const { error } = await adminDb.from("knowledge_base_docs").delete().eq("id", id);
  if (error) throw new Error("Failed to delete knowledge doc");

  await logAudit({
    action_type: "knowledge.document.deleted",
    target_resource: `knowledge_base_docs/${id}`,
    details: { storage_path: storagePath },
  });

  revalidatePath("/admin/knowledge");
}
