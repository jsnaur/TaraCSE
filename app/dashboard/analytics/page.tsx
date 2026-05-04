"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Menu, TrendingUp, Target, Clock, BrainCircuit,
  AlertTriangle, CheckCircle2, Flame, BarChart3,
} from "lucide-react";
import { getAnalyticsData, type AnalyticsData, type CategoryStat } from "./actions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function sessionScorePct(session: AnalyticsData["recentSessions"][number]): number | null {
  // Prefer computed score (from user_responses) — always available for practice sessions
  if (session.computed_score_pct !== null) return session.computed_score_pct;
  // Fall back to stored score for mock exams that save it explicitly
  if (session.score !== null && session.total_questions) {
    return Math.round((session.score / session.total_questions) * 100);
  }
  return null;
}

function sessionStatus(pct: number | null): { label: string; pass: boolean } {
  if (pct === null) return { label: "Incomplete", pass: false };
  if (pct >= 80) return { label: "Passed", pass: true };
  if (pct >= 60) return { label: "Good", pass: true };
  return { label: "Needs Work", pass: false };
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  // Guard against epoch (null stored as 0) or unparseable values
  if (isNaN(d.getTime()) || d.getFullYear() < 2020) return "—";
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Category visual config ───────────────────────────────────────────────────

const CAT_CONFIG: Record<string, { color: string; text: string }> = {
  "Verbal Ability":      { color: "bg-emerald-500", text: "text-emerald-500" },
  "Numerical Ability":   { color: "bg-blue-500",    text: "text-blue-500" },
  "Analytical Ability":  { color: "bg-violet-500",  text: "text-violet-500" },
  "General Information": { color: "bg-amber-500",   text: "text-amber-500" },
  "Clerical Operations": { color: "bg-rose-500",    text: "text-rose-500" },
};

function catStyle(category: string) {
  return CAT_CONFIG[category] ?? { color: "bg-primary", text: "text-primary" };
}

// ─── Skeleton primitives ──────────────────────────────────────────────────────

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5 flex flex-col justify-center gap-2">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-8 w-20" />
        <Pulse className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h3 className="font-heading text-lg font-bold mb-1">No data yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Complete your first practice session or mock exam to start seeing your analytics here.
      </p>
      <Link
        href="/dashboard/practice"
        className="mt-5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Start practicing
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsData().then(({ data, error }) => {
      if (error) setError(error);
      else setData(data);
      setLoading(false);
    });
  }, []);

  const isEmpty = !loading && !error && data?.totalAnswered === 0;

  // Weakest category (lowest accuracy among categories with data)
  const weakest: CategoryStat | null =
    data && data.categoryStats.length > 0
      ? data.categoryStats.reduce((min, c) => (c.accuracy < min.accuracy ? c : min))
      : null;

  const THRESHOLD = 70;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="px-4 md:px-5 h-[52px] min-h-[52px] border-b border-border flex items-center gap-3 bg-background transition-colors duration-200">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground shrink-0">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[220px] border-r-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar className="flex border-none" />
            </SheetContent>
          </Sheet>

          <div className="font-heading text-[15px] font-bold tracking-tight truncate">
            Analytics
          </div>

          {/* Streak chip */}
          {!loading && data && data.streak > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs text-orange-500 font-semibold shrink-0">
              <Flame className="w-3.5 h-3.5" />
              {data.streak}-day streak
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 md:gap-4 text-[11px] text-muted-foreground shrink-0">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-8">

              {/* Header */}
              <div className="space-y-1.5">
                <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Your Performance Analytics
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track your progress, identify weak areas, and optimize your review strategy.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-500">
                  Could not load analytics. Please refresh the page.
                </div>
              )}

              {/* Empty state */}
              {isEmpty && <EmptyState />}

              {!isEmpty && (
                <>
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                    ) : (
                      <>
                        <Card className="bg-card border-border">
                          <CardContent className="p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Target className="h-4 w-4" />
                              <span className="text-xs font-semibold uppercase tracking-wider">Avg. Score</span>
                            </div>
                            <div className="text-3xl font-bold font-mono">
                              {data!.averageScore > 0 ? `${data!.averageScore}%` : "—"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Across {data!.sessionCount} session{data!.sessionCount !== 1 ? "s" : ""}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardContent className="p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <BrainCircuit className="h-4 w-4" />
                              <span className="text-xs font-semibold uppercase tracking-wider">Sessions</span>
                            </div>
                            <div className="text-3xl font-bold font-mono">{data!.sessionCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Total completed sessions
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardContent className="p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs font-semibold uppercase tracking-wider">Time Spent</span>
                            </div>
                            <div className="text-3xl font-bold font-mono">
                              {data!.totalTimeSeconds > 0 ? formatTime(data!.totalTimeSeconds) : "—"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Total active review time
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardContent className="p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-semibold uppercase tracking-wider">Accuracy</span>
                            </div>
                            <div className="text-3xl font-bold font-mono">
                              {data!.overallAccuracy}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {data!.totalCorrect} of {data!.totalAnswered} correct
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Performance */}
                    <Card className="lg:col-span-1 border-border bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Category Performance</CardTitle>
                        <CardDescription>Your mastery level per subject area.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {loading ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                              <Pulse className="h-3 w-36" />
                              <Pulse className="h-2 w-full" />
                            </div>
                          ))
                        ) : data!.categoryStats.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No category data available yet.</p>
                        ) : (
                          <>
                            {data!.categoryStats.map((cat) => {
                              const style = catStyle(cat.category);
                              return (
                                <div key={cat.category} className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{cat.category}</span>
                                    <span className={`font-mono font-bold text-xs ${style.text}`}>
                                      {cat.accuracy}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={cat.accuracy}
                                    className="h-2"
                                    indicatorColor={style.color}
                                  />
                                  <p className="text-[10px] text-muted-foreground">
                                    {cat.correct}/{cat.total} correct
                                  </p>
                                </div>
                              );
                            })}

                            {/* Focus area alert */}
                            {weakest && weakest.accuracy < THRESHOLD && (
                              <div className="pt-2 border-t border-border">
                                <div className="flex items-start gap-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
                                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-semibold text-rose-500">Focus Area Identified</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Your performance in{" "}
                                      <strong>{weakest.category}</strong>{" "}
                                      ({weakest.accuracy}%) is below the {THRESHOLD}% passing threshold.
                                      Practice this area next.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* All green */}
                            {weakest && weakest.accuracy >= THRESHOLD && (
                              <div className="pt-2 border-t border-border">
                                <div className="flex items-start gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-semibold text-emerald-500">Great job!</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      All categories are above the passing threshold. Keep it up!
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recent History Table */}
                    <Card className="lg:col-span-2 border-border bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Exam History</CardTitle>
                        <CardDescription>Your latest sessions and their results.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <Pulse key={i} className="h-10 w-full" />
                            ))}
                          </div>
                        ) : data!.recentSessions.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4">No sessions yet.</p>
                        ) : (
                          <div className="overflow-x-auto -mx-2 px-2">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-border">
                                  <TableHead>Date</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Level</TableHead>
                                  <TableHead>Score</TableHead>
                                  <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data!.recentSessions.map((session) => {
                                  const pct = sessionScorePct(session);
                                  const status = sessionStatus(pct);
                                  return (
                                    <TableRow key={session.id} className="border-border">
                                      <TableCell className="font-medium text-muted-foreground whitespace-nowrap text-xs">
                                        {formatDate(session.completed_at)}
                                      </TableCell>
                                      <TableCell className="text-xs">{session.mode}</TableCell>
                                      <TableCell className="text-xs">{session.level}</TableCell>
                                      <TableCell className="font-mono font-medium text-xs">
                                        {pct !== null ? `${pct}%` : "—"}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge
                                          variant="outline"
                                          className={
                                            status.pass
                                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                                              : status.label === "Incomplete"
                                              ? "bg-muted text-muted-foreground border-border text-[10px]"
                                              : "bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]"
                                          }
                                        >
                                          {status.label}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
