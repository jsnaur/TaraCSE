"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Loader2, BrainCircuit, Trash2, FileType, AlertCircle } from "lucide-react";
import { uploadKnowledgeDoc, deleteKnowledgeDoc, type KnowledgeDoc } from "./actions";

const ACCEPT = ".pdf,.txt,.md,application/pdf,text/plain,text/markdown";

function statusTone(status: KnowledgeDoc["status"]) {
  switch (status) {
    case "embedded": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "processing": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "failed": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
    default: return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function KnowledgeClient({ initialDocs }: { initialDocs: KnowledgeDoc[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadKnowledgeDoc(fd);
    setBusy(false);
    if (!res.ok) {
      toast({ title: "Upload failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Uploaded", description: `${file.name} queued for embedding.` });
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function handleDelete(doc: KnowledgeDoc) {
    if (!confirm(`Delete "${doc.filename}" from the knowledge base? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await deleteKnowledgeDoc(doc.id, doc.storage_path);
      toast({ title: "Deleted", description: doc.filename });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" /> Knowledge Base
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload reference documents (PDF, TXT, MD) for the upcoming RAG retrieval pipeline. Files are stored privately in Supabase Storage.
        </p>
      </motion.div>

      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
        <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${file ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            {file ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center"><FileText className="w-7 h-7" /></div>
                <p className="font-bold text-base break-all px-4">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {file.type || "unknown"}</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center"><UploadCloud className="w-7 h-7" /></div>
                <p className="font-bold text-base">Tap or drop a file to upload</p>
                <p className="text-xs text-muted-foreground">PDF, TXT, or MD · max 25 MB</p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            New uploads start as <code className="bg-muted px-1 rounded">pending</code>; the embedding worker will flip the status when chunks are vectorized.
          </div>
          <Button onClick={handleUpload} disabled={!file || busy} className="rounded-xl font-bold gap-2 h-11 px-6 w-full sm:w-auto">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><UploadCloud className="w-4 h-4" /> Upload</>}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Indexed Documents · {initialDocs.length}</h2>
        {initialDocs.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {initialDocs.map((doc) => (
              <li key={doc.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <FileType className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold truncate">{doc.filename}</p>
                    <Badge variant="outline" className={`text-[10px] font-bold ${statusTone(doc.status)} border-0`}>{doc.status}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">By {doc.uploaded_by_username ?? "—"} · {formatDate(doc.created_at)}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/70 truncate mt-0.5">{doc.storage_path}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  title="Delete"
                >
                  {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
