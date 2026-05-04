"use client";

import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ScrollText, ChevronDown, ChevronRight } from "lucide-react";
import type { AuditLogRow } from "./actions";

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function actionTone(action: string) {
  if (action.includes("revoked") || action.includes("rejected") || action.includes("deleted") || action.includes("reverted"))
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";
  if (action.includes("granted") || action.includes("approved") || action.includes("upload"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
  return "bg-muted text-foreground border-border";
}

export default function AuditClient({ initialLogs }: { initialLogs: AuditLogRow[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return initialLogs;
    return initialLogs.filter((l) =>
      l.action_type.toLowerCase().includes(q) ||
      (l.target_resource ?? "").toLowerCase().includes(q) ||
      (l.admin_username ?? "").toLowerCase().includes(q)
    );
  }, [initialLogs, search]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" /> Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Append-only record of every admin action. Showing the latest {initialLogs.length}.</p>
        </div>
      </motion.div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, resource, or admin username..."
            className="pl-9 h-10 rounded-xl bg-background"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[180px]"><span className="text-xs font-bold uppercase">When</span></TableHead>
                <TableHead className="w-[220px]"><span className="text-xs font-bold uppercase">Action</span></TableHead>
                <TableHead className="w-[180px]"><span className="text-xs font-bold uppercase">Admin</span></TableHead>
                <TableHead><span className="text-xs font-bold uppercase">Target</span></TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">No matching audit entries.</TableCell></TableRow>
              ) : (
                filtered.map((log) => (
                  <Fragment key={log.id}>
                    <TableRow className="hover:bg-muted/30 cursor-pointer" onClick={() => toggle(log.id)}>
                      <TableCell className="text-xs text-muted-foreground">{formatTimestamp(log.created_at)}</TableCell>
                      <TableCell><Badge variant="outline" className={`font-mono text-[10px] ${actionTone(log.action_type)}`}>{log.action_type}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">{log.admin_username ?? <span className="text-muted-foreground italic">unknown</span>}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-md">{log.target_resource ?? "—"}</TableCell>
                      <TableCell>{log.details ? (expanded.has(log.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : null}</TableCell>
                    </TableRow>
                    {expanded.has(log.id) && log.details && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={5} className="py-3">
                          <pre className="text-[11px] font-mono bg-background border border-border rounded-lg p-3 overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No matching audit entries.</p>
        ) : (
          filtered.map((log) => (
            <div key={log.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className={`font-mono text-[10px] ${actionTone(log.action_type)}`}>{log.action_type}</Badge>
                <span className="text-[11px] text-muted-foreground shrink-0">{formatTimestamp(log.created_at)}</span>
              </div>
              <div className="text-xs">
                <span className="font-bold">By:</span> {log.admin_username ?? <span className="italic text-muted-foreground">unknown</span>}
              </div>
              {log.target_resource && (
                <div className="text-xs font-mono break-all text-muted-foreground">{log.target_resource}</div>
              )}
              {log.details && (
                <details className="text-[11px] mt-1">
                  <summary className="cursor-pointer text-primary font-bold">Details</summary>
                  <pre className="font-mono bg-background border border-border rounded-lg p-2 mt-2 overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
