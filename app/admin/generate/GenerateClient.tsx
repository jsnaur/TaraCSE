"use client";

import { useState, useMemo, useRef, ElementType } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MathText } from "@/components/ui/math-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ListChecks,
  Flag,
  Check,
  Trash2,
  Play,
  Square,
  ChevronDown,
} from "lucide-react";
import type { Question } from "../questions/actions";
import {
  QuestionStyle,
  GenerationStats,
  BucketStat,
  toggleStyleEnabled,
  deleteStyle,
  approveGeneratedQuestions,
  rejectGeneratedQuestions,
} from "./actions";

const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"];

function StatCard({ label, value, icon: Icon, colorClass }: { label: string; value: string | number; icon: ElementType; colorClass: string; }) {
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-heading font-black text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function GenerateClient({
  styles,
  stats,
  reviewQueue,
}: {
  styles: QuestionStyle[];
  stats: GenerationStats;
  reviewQueue: Question[];
}) {
  const { toast } = useToast();
  const router = useRouter();

  // ── Discovery state ──
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverMsg, setDiscoverMsg] = useState<string | null>(null);

  // ── Generation state ──
  const [isGenerating, setIsGenerating] = useState(false);
  const stopRef = useRef(false);
  const [genResult, setGenResult] = useState<{
    sessionInserted: number;
    sessionFlagged: number;
    lastMessage: string;
    remaining: number;
    firstError: string | null;
  } | null>(null);

  // ── Review queue state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const bankPct = stats.totalTarget > 0 ? Math.min(100, Math.round((stats.totalCurrent / stats.totalTarget) * 100)) : 0;

  // Group styles by level → category
  const groupedStyles = useMemo(() => {
    const map = new Map<string, QuestionStyle[]>();
    for (const s of styles) {
      const key = `${s.level}|${s.category}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [styles]);

  // Group buckets by level → category
  const buckets = stats.buckets;
  const groupedBuckets = useMemo(() => {
    const map = new Map<string, BucketStat[]>();
    for (const b of buckets) {
      const key = `${b.level}|${b.category}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [buckets]);

  // ── Discovery handler ──
  const handleDiscover = async () => {
    setIsDiscovering(true);
    setDiscoverMsg(null);
    let discovered = 0;
    try {
      while (true) {
        const res = await fetch("/api/admin/generate/discover-styles", { method: "POST" });
        const data = await res.json();
        if (data.firstError) {
          toast({ title: "Discovery Error", description: data.firstError, variant: "destructive" });
          break;
        }
        discovered += data.discovered ?? 0;
        setDiscoverMsg(`${discovered} styles mapped so far…`);
        if ((data.remaining ?? 0) === 0) break;
      }
      toast({ title: "Style Map Ready", description: `${discovered} question styles discovered.` });
      router.refresh();
    } catch {
      toast({ title: "Discovery Failed", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setIsDiscovering(false);
      setDiscoverMsg(null);
    }
  };

  // ── Generation handler ──
  const runGeneration = async (auto: boolean) => {
    if (stats.styleCount === 0) {
      toast({ title: "No Style Map", description: "Discover question styles first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    stopRef.current = false;

    let sessionInserted = genResult?.sessionInserted ?? 0;
    let sessionFlagged = genResult?.sessionFlagged ?? 0;

    try {
      do {
        const res = await fetch("/api/admin/generate", { method: "POST" });
        const data = await res.json();

        sessionInserted += data.inserted ?? 0;
        sessionFlagged += data.flagged ?? 0;
        setGenResult({
          sessionInserted,
          sessionFlagged,
          lastMessage: data.message ?? "",
          remaining: data.remaining ?? 0,
          firstError: data.firstError ?? null,
        });

        if (data.firstError && (data.inserted ?? 0) === 0) {
          toast({ title: "Generation Halted", description: data.firstError, variant: "destructive" });
          break;
        }
        // Stop the loop when done, on no progress, or when the user hits Stop.
        if ((data.remaining ?? 0) === 0 || (data.inserted ?? 0) === 0 || stopRef.current) break;
      } while (auto);

      router.refresh();
      if (!stopRef.current) {
        toast({ title: "Batch Complete", description: `${sessionInserted} questions added to the review queue this session.` });
      }
    } catch {
      toast({ title: "Generation Failed", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      stopRef.current = false;
    }
  };

  // ── Style handlers ──
  const handleToggleStyle = async (s: QuestionStyle) => {
    try {
      await toggleStyleEnabled(s.id, !s.is_enabled);
      router.refresh();
    } catch {
      toast({ title: "Update Failed", description: "Could not update the style.", variant: "destructive" });
    }
  };

  const handleDeleteStyle = async (id: string) => {
    try {
      await deleteStyle(id);
      toast({ title: "Style Removed" });
      router.refresh();
    } catch {
      toast({ title: "Delete Failed", description: "Could not remove the style.", variant: "destructive" });
    }
  };

  // ── Review queue handlers ──
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = reviewQueue.length > 0 && selectedIds.size === reviewQueue.length;
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(reviewQueue.map((q) => q.id)));
  };

  const handleApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsActing(true);
    try {
      await approveGeneratedQuestions([...selectedIds]);
      toast({ title: "Questions Approved", description: `${selectedIds.size} questions are now live.` });
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast({ title: "Approve Failed", description: "Could not approve questions.", variant: "destructive" });
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (selectedIds.size === 0) return;
    setIsActing(true);
    try {
      await rejectGeneratedQuestions([...selectedIds]);
      toast({ title: "Questions Rejected", description: `${selectedIds.size} questions removed.` });
      setSelectedIds(new Set());
      setRejectOpen(false);
      router.refresh();
    } catch {
      toast({ title: "Reject Failed", description: "Could not reject questions.", variant: "destructive" });
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-black text-foreground">AI Question Generation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Discover question styles, generate balanced CSE questions, and review them before they go live.</p>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Questions in Bank" value={stats.totalCurrent} icon={Database} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40" />
        <StatCard label="Target" value={stats.totalTarget} icon={Sparkles} colorClass="bg-primary/10 text-primary dark:bg-primary/15" />
        <StatCard label="Awaiting Review" value={stats.reviewQueueCount} icon={ListChecks} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40" />
        <StatCard label="Styles Mapped" value={stats.styleCount} icon={Wand2} colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40" />
      </div>

      {/* ── Overall progress ── */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-foreground">Bank Progress</span>
          <span className="text-muted-foreground font-medium">{stats.totalCurrent} / {stats.totalTarget} ({bankPct}%)</span>
        </div>
        <Progress value={bankPct} className="h-2.5" />
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="h-11 rounded-2xl p-1 bg-muted/60 w-full sm:w-fit">
          <TabsTrigger value="generate" className="rounded-xl px-4 sm:px-6 font-bold data-[state=active]:bg-card flex-1 sm:flex-none">Generate</TabsTrigger>
          <TabsTrigger value="styles" className="rounded-xl px-4 sm:px-6 font-bold data-[state=active]:bg-card flex-1 sm:flex-none">Style Map</TabsTrigger>
          <TabsTrigger value="review" className="rounded-xl px-4 sm:px-6 font-bold data-[state=active]:bg-card flex items-center gap-2 flex-1 sm:flex-none justify-center">
            Review Queue
            {stats.reviewQueueCount > 0 && (
              <span className="bg-amber-500/15 text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-black">{stats.reviewQueueCount}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ════════ GENERATE TAB ════════ */}
        <TabsContent value="generate" className="m-0 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-heading font-black text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Generate Questions</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Each batch fills the most-under-target bucket with up to 30 questions, auto-checked and queued for review.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {isGenerating ? (
                  <Button onClick={() => { stopRef.current = true; }} variant="destructive" className="rounded-xl font-bold gap-2">
                    <Square className="w-4 h-4" /> Stop
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => runGeneration(false)} variant="outline" className="rounded-xl font-bold gap-2 bg-card">
                      <Play className="w-4 h-4" /> Run One Batch
                    </Button>
                    <Button onClick={() => runGeneration(true)} className="rounded-xl font-bold gap-2">
                      <Sparkles className="w-4 h-4" /> Auto-Run
                    </Button>
                  </>
                )}
              </div>
            </div>

            {stats.styleCount === 0 && (
              <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-4 py-3 text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>No question styles mapped yet. Open the <strong>Style Map</strong> tab and run Discovery first.</span>
              </div>
            )}

            {(isGenerating || genResult) && (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 space-y-1.5 text-sm">
                {genResult && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium">{genResult.sessionInserted} added this session</span>
                      {genResult.sessionFlagged > 0 && (
                        <span className="text-amber-600 font-medium">· {genResult.sessionFlagged} auto-flagged</span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{genResult.lastMessage}</p>
                    {genResult.firstError && (
                      <div className="flex items-start gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{genResult.firstError.slice(0, 160)}</span>
                      </div>
                    )}
                    <p className="text-muted-foreground">{genResult.remaining} questions still needed to hit target.</p>
                  </>
                )}
                {isGenerating && <p className="text-muted-foreground">Generating batch…</p>}
              </div>
            )}
          </div>

          {/* Bucket grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...groupedBuckets.entries()].map(([key, bks]) => {
              const [level, category] = key.split("|");
              const current = bks.reduce((s, b) => s + b.current, 0);
              const target = bks.reduce((s, b) => s + b.target, 0);
              return (
                <div key={key} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-bold text-foreground">{category}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{level}</p>
                    </div>
                    <Badge variant="outline" className="bg-background font-bold">{current} / {target}</Badge>
                  </div>
                  <div className="space-y-2">
                    {DIFFICULTY_ORDER.map((diff) => {
                      const b = bks.find((x) => x.difficulty === diff);
                      if (!b) return null;
                      const pct = b.target > 0 ? Math.min(100, Math.round((b.current / b.target) * 100)) : 0;
                      return (
                        <div key={diff} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-muted-foreground">{diff}</span>
                            <span className="text-muted-foreground">{b.current} / {b.target}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ════════ STYLE MAP TAB ════════ */}
        <TabsContent value="styles" className="m-0 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-lg flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary" /> Question Style Map</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Discovery asks the AI to break down each CSE section into question styles. Disable any style you don&apos;t want generated.</p>
            </div>
            <Button onClick={handleDiscover} disabled={isDiscovering} className="rounded-xl font-bold gap-2 shrink-0">
              {isDiscovering ? <><Loader2 className="w-4 h-4 animate-spin" /> {discoverMsg ?? "Discovering…"}</> : <><Wand2 className="w-4 h-4" /> Discover Styles</>}
            </Button>
          </div>

          {styles.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
              No styles mapped yet. Click <strong>Discover Styles</strong> to build the taxonomy for all 8 CSE sections.
            </div>
          ) : (
            <div className="space-y-4">
              {[...groupedStyles.entries()].map(([key, list]) => {
                const [level, category] = key.split("|");
                const enabledCount = list.filter((s) => s.is_enabled).length;
                return (
                  <div key={key} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-heading font-bold text-foreground">{category}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{level}</p>
                      </div>
                      <Badge variant="outline" className="bg-background font-bold">{enabledCount} / {list.length} enabled</Badge>
                    </div>
                    <div className="space-y-2">
                      {list.map((s) => (
                        <div key={s.id} className={`flex items-start gap-3 p-3 rounded-xl border ${s.is_enabled ? "border-border bg-background" : "border-border bg-muted/40 opacity-60"}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">{s.style_name}</p>
                            {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleStyle(s)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors ${s.is_enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                          >
                            {s.is_enabled ? "Enabled" : "Disabled"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStyle(s.id)}
                            className="text-muted-foreground hover:text-rose-600 transition-colors shrink-0 p-1"
                            title="Delete style"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ════════ REVIEW QUEUE TAB ════════ */}
        <TabsContent value="review" className="m-0 space-y-4">
          {reviewQueue.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
              The review queue is empty. Generated questions appear here for approval before going live.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-primary" />
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : `Select all (${reviewQueue.length})`}
                </label>
                <div className="flex gap-2">
                  <Button onClick={handleApprove} disabled={selectedIds.size === 0 || isActing} size="sm" className="rounded-xl font-bold gap-1.5">
                    {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve Selected
                  </Button>
                  <Button onClick={() => setRejectOpen(true)} disabled={selectedIds.size === 0 || isActing} size="sm" variant="destructive" className="rounded-xl font-bold gap-1.5">
                    <Trash2 className="w-4 h-4" /> Reject Selected
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {reviewQueue.map((q) => {
                  const flagged = q.quality_status === "flagged";
                  const expanded = expandedId === q.id;
                  return (
                    <div key={q.id} className={`bg-card border rounded-2xl overflow-hidden ${selectedIds.has(q.id) ? "border-primary" : "border-border"}`}>
                      <div className="flex items-start gap-3 p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(q.id)}
                          onChange={() => toggleSelect(q.id)}
                          className="w-4 h-4 rounded accent-primary mt-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <Badge variant="outline" className="bg-background text-[10px]">{q.level}</Badge>
                            <Badge variant="secondary" className="bg-muted text-[10px]">{q.category}</Badge>
                            <Badge variant="outline" className="text-[10px]">{q.difficulty}</Badge>
                            {typeof q.quality_score === "number" && (
                              <Badge variant="outline" className="text-[10px] bg-background">QA {q.quality_score}/5</Badge>
                            )}
                            {flagged && (
                              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-0.5">
                                <Flag className="w-2.5 h-2.5" /> Flagged
                              </Badge>
                            )}
                          </div>
                          <MathText text={q.question_text} className="text-sm font-medium text-foreground" />
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : q.id)}
                            className="text-xs font-semibold text-primary mt-1.5 flex items-center gap-1"
                          >
                            {expanded ? "Hide" : "Show"} options & explanation
                            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="px-4 pb-4 pl-11 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, idx) => (
                              <div key={idx} className={`p-2.5 rounded-xl border text-sm flex items-start gap-2 ${opt.is_correct ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900" : "bg-background border-border"}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${opt.is_correct ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <MathText text={opt.text} />
                              </div>
                            ))}
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Explanation</p>
                            <MathText text={q.explanation} className="text-sm text-blue-900 dark:text-blue-100" />
                          </div>
                          {flagged && q.quality_flags?.reason && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
                              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Flag className="w-3 h-3" /> QA Flag</p>
                              <p className="text-sm text-amber-900 dark:text-amber-100">{q.quality_flags.reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Reject Confirmation ── */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent className="rounded-3xl border-border max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading font-black">Reject {selectedIds.size} Questions?</AlertDialogTitle>
            <AlertDialogDescription>These AI-generated questions will be permanently deleted from the review queue. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold">Reject All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
