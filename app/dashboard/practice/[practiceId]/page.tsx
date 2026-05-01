"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  Loader2,
  X,
  Target,
  ArrowLeft,
  ArrowRight,
  Flag,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  getUserMonetizationStatus, 
  decrementKotAiUsage, 
  getPracticeQuestions, 
  checkPracticeAnswer 
} from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { id: string; text: string };

type Question = {
  id: string;
  category: string;
  text: string;
  options: Option[];
};

type QuestionState = {
  selectedId: string | null;
  correctId: string | null;
  explanation: string | null;
  aiHint: string | null;
  isChecking: boolean; // For just-in-time backend validation
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const router = useRouter();
  const params = useParams<{ practiceId: string }>();
  
  // Data State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [states, setStates] = useState<QuestionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Monetization State
  const [isPremium, setIsPremium] = useState(false);
  const [aiUsesLeft, setAiUsesLeft] = useState<number | "unlimited">(3);
  const [showAiPaywall, setShowAiPaywall] = useState(false);

  // Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // ── Initial Fetch (REPLACES MOCK DATA) ───────────────────────────────────
  useEffect(() => {
    async function loadSession() {
      if (!params.practiceId) return;

      const [status, sessionData] = await Promise.all([
        getUserMonetizationStatus(),
        getPracticeQuestions(params.practiceId)
      ]);

      if (status && !status.error) {
        setIsPremium(status.isPremium);
        setAiUsesLeft(status.isPremium ? "unlimited" : status.remainingAiUses);
      }

      if (sessionData.error || !sessionData.questions) {
        setErrorMsg(sessionData.error || "Failed to load questions.");
      } else {
        setQuestions(sessionData.questions);
        setStates(
          sessionData.questions.map(() => ({
            selectedId: null,
            correctId: null,
            explanation: null,
            aiHint: null,
            isChecking: false,
          }))
        );
      }

      setIsLoading(false);
    }
    loadSession();
  }, [params.practiceId]);

  // Loading & Error States
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Fetching your questions...</p>
      </div>
    );
  }

  if (errorMsg || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full border border-border shadow-md">
          <CardContent className="p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Session Error</h2>
            <p className="text-muted-foreground text-sm">{errorMsg || "No questions available for these categories."}</p>
            <Button onClick={() => router.push("/dashboard/practice")} className="mt-4 w-full">
              Return to Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentIndex];
  const currentState = states[currentIndex];
  const total = questions.length;

  const isAnswered = currentState.selectedId !== null;
  const isCorrect = isAnswered && currentState.selectedId === currentState.correctId;

  const checkedCount = states.filter((s) => s.selectedId !== null).length;
  const score = states.filter((s) => s.selectedId !== null && s.selectedId === s.correctId).length;
  const progressValue = (checkedCount / total) * 100;

  // ── Handle Select (Just-In-Time Backend Grading) ──────────────────────────
  async function handleSelect(id: string) {
    if (currentState.selectedId !== null || currentState.isChecking) return; 

    // Optimistically lock the UI and show checking spinner
    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], isChecking: true };
      return next;
    });

    // Fetch the correct answer and explanation securely from backend
    const answerData = await checkPracticeAnswer(question.id);

    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = { 
        ...next[currentIndex], 
        selectedId: id,
        correctId: answerData.correctId || id, // Fallback safety
        explanation: answerData.explanation || "No explanation available.",
        isChecking: false 
      };
      return next;
    });
  }

  // ── Flag toggle ──────────────────────────────────────────────────────────
  function toggleFlag(index: number) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  // ── Advance or finish ────────────────────────────────────────────────────
  function advanceOrFinish() {
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  // ── AI Hint & Paywall Logic ──────────────────────────────────────────────
  const handleAiHint = async () => {
    // Check if free user has exhausted uses
    if (!isPremium && typeof aiUsesLeft === "number" && aiUsesLeft <= 0) {
      setShowAiPaywall(true);
      return;
    }

    setLoadingAi(true);

    // If not premium, decrement usage in backend
    if (!isPremium) {
      const res = await decrementKotAiUsage();
      if (res.error === "exhausted") {
        setShowAiPaywall(true);
        setLoadingAi(false);
        return;
      }
      if (res.success && typeof res.remaining === "number") {
        setAiUsesLeft(res.remaining);
      }
    }

    // Simulate AI request (Replace with real KOT API Call integration)
    await new Promise((r) => setTimeout(r, 1400));
    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        aiHint:
          "💡 KOT AI Breakdown: Review the context of the question carefully. Try eliminating the choices that are factually opposite to the main premise.",
      };
      return next;
    });
    setLoadingAi(false);
  };

  // ── Sidebar grid cell variant ────────────────────────────────────────────
  function getCellVariant(i: number): "unanswered" | "correct" | "wrong" | "current" | "current-correct" | "current-wrong" {
    const s = states[i];
    const isCurrent = i === currentIndex;
    const answered = s.selectedId !== null;
    const correct = answered && s.selectedId === s.correctId;

    if (isCurrent) {
      if (!answered) return "current";
      return correct ? "current-correct" : "current-wrong";
    }

    if (!answered) return "unanswered";
    return correct ? "correct" : "wrong";
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

  // ── Main Practice UI ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-background lg:grid lg:grid-cols-[1fr_300px] overflow-hidden text-foreground">

      {/* ════════════════════════════════════════
          LEFT COLUMN
      ════════════════════════════════════════ */}
      <div className="flex flex-col h-full overflow-hidden border-r border-border">

        {/* ── Header ── */}
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
          <Badge variant="outline" className="hidden sm:inline-flex bg-card">
            {question.category}
          </Badge>
        </header>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto">
          <main className="w-full max-w-3xl mx-auto px-6 py-8 pb-4">

            {/* Mobile progress */}
            <div className="mb-8 space-y-3 lg:hidden">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                <span>Question {currentIndex + 1} of {total}</span>
                <span>{checkedCount} Completed</span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Question card */}
                <Card className="rounded-3xl border shadow-sm bg-card mb-6">
                  <CardContent className="p-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                      Question {currentIndex + 1}
                    </p>
                    <p
                      className="font-heading text-[1.2rem] font-semibold leading-[1.75] text-foreground whitespace-pre-line"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(question.text),
                      }}
                    />
                  </CardContent>
                </Card>

                {/* ── Options ── */}
                <div className="space-y-3 mb-8">
                  {question.options.map((opt) => {
                    const isSelected = currentState.selectedId === opt.id;
                    const isRight = opt.id === currentState.correctId;
                    const locked = isAnswered || currentState.isChecking;

                    let cardClass =
                      "w-full text-left p-5 rounded-2xl border-[1.5px] transition-all duration-200 flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ";

                    if (!isAnswered) {
                      cardClass +=
                        "cursor-pointer border-border bg-card hover:border-primary/50 hover:bg-muted/50";
                    } else if (isRight) {
                      cardClass +=
                        "cursor-default border-[var(--spark-correct-border)] bg-[var(--spark-correct-bg)] text-[var(--spark-correct-text)]";
                    } else if (isSelected && !isRight) {
                      cardClass +=
                        "cursor-default border-[var(--spark-wrong-border)] bg-[var(--spark-wrong-bg)] text-[var(--spark-wrong-text)]";
                    } else {
                      cardClass +=
                        "cursor-default border-border bg-card opacity-40";
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={locked}
                        onClick={() => handleSelect(opt.id)}
                        className={cardClass}
                      >
                        <span
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-heading font-bold shrink-0 transition-colors relative",
                            !isAnswered
                              ? "bg-muted text-muted-foreground"
                              : isRight
                              ? "bg-[var(--spark-correct-text)] text-[var(--spark-correct-bg)]"
                              : isSelected
                              ? "bg-[var(--spark-wrong-text)] text-[var(--spark-wrong-bg)]"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {currentState.isChecking && isSelected ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            opt.id.toUpperCase()
                          )}
                        </span>
                        <span className="font-medium text-sm leading-relaxed flex-1">
                          {opt.text}
                        </span>
                        {isAnswered && isRight && (
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--spark-correct-text)]" />
                        )}
                        {isAnswered && isSelected && !isRight && (
                          <XCircle className="w-5 h-5 shrink-0 text-[var(--spark-wrong-text)]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ── Explanation card ── */}
                <AnimatePresence>
                  {isAnswered && currentState.explanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
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
                            {currentState.explanation}
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
                                className="rounded-xl border-[1.5px] font-semibold text-sm transition-all"
                                style={{
                                  background: "var(--spark-ai-bg)",
                                  color: "var(--spark-ai-text)",
                                  borderColor: "var(--spark-ai-border)",
                                }}
                              >
                                {loadingAi ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing…
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Ask KOT AI 
                                    {!isPremium && typeof aiUsesLeft === "number" && (
                                      <span className="ml-1.5 opacity-60 text-[10px] uppercase tracking-wider font-bold">
                                        ({aiUsesLeft} left)
                                      </span>
                                    )}
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

                {/* ── Next / Finish button ── */}
                <AnimatePresence>
                  {isAnswered && !currentState.isChecking && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="mb-4"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* ── Navigation Footer ── */}
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

        <div className="lg:hidden h-20" />
      </div>

      {/* ════════════════════════════════════════
          RIGHT COLUMN — Sidebar
      ════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col gap-5 sticky top-0 h-screen overflow-y-auto p-5 bg-card border-l border-border">

        {/* Score counter */}
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

        {/* Question Navigator */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Question Navigator
          </p>

          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_, i) => {
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
                    variant === "correct" &&
                      "bg-[var(--spark-correct-bg)] border-[1.5px] border-[var(--spark-correct-border)] text-[var(--spark-correct-text)]",
                    variant === "wrong" &&
                      "bg-[var(--spark-wrong-bg)] border-[1.5px] border-[var(--spark-wrong-border)] text-[var(--spark-wrong-text)]",
                    variant === "current" &&
                      "border-[2px] border-foreground/30 text-foreground font-extrabold bg-muted ring-2 ring-foreground/20 ring-offset-2",
                    variant === "current-correct" &&
                      "bg-[var(--spark-correct-bg)] border-[1.5px] border-[var(--spark-correct-border)] text-[var(--spark-correct-text)] ring-2 ring-[var(--spark-correct-border)] ring-offset-2",
                    variant === "current-wrong" &&
                      "bg-[var(--spark-wrong-bg)] border-[1.5px] border-[var(--spark-wrong-border)] text-[var(--spark-wrong-text)] ring-2 ring-[var(--spark-wrong-border)] ring-offset-2"
                  )}
                >
                  {i + 1}
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

        {/* Progress summary */}
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
            <span>{checkedCount} answered</span>
            <span>{total - checkedCount} remaining</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Exit */}
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

      {/* ── KOT AI Paywall Modal ────────────────────────────────────────── */}
      <AlertDialog open={showAiPaywall} onOpenChange={setShowAiPaywall}>
        <AlertDialogContent className="rounded-[32px] sm:rounded-[32px] max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-primary w-8 h-8" />
            </div>
            <AlertDialogTitle className="font-heading text-2xl text-center">AI Limit Reached</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              You've used all your free KOT AI explanations! Unlock unlimited step-by-step AI assistance and the full question bank for only ₱99.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center sm:space-x-3 mt-4 flex-col gap-2">
            <AlertDialogAction
              onClick={() => router.push("/pricing")}
              className="rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 w-full font-bold py-6 text-base"
            >
              <Sparkles size={18} className="mr-2" /> Upgrade to Premium
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-2xl border-transparent bg-muted hover:bg-muted/80 w-full sm:mt-0">
              Not Now
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}