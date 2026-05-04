"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Flag,
  RotateCcw,
  X,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getResumeSessionData,
  checkPracticeAnswer,
  saveAnswer,
  completeSession,
  getUserMonetizationStatus,
  decrementKotAiUsage,
} from "../../actions";

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
  isChecking: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// ─── Navigator dot ────────────────────────────────────────────────────────────

function NavDot({
  index,
  state,
  isCurrent,
  isFlagged,
  onClick,
}: {
  index: number;
  state: QuestionState | undefined;
  isCurrent: boolean;
  isFlagged: boolean;
  onClick: () => void;
}) {
  const answered = state?.selectedId != null;
  const correct = answered && state?.selectedId === state?.correctId;

  return (
    <button
      onClick={onClick}
      title={`Question ${index + 1}`}
      className="relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-heading transition-all duration-150 hover:scale-110"
      style={{
        background: isCurrent
          ? "var(--primary)"
          : answered
          ? correct
            ? "var(--spark-correct-bg)"
            : "var(--spark-wrong-bg)"
          : "var(--muted)",
        color: isCurrent
          ? "var(--primary-foreground)"
          : answered
          ? correct
            ? "var(--spark-correct-text)"
            : "var(--spark-wrong-text)"
          : "var(--muted-foreground)",
        outline: isCurrent ? `2px solid var(--primary)` : "none",
        outlineOffset: "2px",
      }}
    >
      {index + 1}
      {isFlagged && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
          style={{ background: "rgb(245,158,11)" }}
        />
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResumeSessionPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();

  // Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [states, setStates] = useState<QuestionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Monetization
  const [isPremium, setIsPremium] = useState(false);
  const [aiUsesLeft, setAiUsesLeft] = useState<number | "unlimited">(3);
  const [showAiPaywall, setShowAiPaywall] = useState(false);

  // Session
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [loadingAi, setLoadingAi] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [examSessionId, setExamSessionId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const sessionStartTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());

  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  useEffect(() => {
    if (!params.sessionId) return;

    Promise.all([
      getUserMonetizationStatus(),
      getResumeSessionData(params.sessionId),
    ]).then(([mono, resumeData]) => {
      if (!("error" in mono)) {
        setIsPremium(mono.isPremium ?? false);
        setAiUsesLeft(mono.remainingAiUses ?? 3);
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

      setExamSessionId(resumeData.examSessionId ?? null);
      setQuestions(resumeData.questions as Question[]);
      setStates(resumeData.initialStates as QuestionState[]);
      setCurrentIndex(resumeData.firstUnansweredIndex ?? 0);
      sessionStartTime.current = Date.now();
      setIsLoading(false);
    });
  }, [params.sessionId, router]);

  // ── Answer handling ──────────────────────────────────────────────────────

  async function handleSelect(optionId: string) {
    const s = states[currentIndex];
    if (!s || s.selectedId !== null || s.isChecking || !examSessionId) return;

    setStates((prev) =>
      prev.map((st, i) =>
        i === currentIndex ? { ...st, isChecking: true } : st
      )
    );

    const result = await checkPracticeAnswer(questions[currentIndex].id);
    if ("error" in result) {
      setStates((prev) =>
        prev.map((st, i) =>
          i === currentIndex ? { ...st, isChecking: false } : st
        )
      );
      return;
    }

    const elapsed = Math.round(
      (Date.now() - questionStartTime.current) / 1000
    );

    setStates((prev) =>
      prev.map((st, i) =>
        i === currentIndex
          ? {
              ...st,
              selectedId: optionId,
              correctId: result.correctId,
              explanation: result.explanation,
              isChecking: false,
            }
          : st
      )
    );

    // Fire-and-forget save
    saveAnswer(
      examSessionId,
      questions[currentIndex].id,
      optionId,
      elapsed
    );
  }

  // ── KOT AI ──────────────────────────────────────────────────────────────

  async function handleAiHint() {
    if (!isPremium) {
      if (aiUsesLeft === 0) {
        setShowAiPaywall(true);
        return;
      }
      const dec = await decrementKotAiUsage();
      if ("error" in dec && dec.error === "exhausted") {
        setShowAiPaywall(true);
        return;
      }
      if (!("error" in dec)) {
        setAiUsesLeft(
          dec.remaining === "unlimited"
            ? "unlimited"
            : typeof dec.remaining === "number"
            ? dec.remaining
            : 0
        );
      }
    }

    setLoadingAi(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoadingAi(false);

    const s = states[currentIndex];
    const isCorrect = s.selectedId === s.correctId;
    setStates((prev) =>
      prev.map((st, i) =>
        i === currentIndex
          ? {
              ...st,
              aiHint: isCorrect
                ? `Great job! Keep applying this logic for similar "${questions[currentIndex].category}" questions in the actual exam.`
                : `The correct answer is (${s.correctId?.toUpperCase()}). ${s.explanation ? "Re-read the explanation above — it explains the key concept you'll need to remember." : "Review this topic and try similar questions to reinforce the pattern."}`,
            }
          : st
      )
    );
  }

  // ── Complete session ─────────────────────────────────────────────────────

  async function handleComplete() {
    if (!examSessionId || isCompleting) return;
    setIsCompleting(true);
    const elapsed = Math.round((Date.now() - sessionStartTime.current) / 1000);
    const result = await completeSession(
      examSessionId,
      questions.length,
      elapsed
    );
    if (result.success) {
      setFinalScore(result.score);
      setFinished(true);
    }
    setIsCompleting(false);
  }

  function toggleFlag(index: number) {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────

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

  // ── Error ────────────────────────────────────────────────────────────────

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

  // ── Finished screen ──────────────────────────────────────────────────────

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
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <BookOpen size={16} className="mr-2" />
              Return to Practice Hub
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main practice UI ─────────────────────────────────────────────────────

  const q = questions[currentIndex];
  const s = states[currentIndex];
  const answered = states.filter((st) => st.selectedId !== null).length;
  const progressPct = Math.round((answered / questions.length) * 100);

  return (
    <div
      className="fixed inset-0 flex flex-col lg:grid lg:grid-cols-[1fr_280px] overflow-hidden"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
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
          className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
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
          className="shrink-0 px-5 py-2 border-b"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <Progress value={progressPct} className="h-1.5" />
          <div className="flex justify-between mt-1">
            <span
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              {answered} answered
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              {questions.length - answered} remaining
            </span>
          </div>
        </div>

        {/* Scrollable question body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-5 py-7 flex flex-col gap-6">
            {/* Category label + flag */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--primary)" }}
              >
                {q.category}
              </span>
              <button
                onClick={() => toggleFlag(currentIndex)}
                className="flex items-center gap-1.5 text-xs rounded-xl px-2.5 py-1.5 transition-colors"
                style={{
                  background: flagged.has(currentIndex)
                    ? "rgba(245,158,11,0.12)"
                    : "transparent",
                  color: flagged.has(currentIndex)
                    ? "rgb(245,158,11)"
                    : "var(--muted-foreground)",
                }}
              >
                <Flag
                  size={12}
                  fill={flagged.has(currentIndex) ? "currentColor" : "none"}
                />
                {flagged.has(currentIndex) ? "Flagged" : "Flag"}
              </button>
            </div>

            {/* Question text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="font-heading text-lg sm:text-xl font-semibold leading-relaxed"
                style={{ color: "var(--foreground)" }}
              >
                {q.text}
              </motion.p>
            </AnimatePresence>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {q.options.map((opt) => {
                const isSelected = s.selectedId === opt.id;
                const isCorrectOpt = s.correctId === opt.id;
                const hasAnswered = s.selectedId !== null;

                let bg = "var(--card)";
                let borderColor = "var(--border)";
                let textColor = "var(--foreground)";
                let icon: React.ReactNode = null;

                if (hasAnswered) {
                  if (isSelected && isCorrectOpt) {
                    bg = "var(--spark-correct-bg)";
                    borderColor = "var(--spark-correct-border)";
                    textColor = "var(--spark-correct-text)";
                    icon = (
                      <CheckCircle2
                        size={16}
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
                        size={16}
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
                        size={16}
                        style={{
                          color: "var(--spark-correct-text)",
                          opacity: 0.6,
                        }}
                        className="shrink-0 mt-0.5"
                      />
                    );
                  } else {
                    bg = "var(--muted)";
                    borderColor = "transparent";
                    textColor = "var(--muted-foreground)";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={hasAnswered || s.isChecking}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-2xl px-4 py-3.5 border text-left transition-all duration-150",
                      !hasAnswered &&
                        !s.isChecking &&
                        "hover:scale-[1.01] hover:border-[var(--primary)]"
                    )}
                    style={{
                      background: bg,
                      borderColor,
                      cursor: hasAnswered ? "default" : "pointer",
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-heading font-bold shrink-0 mt-0.5"
                      style={{
                        background: hasAnswered ? borderColor : "var(--muted)",
                        color: hasAnswered
                          ? textColor
                          : "var(--muted-foreground)",
                      }}
                    >
                      {opt.id.toUpperCase()}
                    </span>
                    <span
                      className="flex-1 text-sm leading-relaxed"
                      style={{ color: textColor }}
                    >
                      {opt.text}
                    </span>
                    {s.isChecking && !hasAnswered && (
                      <Loader2
                        size={15}
                        className="animate-spin shrink-0 mt-0.5"
                        style={{ color: "var(--primary)" }}
                      />
                    )}
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Explanation card */}
            <AnimatePresence>
              {s.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="rounded-2xl p-4 border"
                  style={{
                    background:
                      s.selectedId === s.correctId
                        ? "var(--spark-correct-bg)"
                        : "var(--spark-wrong-bg)",
                    borderColor:
                      s.selectedId === s.correctId
                        ? "var(--spark-correct-border)"
                        : "var(--spark-wrong-border)",
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{
                      color:
                        s.selectedId === s.correctId
                          ? "var(--spark-correct-text)"
                          : "var(--spark-wrong-text)",
                    }}
                  >
                    {s.selectedId === s.correctId ? "Correct!" : "Explanation"}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--foreground)" }}
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(s.explanation),
                    }}
                  />

                  {!s.aiHint && (
                    <button
                      onClick={handleAiHint}
                      disabled={loadingAi}
                      className="mt-3 flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 border transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{
                        background: "var(--spark-ai-bg)",
                        borderColor: "var(--spark-ai-border)",
                        color: "var(--spark-ai-text)",
                      }}
                    >
                      {loadingAi ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Sparkles size={11} />
                      )}
                      Ask KOT AI
                      {!isPremium && aiUsesLeft !== "unlimited" && (
                        <span className="ml-1 opacity-60">
                          ({aiUsesLeft} left)
                        </span>
                      )}
                    </button>
                  )}

                  {s.aiHint && (
                    <div
                      className="mt-3 rounded-xl p-3 border text-sm"
                      style={{
                        background: "var(--spark-ai-bg)",
                        borderColor: "var(--spark-ai-border)",
                        color: "var(--spark-ai-text)",
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles size={12} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          KOT AI
                        </span>
                      </div>
                      {s.aiHint}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer navigation */}
        <footer
          className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-t"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="rounded-xl gap-1.5 font-heading font-bold"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <ArrowLeft size={14} />
            Prev
          </Button>

          <div
            className="flex items-center gap-1 flex-wrap justify-center"
            style={{ maxWidth: 200 }}
          >
            {questions
              .slice(
                Math.max(0, currentIndex - 2),
                Math.min(questions.length, currentIndex + 3)
              )
              .map((_, relIdx) => {
                const absIdx = Math.max(0, currentIndex - 2) + relIdx;
                return (
                  <NavDot
                    key={absIdx}
                    index={absIdx}
                    state={states[absIdx]}
                    isCurrent={absIdx === currentIndex}
                    isFlagged={flagged.has(absIdx)}
                    onClick={() => setCurrentIndex(absIdx)}
                  />
                );
              })}
          </div>

          <Button
            size="sm"
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex((i) => i + 1);
              } else {
                handleComplete();
              }
            }}
            disabled={isCompleting}
            className="rounded-xl gap-1.5 font-heading font-bold"
            style={{
              background:
                currentIndex === questions.length - 1
                  ? "var(--spark-correct-bg)"
                  : "var(--primary)",
              color:
                currentIndex === questions.length - 1
                  ? "var(--spark-correct-text)"
                  : "var(--primary-foreground)",
            }}
          >
            {isCompleting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : currentIndex === questions.length - 1 ? (
              "Finish"
            ) : (
              <>
                Next <ArrowRight size={14} />
              </>
            )}
          </Button>
        </footer>
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
              isFlagged={flagged.has(i)}
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
            <div className="relative w-4 h-4 rounded-md shrink-0" style={{ background: "var(--muted)" }}>
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: "rgb(245,158,11)" }}
              />
            </div>
            <span
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
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
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
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
