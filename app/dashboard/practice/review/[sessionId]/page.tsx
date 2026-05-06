"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { motion, AnimatePresence } from "framer-motion";
import { getSessionReview } from "../../actions";
import { getBookmarkStatus } from "@/app/dashboard/bookmarks/actions";
import { MathText } from "@/components/ui/math-text";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewItem = {
  index: number;
  questionId: string;
  questionText: string;
  options: { id: string; text: string }[];
  selectedId: string;
  correctId: string;
  explanation: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  category: string;
};

type SessionMeta = {
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  completedAt: string | null;
  mode: string;
  level: string;
};

type Filter = "all" | "correct" | "incorrect";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPerformance(pct: number) {
  if (pct >= 80)
    return {
      label: "Excellent",
      emoji: "🏆",
      color: "var(--spark-correct-text)",
      bg: "var(--spark-correct-bg)",
      border: "var(--spark-correct-border)",
    };
  if (pct >= 70)
    return {
      label: "Good Job",
      emoji: "⭐",
      color: "var(--secondary)",
      bg: "var(--spark-ai-bg)",
      border: "var(--spark-ai-border)",
    };
  if (pct >= 60)
    return {
      label: "Passing",
      emoji: "👍",
      color: "var(--accent)",
      bg: "var(--muted)",
      border: "var(--border)",
    };
  return {
    label: "Needs Work",
    emoji: "📚",
    color: "var(--spark-wrong-text)",
    bg: "var(--spark-wrong-bg)",
    border: "var(--spark-wrong-border)",
  };
}

// ─── Score Summary Card ────────────────────────────────────────────────────────

