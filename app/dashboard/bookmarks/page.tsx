"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { MathText } from "@/components/ui/math-text";
import {
  Bookmark,
  Menu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSavedQuestions } from "./actions";

type SavedQuestion = {
  bookmarkId: string;
  bookmarkedAt: string;
  questionId: string;
  questionText: string;
  category: string;
  difficulty: string;
  level: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
};

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pulse className="h-5 w-16 rounded-full" />
          <Pulse className="h-5 w-12 rounded-full" />
        </div>
        <Pulse className="h-7 w-7 rounded-md shrink-0" />
      </div>
      <Pulse className="h-4 w-full" />
      <Pulse className="h-4 w-3/4" />
    </div>
  );
}

const DIFF_STYLE: Record<string, { bg: string; text: string }> = {
  Easy:   { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  Medium: { bg: "bg-amber-500/10",   text: "text-amber-500" },
  Hard:   { bg: "bg-rose-500/10",    text: "text-rose-500" },
};

const CAT_STYLE: Record<string, { bg: string; text: string }> = {
  "Verbal Ability":      { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  "Numerical Ability":   { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
  "Analytical Ability":  { bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400" },
  "General Information": { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
  "Clerical Operations": { bg: "bg-rose-500/10",    text: "text-rose-600 dark:text-rose-400" },
};

function catStyle(cat: string) {
  return CAT_STYLE[cat] ?? { bg: "bg-primary/10", text: "text-primary" };
}

function diffStyle(diff: string) {
  const d = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
  return DIFF_STYLE[d] ?? { bg: "bg-muted", text: "text-muted-foreground" };
}

function QuestionCard({
  question,
  expanded,
  onToggle,
  onUnbookmark,
}: {
  question: SavedQuestion;
  expanded: boolean;
  onToggle: () => void;
  onUnbookmark: (questionId: string) => void;
}) {
  const cs = catStyle(question.category);
  const ds = diffStyle(question.difficulty);

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <button
          onClick={onToggle}
          className="flex-1 flex items-start gap-3 text-left hover:opacity-80 transition-opacity min-w-0"
        >
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cs.bg} ${cs.text}`}
              >
                {question.category}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ds.bg} ${ds.text}`}
              >
                {question.difficulty}
              </span>
            </div>
            <MathText
              text={question.questionText}
              block
              className="text-sm font-medium leading-snug line-clamp-2"
              style={{ color: "var(--foreground)" }}
            />
          </div>
          <div className="shrink-0 mt-0.5">
            {expanded ? (
              <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} />
            ) : (
              <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
            )}
          </div>
        </button>

        <div className="shrink-0 -mt-1 -mr-1">
          <BookmarkButton
            questionId={question.questionId}
            initialBookmarked={true}
            size="sm"
            onToggle={(id, bm) => {
              if (!bm) onUnbookmark(id);
            }}
          />
        </div>
      </div>

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
              <MathText
                text={question.questionText}
                block
                className="text-sm mt-3 leading-relaxed"
                style={{ color: "var(--foreground)" }}
              />

              <div className="flex flex-col gap-2">
                {question.options.map((opt) => {
                  const isCorrect = opt.id === question.correctOptionId;
                  return (
                    <div
                      key={opt.id}
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 border"
                      style={{
                        background: isCorrect
                          ? "var(--spark-correct-bg)"
                          : "var(--muted)",
                        borderColor: isCorrect
                          ? "var(--spark-correct-border)"
                          : "transparent",
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-heading shrink-0 mt-0.5"
                        style={{
                          background: isCorrect
                            ? "var(--spark-correct-border)"
                            : "var(--border)",
                          color: isCorrect
                            ? "var(--spark-correct-text)"
                            : "var(--muted-foreground)",
                        }}
                      >
                        {opt.id.toUpperCase()}
                      </span>
                      <MathText
                        text={opt.text}
                        className="text-sm flex-1 leading-snug"
                        style={{
                          color: isCorrect
                            ? "var(--spark-correct-text)"
                            : "var(--muted-foreground)",
                        }}
                      />
                      {isCorrect && (
                        <CheckCircle2
                          size={14}
                          className="shrink-0 mt-0.5"
                          style={{ color: "var(--spark-correct-text)" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

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
                  text={question.explanation}
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

export default function BookmarksPage() {
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSavedQuestions().then((result) => {
      if ("error" in result) {
        setError(result.error);
      } else {
        setQuestions(result.questions);
      }
      setLoading(false);
    });
  }, []);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleUnbookmark(questionId: string) {
    setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  }

  const categories = ["All", ...Array.from(new Set(questions.map((q) => q.category)))];

  const filtered =
    selectedCategory === "All"
      ? questions
      : questions.filter((q) => q.category === selectedCategory);

  const isEmpty = !loading && !error && questions.length === 0;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-4 md:px-5 h-[52px] min-h-[52px] border-b border-border flex items-center gap-3 bg-background transition-colors duration-200">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2 text-muted-foreground shrink-0"
              >
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
            Saved Questions
          </div>

          {!loading && !error && questions.length > 0 && (
            <span className="hidden sm:inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
              {questions.length}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2 md:gap-4 text-[11px] text-muted-foreground shrink-0">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-6">

              <div className="space-y-1.5">
                <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
                  <Bookmark className="h-6 w-6 text-primary" fill="currentColor" />
                  Saved Questions
                  {!loading && !error && questions.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {questions.length}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Questions you've saved for focused review.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-500">
                  Could not load saved questions. Please refresh the page.
                </div>
              )}

              {isEmpty && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bookmark className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="font-heading text-lg font-bold mb-1">No saved questions yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Bookmark questions during practice sessions to review them here later.
                  </p>
                  <Link
                    href="/dashboard/practice"
                    className="mt-5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Start practicing
                  </Link>
                </div>
              )}

              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {!loading && !error && questions.length > 0 && (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      const count =
                        cat === "All"
                          ? questions.length
                          : questions.filter((q) => q.category === cat).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150"
                          style={{
                            background: isActive ? "var(--primary)" : "var(--muted)",
                            color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
                          }}
                        >
                          {cat}
                          <span
                            className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold"
                            style={{
                              background: isActive
                                ? "rgba(255,255,255,0.25)"
                                : "var(--border)",
                              color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {filtered.length === 0 ? (
                    <div
                      className="rounded-2xl border p-10 text-center"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        No questions in this category.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {filtered.map((q) => (
                          <motion.div
                            key={q.questionId}
                            initial={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                          >
                            <QuestionCard
                              question={q}
                              expanded={expandedIds.has(q.questionId)}
                              onToggle={() => toggleExpand(q.questionId)}
                              onUnbookmark={handleUnbookmark}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
