"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  Zap,
  BarChart3,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Flame,
  Star,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPracticeHubData } from "./actions";
import type { PracticeHubData } from "./types";
import type { CategoryStat, PracticeSessionSummary } from "@/lib/analytics/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Semantic colour for an accuracy percentage. */
function accuracyColor(pct: number): string {
  if (pct >= 80) return "var(--spark-correct-text)";
  if (pct >= 60) return "var(--accent)";
  return "var(--spark-wrong-text)";
}

/** Human label for the (possibly multi-category) session. */
function categoryLabel(categories: string[]): string {
  if (categories.length === 0) return "Practice Session";
  if (categories.length === 1) return categories[0];
  return `${categories.length} Categories`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
      style={{
        background: accent ? "var(--spark-ai-bg)" : "var(--card)",
        borderColor: accent ? "var(--spark-ai-border)" : "var(--border)",
      }}
    >
      <span
        className="flex items-center justify-center w-9 h-9 rounded-xl"
        style={{
          background: accent ? "var(--spark-ai-border)" : "var(--muted)",
          color: accent ? "var(--spark-ai-text)" : "var(--primary)",
        }}
      >
        {icon}
      </span>
      <div className="flex flex-col leading-tight">
        <span
          className="text-xl font-heading font-bold"
          style={{ color: "var(--foreground)" }}
        >
          {value}
        </span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function CategoryBar({
  label,
  pct,
}: {
  label: string;
  pct: number;
}) {
  const color = accuracyColor(pct);
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs w-44 shrink-0 truncate"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
      <div
        className="flex-1 rounded-full h-2.5 overflow-hidden"
        style={{ background: "var(--muted)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="text-xs font-heading font-bold w-8 text-right"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  );
}

function SessionCard({ session }: { session: PracticeSessionSummary }) {
  const isIncomplete = !session.completed;
  const href = isIncomplete
    ? `/dashboard/practice/session/${session.practiceId}`
    : `/dashboard/practice/review/${session.examSessionId}`;
  const accuracy = session.accuracy ?? 0;

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl p-4 border transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: isIncomplete ? "var(--spark-ai-bg)" : "var(--card)",
        borderColor: isIncomplete ? "var(--spark-ai-border)" : "var(--border)",
      }}
    >
      {/* icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{
          background: isIncomplete ? "var(--spark-ai-border)" : "var(--muted)",
          color: isIncomplete ? "var(--spark-ai-text)" : "var(--primary)",
        }}
      >
        {isIncomplete ? <RotateCcw size={18} /> : <CheckCircle2 size={18} />}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-heading font-bold text-sm truncate"
            style={{ color: "var(--foreground)" }}
          >
            {categoryLabel(session.categories)}
          </span>
          {isIncomplete && (
            <Badge
              className="text-[10px] px-1.5 py-0 rounded-md border-0"
              style={{
                background: "var(--spark-ai-border)",
                color: "var(--spark-ai-text)",
              }}
            >
              Resume
            </Badge>
          )}
        </div>
        <span
          className="text-xs mt-0.5 block"
          style={{ color: "var(--muted-foreground)" }}
        >
          {session.dateLabel} &middot; {session.answered}/{session.total} items
        </span>

        {/* mini progress for incomplete */}
        {isIncomplete && session.total > 0 && (
          <div
            className="mt-2 h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--muted)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (session.answered / session.total) * 100)}%`,
                background: "var(--spark-ai-text)",
              }}
            />
          </div>
        )}
      </div>

      {/* accuracy / score */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {!isIncomplete && (
          <span
            className="text-sm font-heading font-bold"
            style={{
              color:
                accuracy >= 75
                  ? "var(--spark-correct-text)"
                  : accuracy >= 60
                  ? "var(--accent)"
                  : "var(--spark-wrong-text)",
            }}
          >
            {accuracy}%
          </span>
        )}
        <span
          className="text-xs flex items-center gap-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          {isIncomplete ? (
            <>{session.answered} done</>
          ) : (
            <>
              <CheckCircle2
                size={11}
                style={{ color: "var(--spark-correct-text)" }}
              />
              {session.correct}
              <XCircle
                size={11}
                style={{ color: "var(--spark-wrong-text)" }}
                className="ml-0.5"
              />
              {session.answered - session.correct}
            </>
          )}
        </span>
      </div>

      <ChevronRight
        size={16}
        className="shrink-0 opacity-30 group-hover:opacity-70 transition-opacity"
        style={{ color: "var(--foreground)" }}
      />
    </Link>
  );
}

