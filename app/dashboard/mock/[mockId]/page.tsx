"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/ui/math-text";

// ─── Supabase & Server Actions ────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";
import { fetchSanitizedQuestions, submitExam, UserSubmission } from "@/app/dashboard/exams/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { text: string };

type Question = {
  id: string;
  category: string;
  difficulty: string;
  question_text: string;
  options: Option[];
};

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const OPTION_LETTERS = ["A", "B", "C", "D"];
const EXAM_DURATION_SECONDS = 2 * 60 * 60 + 45 * 60; // 2h 45m

// ─── Timer Hook ───────────────────────────────────────────────────────────────

function useCountdown(initialSeconds: number, onExpire: () => void, isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isActive) return; // Pause timer if not active (e.g., submitted)
    
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  return timeLeft;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ─── Submitted Screen ─────────────────────────────────────────────────────────

function SubmittedScreen({
  answers,
  total,
  sessionId
}: {
  answers: (string | null)[];
  total: number;
  sessionId: string | null;
}) {
  const answered = answers.filter((a) => a !== null).length;
  const skipped = total - answered;
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center border-2"
          style={{
            background: "var(--spark-correct-bg, #EAF3DE)",
            borderColor: "var(--spark-correct-border, #97C459)",
          }}
        >
          <CheckCircle2
            className="w-8 h-8"
            style={{ color: "var(--spark-correct-text, #27500A)" }}
          />
        </div>

        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">
            Exam Submitted!
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            Your answers have been recorded. Results will be available once the
            examination period has concluded.
          </p>
        </div>

        <div className="flex gap-4 mt-2 mb-4">
          <div className="bg-muted rounded-xl px-6 py-4 text-center w-full">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Answered
            </p>
            <p className="text-3xl font-extrabold text-primary">
              {answered}
              <span className="text-muted-foreground text-lg font-medium">
                /{total}
              </span>
            </p>
          </div>
          <div className="bg-muted rounded-xl px-6 py-4 text-center w-full">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Skipped
            </p>
            <p className="text-3xl font-extrabold text-foreground">{skipped}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          {sessionId ? (
            <Button
              size="lg"
              className="font-heading font-bold w-full"
              onClick={() => router.push(`/dashboard/mock/${sessionId}/results`)}
            >
              View Results
            </Button>
          ) : (
            <Button size="lg" className="font-heading font-bold w-full" disabled>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MockExamPage() {
  const router = useRouter();

  // Data State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Exam State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // ── Fetch User & Questions on Mount ──
  useEffect(() => {
    async function initExam() {
      // 1. Get the current user
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      // 2. Fetch Mock Questions (fetching 20 for this mock example)
      const res = await fetchSanitizedQuestions(20);
      if (res.success && res.data) {
        setQuestions(res.data);
        setAnswers(new Array(res.data.length).fill(null));
      } else {
        console.error("Failed to load questions", res.error);
      }
      setLoadingInitial(false);
    }
    initExam();
  }, []);

  // Use a ref to access latest state inside the countdown callback without triggering re-renders
  const stateRef = useRef({ answers, questions });
  useEffect(() => {
    stateRef.current = { answers, questions };
  }, [answers, questions]);

  const handleTimeExpire = useCallback(() => {
    // If time expires, auto-submit using the latest state ref
    autoSubmit(stateRef.current.answers, stateRef.current.questions);
  }, []);

  // Stop the timer if the user has already submitted the exam to prevent double-submissions
  const timeLeft = useCountdown(EXAM_DURATION_SECONDS, handleTimeExpire, !submitted);

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Preparing Mock Examination...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <p>No active questions found in the database.</p>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = answers.filter((a) => a !== null).length;
  const unansweredCount = questions.length - answeredCount;
  const progressValue = (answeredCount / questions.length) * 100;

  const isTimeLow = timeLeft <= 300;       // < 5 min → destructive red
  const isTimeWarning = timeLeft <= 900 && timeLeft > 300; // < 15 min → amber

  function selectOption(text: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = text;
      return next;
    });
  }

  function toggleFlag(index: number) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  // ── Secure Submission Logic ──
  async function performSubmission(currentAnswers: (string | null)[], currentQuestions: Question[]) {
    setIsSubmitting(true);
    setSubmitted(true);
    setShowDialog(false);

    const timeSpent = EXAM_DURATION_SECONDS - timeLeft;

    // Format for the backend schema
    const submissions: UserSubmission[] = currentQuestions.map((q, i) => ({
      question_id: q.id,
      selected_answer: currentAnswers[i] || "SKIPPED",
      category: q.category,
      time_taken_seconds: Math.round(timeSpent / currentQuestions.length), // Estimate avg time per question
    }));

    if (userId) {
      const res = await submitExam(
        userId,
        "Mock",
        "Professional", // Or pass the actual selected level dynamically
        timeSpent,
        submissions
      );

      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
      } else {
        console.error("Submission failed:", res.error);
      }
    } else {
      console.error("No active user session found. Cannot save exam.");
    }
  }

  function handleSubmit() {
    performSubmission(answers, questions);
  }

  function autoSubmit(latestAnswers: (string | null)[], latestQuestions: Question[]) {
    performSubmission(latestAnswers, latestQuestions);
  }

  // Nav grid cell variant
  function getCellVariant(
    i: number
  ): "unanswered" | "answered" | "current" | "current-answered" {
    const isAnswered = answers[i] !== null;
    const isCurrent = i === currentIndex;
    if (isCurrent && isAnswered) return "current-answered";
    if (isCurrent) return "current";
    if (isAnswered) return "answered";
    return "unanswered";
  }

  if (submitted) {
    return <SubmittedScreen answers={answers} total={questions.length} sessionId={sessionId} />;
  }

  return (
    <>
      {/* ── Submit Confirmation AlertDialog ── */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-md rounded-[var(--radius-lg)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl font-bold">
              Submit Examination?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              You are about to submit your answers. This action is{" "}
              <span className="font-semibold text-foreground">
                permanent and cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Warning: unanswered questions */}
          {unansweredCount > 0 && (
            <div
              className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
              style={{
                background: "#FAEEDA",
                borderColor: "#EF9F27",
                color: "#633806",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "#BA7517" }}
              />
              <p>
                You have{" "}
                <strong>
                  {unansweredCount} unanswered question
                  {unansweredCount > 1 ? "s" : ""}
                </strong>
                . Unanswered items will be counted as incorrect.
              </p>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Answered</p>
              <p className="font-bold text-primary text-base">
                {answeredCount}/{questions.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Remaining Time
              </p>
              <p
                className={cn(
                  "font-mono font-bold text-base",
                  isTimeLow ? "text-destructive" : "text-foreground"
                )}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} className="font-medium">
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 font-heading font-bold"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Main Two-Column Layout ── */}
      <div className="min-h-screen bg-background">
        <div className="lg:grid lg:grid-cols-[1fr_300px] min-h-screen">

          {/* ════════════════════════════════════════
              LEFT COLUMN — Question Area
          ════════════════════════════════════════ */}
          <div className="flex flex-col min-h-screen border-r border-border">

            {/* ── Exam Header ── */}
            <header className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
              <div>
                <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  TaraCSE — Mock Exam
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Professional &amp; Subprofessional · {questions.length} items · 2h 45m
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile-only inline timer */}
                <div
                  className={cn(
                    "lg:hidden flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-lg bg-muted",
                    isTimeLow && "text-destructive",
                    isTimeWarning && "text-amber-600"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(timeLeft)}
                </div>

                <Badge variant="outline" className="text-xs hidden sm:flex">
                  {question.category}
                </Badge>
              </div>
            </header>

            {/* ── Progress Bar ── */}
            <div className="px-8 pt-5 shrink-0">
              <div className="w-full max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {answeredCount} answered
                  </span>
                </div>
                <Progress
                  value={progressValue}
                  className="h-1.5 bg-muted [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-500"
                />
              </div>
            </div>

            {/* ── Question Content ── */}
            <main className="flex-1 px-8 py-7 overflow-y-auto">
              <div className="w-full max-w-3xl mx-auto">
                <Badge variant="outline" className="mb-4 text-[11px] sm:hidden">
                  {question.category}
                </Badge>

                {/* Question text wrapped in Practice-style Card */}
                <Card className="rounded-3xl border shadow-sm bg-card mb-6">
                  <CardContent className="p-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                      Question {currentIndex + 1}
                    </p>
                    <MathText
                      text={question.question_text}
                      block
                      className="font-heading text-[1.2rem] font-semibold leading-[1.75] text-foreground whitespace-pre-line"
                    />
                  </CardContent>
                </Card>

                {/* Options — selected state is purely neutral (no correct/wrong colors) */}
                <div className="flex flex-col gap-3">
                  {question.options.map((opt, i) => {
                    const isSelected = answers[currentIndex] === opt.text;
                    return (
                      <button
                        key={i}
                        onClick={() => selectOption(opt.text)}
                        className={cn(
                          "group flex items-center gap-4 w-full text-left",
                          "p-5 rounded-2xl border-[1.5px]",
                          "transition-all duration-150",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          // Selected: neutral primary ring only — NEVER green or red
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-border/60 hover:bg-muted/50"
                        )}
                      >
                        {/* Letter bubble */}
                        <span
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center",
                            "text-xs font-bold shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-muted/70"
                          )}
                        >
                          {OPTION_LETTERS[i]}
                        </span>

                        {/* Option text */}
                        <MathText
                          text={opt.text}
                          className={cn(
                            "flex-1 text-sm leading-relaxed",
                            isSelected
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground"
                          )}
                        />

                        {/* Dot indicator when selected */}
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </main>

            {/* ── Navigation Footer ── */}
            <footer className="px-8 py-5 border-t border-border shrink-0">
              <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-3">
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
                      flagged.has(currentIndex)
                        ? "Remove flag"
                        : "Flag for review"
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

                {isLastQuestion ? (
                  <Button
                    onClick={() => setShowDialog(true)}
                    className="gap-1.5 font-heading font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Submit Exam
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentIndex((i) => i + 1)}
                    className="gap-1.5 font-heading font-bold"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </footer>

            {/* Mobile: bottom padding for fixed submit bar */}
            <div className="lg:hidden h-20" />
          </div>

          {/* ════════════════════════════════════════
              RIGHT COLUMN — Persistent Sidebar
          ════════════════════════════════════════ */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-0 h-screen overflow-y-auto p-5 bg-card border-l border-border">

            {/* ── Countdown Timer ── */}
            <div
              className={cn(
                "rounded-[var(--radius-lg)] border p-5 text-center transition-colors duration-500",
                isTimeLow
                  ? "border-destructive/30 bg-destructive/5"
                  : isTimeWarning
                  ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                  : "border-border bg-muted/40"
              )}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock
                  className={cn(
                    "w-3.5 h-3.5",
                    isTimeLow
                      ? "text-destructive"
                      : isTimeWarning
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  )}
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Time Remaining
                </p>
              </div>

              <p
                className={cn(
                  "font-mono text-[2.5rem] font-extrabold tracking-tight tabular-nums leading-none transition-colors duration-300",
                  isTimeLow
                    ? "text-destructive"
                    : isTimeWarning
                    ? "text-amber-600"
                    : "text-foreground"
                )}
              >
                {formatTime(timeLeft)}
              </p>

              {isTimeLow && (
                <p className="text-xs text-destructive font-semibold mt-2 animate-pulse">
                  Less than 5 minutes left!
                </p>
              )}
            </div>

            {/* ── Question Navigation Grid ── */}
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
                      title={`Q${i + 1}${answers[i] !== null ? " · answered" : ""}${isFlagged ? " · flagged" : ""}`}
                      className={cn(
                        "relative aspect-square rounded-lg text-xs font-bold",
                        "transition-all duration-100",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",

                        // Unanswered
                        variant === "unanswered" &&
                          "border-[1.5px] border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",

                        // Answered (not current)
                        variant === "answered" &&
                          "bg-primary border-[1.5px] border-primary text-primary-foreground hover:bg-primary/85",

                        // Current, unanswered
                        variant === "current" &&
                          "border-[2.5px] border-primary text-primary font-extrabold bg-background ring-2 ring-primary ring-offset-2",

                        // Current AND answered
                        variant === "current-answered" &&
                          "bg-primary border-[1.5px] border-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-2"
                      )}
                    >
                      {i + 1}
                      {/* Amber flag dot */}
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
                  <span className="w-3 h-3 rounded-[3px] bg-primary inline-block" />
                  Answered
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-3 h-3 rounded-[3px] border border-border inline-block" />
                  Unanswered
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
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <Progress
                value={progressValue}
                className="h-1.5 bg-muted [&>div]:bg-primary"
              />
              <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
                <span>{answeredCount} answered</span>
                <span>{unansweredCount} remaining</span>
              </div>
            </div>

            {/* Spacer pushes submit to bottom */}
            <div className="flex-1" />

            {/* ── Submit Exam Button ── */}
            <div className="space-y-2">
              <Button
                variant="destructive"
                size="lg"
                className="w-full font-heading font-extrabold text-sm tracking-wide"
                onClick={() => setShowDialog(true)}
              >
                Submit Exam
              </Button>
              <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
                Review all answers before submitting.
              </p>
            </div>
          </aside>
        </div>

        {/* ── Mobile: Fixed bottom Submit Bar (hidden on lg) ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 px-4 py-3 bg-background/95 border-t border-border backdrop-blur-sm">
          <Button
            variant="destructive"
            size="lg"
            className="w-full font-heading font-extrabold"
            onClick={() => setShowDialog(true)}
          >
            Submit Exam
          </Button>
        </div>
      </div>
    </>
  );
}