"use client";

import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionStateSlice = {
  selectedId: string | null;
  correctId: string | null;
};

type NavDotProps = {
  index: number;
  state: QuestionStateSlice | undefined;
  isCurrent: boolean;
  isFlagged: boolean;
  /** "practice" shows correct/wrong colouring. "mock" shows neutral answered. */
  mode?: "practice" | "mock";
  onClick: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NavDot({
  index,
  state,
  isCurrent,
  isFlagged,
  mode = "practice",
  onClick,
}: NavDotProps) {
  const answered = state?.selectedId != null;
  const correct = answered && state?.selectedId === state?.correctId;

  // Compute inline style tokens so the dot can reference CSS custom properties
  // that aren't in the Tailwind allowlist.
  let bg: string;
  let color: string;
  let outline: string;

  if (isCurrent) {
    bg = "var(--primary)";
    color = "var(--primary-foreground)";
    outline = "2px solid var(--primary)";
  } else if (answered) {
    if (mode === "mock") {
      bg = "var(--primary)";
      color = "var(--primary-foreground)";
      outline = "none";
    } else if (correct) {
      bg = "var(--spark-correct-bg)";
      color = "var(--spark-correct-text)";
      outline = "none";
    } else {
      bg = "var(--spark-wrong-bg)";
      color = "var(--spark-wrong-text)";
      outline = "none";
    }
  } else {
    bg = "var(--muted)";
    color = "var(--muted-foreground)";
    outline = "none";
  }

  return (
    <button
      onClick={onClick}
      title={`Question ${index + 1}`}
      className={cn(
        "relative w-8 h-8 rounded-xl flex items-center justify-center",
        "text-xs font-bold font-heading",
        "transition-all duration-150 hover:scale-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      )}
      style={{ background: bg, color, outline, outlineOffset: "2px" }}
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
