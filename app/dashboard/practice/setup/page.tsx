"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Hash,
  Layers,
  BrainCircuit,
  Globe2,
  CalculatorIcon,
  Infinity,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExamLevel = "professional" | "subprofessional" | null;
type Category = "verbal" | "numerical" | "analytical" | "general";
type ItemCount = 10 | 20 | 50 | "endless";

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXAM_LEVELS = [
  {
    id: "professional" as ExamLevel,
    label: "Professional",
    subtitle: "Career Service — Professional",
    description: "For positions in the 1st and 2nd level of the Civil Service",
    badge: "Higher Difficulty",
    badgeColor: "var(--spark-ai-text)",
    badgeBg: "var(--spark-ai-bg)",
  },
  {
    id: "subprofessional" as ExamLevel,
    label: "Subprofessional",
    subtitle: "Career Service — SubProf",
    description: "For clerical, trades, crafts and custodial service positions",
    badge: "Entry Level",
    badgeColor: "var(--spark-correct-text)",
    badgeBg: "var(--spark-correct-bg)",
  },
];

const CATEGORIES = [
  {
    id: "verbal" as Category,
    label: "Verbal",
    full: "Verbal Ability",
    description: "Analogies, grammar, reading comprehension",
    icon: BookOpen,
    color: "var(--primary)",
    bg: "var(--spark-ai-bg)",
    border: "var(--spark-ai-border)",
  },
  {
    id: "numerical" as Category,
    label: "Numerical",
    full: "Numerical Ability",
    description: "Arithmetic, number series, word problems",
    icon: CalculatorIcon,
    color: "var(--secondary)",
    bg: "#EBF8FF",
    border: "#BAE6FD",
  },
  {
    id: "analytical" as Category,
    label: "Analytical",
    full: "Analytical Ability",
    description: "Pattern recognition, logic, data sufficiency",
    icon: BrainCircuit,
    color: "var(--accent)",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  {
    id: "general" as Category,
    label: "General Info",
    full: "General Information & CS",
    description: "Philippine history, government, constitution",
    icon: Globe2,
    color: "var(--spark-correct-text)",
    bg: "var(--spark-correct-bg)",
    border: "var(--spark-correct-border)",
  },
];

const ITEM_COUNTS: { value: ItemCount; label: string; sub: string }[] = [
  { value: 10, label: "10", sub: "Quick Sprint" },
  { value: 20, label: "20", sub: "Standard Set" },
  { value: 50, label: "50", sub: "Full Drill" },
  { value: "endless", label: "∞", sub: "Endless Mode" },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({
  step,
  current,
  done,
}: {
  step: number;
  current: number;
  done: boolean;
}) {
  const active = step === current;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-bold transition-all duration-300"
        style={{
          background: done
            ? "var(--spark-correct-text)"
            : active
            ? "var(--primary)"
            : "var(--muted)",
          color: done || active ? "white" : "var(--muted-foreground)",
          boxShadow: active ? "0 0 0 4px var(--spark-ai-border)" : "none",
        }}
      >
        {done ? <CheckCircle2 size={14} strokeWidth={2.5} /> : step}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PracticeSetupPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [examLevel, setExamLevel] = useState<ExamLevel>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemCount, setItemCount] = useState<ItemCount | null>(null);

  const toggleCategory = (cat: Category) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // derive per-step validity
  const step1Valid = examLevel !== null;
  const step2Valid = categories.length > 0;
  const step3Valid = itemCount !== null;
  const allValid = step1Valid && step2Valid && step3Valid;

  const handleStart = () => {
    if (!allValid) return;
    router.push('/dashboard/practice/test-123');
  };

  // summary label helpers
  const summaryLevel = examLevel
    ? EXAM_LEVELS.find((l) => l.id === examLevel)?.label
    : null;
  const summaryCategories =
    categories.length === CATEGORIES.length
      ? "All Categories"
      : categories
          .map((c) => CATEGORIES.find((x) => x.id === c)?.label)
          .join(", ");
  const summaryItems =
    itemCount === "endless"
      ? "Endless"
      : itemCount
      ? `${itemCount} items`
      : null;

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      {/* ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 right-0 w-[480px] h-[480px] opacity-20 blur-[120px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          transform: "translate(30%,-30%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 w-[380px] h-[380px] opacity-15 blur-[100px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--secondary) 0%, transparent 70%)",
          transform: "translate(-40%,40%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-24 flex flex-col gap-8">
        {/* ── Back nav ───────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/practice"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={15} /> Back to Practice
          </Link>

          {/* step indicator */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <StepDot step={s} current={step} done={s < step} />
                {s < 3 && (
                  <div
                    className="w-6 h-0.5 rounded-full transition-all duration-500"
                    style={{
                      background:
                        s < step ? "var(--spark-correct-text)" : "var(--muted)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Header ─────────────────────────────────────────── */}
        <header>
          <p
            className="text-xs uppercase tracking-widest font-medium mb-1"
            style={{ color: "var(--primary)" }}
          >
            Step {step} of 3
          </p>
          <h1
            className="font-heading text-3xl font-bold leading-tight"
            style={{ color: "var(--foreground)" }}
          >
            {step === 1 && "Choose your exam level."}
            {step === 2 && "Pick your categories."}
            {step === 3 && "How many questions?"}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            {step === 1 &&
              "Select the Civil Service track that matches your target position."}
            {step === 2 &&
              "Select one or more subject areas to include in this session."}
            {step === 3 &&
              "Pick a session length. Endless mode keeps going until you stop."}
          </p>
        </header>

        {/* ── Step 1: Exam Level ─────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            {EXAM_LEVELS.map((level) => {
              const active = examLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setExamLevel(level.id)}
                  className="text-left w-full rounded-3xl border p-5 flex items-start gap-4 transition-all duration-200 hover:scale-[1.01] focus:outline-none"
                  style={{
                    background: active ? "var(--spark-ai-bg)" : "var(--card)",
                    borderColor: active
                      ? "var(--primary)"
                      : "var(--border)",
                    boxShadow: active
                      ? "0 0 0 2px var(--primary)"
                      : "none",
                  }}
                >
                  {/* check circle */}
                  <div
                    className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                    style={{
                      borderColor: active ? "var(--primary)" : "var(--border)",
                      background: active ? "var(--primary)" : "transparent",
                    }}
                  >
                    {active && (
                      <CheckCircle2
                        size={12}
                        strokeWidth={3}
                        color="white"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-heading text-lg font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {level.label}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{
                          background: level.badgeBg,
                          color: level.badgeColor,
                        }}
                      >
                        {level.badge}
                      </span>
                    </div>
                    <p
                      className="text-xs mt-0.5 font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      {level.subtitle}
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {level.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 2: Categories ─────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            {/* Select All shortcut */}
            <button
              onClick={() =>
                setCategories(
                  categories.length === CATEGORIES.length
                    ? []
                    : (CATEGORIES.map((c) => c.id) as Category[])
                )
              }
              className="self-start text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition-all duration-150 hover:opacity-80"
              style={{
                borderColor:
                  categories.length === CATEGORIES.length
                    ? "var(--primary)"
                    : "var(--border)",
                color:
                  categories.length === CATEGORIES.length
                    ? "var(--primary)"
                    : "var(--muted-foreground)",
                background:
                  categories.length === CATEGORIES.length
                    ? "var(--spark-ai-bg)"
                    : "var(--card)",
              }}
            >
              <Layers size={12} />
              {categories.length === CATEGORIES.length
                ? "Deselect All"
                : "Select All"}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const active = categories.includes(cat.id);
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className="text-left rounded-3xl border p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01] focus:outline-none"
                    style={{
                      background: active ? cat.bg : "var(--card)",
                      borderColor: active ? cat.color : "var(--border)",
                      boxShadow: active
                        ? `0 0 0 2px ${cat.color}`
                        : "none",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{
                          background: active ? cat.color : "var(--muted)",
                          color: active ? "white" : cat.color,
                        }}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                        style={{
                          borderColor: active ? cat.color : "var(--border)",
                          background: active ? cat.color : "transparent",
                        }}
                      >
                        {active && (
                          <CheckCircle2
                            size={11}
                            strokeWidth={3}
                            color="white"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <p
                        className="font-heading text-base font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {cat.full}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Item Count ─────────────────────────────── */}
        {step === 3 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ITEM_COUNTS.map((opt) => {
              const active = itemCount === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => setItemCount(opt.value)}
                  className="rounded-3xl border p-5 flex flex-col items-center justify-center gap-2 aspect-square transition-all duration-200 hover:scale-[1.03] focus:outline-none"
                  style={{
                    background: active ? "var(--spark-ai-bg)" : "var(--card)",
                    borderColor: active ? "var(--primary)" : "var(--border)",
                    boxShadow: active
                      ? "0 0 0 2px var(--primary)"
                      : "none",
                  }}
                >
                  <span
                    className="font-heading text-4xl font-bold leading-none"
                    style={{
                      color: active ? "var(--primary)" : "var(--foreground)",
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: active
                        ? "var(--primary)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {opt.sub}
                  </span>
                  {active && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Summary strip (visible from step 2+) ──────────── */}
        {step >= 2 && (
          <div
            className="rounded-2xl border px-4 py-3 flex items-center gap-3 flex-wrap"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <span
              className="text-xs uppercase tracking-widest font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Session
            </span>
            {summaryLevel && (
              <>
                <ChevronRight size={12} style={{ color: "var(--muted-foreground)" }} />
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {summaryLevel}
                </span>
              </>
            )}
            {step >= 2 && categories.length > 0 && (
              <>
                <ChevronRight size={12} style={{ color: "var(--muted-foreground)" }} />
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  {summaryCategories}
                </span>
              </>
            )}
            {step >= 3 && summaryItems && (
              <>
                <ChevronRight size={12} style={{ color: "var(--muted-foreground)" }} />
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  {summaryItems}
                </span>
              </>
            )}
          </div>
        )}

        {/* ── Navigation buttons ─────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Back / step back */}
          {step === 1 ? (
            <Link href="/dashboard/practice">
              <Button
                variant="outline"
                className="rounded-2xl gap-2"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--muted-foreground)",
                  background: "transparent",
                }}
              >
                <ArrowLeft size={15} /> Cancel
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-2xl gap-2"
              style={{
                borderColor: "var(--border)",
                color: "var(--muted-foreground)",
                background: "transparent",
              }}
            >
              <ArrowLeft size={15} /> Back
            </Button>
          )}

          {/* Next / Start */}
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="rounded-2xl gap-2 font-heading font-bold px-6"
              style={{
                background:
                  (step === 1 ? step1Valid : step2Valid)
                    ? "var(--primary)"
                    : "var(--muted)",
                color:
                  (step === 1 ? step1Valid : step2Valid)
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
                cursor:
                  (step === 1 ? step1Valid : step2Valid)
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Continue <ArrowRight size={15} />
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={!step3Valid}
              className="rounded-2xl gap-2 font-heading font-bold px-6 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: step3Valid
                  ? "linear-gradient(135deg, var(--primary) 0%, #3730A3 100%)"
                  : "var(--muted)",
                color: step3Valid
                  ? "var(--primary-foreground)"
                  : "var(--muted-foreground)",
                cursor: step3Valid ? "pointer" : "not-allowed",
              }}
            >
              <Sparkles size={15} /> Start Practice Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}