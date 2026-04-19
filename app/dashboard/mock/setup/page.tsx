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
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExamLevel = "professional" | "subprofessional" | null;

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXAM_SPECS = {
  professional: { items: 150, hours: 3, label: "Professional", sub: "Career Service — Professional" },
  subprofessional: { items: 120, hours: 2, label: "Subprofessional", sub: "Career Service — SubProf" },
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
}: {
  level: keyof typeof EXAM_SPECS;
  selected: boolean;
  onSelect: () => void;
}) {
  const spec = EXAM_SPECS[level];
  return (
    <button
      onClick={onSelect}
      className="group relative flex-1 text-left rounded-3xl border p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01] focus:outline-none"
      style={{
        background: selected ? "var(--spark-ai-bg)" : "var(--card)",
        borderColor: selected ? "var(--primary)" : "var(--border)",
        boxShadow: selected ? "0 0 0 2px var(--primary)" : "none",
      }}
    >
      {/* selection indicator */}
      <div
        className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
        style={{
          borderColor: selected ? "var(--primary)" : "var(--border)",
          background: selected ? "var(--primary)" : "transparent",
        }}
      >
        {selected && <CheckCircle2 size={11} strokeWidth={3} color="white" />}
      </div>

      {/* icon blob */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{
          background: selected ? "var(--primary)" : "var(--muted)",
          color: selected ? "white" : "var(--primary)",
        }}
      >
        <Shield size={18} strokeWidth={2} />
      </div>

      <div>
        <p
          className="font-heading text-lg font-bold leading-tight"
          style={{ color: "var(--foreground)" }}
        >
          {spec.label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>
          {spec.sub}
        </p>
      </div>

      {/* spec pills */}
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

function RuleCard({
  rule,
  index,
}: {
  rule: (typeof RULES)[0];
  index: number;
}) {
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
          style={{
            color: high ? "var(--spark-wrong-text)" : "var(--foreground)",
          }}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MockSetupPage() {
  const router = useRouter();
  const [examLevel, setExamLevel] = useState<ExamLevel>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const canStart = examLevel !== null && acknowledged;
  const spec = examLevel ? EXAM_SPECS[examLevel] : null;

  const handleBegin = () => {
    if (!canStart) return;
    router.push('/dashboard/mock/test-456');
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--background)" }}>
      {/* ── Ambient atmosphere ──────────────────────────────── */}
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
        style={{
          background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-28 flex flex-col gap-8">

        {/* ── Back nav ─────────────────────────────────────── */}
        <Link
          href="/dashboard/mock"
          className="flex items-center gap-1.5 text-sm w-fit transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={15} /> Back to Mock Exams
        </Link>

        {/* ── Psychological header ──────────────────────────── */}
        <header className="flex flex-col items-center text-center gap-3 py-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, #312E81 100%)",
              boxShadow: "0 0 40px var(--spark-ai-border)",
            }}
          >
            <Shield size={28} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] font-medium mb-1"
              style={{ color: "var(--primary)" }}
            >
              Civil Service Exam Simulation
            </p>
            <h1
              className="font-heading text-4xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Readiness Check
            </h1>
            <p
              className="text-sm mt-2 max-w-sm mx-auto"
              style={{ color: "var(--muted-foreground)" }}
            >
              Before you begin, confirm your exam level and accept the
              simulation conditions. This is as close to the real thing as it gets.
            </p>
          </div>
        </header>

        {/* ── Step 1: Level Selection ───────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
              style={{ background: "var(--primary)", color: "white" }}
            >
              1
            </div>
            <h2
              className="font-heading text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--foreground)" }}
            >
              Select Exam Level
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {(["professional", "subprofessional"] as const).map((level) => (
              <LevelCard
                key={level}
                level={level}
                selected={examLevel === level}
                onSelect={() => setExamLevel(level)}
              />
            ))}
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
                <strong>{spec.hours} hour{spec.hours > 1 ? "s" : ""}</strong> to
                answer <strong>{spec.items} items</strong> — that's roughly{" "}
                <strong>
                  {Math.floor((spec.hours * 3600) / spec.items)} seconds
                </strong>{" "}
                per question.
              </span>
            </div>
          )}
        </section>

        {/* ── Step 2: Rules ─────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
              style={{ background: "var(--primary)", color: "white" }}
            >
              2
            </div>
            <h2
              className="font-heading text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--foreground)" }}
            >
              Simulation Rules
            </h2>
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "var(--spark-wrong-bg)",
                color: "var(--spark-wrong-text)",
                border: "1px solid var(--spark-wrong-border)",
              }}
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

        {/* ── Step 3: Acknowledgment ────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
              style={{ background: "var(--primary)", color: "white" }}
            >
              3
            </div>
            <h2
              className="font-heading text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--foreground)" }}
            >
              Acknowledge & Confirm
            </h2>
          </div>

          <button
            onClick={() => setAcknowledged((v) => !v)}
            className="w-full text-left rounded-3xl border p-5 flex items-start gap-4 transition-all duration-200 focus:outline-none"
            style={{
              background: acknowledged ? "var(--spark-correct-bg)" : "var(--card)",
              borderColor: acknowledged
                ? "var(--spark-correct-text)"
                : "var(--border)",
              boxShadow: acknowledged
                ? "0 0 0 2px var(--spark-correct-text)"
                : "none",
            }}
          >
            {/* big checkbox */}
            <div
              className="mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                borderColor: acknowledged
                  ? "var(--spark-correct-text)"
                  : "var(--border)",
                background: acknowledged
                  ? "var(--spark-correct-text)"
                  : "transparent",
              }}
            >
              {acknowledged && (
                <CheckCircle2 size={14} strokeWidth={3} color="white" />
              )}
            </div>
            <div>
              <p
                className="font-heading text-base font-bold"
                style={{
                  color: acknowledged
                    ? "var(--spark-correct-text)"
                    : "var(--foreground)",
                }}
              >
                I am ready to begin my simulation
              </p>
              <p
                className="text-xs mt-1 leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                I understand that the exam is timed, cannot be paused, and that
                results will only be shown after I submit. I have read and accept
                all simulation conditions above.
              </p>
            </div>
          </button>
        </section>

        {/* ── Warning if not all done ────────────────────────── */}
        {(!examLevel || !acknowledged) && (
          <div
            className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            <AlertTriangle size={13} style={{ color: "var(--accent)" }} />
            {!examLevel && !acknowledged
              ? "Select an exam level and acknowledge the conditions to continue."
              : !examLevel
              ? "Please select your exam level to continue."
              : "Please acknowledge the simulation conditions to continue."}
          </div>
        )}

        {/* ── Action row ────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Link href="/dashboard/mock">
            <Button
              variant="outline"
              className="rounded-2xl gap-2"
              style={{
                borderColor: "var(--border)",
                color: "var(--muted-foreground)",
                background: "transparent",
              }}
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
                    background:
                      "linear-gradient(135deg, var(--primary) 0%, #312E81 100%)",
                    color: "var(--primary-foreground)",
                    boxShadow: "0 4px 24px var(--spark-ai-border)",
                    transform: "none",
                    cursor: "pointer",
                  }
                : {
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                    cursor: "not-allowed",
                  }
            }
          >
            <Zap
              size={15}
              fill={canStart ? "white" : "var(--muted-foreground)"}
              strokeWidth={0}
            />
            Begin Mock Exam
            {canStart && <ChevronRight size={14} />}
          </Button>
        </div>

        {/* ── Footer note ──────────────────────────────────── */}
        <p
          className="text-center text-xs pb-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          Once you click "Begin Mock Exam", the timer starts immediately.
          <br />
          Make sure you're in a quiet place with a stable connection.
        </p>
      </div>
    </div>
  );
}