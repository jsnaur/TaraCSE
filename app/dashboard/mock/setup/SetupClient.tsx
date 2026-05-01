"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Clock,
  EyeOff,
  Ban,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Timer,
  FileText,
  Wifi,
  Volume2,
  Zap,
  Lock,
  Crown,
  FlaskConical,
  Star,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ExamLevel = "professional" | "subprofessional" | "diagnostic" | null;
type UserState = "premium" | "free_eligible" | "free_exhausted";

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXAM_SPECS = {
  diagnostic: {
    items: 75,
    hours: 1.5,
    label: "Diagnostic Exam",
    sub: "Baseline Assessment — Free",
    icon: FlaskConical,
    accent: "#0F766E",
    accentLight: "#CCFBF1",
  },
  professional: {
    items: 150,
    hours: 3,
    label: "Professional",
    sub: "Career Service — Professional",
    icon: Shield,
    accent: "var(--primary)",
    accentLight: "var(--spark-ai-bg)",
  },
  subprofessional: {
    items: 120,
    hours: 2,
    label: "Subprofessional",
    sub: "Career Service — SubProf",
    icon: Shield,
    accent: "var(--primary)",
    accentLight: "var(--spark-ai-bg)",
  },
};

const RULES = [
  {
    icon: Clock,
    title: "Strictly Timed",
    body: "The timer starts the moment you begin and cannot be paused. You will be automatically submitted when time runs out.",
    severity: "high" as const,
  },
  {
    icon: EyeOff,
    title: "No Peeking",
    body: "Results, scores, and correct answers are revealed only at the end. You cannot review previous questions mid-exam.",
    severity: "high" as const,
  },
  {
    icon: Ban,
    title: "No Interruptions",
    body: "Leaving this tab or closing the browser does not pause the exam. The timer continues running in the background.",
    severity: "high" as const,
  },
  {
    icon: FileText,
    title: "All Sections Covered",
    body: "The exam includes all four subject areas in fixed proportion — just like the actual CSE. You cannot skip sections.",
    severity: "medium" as const,
  },
  {
    icon: Wifi,
    title: "Stable Connection Required",
    body: "Ensure you have a reliable internet connection. Answers are saved periodically, but a disconnection may affect your session.",
    severity: "medium" as const,
  },
  {
    icon: Volume2,
    title: "Exam Conditions",
    body: "Find a quiet environment. Treat this simulation exactly as you would the real Civil Service Examination.",
    severity: "medium" as const,
  },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

function LevelCard({
  level,
  selected,
  onSelect,
  locked,
}: {
  level: keyof typeof EXAM_SPECS;
  selected: boolean;
  onSelect: () => void;
  locked?: boolean;
}) {
  const spec = EXAM_SPECS[level];
  const Icon = spec.icon;
  const isDiagnostic = level === "diagnostic";

  return (
    <button
      onClick={onSelect}
      className="group relative flex-1 text-left rounded-3xl border p-5 flex flex-col gap-3 transition-all duration-200 focus:outline-none"
      style={{
        background: locked
          ? "var(--muted)"
          : selected
          ? isDiagnostic
            ? "#F0FDF4"
            : "var(--spark-ai-bg)"
          : "var(--card)",
        borderColor: locked
          ? "var(--border)"
          : selected
          ? isDiagnostic
            ? "#16A34A"
            : "var(--primary)"
          : "var(--border)",
        boxShadow: !locked && selected
          ? isDiagnostic
            ? "0 0 0 2px #16A34A"
            : "0 0 0 2px var(--primary)"
          : "none",
        opacity: locked ? 0.55 : 1,
        cursor: locked ? "default" : "pointer",
      }}
    >
      <div
        className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
        style={{
          borderColor: locked
            ? "var(--muted-foreground)"
            : selected
            ? isDiagnostic
              ? "#16A34A"
              : "var(--primary)"
            : "var(--border)",
          background: locked
            ? "var(--muted)"
            : selected
            ? isDiagnostic
              ? "#16A34A"
              : "var(--primary)"
            : "transparent",
        }}
      >
        {locked ? (
          <Lock size={11} strokeWidth={2.5} style={{ color: "var(--muted-foreground)" }} />
        ) : selected ? (
          <CheckCircle2 size={12} strokeWidth={3} color="white" />
        ) : null}
      </div>

      {locked && (
        <div
          className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
          style={{ background: "#FEF3C7", color: "#B45309" }}
        >
          <Crown size={8} /> Premium
        </div>
      )}

      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200"
        style={{
          background: locked
            ? "var(--border)"
            : selected
            ? isDiagnostic
              ? "#16A34A"
              : "var(--primary)"
            : "var(--muted)",
          color: locked
            ? "var(--muted-foreground)"
            : selected
            ? "white"
            : isDiagnostic
            ? "#0F766E"
            : "var(--primary)",
        }}
      >
        <Icon size={18} strokeWidth={2} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <p className="font-heading text-lg font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            {spec.label}
          </p>
          {isDiagnostic && !locked && (
            <span
              className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
              style={{ background: "#DCFCE7", color: "#15803D" }}
            >
              <Star size={7} fill="#15803D" strokeWidth={0} /> FREE
            </span>
          )}
        </div>
        <p
          className="text-xs mt-0.5"
          style={{
            color: locked
              ? "var(--muted-foreground)"
              : isDiagnostic
              ? "#0F766E"
              : "var(--primary)",
          }}
        >
          {spec.sub}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-xl"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <FileText size={10} />
          {spec.items} items
        </span>
        <span
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-xl"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <Timer size={10} />
          {spec.hours} hours
        </span>
      </div>
    </button>
  );
}

function RuleCard({ rule, index }: { rule: (typeof RULES)[0]; index: number }) {
  const Icon = rule.icon;
  const high = rule.severity === "high";
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border p-4"
      style={{
        background: high ? "var(--spark-wrong-bg)" : "var(--card)",
        borderColor: high ? "var(--spark-wrong-border)" : "var(--border)",
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: high ? "var(--spark-wrong-border)" : "var(--muted)",
          color: high ? "var(--spark-wrong-text)" : "var(--muted-foreground)",
        }}
      >
        <Icon size={15} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-heading font-bold"
          style={{ color: high ? "var(--spark-wrong-text)" : "var(--foreground)" }}
        >
          {rule.title}
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          {rule.body}
        </p>
      </div>
      <span
        className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0"
        style={{
          background: high ? "var(--spark-wrong-border)" : "var(--muted)",
          color: high ? "var(--spark-wrong-text)" : "var(--muted-foreground)",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function SetupClient({ userState }: { userState: UserState }) {
  const router = useRouter();
  const [examLevel, setExamLevel] = useState<ExamLevel>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);

  const isFreeEligible = userState === "free_eligible";
  const canStart = examLevel !== null && acknowledged;
  const spec = examLevel ? EXAM_SPECS[examLevel] : null;

  const handleLevelSelect = (level: ExamLevel) => {
    if (!level) return;
    if (isFreeEligible && level !== "diagnostic") {
      setUpsellOpen(true);
      return;
    }
    setExamLevel(level);
  };

  const handleBegin = () => {
    if (!canStart) return;
    // Route to actual exam session setup/creation API
    router.push("/dashboard/mock/test-456"); 
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--background)" }}>
      <AlertDialog open={upsellOpen} onOpenChange={setUpsellOpen}>
        <AlertDialogContent
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
            borderRadius: "1.5rem",
            maxWidth: "380px",
          }}
        >
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
                }}
              >
                <Crown size={26} color="white" />
              </div>
            </div>
            <AlertDialogTitle
              className="font-heading text-xl font-bold text-center"
              style={{ color: "var(--foreground)" }}
            >
              Premium Exam
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Full-length Professional and Subprofessional exams are available to Premium members.
              Upgrade for <strong style={{ color: "var(--accent)" }}>₱99</strong> to unlock unlimited practice, detailed analytics, and AI-powered review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction asChild>
              <Link href="/pricing" className="w-full">
                <Button
                  className="w-full rounded-2xl gap-2 font-heading font-bold transition-all duration-200 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #B45309 100%)",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
                  }}
                >
                  <Crown size={14} /> Upgrade to Premium — ₱99
                </Button>
              </Link>
            </AlertDialogAction>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className="w-full rounded-2xl font-heading"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "transparent" }}
              >
                Maybe Later
              </Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 40px, var(--border) 40px, var(--border) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, var(--border) 40px, var(--border) 41px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] opacity-[0.12] blur-[120px] rounded-full"
        style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-28 flex flex-col gap-8">
        <Link
          href="/dashboard/mock"
          className="flex items-center gap-1.5 text-sm w-fit transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={15} /> Back to Mock Exams
        </Link>

        <header className="flex flex-col items-center text-center gap-3 py-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, #0F1D35 100%)",
              boxShadow: "0 0 40px var(--spark-ai-border)",
            }}
          >
            <Shield size={28} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-medium mb-1" style={{ color: "var(--primary)" }}>
              Civil Service Exam Simulation
            </p>
            <h1 className="font-heading text-4xl font-bold" style={{ color: "var(--foreground)" }}>
              Readiness Check
            </h1>
            <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: "var(--muted-foreground)" }}>
              {isFreeEligible
                ? "Confirm your diagnostic exam and accept the simulation conditions. This is as close to the real thing as it gets."
                : "Before you begin, confirm your exam level and accept the simulation conditions."}
            </p>
          </div>
        </header>

        {isFreeEligible && (
          <div
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: "#ECFDF5", borderColor: "#A7F3D0" }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#D1FAE5" }}>
              <FlaskConical size={15} style={{ color: "#059669" }} />
            </div>
            <div>
              <p className="text-sm font-heading font-bold" style={{ color: "#065F46" }}>
                Your free Diagnostic Exam is ready
              </p>
              <p className="text-xs" style={{ color: "#047857" }}>
                75 items · 1.5 hours · Covers all four CSE subject areas. No payment needed.
              </p>
            </div>
          </div>
        )}

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
              style={{ background: "var(--primary)", color: "white" }}
            >
              1
            </div>
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
              Select Exam Level
            </h2>
            {isFreeEligible && (
              <span
                className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                1 of 3 available
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <LevelCard
              level="diagnostic"
              selected={examLevel === "diagnostic"}
              onSelect={() => handleLevelSelect("diagnostic")}
              locked={false}
            />
            <LevelCard
              level="professional"
              selected={examLevel === "professional"}
              onSelect={() => handleLevelSelect("professional")}
              locked={isFreeEligible}
            />
            <LevelCard
              level="subprofessional"
              selected={examLevel === "subprofessional"}
              onSelect={() => handleLevelSelect("subprofessional")}
              locked={isFreeEligible}
            />
          </div>

          {spec && (
            <div
              className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs"
              style={{
                background: "var(--spark-ai-bg)",
                borderColor: "var(--spark-ai-border)",
                color: "var(--spark-ai-text)",
              }}
            >
              <Timer size={13} />
              <span>
                You will have{" "}
                <strong>{spec.hours} hour{spec.hours > 1 ? "s" : ""}</strong> to answer{" "}
                <strong>{spec.items} items</strong> — that's roughly{" "}
                <strong>{Math.floor((spec.hours * 3600) / spec.items)} seconds</strong> per question.
              </span>
            </div>
          )}

          {isFreeEligible && (
            <div
              className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 flex-wrap"
              style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
            >
              <div className="flex items-center gap-2">
                <Crown size={14} style={{ color: "var(--accent)" }} />
                <span className="text-xs font-medium" style={{ color: "#92400E" }}>
                  Want the full 150-item exam?
                </span>
              </div>
              <Link href="/pricing">
                <Button
                  size="sm"
                  className="rounded-xl gap-1 font-bold text-xs h-7 px-3 transition-all duration-200 hover:scale-105"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  <Crown size={10} /> Upgrade — ₱99
                </Button>
              </Link>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
              style={{ background: "var(--primary)", color: "white" }}
            >
              2
            </div>
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
              Simulation Rules
            </h2>
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--spark-wrong-bg)", color: "var(--spark-wrong-text)", border: "1px solid var(--spark-wrong-border)" }}
            >
              Read carefully
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {RULES.map((rule, i) => (
              <RuleCard key={rule.title} rule={rule} index={i} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
              style={{ background: "var(--primary)", color: "white" }}
            >
              3
            </div>
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
              Acknowledge & Confirm
            </h2>
          </div>

          <button
            onClick={() => setAcknowledged((v) => !v)}
            className="w-full text-left rounded-3xl border p-5 flex items-start gap-4 transition-all duration-200 focus:outline-none"
            style={{
              background: acknowledged ? "var(--spark-correct-bg)" : "var(--card)",
              borderColor: acknowledged ? "var(--spark-correct-text)" : "var(--border)",
              boxShadow: acknowledged ? "0 0 0 2px var(--spark-correct-text)" : "none",
            }}
          >
            <div
              className="mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                borderColor: acknowledged ? "var(--spark-correct-text)" : "var(--border)",
                background: acknowledged ? "var(--spark-correct-text)" : "transparent",
              }}
            >
              {acknowledged && <CheckCircle2 size={14} strokeWidth={3} color="white" />}
            </div>
            <div>
              <p
                className="font-heading text-base font-bold"
                style={{ color: acknowledged ? "var(--spark-correct-text)" : "var(--foreground)" }}
              >
                I am ready to begin my simulation
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                I understand that the exam is timed, cannot be paused, and that results will only be shown after I submit. I have read and accept all simulation conditions above.
              </p>
            </div>
          </button>
        </section>

        {(!examLevel || !acknowledged) && (
          <div
            className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            <AlertTriangle size={13} style={{ color: "var(--accent)" }} />
            {!examLevel && !acknowledged
              ? "Select an exam level and acknowledge the conditions to continue."
              : !examLevel
              ? "Please select your exam level to continue."
              : "Please acknowledge the simulation conditions to continue."}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-2">
          <Link href="/dashboard/mock">
            <Button
              variant="outline"
              className="rounded-2xl gap-2"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "transparent" }}
            >
              <ArrowLeft size={14} /> Cancel
            </Button>
          </Link>

          <Button
            onClick={handleBegin}
            disabled={!canStart}
            className="rounded-2xl gap-2 font-heading font-bold px-7 text-sm transition-all duration-200"
            style={
              canStart
                ? {
                    background: "linear-gradient(135deg, var(--primary) 0%, #0F1D35 100%)",
                    color: "var(--primary-foreground)",
                    boxShadow: "0 4px 24px var(--spark-ai-border)",
                    cursor: "pointer",
                  }
                : {
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                    cursor: "not-allowed",
                  }
            }
          >
            <Zap size={15} fill={canStart ? "white" : "var(--muted-foreground)"} strokeWidth={0} />
            Begin Mock Exam
            {canStart && <ChevronRight size={14} />}
          </Button>
        </div>

        <p className="text-center text-xs pb-2" style={{ color: "var(--muted-foreground)" }}>
          Once you click "Begin Mock Exam", the timer starts immediately.
          <br />
          Make sure you're in a quiet place with a stable connection.
        </p>
      </div>
    </div>
  );
}