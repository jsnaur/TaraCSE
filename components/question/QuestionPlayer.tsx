"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { MathText } from "@/components/ui/math-text";
import { cn } from "@/lib/utils";
import type { QuestionState } from "./useQuestionSession";

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string;
  category: string;
  text: string;
  options: { id: string; text: string }[];
};

export type QuestionPlayerProps = {
  question: Question;
  state: QuestionState;
  mode: "practice" | "mock";
  questionNumber: number;
  totalQuestions: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onSelect: (optionId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  // practice only
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onRequestAiHint?: () => void;
  loadingAi?: boolean;
  isPremium?: boolean;
  aiUsesLeft?: number | "unlimited";
  // mock only — renders inside the question card header slot
  headerSlot?: React.ReactNode;
};

// ─── Option Button ─────────────────────────────────────────────────────────────

function OptionButton({
  opt,
  state,
  mode,
  onSelect,
}: {
  opt: { id: string; text: string };
  state: QuestionState;
  mode: "practice" | "mock";
  onSelect: (id: string) => void;
}) {
  const { selectedId, isPending, correctId } = state;

  const isSelected = selectedId === opt.id;
  const isConfirmedCorrect = correctId === opt.id;
  const isRevealed = correctId !== null;

  // ── Mock mode: neutral selection, always re-selectable ───────────────────
  if (mode === "mock") {
    return (
      <button
        onClick={() => onSelect(opt.id)}
        className={cn(
          "group flex items-center gap-3 sm:gap-4 w-full text-left",
          "p-3 sm:p-4 rounded-2xl border-[1.5px]",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <span
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center",
            "text-xs font-bold font-heading shrink-0 transition-colors",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {opt.id.toUpperCase()}
        </span>
        <MathText
          text={opt.text}
          className={cn(
            "flex-1 text-sm leading-relaxed",
            isSelected
              ? "font-semibold text-foreground"
              : "font-medium text-foreground"
          )}
        />
        {isSelected && (
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
        )}
      </button>
    );
  }

  // ── Practice mode ─────────────────────────────────────────────────────────
  // States:
  //   1. Unanswered (no selection yet)       → normal hover, all clickable
  //   2. Pending-selected (this option)      → primary border, no reveal yet; others still clickable
  //   3. Pending-other (different option)    → normal, no hover interaction
  //   4. Revealed + correct option           → green
  //   5. Revealed + wrong selected           → red
  //   6. Revealed + dim (non-selected, non-correct) → opacity-40

  const isPendingSelected = isPending && isSelected;
  const isPendingOther = isPending && !isSelected;

  let containerClass = cn(
    "w-full text-left rounded-2xl border-[1.5px] transition-all duration-200",
    "flex items-center gap-3 sm:gap-4 p-3 sm:p-4",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  );

  let letterBubbleClass: string;
  let icon: React.ReactNode = null;

  if (!isRevealed && !isPending) {
    // State 1: fully unanswered
    containerClass = cn(
      containerClass,
      "cursor-pointer border-border bg-card hover:border-primary/50 hover:bg-muted/50"
    );
    letterBubbleClass = "bg-muted text-muted-foreground";
  } else if (isPendingSelected) {
    // State 2: pending — this is the selected option
    containerClass = cn(
      containerClass,
      "cursor-pointer border-primary bg-primary/5 shadow-sm"
    );
    letterBubbleClass = "bg-primary text-primary-foreground";
  } else if (isPendingOther) {
    // State 3: pending — not this option, keep clickable so user can change
    containerClass = cn(
      containerClass,
      "cursor-pointer border-border bg-card hover:border-primary/50 hover:bg-muted/50"
    );
    letterBubbleClass = "bg-muted text-muted-foreground";
  } else if (isRevealed && isConfirmedCorrect) {
    // State 4: correct
    containerClass = cn(
      containerClass,
      "cursor-default border-[var(--spark-correct-border)] bg-[var(--spark-correct-bg)] text-[var(--spark-correct-text)]"
    );
    letterBubbleClass =
      "bg-[var(--spark-correct-text)] text-[var(--spark-correct-bg)]";
    icon = (
      <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--spark-correct-text)]" />
    );
  } else if (isRevealed && isSelected && !isConfirmedCorrect) {
    // State 5: wrong
    containerClass = cn(
      containerClass,
      "cursor-default border-[var(--spark-wrong-border)] bg-[var(--spark-wrong-bg)] text-[var(--spark-wrong-text)]"
    );
    letterBubbleClass =
      "bg-[var(--spark-wrong-text)] text-[var(--spark-wrong-bg)]";
    icon = (
      <XCircle className="w-5 h-5 shrink-0 text-[var(--spark-wrong-text)]" />
    );
  } else {
    // State 6: revealed but dim (not selected, not correct)
    containerClass = cn(
      containerClass,
      "cursor-default border-border bg-card opacity-40"
    );
    letterBubbleClass = "bg-muted text-muted-foreground";
  }

  // Clicking while pending fires a new handleSelect with the new optionId —
  // the stale-response guard in useQuestionSession handles discarding the old
  // in-flight response.
  const handleClick = () => {
    if (!isRevealed) onSelect(opt.id);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRevealed}
      className={containerClass}
    >
      <span
        className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center",
          "text-xs font-heading font-bold shrink-0 transition-colors",
          letterBubbleClass
        )}
      >
        {opt.id.toUpperCase()}
      </span>
      <MathText
        text={opt.text}
        className="font-medium text-sm leading-relaxed flex-1"
      />
      {icon}
    </button>
  );
}

