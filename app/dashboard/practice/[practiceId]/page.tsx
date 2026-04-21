"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  Trophy,
  Brain,
  Loader2,
  X,
  Target,
  ArrowLeft,
  ArrowRight,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { id: string; text: string };

type Question = {
  id: number;
  category: string;
  categoryIcon: "vocab" | "math" | "reading";
  text: string;
  options: Option[];
  correctId: string;
  explanation: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Vocabulary",
    categoryIcon: "vocab",
    text: 'Choose the word that is closest in meaning to the underlined word.\n\n"The senator delivered an **eloquent** speech that moved many in the audience to tears."',
    options: [
      { id: "a", text: "Persuasive and well-expressed" },
      { id: "b", text: "Loud and boisterous" },
      { id: "c", text: "Brief and concise" },
      { id: "d", text: "Confusing and unclear" },
    ],
    correctId: "a",
    explanation:
      "Eloquent means fluent, persuasive, and well-expressed in speech or writing. A speaker who is eloquent conveys ideas clearly and movingly — exactly what the context implies.",
  },
  {
    id: 2,
    category: "Numerical Reasoning",
    categoryIcon: "math",
    text: "A government employee earns ₱18,500 per month. If she receives a 12% salary increase, what will her new monthly salary be?",
    options: [
      { id: "a", text: "₱20,220" },
      { id: "b", text: "₱20,720" },
      { id: "c", text: "₱21,200" },
      { id: "d", text: "₱19,850" },
    ],
    correctId: "b",
    explanation:
      "12% of ₱18,500 = ₱2,220. Add to original: ₱18,500 + ₱2,220 = ₱20,720. Always multiply the base salary by the percentage increase, then add it back to find the new total.",
  },
  {
    id: 3,
    category: "Vocabulary",
    categoryIcon: "vocab",
    text: 'Select the word that is OPPOSITE in meaning to the underlined word.\n\n"The committee made a **hasty** decision without reviewing all the facts."',
    options: [
      { id: "a", text: "Impulsive" },
      { id: "b", text: "Deliberate" },
      { id: "c", text: "Reckless" },
      { id: "d", text: "Careless" },
    ],
    correctId: "b",
    explanation:
      "Hasty means done too quickly without careful thought. Its antonym is deliberate, which means done with full consideration and intention. Options A, C, and D are all synonyms or near-synonyms of hasty.",
  },
  {
    id: 4,
    category: "Numerical Reasoning",
    categoryIcon: "math",
    text: "In a barangay election, Candidate A received 3/5 of the total votes cast, and Candidate B received the remaining votes. If Candidate B got 480 votes, how many total votes were cast?",
    options: [
      { id: "a", text: "1,100" },
      { id: "b", text: "1,200" },
      { id: "c", text: "1,250" },
      { id: "d", text: "1,320" },
    ],
    correctId: "b",
    explanation:
      "Candidate B received 2/5 of total votes (since A got 3/5). So 2/5 × Total = 480. Therefore Total = 480 ÷ (2/5) = 480 × 5/2 = 1,200 votes.",
  },
  {
    id: 5,
    category: "Reading Comprehension",
    categoryIcon: "reading",
    text: 'Read the passage and answer the question.\n\n*"The Philippine Civil Service Commission was established to promote morale, efficiency, integrity, and responsiveness in the civil service. It serves as the central personnel agency of the government."*\n\nWhat is the PRIMARY role of the Civil Service Commission according to the passage?',
    options: [
      { id: "a", text: "To audit government financial transactions" },
      { id: "b", text: "To serve as the central personnel agency of the government" },
      { id: "c", text: "To create laws governing public officials" },
      { id: "d", text: "To resolve disputes between government agencies" },
    ],
    correctId: "b",
    explanation:
      'The passage explicitly states that the CSC "serves as the central personnel agency of the government." While promoting morale and integrity are mentioned as goals, the primary structural role identified is that of the central personnel agency.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

type QuestionState = {
  selectedId: string | null;
  checked: boolean;
  aiHint: string | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Flagging state (ported from mockId/page.tsx)
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // Maintain state for all questions so users can navigate the grid
  const [states, setStates] = useState<QuestionState[]>(
    QUESTIONS.map(() => ({ selectedId: null, checked: false, aiHint: null }))
  );

  const question = QUESTIONS[currentIndex];
  const currentState = states[currentIndex];
  const total = QUESTIONS.length;

  // Derived Stats
  const answeredCount = states.filter((s) => s.selectedId !== null).length;
  const checkedCount = states.filter((s) => s.checked).length;
  const score = states.filter(
    (s, i) => s.checked && s.selectedId === QUESTIONS[i].correctId
  ).length;
  const progressValue = (checkedCount / total) * 100;
  const isCorrect = currentState.selectedId === question.correctId;

  // ── Flag toggle (ported from mockId/page.tsx) ────────────────────────────
  function toggleFlag(index: number) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const handleSelect = (id: string) => {
    if (currentState.checked) return;
    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], selectedId: id };
      return next;
    });
  };

  const handleCheck = () => {
    if (!currentState.selectedId) return;
    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], checked: true };
      return next;
    });
  };

  // Shared "advance" logic used by both the inline button and the footer Next button
  function advanceOrFinish() {
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  const handleAiHint = async () => {
    setLoadingAi(true);
    await new Promise((r) => setTimeout(r, 1400));
    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        aiHint:
          "💡 Think carefully about the context. Eliminate obviously incorrect choices first to narrow down your options.",
      };
      return next;
    });
    setLoadingAi(false);
  };

  // ── Grid Cell Variant Mapping ────────────────────────────────────────────
  function getCellVariant(
    i: number
  ):
    | "unanswered"
    | "answered"
    | "correct"
    | "wrong"
    | "current"
    | "current-answered"
    | "current-correct"
    | "current-wrong" {
    const s = states[i];
    const isCurrent = i === currentIndex;
    const isAnswered = s.selectedId !== null;
    const isChecked = s.checked;
    const isAnsCorrect = isChecked && s.selectedId === QUESTIONS[i].correctId;

    if (isCurrent) {
      if (isChecked) return isAnsCorrect ? "current-correct" : "current-wrong";
      if (isAnswered) return "current-answered";
      return "current";
    }

    if (isChecked) return isAnsCorrect ? "correct" : "wrong";
    if (isAnswered) return "answered";
    return "unanswered";
  }

  // ── Finished Screen ──────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / total) * 100);
    const message =
      pct >= 80
        ? "Kahanga-hanga! 🎉 Outstanding performance!"
        : pct >= 60
        ? "Magaling! 👍 You're on the right track."
        : "Keep going! 💪 Practice makes perfect.";

    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md text-center"
        >
          <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden bg-card border-border">
            <div
              className="h-2 w-full"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-2)))",
              }}
            />
            <CardContent className="p-10 space-y-6">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="text-7xl"
              >
                {pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚"}
              </motion.div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                  Practice Complete
                </p>
                <h1 className="font-heading text-4xl font-bold text-foreground">
                  {score}/{total}
                </h1>
                <p className="text-xl font-heading font-semibold mt-1 text-primary">
                  {pct}% Correct
                </p>
              </div>
              <p className="text-base text-muted-foreground font-medium">
                {message}
              </p>
              <div className="pt-4 flex flex-col gap-3">
                <Button
                  className="w-full h-12 rounded-2xl font-heading font-semibold text-base"
                  onClick={() => router.push("/dashboard/practice")}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Main Practice UI ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-background lg:grid lg:grid-cols-[1fr_300px] overflow-hidden text-foreground">

      {/* ════════════════════════════════════════
          LEFT COLUMN — Main Content Area
      ════════════════════════════════════════ */}
      <div className="flex flex-col h-full overflow-hidden border-r border-border">

        {/* ── Minimal Top Navigation ── */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/practice")}
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-full bg-muted/50 hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-heading text-sm md:text-base font-extrabold tracking-tight">
                Practice Session
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold hidden sm:block">
                Focus Mode Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex bg-card">
              {question.category}
            </Badge>
          </div>
        </header>

        {/* ── Scrollable Question Area ── */}
        <div className="flex-1 overflow-y-auto">
          <main className="w-full max-w-3xl mx-auto px-6 py-8 pb-4">

            {/* Progress Header (Mobile Only) */}
            <div className="mb-8 space-y-3 lg:hidden">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                <span>Question {currentIndex + 1} of {total}</span>
                <span>{checkedCount} Completed</span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Card className="rounded-3xl border shadow-sm bg-card mb-6">
                  <CardContent className="p-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                      Question {currentIndex + 1}
                    </p>
                    <p
                      className="font-heading text-xl md:text-2xl font-semibold text-foreground leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(question.text),
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Options */}
                <div className="space-y-3 mb-8">
                  {question.options.map((opt) => {
                    const isSelected = currentState.selectedId === opt.id;
                    const isRight = opt.id === question.correctId;
                    const isChecked = currentState.checked;

                    let cardClass =
                      "w-full text-left p-5 rounded-2xl border-[1.5px] transition-all duration-200 cursor-pointer group flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ";

                    if (!isChecked) {
                      cardClass += isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-border/80 hover:bg-muted/50";
                    } else if (isRight) {
                      cardClass +=
                        "border-[var(--spark-correct-border)] bg-[var(--spark-correct-bg)] text-[var(--spark-correct-text)]";
                    } else if (isSelected && !isRight) {
                      cardClass +=
                        "border-[var(--spark-wrong-border)] bg-[var(--spark-wrong-bg)] text-[var(--spark-wrong-text)]";
                    } else {
                      cardClass += "border-border bg-card opacity-50";
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isChecked}
                        onClick={() => handleSelect(opt.id)}
                        className={cardClass}
                      >
                        <span
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-heading font-bold shrink-0 transition-colors",
                            !isChecked
                              ? isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                              : isRight
                              ? "bg-[var(--spark-correct-text)] text-[var(--spark-correct-bg)]"
                              : isSelected
                              ? "bg-[var(--spark-wrong-text)] text-[var(--spark-wrong-bg)]"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {opt.id.toUpperCase()}
                        </span>
                        <span className="font-medium text-base leading-snug flex-1">
                          {opt.text}
                        </span>
                        {isChecked && isRight && (
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--spark-correct-text)]" />
                        )}
                        {isChecked && isSelected && !isRight && (
                          <XCircle className="w-5 h-5 shrink-0 text-[var(--spark-wrong-text)]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                <AnimatePresence>
                  {currentState.checked && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="mb-8"
                    >
                      <Card
                        className="rounded-2xl border-[1.5px] shadow-sm"
                        style={{
                          borderColor: isCorrect
                            ? "var(--spark-correct-border)"
                            : "var(--spark-wrong-border)",
                          background: isCorrect
                            ? "var(--spark-correct-bg)"
                            : "var(--spark-wrong-bg)",
                        }}
                      >
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle2
                                className="w-5 h-5"
                                style={{ color: "var(--spark-correct-text)" }}
                              />
                            ) : (
                              <XCircle
                                className="w-5 h-5"
                                style={{ color: "var(--spark-wrong-text)" }}
                              />
                            )}
                            <p
                              className="font-heading font-bold text-base"
                              style={{
                                color: isCorrect
                                  ? "var(--spark-correct-text)"
                                  : "var(--spark-wrong-text)",
                              }}
                            >
                              {isCorrect
                                ? "Tama! That's correct."
                                : "Hindi tama. Here's why:"}
                            </p>
                          </div>
                          <p
                            className="text-sm leading-relaxed font-medium"
                            style={{
                              color: isCorrect
                                ? "var(--spark-correct-text)"
                                : "var(--spark-wrong-text)",
                              opacity: 0.9,
                            }}
                          >
                            {question.explanation}
                          </p>

                          {/* AI Hint Section */}
                          {currentState.aiHint ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="rounded-xl p-4 border-[1.5px] mt-4"
                              style={{
                                background: "var(--spark-ai-bg)",
                                borderColor: "var(--spark-ai-border)",
                              }}
                            >
                              <p
                                className="text-sm font-medium leading-relaxed"
                                style={{ color: "var(--spark-ai-text)" }}
                              >
                                {currentState.aiHint}
                              </p>
                            </motion.div>
                          ) : (
                            <div className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAiHint}
                                disabled={loadingAi}
                                className="rounded-xl border-[1.5px] font-semibold text-sm"
                                style={{
                                  background: "var(--spark-ai-bg)",
                                  color: "var(--spark-ai-text)",
                                  borderColor: "var(--spark-ai-border)",
                                }}
                              >
                                {loadingAi ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Asking AI…
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Ask AI for a Hint
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Inline Check / Next Button (below options) ── */}
                <motion.div layout className="mb-4">
                  {!currentState.checked ? (
                    <Button
                      size="lg"
                      className="w-full h-14 rounded-2xl font-heading font-bold text-lg shadow-md transition-all"
                      disabled={!currentState.selectedId}
                      onClick={handleCheck}
                    >
                      Check Answer
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full h-14 rounded-2xl font-heading font-bold text-lg shadow-md group"
                      onClick={advanceOrFinish}
                    >
                      {currentIndex + 1 === total
                        ? "Finish Practice"
                        : "Next Question"}
                      <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* ── Navigation Footer (ported from mockId/page.tsx) ── */}
        <footer className="px-6 py-4 border-t border-border shrink-0 bg-background">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFlag(currentIndex)}
                className={cn(
                  "gap-1.5 text-muted-foreground",
                  flagged.has(currentIndex) &&
                    "text-amber-600 hover:text-amber-700"
                )}
                title={
                  flagged.has(currentIndex) ? "Remove flag" : "Flag for review"
                }
              >
                <Flag
                  className={cn(
                    "w-3.5 h-3.5",
                    flagged.has(currentIndex) && "fill-current"
                  )}
                />
                <span className="hidden sm:inline">
                  {flagged.has(currentIndex) ? "Flagged" : "Flag"}
                </span>
              </Button>
            </div>

            <Button
              onClick={() =>
                setCurrentIndex((i) => Math.min(total - 1, i + 1))
              }
              disabled={currentIndex === total - 1}
              className="gap-1.5 font-heading font-bold"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </footer>

        {/* Mobile: bottom padding for fixed submit bar */}
        <div className="lg:hidden h-20" />
      </div>

      {/* ════════════════════════════════════════
          RIGHT COLUMN — Persistent Sidebar
      ════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col gap-5 sticky top-0 h-screen overflow-y-auto p-5 bg-card border-l border-border">

        {/* ── Score Counter (retained from original practice page — NO timer) ── */}
        <div className="rounded-[var(--radius-lg)] border p-5 text-center border-border bg-muted/40">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Current Score
            </p>
          </div>

          <p className="font-mono text-[2.5rem] font-extrabold tracking-tight tabular-nums leading-none text-foreground">
            {score}
            <span className="text-xl text-muted-foreground/50">/{total}</span>
          </p>
        </div>

        {/* ── Question Navigation Grid ── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Question Navigator
          </p>

          <div className="grid grid-cols-5 gap-1.5">
            {QUESTIONS.map((_, i) => {
              const variant = getCellVariant(i);
              const isFlagged = flagged.has(i);

              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  title={`Q${i + 1}${states[i].selectedId !== null ? " · answered" : ""}${isFlagged ? " · flagged" : ""}`}
                  className={cn(
                    "relative aspect-square rounded-lg text-xs font-bold",
                    "transition-all duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",

                    variant === "unanswered" &&
                      "border-[1.5px] border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",

                    variant === "answered" &&
                      "bg-primary border-[1.5px] border-primary text-primary-foreground hover:bg-primary/85",

                    variant === "correct" &&
                      "bg-[var(--spark-correct-bg)] border-[1.5px] border-[var(--spark-correct-border)] text-[var(--spark-correct-text)]",

                    variant === "wrong" &&
                      "bg-[var(--spark-wrong-bg)] border-[1.5px] border-[var(--spark-wrong-border)] text-[var(--spark-wrong-text)]",

                    variant === "current" &&
                      "border-[2.5px] border-primary text-primary font-extrabold bg-background ring-2 ring-primary ring-offset-2",

                    variant === "current-answered" &&
                      "bg-primary border-[1.5px] border-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-2",

                    variant === "current-correct" &&
                      "bg-[var(--spark-correct-bg)] border-[1.5px] border-[var(--spark-correct-border)] text-[var(--spark-correct-text)] ring-2 ring-[var(--spark-correct-border)] ring-offset-2",

                    variant === "current-wrong" &&
                      "bg-[var(--spark-wrong-bg)] border-[1.5px] border-[var(--spark-wrong-border)] text-[var(--spark-wrong-text)] ring-2 ring-[var(--spark-wrong-border)] ring-offset-2"
                  )}
                >
                  {i + 1}
                  {/* Amber flag dot (ported from mockId/page.tsx) */}
                  {isFlagged && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-background" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-3 h-3 rounded-[3px] border border-border inline-block" />
              Unanswered
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-3 h-3 rounded-[3px] bg-[var(--spark-correct-bg)] border border-[var(--spark-correct-border)] inline-block" />
              Correct
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-3 h-3 rounded-[3px] bg-[var(--spark-wrong-bg)] border border-[var(--spark-wrong-border)] inline-block" />
              Incorrect
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-3 h-3 rounded-[3px] bg-amber-400 inline-block" />
              Flagged
            </div>
          </div>
        </div>

        {/* ── Progress Summary Card ── */}
        <div className="rounded-lg bg-muted/50 border border-border p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold text-primary">
              {checkedCount}/{total}
            </span>
          </div>
          <Progress
            value={progressValue}
            className="h-1.5 bg-muted [&>div]:bg-primary"
          />
          <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
            <span>{checkedCount} checked</span>
            <span>{total - checkedCount} remaining</span>
          </div>
        </div>

        {/* Spacer pushes exit to bottom */}
        <div className="flex-1" />

        {/* ── Exit Action (retained from original practice page) ── */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full font-heading font-extrabold text-sm tracking-wide border-border"
            onClick={() => router.push("/dashboard/practice")}
          >
            Exit Practice
          </Button>
          <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
            Your progress will not be saved if you exit early.
          </p>
        </div>
      </aside>
    </div>
  );
}