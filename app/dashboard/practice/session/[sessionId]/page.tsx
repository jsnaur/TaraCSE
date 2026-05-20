"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  XCircle,
  Sparkles,
  Loader2,
  ArrowLeft,
  RotateCcw,
  X,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getResumeSessionData,
  saveAnswer,
  completeSession,
  getUserMonetizationStatus,
} from "../../actions";
import { getBookmarkStatus } from "@/app/dashboard/bookmarks/actions";
import { useQuestionSession } from "@/components/question/useQuestionSession";
import { QuestionPlayer } from "@/components/question/QuestionPlayer";
import { NavDot } from "@/components/question/NavDot";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { id: string; text: string };

type Question = {
  id: string;
  category: string;
  text: string;
  options: Option[];
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResumeSessionPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();

  // Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Monetization
  const [isPremium, setIsPremium] = useState(false);
  const [aiUsesLeft, setAiUsesLeft] = useState<number | "unlimited">(3);
  const [showAiPaywall, setShowAiPaywall] = useState(false);

  // Bookmark
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Session
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [loadingAi, setLoadingAi] = useState(false);
  const [examSessionId, setExamSessionId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const sessionStartTime = useRef(Date.now());

  // ── Question Session Hook ─────────────────────────────────────────────────

  const session = useQuestionSession({
    mode: "practice",
    onAnswered: (questionId, selectedId, elapsed) => {
      if (!examSessionId) return;
      saveAnswer(examSessionId, questionId, selectedId, elapsed).catch((err) => {
        console.error("saveAnswer failed", err);
      });
    },
  });

  const {
    states,
    currentIndex,
    setCurrentIndex,
    initialize,
    handleSelect,
    toggleFlag,
    advance,
    goPrev,
    setAiExplanation,
  } = session;

  // ── Initial Fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!params.sessionId) return;

    Promise.all([
      getUserMonetizationStatus(),
      getResumeSessionData(params.sessionId),
    ]).then(([mono, resumeData]) => {
      if (!("error" in mono)) {
        setIsPremium(mono.isPremium ?? false);
        setAiUsesLeft(
          mono.isPremium ? "unlimited" : (mono.remainingAiUses ?? 3)
        );
      }

      if ("redirectTo" in resumeData && resumeData.redirectTo) {
        router.replace(resumeData.redirectTo);
        return;
      }

      if ("error" in resumeData) {
        setErrorMsg(resumeData.error ?? "An error occurred");
        setIsLoading(false);
        return;
      }

      const qs = resumeData.questions as Question[];
      const initStates = resumeData.initialStates as {
        selectedId: string | null;
        correctId: string | null;
        explanation: string | null;
      }[];
      const startIndex = resumeData.firstUnansweredIndex ?? 0;

      setExamSessionId(resumeData.examSessionId ?? null);
      setQuestions(qs);
      sessionStartTime.current = Date.now();

      // Initialize hook with pre-existing answer states from the server
      initialize(
        qs.map((q) => q.id),
        initStates,
        startIndex
      );

      // Load bookmarks for all question IDs
      const ids = qs.map((q) => q.id);
      if (ids.length > 0) {
        getBookmarkStatus(ids).then((bResult) => {
          if (!("error" in bResult)) {
            setBookmarkedIds(new Set(bResult.bookmarkedIds));
          }
        });
      }

      setIsLoading(false);
    });
  }, [params.sessionId, router, initialize]);

  // ── Complete session ──────────────────────────────────────────────────────

  async function handleComplete() {
    if (!examSessionId || isCompleting) return;
    setIsCompleting(true);
    const elapsed = Math.round(
      (Date.now() - sessionStartTime.current) / 1000
    );
    const result = await completeSession(examSessionId, questions.length, elapsed);
    if (result.success) {
      setFinalScore(result.score);
      setFinished(true);
    }
    setIsCompleting(false);
  }

  // ── KOT AI ────────────────────────────────────────────────────────────────

  async function handleAiHint(questionId: string) {
    if (!isPremium && typeof aiUsesLeft === "number" && aiUsesLeft <= 0) {
      setShowAiPaywall(true);
      return;
    }

    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/kot-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error === "exhausted") {
        setShowAiPaywall(true);
        return;
      }

      const hint =
        res.ok && typeof data.response === "string"
          ? data.response
          : process.env.NODE_ENV === "development" && data.error
          ? `KOT AI error: ${data.error}`
          : "KOT AI is unavailable right now. Please try again later.";

      setAiExplanation(currentIndex, hint);

      if (res.ok && typeof data.remaining === "number") {
        setAiUsesLeft(data.remaining);
      }
    } catch {
      setAiExplanation(
        currentIndex,
        "KOT AI is unavailable right now. Please try again later."
      );
    } finally {
      setLoadingAi(false);
    }
  }

  // ── Next: advance or complete ─────────────────────────────────────────────

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      advance();
    } else {
      handleComplete();
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--primary)",
              borderTopColor: "transparent",
            }}
          />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Resuming your session…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (errorMsg || questions.length === 0) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-6"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center flex flex-col items-center gap-4 max-w-sm">
          <XCircle size={48} style={{ color: "var(--spark-wrong-text)" }} />
          <p
            className="font-heading font-bold text-xl"
            style={{ color: "var(--foreground)" }}
          >
            {errorMsg ?? "No questions found"}
          </p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            This session may have expired or all questions have been answered.
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

  // ── Finished screen ───────────────────────────────────────────────────────

  if (finished) {
    const pct = Math.round((finalScore / questions.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚";
    const message =
      pct >= 80
        ? "Kahanga-hanga! Outstanding performance!"
        : pct >= 60
        ? "Magaling! You're on the right track."
        : "Kaya mo 'yan — keep pushing!";

    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-6"
        style={{ background: "var(--background)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
        >
          <motion.span
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="text-7xl"
          >
            {emoji}
          </motion.span>

          <div>
            <p
              className="text-sm font-medium uppercase tracking-widest mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Session Complete
            </p>
            <p
              className="font-heading text-5xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {finalScore}/{questions.length}
            </p>
            <p
              className="font-heading text-xl mt-1"
              style={{ color: "var(--primary)" }}
            >
              {pct}% Accuracy
            </p>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {examSessionId && (
              <Link href={`/dashboard/practice/review/${examSessionId}`}>
                <Button
                  className="w-full rounded-2xl h-12 font-heading font-semibold text-base"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Review Answers
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              className="w-full rounded-2xl h-12 font-heading font-semibold text-base"
              onClick={() => router.push("/dashboard/practice")}
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <BookOpen size={16} className="mr-2" />
              Return to Practice Hub
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  const q = questions[currentIndex];
  const currentState = states[currentIndex];

  // Guard: hook state not yet initialized
  if (!currentState || !q) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const answered = states.filter((s) => s.selectedId !== null).length;
  const progressPct = Math.round((answered / questions.length) * 100);

  return (
    <div
      className="fixed inset-0 flex flex-col lg:grid lg:grid-cols-[1fr_280px] overflow-hidden"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* ══════════════════════════════════════════
          LEFT: Question area
      ══════════════════════════════════════════ */}
      <div
        className="flex flex-col h-full overflow-hidden border-r"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Header */}
        <header
          className="shrink-0 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <Link
            href="/dashboard/practice"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Practice</span>
          </Link>

          <div className="flex items-center gap-2">
            <Badge
              className="text-[10px] px-2 py-0.5 rounded-lg border-0 gap-1"
              style={{
                background: "var(--spark-ai-border)",
                color: "var(--spark-ai-text)",
              }}
            >
              <RotateCcw size={9} />
              Resuming
            </Badge>
            <span
              className="text-sm font-heading font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {currentIndex + 1}
              <span
                className="font-normal"
                style={{ color: "var(--muted-foreground)" }}
              >
                /{questions.length}
              </span>
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleComplete}
            disabled={isCompleting || answered === 0}
            className="rounded-xl text-xs font-bold gap-1.5 h-8"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              opacity: answered === 0 ? 0.5 : 1,
            }}
          >
            {isCompleting && <Loader2 size={12} className="animate-spin" />}
            Finish
          </Button>
        </header>

        {/* Progress bar */}
        <div
          className="shrink-0 px-4 sm:px-5 py-2 border-b"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <Progress value={progressPct} className="h-1.5" />
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {answered} answered
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {questions.length - answered} remaining
            </span>
          </div>
        </div>

        {/* QuestionPlayer — takes remaining height */}
        <div className="flex-1 overflow-hidden">
          <QuestionPlayer
            question={q}
            state={currentState}
            mode="practice"
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            canGoPrev={currentIndex > 0}
            canGoNext={currentIndex < questions.length - 1 || !isCompleting}
            onSelect={handleSelect}
            onPrev={goPrev}
            onNext={handleNext}
            onToggleFlag={() => toggleFlag(currentIndex)}
            isBookmarked={bookmarkedIds.has(q.id)}
            onRequestAiHint={
              currentState.correctId !== null
                ? () => handleAiHint(q.id)
                : undefined
            }
            loadingAi={loadingAi}
            isPremium={isPremium}
            aiUsesLeft={aiUsesLeft}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT: Navigator sidebar (lg+ only)
      ══════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col gap-4 p-5 overflow-y-auto"
        style={{ background: "var(--card)" }}
      >
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "var(--foreground)" }}
          >
            Navigator
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {answered}/{questions.length} answered
          </p>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((_, i) => (
            <NavDot
              key={i}
              index={i}
              state={states[i]}
              isCurrent={i === currentIndex}
              isFlagged={states[i]?.isFlagged ?? false}
              mode="practice"
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 mt-2">
          {[
            { color: "var(--primary)", label: "Current" },
            {
              color: "var(--spark-correct-text)",
              bg: "var(--spark-correct-bg)",
              label: "Correct",
            },
            {
              color: "var(--spark-wrong-text)",
              bg: "var(--spark-wrong-bg)",
              label: "Incorrect",
            },
            { color: "var(--muted-foreground)", label: "Unanswered" },
          ].map(({ color, bg, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-md shrink-0"
                style={{ background: bg ?? color, border: `1px solid ${color}` }}
              />
              <span
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {label}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div
              className="relative w-4 h-4 rounded-md shrink-0"
              style={{ background: "var(--muted)" }}
            >
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: "rgb(245,158,11)" }}
              />
            </div>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Flagged
            </span>
          </div>
        </div>

        {/* Finish button in sidebar */}
        <div className="mt-auto pt-4">
          <Button
            onClick={handleComplete}
            disabled={isCompleting || answered === 0}
            className="w-full rounded-2xl font-heading font-bold gap-2"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              opacity: answered === 0 ? 0.5 : 1,
            }}
          >
            {isCompleting && <Loader2 size={14} className="animate-spin" />}
            Finish Session
          </Button>
          {answered === 0 && (
            <p
              className="text-[10px] text-center mt-1.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              Answer at least one question first
            </p>
          )}
        </div>
      </div>

      {/* AI Paywall modal */}
      {showAiPaywall && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-6"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 border shadow-2xl"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={18}
                  style={{ color: "var(--spark-ai-text)" }}
                />
                <span
                  className="font-heading font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  Unlock KOT AI
                </span>
              </div>
              <button
                onClick={() => setShowAiPaywall(false)}
                className="transition-opacity hover:opacity-60"
              >
                <X size={16} style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              You've used all your free AI hints. Upgrade to Premium for
              unlimited KOT AI explanations and all practice features.
            </p>
            <Link href="/pricing" onClick={() => setShowAiPaywall(false)}>
              <Button
                className="w-full rounded-2xl"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                Upgrade for ₱99
              </Button>
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}
