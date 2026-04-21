"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Vocabulary",
    text: "Choose the word most OPPOSITE in meaning to the underlined word: The supervisor gave a PERFUNCTORY inspection of the documents before approving them.",
    options: ["Thorough", "Hasty", "Careless", "Routine"],
  },
  {
    id: 2,
    category: "Numerical Reasoning",
    text: "A government employee earns a basic salary of ₱28,500 per month. If she receives a 12% raise, what will her new monthly salary be?",
    options: ["₱31,920", "₱30,500", "₱32,100", "₱31,500"],
  },
  {
    id: 3,
    category: "Reading Comprehension",
    text: "Based on context: 'The barangay tanod remained VIGILANT throughout the night, watching for any suspicious activity in the neighborhood.' What does vigilant most likely mean?",
    options: [
      "Alert and watchful",
      "Tired and restless",
      "Bored and indifferent",
      "Confused and uncertain",
    ],
  },
  {
    id: 4,
    category: "Analytical Ability",
    text: "If all Maynilad customers pay their bills, and some Maynilad customers have overdue accounts, which conclusion is definitely TRUE?",
    options: [
      "Some customers with overdue accounts pay their bills",
      "All customers with overdue accounts do not pay",
      "No customer pays and has an overdue account",
      "All customers have overdue accounts",
    ],
  },
  {
    id: 5,
    category: "Filipino Vocabulary",
    text: "Piliin ang salitang MAGKASINGKAHULUGAN sa salitang salungguhit: Ang opisyal ay nagpakita ng KATAPATAN sa kanyang trabaho at sa bansa.",
    options: ["Katiyakan", "Katapangan", "Pagiging tapat", "Pagmamahal"],
  },
  {
    id: 6,
    category: "Numerical Reasoning",
    text: "In a Civil Service Review class of 45 students, 60% are women. How many men are in the class?",
    options: ["18", "27", "15", "20"],
  },
  {
    id: 7,
    category: "Vocabulary",
    text: "Select the word that best completes the sentence: The new policy was ________ by the director, meaning it was officially approved and put into effect.",
    options: ["Ratified", "Nullified", "Suspended", "Contested"],
  },
  {
    id: 8,
    category: "Clerical Operations",
    text: "Documents are filed alphabetically. In which order should the following names be arranged? (I) Santos, Maria R. (II) Santos, Jose P. (III) Santillan, Ana (IV) San Pedro, Luis",
    options: ["IV, III, II, I", "III, IV, II, I", "IV, II, I, III", "I, II, III, IV"],
  },
  {
    id: 9,
    category: "Analytical Ability",
    text: "A sequence: 3, 7, 13, 21, 31, ___. What comes next?",
    options: ["43", "41", "45", "47"],
  },
  {
    id: 10,
    category: "Filipino Grammar",
    text: "Piliin ang tamang pangungusap: Ang bawat empleyado ay dapat sumunod sa ____ na patakaran ng tanggapan.",
    options: ["itinakdang", "itinakda", "itinatakda", "itinakday"],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const EXAM_DURATION_SECONDS = 2 * 60 * 60 + 45 * 60; // 2h 45m

// ─── Timer Hook ───────────────────────────────────────────────────────────────

function useCountdown(initialSeconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
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
  }, []);

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
}: {
  answers: (number | null)[];
  total: number;
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

        <div className="flex gap-4 mt-2">
          <div className="bg-muted rounded-xl px-6 py-4 text-center">
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
          <div className="bg-muted rounded-xl px-6 py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Skipped
            </p>
            <p className="text-3xl font-extrabold text-foreground">{skipped}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            size="lg"
            className="font-heading font-bold"
            onClick={() => router.push('/dashboard/mock/test-456/results')}
          >
            View Results
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="font-heading font-bold"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MockExamPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(QUESTIONS.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const handleTimeExpire = useCallback(() => {
    setSubmitted(true);
  }, []);

  const timeLeft = useCountdown(EXAM_DURATION_SECONDS, handleTimeExpire);

  const question = QUESTIONS[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;
  const unansweredCount = QUESTIONS.length - answeredCount;
  const progressValue = (answeredCount / QUESTIONS.length) * 100;

  const isTimeLow = timeLeft <= 300;       // < 5 min → destructive red
  const isTimeWarning = timeLeft <= 900 && timeLeft > 300; // < 15 min → amber

  function selectOption(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
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

  function handleSubmit() {
    setSubmitted(true);
    setShowDialog(false);
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
    return <SubmittedScreen answers={answers} total={QUESTIONS.length} />;
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
                {answeredCount}/{QUESTIONS.length}
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
            <AlertDialogCancel className="font-medium">
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="bg-destructive hover:bg-destructive/90 font-heading font-bold"
            >
              Submit Now
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
                  Professional &amp; Subprofessional · {QUESTIONS.length} items · 2h 45m
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
                    Question {currentIndex + 1} of {QUESTIONS.length}
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

                {/* Question text — large, readable, no answer cues ever */}
                <h2 className="font-heading text-[1.2rem] font-semibold leading-[1.75] text-foreground mb-8">
                  {question.text}
                </h2>

                {/* Options — selected state is purely neutral (no correct/wrong colors) */}
                <div className="flex flex-col gap-3">
                  {question.options.map((opt, i) => {
                    const isSelected = answers[currentIndex] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => selectOption(i)}
                        className={cn(
                          "group flex items-center gap-4 w-full text-left",
                          "px-5 py-4 rounded-[var(--radius-lg)] border-[1.5px]",
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
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            "text-xs font-bold shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-muted/70"
                          )}
                        >
                          {OPTION_LETTERS[i]}
                        </span>

                        {/* Option text */}
                        <span
                          className={cn(
                            "flex-1 text-sm leading-relaxed",
                            isSelected
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground"
                          )}
                        >
                          {opt}
                        </span>

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

                <Button
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(QUESTIONS.length - 1, i + 1)
                    )
                  }
                  disabled={currentIndex === QUESTIONS.length - 1}
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
                {QUESTIONS.map((_, i) => {
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
                  {answeredCount}/{QUESTIONS.length}
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