function HighlightCard({
  kind,
  category,
}: {
  kind: "weak" | "strong";
  category: CategoryStat;
}) {
  const isWeak = kind === "weak";
  return (
    <div
      className="flex-1 rounded-3xl border p-5 flex flex-col justify-between gap-3"
      style={{
        background: isWeak ? "var(--spark-wrong-bg)" : "var(--spark-correct-bg)",
        borderColor: isWeak
          ? "var(--spark-wrong-border)"
          : "var(--spark-correct-border)",
      }}
    >
      <div className="flex items-center gap-2">
        {isWeak ? (
          <TrendingDown size={14} style={{ color: "var(--spark-wrong-text)" }} />
        ) : (
          <Star size={14} style={{ color: "var(--spark-correct-text)" }} />
        )}
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{
            color: isWeak
              ? "var(--spark-wrong-text)"
              : "var(--spark-correct-text)",
          }}
        >
          {isWeak ? "Needs Work" : "Strongest"}
        </span>
      </div>
      <div>
        <p
          className="font-heading text-base font-bold leading-tight"
          style={{
            color: isWeak
              ? "var(--spark-wrong-text)"
              : "var(--spark-correct-text)",
          }}
        >
          {category.category}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {category.accuracy}% accuracy &middot;{" "}
          {isWeak ? "Needs more reps" : "Keep it sharp"}
        </p>
      </div>
      <Link href="/dashboard/practice/setup">
        <Button
          size="sm"
          variant="outline"
          className="w-full rounded-xl gap-1 text-xs font-bold border transition-colors"
          style={{
            borderColor: isWeak
              ? "var(--spark-wrong-border)"
              : "var(--spark-correct-border)",
            color: isWeak
              ? "var(--spark-wrong-text)"
              : "var(--spark-correct-text)",
            background: "transparent",
          }}
        >
          {isWeak ? "Practice Now" : "Keep Practicing"} <ArrowRight size={12} />
        </Button>
      </Link>
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${className}`}
      style={{ background: "var(--muted)" }}
    />
  );
}

function HubSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-[68px]" />
        ))}
      </div>
      <div className="grid sm:grid-cols-5 gap-4">
        <SkeletonBlock className="sm:col-span-3 h-56" />
        <SkeletonBlock className="sm:col-span-2 h-56" />
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-[72px]" />
        ))}
      </div>
    </div>
  );
}

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2
        className="font-heading text-sm font-bold uppercase tracking-wider"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PracticeHubPage() {
  const [hovering, setHovering] = useState(false);
  const [data, setData] = useState<PracticeHubData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPracticeHubData()
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res.data);
      })
      .catch(() => setError("Could not load practice hub."))
      .finally(() => setLoading(false));
  }, []);

  const hasCategoryData = (data?.categoryStats.length ?? 0) > 0;
  const showStrongest =
    data?.strongest != null &&
    data?.weakest != null &&
    data.strongest.category !== data.weakest.category;

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--background)" }}>
      {/* ── Decorative gradient blobs ──────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 right-0 w-[520px] h-[420px] opacity-30 blur-[120px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-20 blur-[100px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--secondary) 0%, transparent 70%)",
          transform: "translate(-40%, 40%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 pt-6 pb-24 flex flex-col gap-6">
        {/* ── Back to Dashboard ──────────────────────────────── */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm w-fit transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>

        {/* ── Header ────────────────────────────────────────── */}
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
            <span
              className="text-xs uppercase tracking-widest font-medium"
              style={{ color: "var(--primary)" }}
            >
              Practice Mode
            </span>
          </div>
          <h1
            className="font-heading text-4xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Sharpen your edge,
            <br />
            <span style={{ color: "var(--primary)" }}>one question at a time.</span>
          </h1>
          <p
            className="text-sm mt-1 max-w-md"
            style={{ color: "var(--muted-foreground)" }}
          >
            Untimed, category-focused practice designed to build mastery for the
            Philippine Civil Service Examination.
          </p>
        </header>

        {/* ── Hero CTA card ──────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border"
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, #3730A3 60%, #1E40AF 100%)",
            borderColor: "transparent",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.15) 28px, rgba(255,255,255,0.15) 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(255,255,255,0.15) 28px, rgba(255,255,255,0.15) 29px)",
            }}
          />

          <div className="relative flex flex-col gap-1 z-10">
            <span className="text-white/70 text-xs uppercase tracking-widest font-medium">
              Ready to level up?
            </span>
            <h2 className="font-heading text-2xl font-bold text-white leading-tight">
              Start New Practice
            </h2>
            <p className="text-white/70 text-sm">
              Choose a category, set your difficulty, and go.
            </p>
          </div>

          <Link href="/dashboard/practice/setup" className="relative z-10 shrink-0">
            <Button
              size="lg"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className="rounded-2xl gap-2 font-heading font-bold text-base transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-105"
              style={{ background: "white", color: "var(--primary)" }}
            >
              <Play size={17} fill="var(--primary)" strokeWidth={0} />
              Begin Practice
              <ArrowRight
                size={16}
                className={hovering ? "translate-x-1" : ""}
                style={{ transition: "transform 0.2s" }}
              />
            </Button>
          </Link>
        </div>

        {/* ── Data sections ──────────────────────────────────── */}
        {loading ? (
          <HubSkeleton />
        ) : error || !data ? (
          <div
            className="rounded-3xl border p-8 flex flex-col items-center gap-3 text-center"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <XCircle size={32} style={{ color: "var(--spark-wrong-text)" }} />
            <p
              className="font-heading font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Could not load your practice stats
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {error ?? "Please try refreshing the page."}
            </p>
          </div>
        ) : (
          <>
            {/* ── Stats row ───────────────────────────────────── */}
            <section className="flex flex-col gap-3">
              <SectionHeading
                icon={<BarChart3 size={14} style={{ color: "var(--primary)" }} />}
              >
                Your Stats
              </SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatPill
                  icon={<CheckCircle2 size={16} />}
                  value={data.totalAnswered.toLocaleString()}
                  label="Items Answered"
                />
                <StatPill
                  icon={<Target size={16} />}
                  value={`${data.overallAccuracy}%`}
                  label="Overall Accuracy"
                  accent
                />
                <StatPill
                  icon={<Flame size={16} />}
                  value={`${data.streak} ${data.streak === 1 ? "day" : "days"}`}
                  label="Current Streak"
                />
                <StatPill
                  icon={<Zap size={16} />}
                  value={data.xp.toLocaleString()}
                  label="Total XP"
                  accent
                />
              </div>
            </section>

            {/* ── Category breakdown + weak/strong ────────────── */}
            {hasCategoryData ? (
              <section className="grid sm:grid-cols-5 gap-4">
                <div
                  className="sm:col-span-3 rounded-3xl border p-5 flex flex-col gap-4"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <SectionHeading
                    icon={
                      <TrendingUp size={14} style={{ color: "var(--primary)" }} />
                    }
                  >
                    Category Accuracy
                  </SectionHeading>
                  <div className="flex flex-col gap-3">
                    {data.categoryStats.map((c) => (
                      <CategoryBar
                        key={c.category}
                        label={c.category}
                        pct={c.accuracy}
                      />
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-3">
                  {data.weakest && (
                    <HighlightCard kind="weak" category={data.weakest} />
                  )}
                  {showStrongest && data.strongest && (
                    <HighlightCard kind="strong" category={data.strongest} />
                  )}
                </div>
              </section>
            ) : (
              <section
                className="rounded-3xl border p-8 flex flex-col items-center gap-2 text-center"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <TrendingUp size={28} style={{ color: "var(--primary)" }} />
                <p
                  className="font-heading font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  No category data yet
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Finish a practice session and your per-category accuracy will
                  appear here.
                </p>
              </section>
            )}

            {/* ── Recent sessions ─────────────────────────────── */}
            <section className="flex flex-col gap-3">
              <SectionHeading
                icon={<Clock size={14} style={{ color: "var(--primary)" }} />}
              >
                Recent Sessions
              </SectionHeading>

              {data.recentSessions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {data.recentSessions.map((s) => (
                    <SessionCard key={s.practiceId} session={s} />
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-2xl border p-6 flex flex-col items-center gap-2 text-center"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <BookOpen size={26} style={{ color: "var(--muted-foreground)" }} />
                  <p
                    className="font-heading font-bold text-sm"
                    style={{ color: "var(--foreground)" }}
                  >
                    No practice sessions yet
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Start your first session and it will show up here.
                  </p>
                </div>
              )}
            </section>

            {/* ── Bottom CTA strip ────────────────────────────── */}
            <div
              className="rounded-2xl border p-4 flex items-center justify-between gap-4"
              style={{
                background: "var(--spark-ai-bg)",
                borderColor: "var(--spark-ai-border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--spark-ai-border)",
                    color: "var(--spark-ai-text)",
                  }}
                >
                  <Trophy size={18} />
                </div>
                <div>
                  <p
                    className="text-sm font-heading font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Aiming for CSE passers&apos; score?
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {data.passingGap > 0 ? (
                      <>
                        You need 80%+ accuracy across all areas. You&apos;re at{" "}
                        <strong style={{ color: "var(--spark-ai-text)" }}>
                          {data.overallAccuracy}%
                        </strong>{" "}
                        &mdash; {data.passingGap}% to go!
                      </>
                    ) : (
                      <>
                        You&apos;re at{" "}
                        <strong style={{ color: "var(--spark-ai-text)" }}>
                          {data.overallAccuracy}%
                        </strong>{" "}
                        &mdash; above the CSE passing mark. Keep it up!
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Link href="/dashboard/practice/setup" className="shrink-0">
                <Button
                  size="sm"
                  className="rounded-xl gap-1 font-bold text-xs"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Let&apos;s go <Zap size={13} fill="currentColor" strokeWidth={0} />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
