"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  BrainCircuit,
  Globe2,
  CalculatorIcon,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getProfile } from "../../actions";
import { createPracticeSession, getUserMonetizationStatus } from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "verbal" | "numerical" | "analytical" | "clerical" | "general";
type ItemCount = 10 | 20 | 50 | "endless";

// ─── Data ─────────────────────────────────────────────────────────────────────

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

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [examCategory, setExamCategory] = useState<string | null>(null);
  
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemCount, setItemCount] = useState<ItemCount | null>(null);

  // Fetch user's exam category & premium status on mount
  useEffect(() => {
    async function load() {
      const [profileRes, monStatus] = await Promise.all([
        getProfile(),
        getUserMonetizationStatus()
      ]);

      if (profileRes?.profile?.exam_category) {
        setExamCategory(profileRes.profile.exam_category);
      } else {
        // If no category is found, kick them back to the dashboard to select one
        router.push("/dashboard");
        return;
      }

      if (monStatus && !monStatus.error) {
        setIsPremium(monStatus.isPremium);
      }

      setIsLoading(false);
    }
    load();
  }, [router]);

  // Dynamically build the category options based on user's exam track
  const availableCategories = useMemo(() => {
    const base = [
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
    ];

    if (examCategory === "Subprofessional") {
      base.push({
        id: "clerical" as Category,
        label: "Clerical",
        full: "Clerical Operations",
        description: "Filing, alphabetizing, office procedures",
        icon: ClipboardList,
        color: "var(--accent)",
        bg: "#FFFBEB",
        border: "#FDE68A",
      });
    } else {
      base.push({
        id: "analytical" as Category,
        label: "Analytical",
        full: "Analytical Ability",
        description: "Pattern recognition, logic, data sufficiency",
        icon: BrainCircuit,
        color: "var(--accent)",
        bg: "#FFFBEB",
        border: "#FDE68A",
      });
    }

    base.push({
      id: "general" as Category,
      label: "General Info",
      full: "General Information & CS",
      description: "Philippine history, government, constitution",
      icon: Globe2,
      color: "var(--spark-correct-text)",
      bg: "var(--spark-correct-bg)",
      border: "var(--spark-correct-border)",
    });

    return base;
  }, [examCategory]);

  const toggleCategory = (cat: Category) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // derive per-step validity
  const step1Valid = categories.length > 0;
  const step2Valid = itemCount !== null;
  const allValid = step1Valid && step2Valid;

  const handleStart = async () => {
    if (!allValid) return;
    setIsStarting(true);
    
    try {
      const res = await createPracticeSession(categories, String(itemCount));
      
      if (res?.error || !res?.practiceId) {
        console.error("Failed to start session:", res?.error);
        setIsStarting(false);
        return;
      }

      // Route to the actual practiceId dynamic route
      router.push(`/dashboard/practice/${res.practiceId}`);
    } catch (error) {
      console.error(error);
      setIsStarting(false);
    }
  };

  // summary label helpers
  const allowedCategoriesList = availableCategories.filter(
    (c) => isPremium || (c.id !== "numerical" && c.id !== "analytical")
  );

  const summaryCategories =
    categories.length === allowedCategoriesList.length
      ? "All Categories"
      : categories
          .map((c) => availableCategories.find((x) => x.id === c)?.label)
          .join(", ");
          
  const summaryItems =
    itemCount === "endless"
      ? "Endless"
      : itemCount
      ? `${itemCount} items`
      : null;

  // Prevent flash of UI while checking auth
  if (isLoading) {
    return <div className="min-h-screen w-full bg-background" />;
  }

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
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <StepDot step={s} current={step} done={s < step} />
                {s < 2 && (
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
            Step {step} of 2
          </p>
          <h1
            className="font-heading text-3xl font-bold leading-tight"
            style={{ color: "var(--foreground)" }}
          >
            {step === 1 && `Pick your categories for the ${examCategory} exam.`}
            {step === 2 && "How many questions?"}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            {step === 1 &&
              "Select one or more subject areas to include in this session."}
            {step === 2 &&
              "Pick a session length. Endless mode keeps going until you stop."}
          </p>
        </header>

        {/* ── Step 1: Categories ─────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            {/* Select All shortcut */}
            <button
              onClick={() =>
                setCategories(
                  categories.length === allowedCategoriesList.length
                    ? []
                    : (allowedCategoriesList.map((c) => c.id) as Category[])
                )
              }
              className="self-start text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition-all duration-150 hover:opacity-80"
              style={{
                borderColor:
                  categories.length === allowedCategoriesList.length && categories.length > 0
                    ? "var(--primary)"
                    : "var(--border)",
                color:
                  categories.length === allowedCategoriesList.length && categories.length > 0
                    ? "var(--primary)"
                    : "var(--muted-foreground)",
                background:
                  categories.length === allowedCategoriesList.length && categories.length > 0
                    ? "var(--spark-ai-bg)"
                    : "var(--card)",
              }}
            >
              <Layers size={12} />
              {categories.length === allowedCategoriesList.length && categories.length > 0
                ? "Deselect All"
                : "Select All"}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableCategories.map((cat) => {
                const active = categories.includes(cat.id);
                const isLocked = !isPremium && (cat.id === "numerical" || cat.id === "analytical");
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (isLocked) {
                        setShowPaywall(true);
                        return;
                      }
                      toggleCategory(cat.id);
                    }}
                    className={`relative text-left rounded-3xl border p-5 flex flex-col gap-3 transition-all duration-200 focus:outline-none ${isLocked ? "opacity-70 hover:scale-100" : "hover:scale-[1.01]"}`}
                    style={{
                      background: active ? cat.bg : "var(--card)",
                      borderColor: active ? cat.color : "var(--border)",
                      boxShadow: active
                        ? `0 0 0 2px ${cat.color}`
                        : "none",
                    }}
                  >
                    {isLocked && (
                      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm border">
                        <Lock size={14} className="text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isLocked ? "grayscale" : ""}`}
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

        {/* ── Step 2: Item Count ─────────────────────────────── */}
        {step === 2 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ITEM_COUNTS.map((opt) => {
              const active = itemCount === opt.value;
              const isLocked = !isPremium && (opt.value === 50 || opt.value === "endless");

              return (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    if (isLocked) {
                      setShowPaywall(true);
                      return;
                    }
                    setItemCount(opt.value);
                  }}
                  className={`relative rounded-3xl border p-5 flex flex-col items-center justify-center gap-2 aspect-square transition-all duration-200 focus:outline-none ${isLocked ? "opacity-70 hover:scale-100" : "hover:scale-[1.03]"}`}
                  style={{
                    background: active ? "var(--spark-ai-bg)" : "var(--card)",
                    borderColor: active ? "var(--primary)" : "var(--border)",
                    boxShadow: active
                      ? "0 0 0 2px var(--primary)"
                      : "none",
                  }}
                >
                  {isLocked && (
                    <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm border">
                      <Lock size={12} className="text-muted-foreground" />
                    </div>
                  )}

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

        {/* ── Summary strip ─────────────────────────────────── */}
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
          {examCategory && (
            <>
              <ChevronRight size={12} style={{ color: "var(--muted-foreground)" }} />
              <span
                className="text-xs font-bold"
                style={{ color: "var(--primary)" }}
              >
                {examCategory}
              </span>
            </>
          )}
          {categories.length > 0 && (
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
          {step >= 2 && summaryItems && (
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
          {step < 2 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!step1Valid}
              className="rounded-2xl gap-2 font-heading font-bold px-6"
              style={{
                background: step1Valid ? "var(--primary)" : "var(--muted)",
                color: step1Valid
                  ? "var(--primary-foreground)"
                  : "var(--muted-foreground)",
                cursor: step1Valid ? "pointer" : "not-allowed",
              }}
            >
              Continue <ArrowRight size={15} />
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={!step2Valid || isStarting}
              className="rounded-2xl gap-2 font-heading font-bold px-6 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: step2Valid
                  ? "linear-gradient(135deg, var(--primary) 0%, #3730A3 100%)"
                  : "var(--muted)",
                color: step2Valid
                  ? "var(--primary-foreground)"
                  : "var(--muted-foreground)",
                cursor: step2Valid || isStarting ? "pointer" : "not-allowed",
              }}
            >
              {isStarting ? (
                <>
                  <Sparkles size={15} className="animate-pulse" /> Preparing...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Start Practice Session
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* ── Paywall Modal ────────────────────────────────────────── */}
      <AlertDialog open={showPaywall} onOpenChange={setShowPaywall}>
        <AlertDialogContent className="rounded-[32px] sm:rounded-[32px] max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-primary w-8 h-8" />
            </div>
            <AlertDialogTitle className="font-heading text-2xl text-center">Unlock Full Access</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Numerical & Analytical categories, along with extended item counts, are reserved for Premium users. Unlock everything for a one-time ₱99!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center sm:space-x-3 mt-4 flex-col gap-2">
            <AlertDialogAction
              onClick={() => router.push("/pricing")}
              className="rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 w-full font-bold py-6 text-base"
            >
              <Sparkles size={18} className="mr-2" /> Upgrade for ₱99
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-2xl border-transparent bg-muted hover:bg-muted/80 w-full sm:mt-0">
              Maybe Later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}