function ScoreSummary({
  session,
  itemCount,
}: {
  session: SessionMeta;
  itemCount: number;
}) {
  const pct =
    session.totalQuestions > 0
      ? Math.round((session.score / session.totalQuestions) * 100)
      : 0;
  const perf = getPerformance(pct);
  const incorrect = session.totalQuestions - session.score;
  const avgTime =
    itemCount > 0
      ? Math.round(session.timeSpentSeconds / itemCount)
      : 0;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 border"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, #3730A3 60%, #1E40AF 100%)",
        borderColor: "transparent",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.15) 28px, rgba(255,255,255,0.15) 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(255,255,255,0.15) 28px, rgba(255,255,255,0.15) 29px)",
        }}
      />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-medium">
              {session.mode} · {session.level}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {formatDate(session.completedAt)}
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{ background: perf.bg, color: perf.color }}
          >
            {perf.emoji} {perf.label}
          </span>
        </div>

        {/* Big score */}
        <div className="mt-5 flex items-end gap-3">
          <span className="font-heading text-6xl font-bold text-white leading-none">
            {pct}%
          </span>
          <span className="text-white/60 text-xl font-heading mb-1">
            {session.score}/{session.totalQuestions}
          </span>
        </div>

        {/* Stat chips */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div
            className="rounded-2xl p-3"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <CheckCircle2 size={14} className="text-green-300 mb-1" />
            <p className="font-heading font-bold text-white text-lg leading-none">
              {session.score}
            </p>
            <p className="text-white/60 text-xs mt-0.5">Correct</p>
          </div>
          <div
            className="rounded-2xl p-3"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <XCircle size={14} className="text-red-300 mb-1" />
            <p className="font-heading font-bold text-white text-lg leading-none">
              {incorrect}
            </p>
            <p className="text-white/60 text-xs mt-0.5">Incorrect</p>
          </div>
          <div
            className="rounded-2xl p-3"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <Clock size={14} className="text-blue-200 mb-1" />
            <p className="font-heading font-bold text-white text-lg leading-none">
              {formatTime(session.timeSpentSeconds)}
            </p>
            <p className="text-white/60 text-xs mt-0.5">
              ~{avgTime}s/item
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({
  item,
  expanded,
  onToggle,
  initialBookmarked,
}: {
  item: ReviewItem;
  expanded: boolean;
  onToggle: () => void;
  initialBookmarked: boolean;
}) {
  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        background: "var(--card)",
        borderColor: item.isCorrect
          ? "var(--spark-correct-border)"
          : "var(--spark-wrong-border)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center px-4 py-3.5 gap-2">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity min-w-0"
        >
          {/* Index badge */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-heading"
            style={{
              background: item.isCorrect
                ? "var(--spark-correct-bg)"
                : "var(--spark-wrong-bg)",
              color: item.isCorrect
                ? "var(--spark-correct-text)"
                : "var(--spark-wrong-text)",
            }}
          >
            {item.index}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                {item.category}
              </span>
              <span
                className="text-[10px] flex items-center gap-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Clock size={9} />
                {item.timeTakenSeconds}s
              </span>
            </div>
            <MathText
              text={item.questionText}
              block
              className="text-sm font-medium mt-0.5 line-clamp-2 leading-snug"
              style={{ color: "var(--foreground)" }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.isCorrect ? (
              <CheckCircle2
                size={18}
                style={{ color: "var(--spark-correct-text)" }}
              />
            ) : (
              <XCircle size={18} style={{ color: "var(--spark-wrong-text)" }} />
            )}
            {expanded ? (
              <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} />
            ) : (
              <ChevronDown
                size={14}
                style={{ color: "var(--muted-foreground)" }}
              />
            )}
          </div>
        </button>

        <div className="shrink-0 -mr-1">
          <BookmarkButton
            questionId={item.questionId}
            initialBookmarked={initialBookmarked}
            size="sm"
          />
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 flex flex-col gap-3 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Full question text */}
              <MathText
                text={item.questionText}
                block
                className="text-sm mt-3 leading-relaxed"
                style={{ color: "var(--foreground)" }}
              />

              {/* Options */}
              <div className="flex flex-col gap-2">
                {item.options.map((opt) => {
                  const isSelected = opt.id === item.selectedId;
                  const isCorrectOpt = opt.id === item.correctId;

                  let bg = "var(--muted)";
                  let borderColor = "transparent";
                  let textColor = "var(--muted-foreground)";
                  let icon: React.ReactNode = null;

                  if (isSelected && isCorrectOpt) {
                    bg = "var(--spark-correct-bg)";
                    borderColor = "var(--spark-correct-border)";
                    textColor = "var(--spark-correct-text)";
                    icon = (
                      <CheckCircle2
                        size={14}
                        style={{ color: "var(--spark-correct-text)" }}
                        className="shrink-0 mt-0.5"
                      />
                    );
                  } else if (isSelected && !isCorrectOpt) {
                    bg = "var(--spark-wrong-bg)";
                    borderColor = "var(--spark-wrong-border)";
                    textColor = "var(--spark-wrong-text)";
                    icon = (
                      <XCircle
                        size={14}
                        style={{ color: "var(--spark-wrong-text)" }}
                        className="shrink-0 mt-0.5"
                      />
                    );
                  } else if (!isSelected && isCorrectOpt) {
                    bg = "var(--spark-correct-bg)";
                    borderColor = "var(--spark-correct-border)";
                    textColor = "var(--spark-correct-text)";
                    icon = (
                      <CheckCircle2
                        size={14}
                        style={{
                          color: "var(--spark-correct-text)",
                          opacity: 0.6,
                        }}
                        className="shrink-0 mt-0.5"
                      />
                    );
                  }

                  return (
                    <div
                      key={opt.id}
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 border"
                      style={{ background: bg, borderColor }}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-heading shrink-0 mt-0.5"
                        style={{
                          background:
                            isSelected || isCorrectOpt
                              ? borderColor
                              : "var(--border)",
                          color: textColor,
                        }}
                      >
                        {opt.id.toUpperCase()}
                      </span>
                      <MathText
                        text={opt.text}
                        className="text-sm flex-1 leading-snug"
                        style={{ color: textColor }}
                      />
                      {icon}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div
                className="rounded-xl p-3 border"
                style={{
                  background: "var(--spark-ai-bg)",
                  borderColor: "var(--spark-ai-border)",
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Explanation
                </p>
                <MathText
                  text={item.explanation}
                  block
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--spark-ai-text)" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const params = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<SessionMeta | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!params.sessionId) return;
    getSessionReview(params.sessionId).then((result) => {
      if ("error" in result) {
        setErrorMsg(result.error ?? "An error occurred");
      } else {
        setSession(result.session);
        setItems(result.items);
        const incorrectIds = new Set(
          result.items.filter((i) => !i.isCorrect).map((i) => i.questionId)
        );
        setExpandedIds(incorrectIds);

        const qIds = result.items.map((i) => i.questionId);
        if (qIds.length > 0) {
          getBookmarkStatus(qIds).then((bResult) => {
            if (!("error" in bResult)) {
              setBookmarkedIds(new Set(bResult.bookmarkedIds));
            }
          });
        }
      }
      setIsLoading(false);
    });
  }, [params.sessionId]);

  const filteredItems = items.filter((item) => {
    if (filter === "correct") return item.isCorrect;
    if (filter === "incorrect") return !item.isCorrect;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () =>
    setExpandedIds(new Set(filteredItems.map((i) => i.questionId)));

  const collapseAll = () => setExpandedIds(new Set());

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--primary)",
              borderTopColor: "transparent",
            }}
          />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Loading review…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (errorMsg || !session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center flex flex-col items-center gap-4 max-w-sm">
          <XCircle size={48} style={{ color: "var(--spark-wrong-text)" }} />
          <p
            className="font-heading font-bold text-xl"
            style={{ color: "var(--foreground)" }}
          >
            Session Not Found
          </p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {errorMsg ??
              "This session doesn't exist or you don't have access to it."}
          </p>
          <Link href="/dashboard/practice">
            <Button
              className="rounded-2xl"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              Back to Practice
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const correctCount = items.filter((i) => i.isCorrect).length;
  const incorrectCount = items.length - correctCount;
  const allExpanded =
    filteredItems.length > 0 &&
    filteredItems.every((i) => expandedIds.has(i.questionId));

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 right-0 w-[520px] h-[420px] opacity-25 blur-[120px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-15 blur-[100px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--secondary) 0%, transparent 70%)",
          transform: "translate(-40%, 40%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-24 flex flex-col gap-6">
        {/* ── Nav bar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ArrowLeft size={15} />
              Dashboard
            </Link>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/</span>
            <Link
              href="/dashboard/practice"
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              Practice Hub
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} style={{ color: "var(--primary)" }} />
            <span
              className="text-xs uppercase tracking-widest font-medium"
              style={{ color: "var(--primary)" }}
            >
              Session Review
            </span>
          </div>
        </div>

        {/* ── Score summary ───────────────────────────────────── */}
        <ScoreSummary session={session} itemCount={items.length} />

        {/* ── CTA buttons ─────────────────────────────────────── */}
        <div className="flex gap-3">
          <Link href="/dashboard/practice/setup" className="flex-1">
            <Button
              className="w-full rounded-2xl gap-2 font-heading font-bold"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              <Zap size={15} fill="currentColor" strokeWidth={0} />
              New Session
            </Button>
          </Link>
          <Link href="/dashboard/practice">
            <Button
              variant="outline"
              className="rounded-2xl gap-2 font-heading font-bold"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <BookOpen size={15} />
              Hub
            </Button>
          </Link>
        </div>

        {/* ── Filter tabs + expand toggle ─────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { key: "all", label: "All", count: items.length, icon: null },
              {
                key: "correct",
                label: "Correct",
                count: correctCount,
                icon: <CheckCircle2 size={11} />,
              },
              {
                key: "incorrect",
                label: "Incorrect",
                count: incorrectCount,
                icon: <XCircle size={11} />,
              },
            ] as const
          ).map(({ key, label, count, icon }) => {
            const isActive = filter === key;
            const activeColor =
              key === "correct"
                ? "var(--spark-correct-text)"
                : key === "incorrect"
                ? "var(--spark-wrong-text)"
                : "var(--foreground)";
            const activeBg =
              key === "correct"
                ? "var(--spark-correct-bg)"
                : key === "incorrect"
                ? "var(--spark-wrong-bg)"
                : "var(--card)";
            const activeBorder =
              key === "correct"
                ? "var(--spark-correct-border)"
                : key === "incorrect"
                ? "var(--spark-wrong-border)"
                : "var(--border)";

            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: isActive ? activeBg : "transparent",
                  color: isActive ? activeColor : "var(--muted-foreground)",
                  border: `1px solid ${isActive ? activeBorder : "transparent"}`,
                }}
              >
                {icon}
                {label} · {count}
              </button>
            );
          })}

          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="ml-auto flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            <LayoutGrid size={12} />
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>

        {/* ── Question list ────────────────────────────────────── */}
        {filteredItems.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <Target
              size={32}
              className="mx-auto mb-3 opacity-30"
              style={{ color: "var(--foreground)" }}
            />
            <p
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              No questions in this filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => (
              <QuestionCard
                key={item.questionId}
                item={item}
                expanded={expandedIds.has(item.questionId)}
                onToggle={() => toggleExpand(item.questionId)}
                initialBookmarked={bookmarkedIds.has(item.questionId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