// ─── QuestionPlayer ───────────────────────────────────────────────────────────

export function QuestionPlayer({
  question,
  state,
  mode,
  questionNumber,
  totalQuestions,
  canGoPrev,
  canGoNext,
  onSelect,
  onPrev,
  onNext,
  onToggleFlag,
  // practice-only
  isBookmarked,
  onRequestAiHint,
  loadingAi = false,
  isPremium,
  aiUsesLeft,
  // mock-only
  headerSlot,
}: QuestionPlayerProps) {
  const {
    selectedId,
    correctId,
    explanation,
    kotAiExplanation,
    isFlagged,
    isPending,
  } = state;

  const isAnswered = selectedId !== null && correctId !== null;
  const isCorrect = isAnswered && selectedId === correctId;

  // In practice, Next is gated until the server has confirmed (correctId set).
  // In mock, Next follows canGoNext normally.
  const nextDisabled =
    mode === "practice"
      ? correctId === null || isPending
      : !canGoNext;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-4">

          {/* ── Question Card ──────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <Card className="rounded-3xl border shadow-sm bg-card mb-4 sm:mb-6">
                <CardContent className="p-4 sm:p-6 lg:p-8 relative">
                  {/* Bookmark (practice only) */}
                  {mode === "practice" && (
                    <div className="absolute top-4 right-4">
                      <BookmarkButton
                        questionId={question.id}
                        initialBookmarked={isBookmarked ?? false}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Mock header slot */}
                  {mode === "mock" && headerSlot && (
                    <div className="absolute top-4 right-4">{headerSlot}</div>
                  )}

                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 sm:mb-4">
                    Question {questionNumber}
                  </p>
                  <MathText
                    text={question.text}
                    block
                    className="text-base sm:text-lg font-heading font-semibold leading-relaxed text-foreground whitespace-pre-line"
                  />
                </CardContent>
              </Card>

              {/* ── Options ────────────────────────────────────────────── */}
              <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
                {question.options.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    opt={opt}
                    state={state}
                    mode={mode}
                    onSelect={onSelect}
                  />
                ))}
              </div>

              {/* ── Explanation Card (practice only) ───────────────────── */}
              {mode === "practice" && (
                <AnimatePresence>
                  {isAnswered && explanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="mb-4 sm:mb-6"
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
                        <CardContent className="p-3 sm:p-5 space-y-3">
                          {/* Correct / wrong label */}
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

                          {/* Explanation text */}
                          <MathText
                            text={explanation}
                            block
                            className="text-sm leading-relaxed font-medium"
                            style={{
                              color: isCorrect
                                ? "var(--spark-correct-text)"
                                : "var(--spark-wrong-text)",
                              opacity: 0.9,
                            }}
                          />

                          {/* KOT AI section */}
                          {kotAiExplanation ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="rounded-xl p-3 sm:p-4 border-[1.5px] mt-2"
                              style={{
                                background: "var(--spark-ai-bg)",
                                borderColor: "var(--spark-ai-border)",
                              }}
                            >
                              <div
                                className="flex items-center gap-1.5 mb-1.5"
                                style={{ color: "var(--spark-ai-text)" }}
                              >
                                <Sparkles size={12} />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                  KOT AI
                                </span>
                              </div>
                              <MathText
                                text={kotAiExplanation}
                                block
                                className="text-sm font-medium leading-relaxed whitespace-pre-line"
                                style={{ color: "var(--spark-ai-text)" }}
                              />
                            </motion.div>
                          ) : (
                            onRequestAiHint && (
                              <div className="pt-1">
                                <button
                                  onClick={onRequestAiHint}
                                  disabled={loadingAi}
                                  className="flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 border-[1.5px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                                  style={{
                                    background: "var(--spark-ai-bg)",
                                    color: "var(--spark-ai-text)",
                                    borderColor: "var(--spark-ai-border)",
                                  }}
                                >
                                  {loadingAi ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Analyzing…
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3" />
                                      Ask KOT AI
                                      {!isPremium &&
                                        typeof aiUsesLeft === "number" && (
                                          <span className="ml-1 opacity-60 text-[10px] uppercase tracking-wider font-bold">
                                            ({aiUsesLeft} left)
                                          </span>
                                        )}
                                    </>
                                  )}
                                </button>
                              </div>
                            )
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Sticky Footer Nav (ONE shared footer for all three screens) ─── */}
      <footer className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-3 sm:px-6 max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Prev + Flag */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={!canGoPrev}
              className="gap-1.5 rounded-xl font-heading font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFlag}
              className={cn(
                "gap-1.5 text-muted-foreground rounded-xl",
                isFlagged && "text-amber-600 hover:text-amber-700"
              )}
              title={isFlagged ? "Remove flag" : "Flag for review"}
            >
              <Flag
                className={cn("w-3.5 h-3.5", isFlagged && "fill-current")}
              />
              <span className="hidden sm:inline">
                {isFlagged ? "Flagged" : "Flag"}
              </span>
            </Button>
          </div>

          {/* Right: Next */}
          <Button
            size="sm"
            onClick={onNext}
            disabled={nextDisabled}
            className="gap-1.5 font-heading font-bold rounded-xl"
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
