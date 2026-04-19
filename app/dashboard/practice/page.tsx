"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = {
  totalAnswered: 2_418,
  accuracy: 73,
  streak: 9,
  xp: 4_860,
  weakestCategory: "Numerical Reasoning",
  strongestCategory: "Verbal Analogies",
};

const CATEGORY_BREAKDOWN = [
  { label: "Verbal Analogies", pct: 87, color: "var(--spark-correct-text)" },
  { label: "Reading Comprehension", pct: 76, color: "var(--secondary)" },
  { label: "Grammar & Correct Usage", pct: 68, color: "var(--accent)" },
  { label: "Numerical Reasoning", pct: 51, color: "var(--spark-wrong-text)" },
  { label: "General Info & CS", pct: 74, color: "var(--primary)" },
];

const RECENT_SESSIONS = [
  {
    id: "s1",
    category: "Verbal Analogies",
    date: "Today, 9:42 AM",
    total: 30,
    answered: 30,
    correct: 26,
    status: "completed",
  },
  {
    id: "s2",
    category: "Numerical Reasoning",
    date: "Yesterday, 8:15 PM",
    total: 25,
    answered: 14,
    correct: 7,
    status: "incomplete",
  },
  {
    id: "s3",
    category: "Grammar & Correct Usage",
    date: "Apr 17, 3:00 PM",
    total: 40,
    answered: 40,
    correct: 28,
    status: "completed",
  },
  {
    id: "s4",
    category: "Reading Comprehension",
    date: "Apr 16, 7:55 PM",
    total: 20,
    answered: 20,
    correct: 16,
    status: "completed",
  },
];

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
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
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

function SessionCard({ session }: { session: (typeof RECENT_SESSIONS)[0] }) {
  const isIncomplete = session.status === "incomplete";
  const accuracy = Math.round((session.correct / session.answered) * 100);

  return (
    <Link
      href={
        isIncomplete
          ? `/dashboard/practice/session/${session.id}`
          : `/dashboard/practice/review/${session.id}`
      }
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
            {session.category}
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
          {session.date} · {session.answered}/{session.total} items
        </span>

        {/* mini progress for incomplete */}
        {isIncomplete && (
          <div
            className="mt-2 h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--muted)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(session.answered / session.total) * 100}%`,
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PracticeHubPage() {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      {/* ── Decorative gradient blob (top-right) ────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 right-0 w-[520px] h-[420px] opacity-30 blur-[120px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-20 blur-[100px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--secondary) 0%, transparent 70%)",
          transform: "translate(-40%, 40%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-24 flex flex-col gap-8">
        {/* ── Header ────────────────────────────────────────── */}
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen
              size={18}
              style={{ color: "var(--primary)" }}
              strokeWidth={2.2}
            />
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
          {/* subtle grid overlay */}
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
              style={{
                background: "white",
                color: "var(--primary)",
              }}
            >
              <Play
                size={17}
                fill={hovering ? "var(--primary)" : "var(--primary)"}
                strokeWidth={0}
              />
              Begin Practice
              <ArrowRight size={16} className={hovering ? "translate-x-1" : ""} style={{ transition: "transform 0.2s" }} />
            </Button>
          </Link>
        </div>

        {/* ── Stats row ─────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} style={{ color: "var(--primary)" }} />
            <h2
              className="font-heading text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--foreground)" }}
            >
              Your Stats
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill
              icon={<CheckCircle2 size={16} />}
              value={STATS.totalAnswered.toLocaleString()}
              label="Items Answered"
            />
            <StatPill
              icon={<Target size={16} />}
              value={`${STATS.accuracy}%`}
              label="Overall Accuracy"
              accent
            />
            <StatPill
              icon={<Flame size={16} />}
              value={`${STATS.streak} days`}
              label="Current Streak"
            />
            <StatPill
              icon={<Zap size={16} />}
              value={STATS.xp.toLocaleString()}
              label="Total XP"
              accent
            />
          </div>
        </section>

        {/* ── Category breakdown + weak/strong ──────────────── */}
        <section className="grid sm:grid-cols-5 gap-4">
          {/* breakdown bars – wider col */}
          <div
            className="sm:col-span-3 rounded-3xl border p-5 flex flex-col gap-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={14} style={{ color: "var(--primary)" }} />
              <h3
                className="font-heading text-sm font-bold uppercase tracking-wider"
                style={{ color: "var(--foreground)" }}
              >
                Category Accuracy
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {CATEGORY_BREAKDOWN.map((c) => (
                <CategoryBar key={c.label} {...c} />
              ))}
            </div>
          </div>

          {/* weak / strong highlight – narrower col */}
          <div className="sm:col-span-2 flex flex-col gap-3">
            {/* weakest */}
            <div
              className="flex-1 rounded-3xl border p-5 flex flex-col justify-between gap-3"
              style={{
                background: "var(--spark-wrong-bg)",
                borderColor: "var(--spark-wrong-border)",
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingDown
                  size={14}
                  style={{ color: "var(--spark-wrong-text)" }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--spark-wrong-text)" }}
                >
                  Needs Work
                </span>
              </div>
              <div>
                <p
                  className="font-heading text-base font-bold leading-tight"
                  style={{ color: "var(--spark-wrong-text)" }}
                >
                  {STATS.weakestCategory}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  51% accuracy · Needs more reps
                </p>
              </div>
              <Link href="/dashboard/practice/setup?category=numerical-reasoning">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-xl gap-1 text-xs font-bold border transition-colors hover:bg-[var(--spark-wrong-border)]"
                  style={{
                    borderColor: "var(--spark-wrong-border)",
                    color: "var(--spark-wrong-text)",
                    background: "transparent",
                  }}
                >
                  Practice Now <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            {/* strongest */}
            <div
              className="flex-1 rounded-3xl border p-5 flex flex-col justify-between gap-3"
              style={{
                background: "var(--spark-correct-bg)",
                borderColor: "var(--spark-correct-border)",
              }}
            >
              <div className="flex items-center gap-2">
                <Star
                  size={14}
                  style={{ color: "var(--spark-correct-text)" }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--spark-correct-text)" }}
                >
                  Strongest
                </span>
              </div>
              <div>
                <p
                  className="font-heading text-base font-bold leading-tight"
                  style={{ color: "var(--spark-correct-text)" }}
                >
                  {STATS.strongestCategory}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  87% accuracy · Keep it sharp
                </p>
              </div>
              <Link href="/dashboard/practice/setup?category=verbal-analogies">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-xl gap-1 text-xs font-bold border transition-colors"
                  style={{
                    borderColor: "var(--spark-correct-border)",
                    color: "var(--spark-correct-text)",
                    background: "transparent",
                  }}
                >
                  Keep Practicing <ArrowRight size={12} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Recent sessions ────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "var(--primary)" }} />
              <h2
                className="font-heading text-sm font-bold uppercase tracking-wider"
                style={{ color: "var(--foreground)" }}
              >
                Recent Sessions
              </h2>
            </div>
            <Link
              href="/dashboard/practice/history"
              className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {RECENT_SESSIONS.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>

        {/* ── Bottom CTA strip ───────────────────────────────── */}
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
                Aiming for CSE passers' score?
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                You need 80%+ accuracy across all areas. You&apos;re at{" "}
                <strong style={{ color: "var(--spark-ai-text)" }}>
                  {STATS.accuracy}%
                </strong>{" "}
                — keep pushing!
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
      </div>
    </div>
  );
}