"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Share2,
  BookOpen,
  Brain,
  Trophy,
  Zap,
  Award,
  BarChart3,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { id: string; text: string };

type QuestionResult = {
  id: number;
  category: string;
  text: string;
  options: Option[];
  correctId: string;
  userSelectedId: string | null;
  explanation: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RESULTS: QuestionResult[] = [
  {
    id: 1,
    category: "Vocabulary",
    text: 'Choose the word closest in meaning to "PERFIDIOUS".',
    options: [
      { id: "a", text: "Loyal and devoted" },
      { id: "b", text: "Treacherous and deceitful" },
      { id: "c", text: "Generous and kind" },
      { id: "d", text: "Cautious and careful" },
    ],
    correctId: "b",
    userSelectedId: "b",
    explanation:
      "Perfidious means guilty of betrayal or treachery. It comes from the Latin 'perfidia' meaning faithlessness. A perfidious person is one who breaks trust or acts deceitfully — making 'treacherous and deceitful' the correct match.",
  },
  {
    id: 2,
    category: "Numerical Reasoning",
    text: "A train travels 240 km in 3 hours. At the same speed, how long will it take to travel 400 km?",
    options: [
      { id: "a", text: "4 hours" },
      { id: "b", text: "4.5 hours" },
      { id: "c", text: "5 hours" },
      { id: "d", text: "5.5 hours" },
    ],
    correctId: "c",
    userSelectedId: "b",
    explanation:
      "Speed = 240 ÷ 3 = 80 km/h. Time = Distance ÷ Speed = 400 ÷ 80 = 5 hours. The key is finding the rate first, then applying it to the new distance. Option B (4.5 hours) would only cover 360 km at that speed.",
  },
  {
    id: 3,
    category: "Reading Comprehension",
    text: 'Based on the passage: "The bayanihan spirit — the Filipino tradition of communal unity and cooperation — remains the bedrock of resilience in Philippine communities, especially during times of calamity."\n\nWhat does "bayanihan" primarily represent?',
    options: [
      { id: "a", text: "Individual achievement and competition" },
      { id: "b", text: "Government-led disaster response" },
      { id: "c", text: "Communal unity and cooperation" },
      { id: "d", text: "Religious devotion and faith" },
    ],
    correctId: "c",
    userSelectedId: "c",
    explanation:
      'The passage explicitly defines bayanihan as "the Filipino tradition of communal unity and cooperation." This is a direct comprehension question — the definition is stated verbatim in the text.',
  },
  {
    id: 4,
    category: "Vocabulary",
    text: 'Select the word OPPOSITE in meaning to "LOQUACIOUS".',
    options: [
      { id: "a", text: "Talkative" },
      { id: "b", text: "Reticent" },
      { id: "c", text: "Eloquent" },
      { id: "d", text: "Boisterous" },
    ],
    correctId: "b",
    userSelectedId: "a",
    explanation:
      "Loquacious means tending to talk a great deal. Its antonym is reticent, meaning reluctant to speak or reserved. 'Talkative' is actually a synonym of loquacious, not its opposite. Reticent people speak little — the complete opposite of someone who is loquacious.",
  },
  {
    id: 5,
    category: "Numerical Reasoning",
    text: "If the ratio of male to female employees in a government office is 3:5 and there are 120 female employees, how many total employees are there?",
    options: [
      { id: "a", text: "168" },
      { id: "b", text: "192" },
      { id: "c", text: "200" },
      { id: "d", text: "216" },
    ],
    correctId: "b",
    userSelectedId: "b",
    explanation:
      "If 5 parts = 120 females, then 1 part = 24. Male employees = 3 × 24 = 72. Total = 72 + 120 = 192. Always find the value of one 'part' first when working with ratios.",
  },
  {
    id: 6,
    category: "Analytical Reasoning",
    text: "All civil servants are government employees. Some government employees are lawyers. Which conclusion is definitely true?",
    options: [
      { id: "a", text: "All lawyers are civil servants" },
      { id: "b", text: "Some civil servants are lawyers" },
      { id: "c", text: "No civil servants are lawyers" },
      { id: "d", text: "All civil servants are lawyers" },
    ],
    correctId: "b",
    userSelectedId: null,
    explanation:
      "From the two statements, we know: (1) All civil servants ⊂ government employees, and (2) Some government employees are lawyers. It's possible (though not certain) that some of those lawyers are civil servants. Only option B ('Some civil servants are lawyers') can be validly inferred — it's possible but the others are too absolute to be guaranteed.",
  },
  {
    id: 7,
    category: "Numerical Reasoning",
    text: "A civil service exam has 100 items worth 1 point each. Passing requires 80%. If Maricel answered 15 items incorrectly and skipped 5, what is her score?",
    options: [
      { id: "a", text: "75 — she passed" },
      { id: "b", text: "80 — she passed" },
      { id: "c", text: "80 — she failed" },
      { id: "d", text: "75 — she failed" },
    ],
    correctId: "b",
    userSelectedId: "b",
    explanation:
      "Correct answers = 100 − 15 (wrong) − 5 (skipped) = 80. Score = 80/100 = 80%. Since passing is exactly 80%, she meets the threshold and passes. Always subtract both wrong AND skipped from total when calculating score.",
  },
  {
    id: 8,
    category: "Reading Comprehension",
    text: 'Read: "Integrity in public service is not merely the absence of corruption, but the active pursuit of transparency, accountability, and ethical conduct in all government transactions."\n\nThe author implies that true integrity is:',
    options: [
      { id: "a", text: "Simply avoiding corrupt behavior" },
      { id: "b", text: "A passive quality requiring no action" },
      { id: "c", text: "An active commitment to ethical standards" },
      { id: "d", text: "Relevant only to financial matters" },
    ],
    correctId: "c",
    userSelectedId: "a",
    explanation:
      "The passage explicitly contrasts integrity as 'not merely the absence of corruption' (passive) with 'active pursuit of transparency and accountability.' The word 'active' is the key — true integrity requires deliberate effort, not just avoiding bad behavior.",
  },
];

// ─── Derived Stats ────────────────────────────────────────────────────────────

const correct = MOCK_RESULTS.filter((q) => q.userSelectedId === q.correctId).length;
const wrong = MOCK_RESULTS.filter((q) => q.userSelectedId !== null && q.userSelectedId !== q.correctId).length;
const skipped = MOCK_RESULTS.filter((q) => q.userSelectedId === null).length;
const total = MOCK_RESULTS.length;
const accuracy = Math.round((correct / total) * 100);
const TIME_SPENT = "42m 18s";

const categoryStats = MOCK_RESULTS.reduce<Record<string, { correct: number; total: number }>>((acc, q) => {
  if (!acc[q.category]) acc[q.category] = { correct: 0, total: 0 };
  acc[q.category].total++;
  if (q.userSelectedId === q.correctId) acc[q.category].correct++;
  return acc;
}, {});

const categoryArray = Object.entries(categoryStats)
  .map(([name, s]) => ({ name, ...s, pct: Math.round((s.correct / s.total) * 100) }))
  .sort((a, b) => b.pct - a.pct);

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Vocabulary: BookOpen,
  "Numerical Reasoning": Brain,
  "Reading Comprehension": Trophy,
  "Analytical Reasoning": Zap,
};

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ target, duration = 1.6 }: { target: number; duration?: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = rounded.on("change", setDisplay);
    mv.set(target);
    return unsub;
  }, [target, mv, rounded]);

  return <>{display}</>;
}

// ─── Radial Score Arc ─────────────────────────────────────────────────────────

function RadialScore({ score, total }: { score: number; total: number }) {
  const pct = score / total;
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const gap = circ - dash;

  const grade =
    pct >= 0.9 ? { label: "Outstanding", color: "#22c55e" }
    : pct >= 0.8 ? { label: "Very Satisfactory", color: "#3b82f6" }
    : pct >= 0.7 ? { label: "Satisfactory", color: "#f59e0b" }
    : { label: "Needs Improvement", color: "#ef4444" };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Track */}
          <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
          {/* Progress */}
          <motion.circle
            cx="80" cy="80" r={r}
            fill="none"
            stroke={grade.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${gap}` }}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.4 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-4xl font-black text-foreground leading-none">
            <AnimatedNumber target={score} />
          </span>
          <span className="text-sm text-muted-foreground font-medium">of {total}</span>
        </div>
      </div>
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: "spring" }}
        className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
        style={{ background: `${grade.color}20`, color: grade.color }}
      >
        {grade.label}
      </motion.span>
    </div>
  );
}

// ─── Category Bar ─────────────────────────────────────────────────────────────

function CategoryBar({ name, correct, total, pct, index }: {
  name: string; correct: number; total: number; pct: number; index: number;
}) {
  const Icon = CATEGORY_ICONS[name] ?? BarChart3;
  const isStrong = pct >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground font-heading">{name}</span>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={
              isStrong
                ? { background: "var(--spark-correct-bg)", color: "var(--spark-correct-text)" }
                : { background: "var(--spark-wrong-bg)", color: "var(--spark-wrong-text)" }
            }
          >
            {isStrong ? "Strong" : "Weak"}
          </span>
        </div>
        <span className="text-sm font-bold font-heading text-foreground">
          {correct}/{total}
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isStrong
              ? "linear-gradient(90deg, var(--spark-correct-border), #16a34a)"
              : "linear-gradient(90deg, var(--spark-wrong-border), #dc2626)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

// ─── Question Review Card ─────────────────────────────────────────────────────

function ReviewCard({ q, index }: { q: QuestionResult; index: number }) {
  const [open, setOpen] = useState(false);
  const isCorrect = q.userSelectedId === q.correctId;
  const isSkipped = q.userSelectedId === null;

  const statusConfig = isSkipped
    ? { icon: MinusCircle, label: "Skipped", color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" }
    : isCorrect
    ? { icon: CheckCircle2, label: "Correct", color: "text-[var(--spark-correct-text)]", bg: "bg-[var(--spark-correct-bg)]", border: "border-[var(--spark-correct-border)]" }
    : { icon: XCircle, label: "Wrong", color: "text-[var(--spark-wrong-text)]", bg: "bg-[var(--spark-wrong-bg)]", border: "border-[var(--spark-wrong-border)]" };

  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.4 }}
      className={`rounded-2xl border-2 overflow-hidden transition-shadow hover:shadow-md ${statusConfig.border}`}
    >
      {/* Card Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full text-left p-5 flex items-start gap-4 ${statusConfig.bg} transition-colors`}
      >
        <div className="shrink-0 mt-0.5">
          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Q{index + 1}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/60 text-foreground border border-border">
              {q.category}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ml-auto ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{q.text}</p>
        </div>
        <div className="shrink-0 mt-0.5 text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 bg-card space-y-4 border-t border-border">
              {/* Options */}
              <div className="space-y-2 pt-4">
                {q.options.map((opt) => {
                  const isUserPick = opt.id === q.userSelectedId;
                  const isRight = opt.id === q.correctId;

                  let cls =
                    "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ";

                  if (isRight && isUserPick) {
                    cls += "border-[var(--spark-correct-border)] bg-[var(--spark-correct-bg)]";
                  } else if (isRight && !isUserPick) {
                    cls += "border-[var(--spark-correct-border)] bg-[var(--spark-correct-bg)] opacity-80";
                  } else if (isUserPick && !isRight) {
                    cls += "border-[var(--spark-wrong-border)] bg-[var(--spark-wrong-bg)]";
                  } else {
                    cls += "border-border bg-muted/30 opacity-50";
                  }

                  return (
                    <div key={opt.id} className={cls}>
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={
                          isRight
                            ? { background: "var(--spark-correct-text)", color: "var(--spark-correct-bg)" }
                            : isUserPick
                            ? { background: "var(--spark-wrong-text)", color: "var(--spark-wrong-bg)" }
                            : { background: "hsl(var(--muted-foreground)/0.2)", color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {opt.id.toUpperCase()}
                      </span>
                      <span
                        className="flex-1 font-medium"
                        style={{
                          color: isRight
                            ? "var(--spark-correct-text)"
                            : isUserPick
                            ? "var(--spark-wrong-text)"
                            : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {opt.text}
                      </span>
                      {isRight && <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--spark-correct-text)]" />}
                      {isUserPick && !isRight && <XCircle className="w-4 h-4 shrink-0 text-[var(--spark-wrong-text)]" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div
                className="rounded-xl p-4 border"
                style={{ background: "hsl(var(--muted)/0.5)", borderColor: "hsl(var(--border))" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Explanation
                </p>
                <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Confetti Burst ───────────────────────────────────────────────────────────

function ConfettiBurst() {
  // Use state to calculate particles ONLY on the client to avoid Hydration Mismatch
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600,
        y: -(Math.random() * 400 + 100),
        rotate: Math.random() * 720 - 360,
        color: ["#F5A800", "#1B3577", "#22c55e", "#ef4444", "#2563EB", "#FFB300"][
          Math.floor(Math.random() * 6)
        ],
        size: Math.random() * 8 + 5,
        shape: Math.random() > 0.5 ? "circle" : "rect",
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 0.6,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            background: p.color,
            top: "45%",
            left: "50%",
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.8, ease: "easeOut", delay: Math.random() * 0.3 }}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [showConfetti, setShowConfetti] = useState(accuracy >= 70);

  useEffect(() => {
    if (showConfetti) {
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
  }, [showConfetti]);

  const strongAreas = categoryArray.filter((c) => c.pct >= 70);
  const weakAreas = categoryArray.filter((c) => c.pct < 70);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <>
      {showConfetti && <ConfettiBurst />}

      <div
        className="min-h-screen"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% -10%, hsl(var(--primary)/0.12) 0%, transparent 70%), hsl(var(--background))",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

          {/* ── Back to Dashboard ── */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* ── Hero Header ── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="text-center space-y-3"
          >
            <motion.div variants={fadeUp} className="flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
                }}
              >
                <Award className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Mock Exam Complete
              </p>
              <h1 className="font-heading text-3xl md:text-4xl font-black text-foreground leading-tight">
                {accuracy >= 80
                  ? "Excellent Work! 🎉"
                  : accuracy >= 70
                  ? "Great Effort! 👍"
                  : "Keep Practicing! 💪"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Here's a complete breakdown of your performance.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex justify-center gap-3 flex-wrap">
              <Button variant="outline" size="sm" className="rounded-xl gap-2 font-semibold">
                <RotateCcw className="w-4 h-4" /> Retake Exam
              </Button>
              <Button size="sm" className="rounded-xl gap-2 font-semibold">
                <Share2 className="w-4 h-4" /> Share Results
              </Button>
            </motion.div>
          </motion.div>

          {/* ── Tabs ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Tabs defaultValue="overview">
              <TabsList className="w-full grid grid-cols-2 rounded-2xl h-12 mb-6">
                <TabsTrigger value="overview" className="rounded-xl font-heading font-semibold text-sm">
                  <BarChart3 className="w-4 h-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="review" className="rounded-xl font-heading font-semibold text-sm">
                  <BookOpen className="w-4 h-4 mr-2" /> Detailed Review
                </TabsTrigger>
              </TabsList>

              {/* ──────────────────── OVERVIEW TAB ──────────────────── */}
              <TabsContent value="overview" className="space-y-5 mt-0">

                {/* Score Hero Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  className="rounded-3xl border bg-card shadow-lg overflow-hidden"
                >
                  <div
                    className="h-1.5 w-full"
                    style={{
                      background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-2)), hsl(var(--chart-3)))`,
                    }}
                  />
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      {/* Radial */}
                      <div className="shrink-0">
                        <RadialScore score={correct} total={total} />
                      </div>

                      {/* Stats grid */}
                      <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        {[
                          {
                            label: "Accuracy Rate",
                            value: accuracy + "%",
                            icon: Target,
                            color: "hsl(var(--primary))",
                            bg: "hsl(var(--primary)/0.08)",
                          },
                          {
                            label: "Time Spent",
                            value: TIME_SPENT,
                            icon: Clock,
                            color: "hsl(var(--chart-2))",
                            bg: "hsl(var(--chart-2)/0.1)",
                          },
                          {
                            label: "Correct",
                            value: correct.toString(),
                            icon: CheckCircle2,
                            color: "var(--spark-correct-text)",
                            bg: "var(--spark-correct-bg)",
                          },
                          {
                            label: "Skipped",
                            value: skipped.toString(),
                            icon: MinusCircle,
                            color: "hsl(var(--muted-foreground))",
                            bg: "hsl(var(--muted))",
                          },
                        ].map((stat, i) => {
                          const SIcon = stat.icon;
                          return (
                            <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 + i * 0.08 }}
                              className="rounded-2xl p-4 flex items-center gap-3"
                              style={{ background: stat.bg }}
                            >
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${stat.color}25` }}
                              >
                                <SIcon className="w-4 h-4" style={{ color: stat.color }} />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                                <p className="font-heading text-xl font-black text-foreground leading-tight">
                                  {stat.value}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Category Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.45 }}
                  className="rounded-3xl border bg-card shadow-sm p-6 space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-base font-bold text-foreground">Category Breakdown</h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[var(--spark-correct-text)]" />
                        Strong ≥ 70%
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5 text-[var(--spark-wrong-text)]" />
                        Weak &lt; 70%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {categoryArray.map((cat, i) => (
                      <CategoryBar key={cat.name} {...cat} index={i} />
                    ))}
                  </div>
                </motion.div>

                {/* Strong / Weak Split */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      title: "Strong Areas",
                      icon: TrendingUp,
                      items: strongAreas,
                      empty: "No strong areas yet — keep practicing!",
                      style: { border: "var(--spark-correct-border)", bg: "var(--spark-correct-bg)", text: "var(--spark-correct-text)" },
                    },
                    {
                      title: "Needs Work",
                      icon: TrendingDown,
                      items: weakAreas,
                      empty: "All categories are strong! 🎉",
                      style: { border: "var(--spark-wrong-border)", bg: "var(--spark-wrong-bg)", text: "var(--spark-wrong-text)" },
                    },
                  ].map((panel, pi) => {
                    const PIcon = panel.icon;
                    return (
                      <motion.div
                        key={panel.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + pi * 0.1 }}
                        className="rounded-2xl border-2 p-5 space-y-3"
                        style={{
                          borderColor: `var(${panel.style.border})`,
                          background: `var(${panel.style.bg})`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <PIcon className="w-4 h-4" style={{ color: `var(${panel.style.text})` }} />
                          <p className="font-heading text-sm font-bold" style={{ color: `var(${panel.style.text})` }}>
                            {panel.title}
                          </p>
                        </div>
                        {panel.items.length === 0 ? (
                          <p className="text-xs text-muted-foreground">{panel.empty}</p>
                        ) : (
                          <ul className="space-y-1">
                            {panel.items.map((c) => {
                              const CIcon = CATEGORY_ICONS[c.name] ?? BarChart3;
                              return (
                                <li key={c.name} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <CIcon className="w-3 h-3" style={{ color: `var(${panel.style.text})` }} />
                                    <span className="text-xs font-semibold text-foreground">{c.name}</span>
                                  </div>
                                  <span className="text-xs font-bold" style={{ color: `var(${panel.style.text})` }}>
                                    {c.pct}%
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

              </TabsContent>

              {/* ──────────────────── REVIEW TAB ──────────────────── */}
              <TabsContent value="review" className="space-y-4 mt-0">

                {/* Legend */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-4 px-1 flex-wrap"
                >
                  {[
                    { icon: CheckCircle2, label: "Correct", color: "var(--spark-correct-text)" },
                    { icon: XCircle, label: "Wrong", color: "var(--spark-wrong-text)" },
                    { icon: MinusCircle, label: "Skipped", color: "hsl(var(--muted-foreground))" },
                  ].map(({ icon: LIcon, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <LIcon className="w-4 h-4" style={{ color }} />
                      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                    </div>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground font-medium">
                    Click any item to expand
                  </span>
                </motion.div>

                {/* Question Cards */}
                <div className="space-y-3">
                  {MOCK_RESULTS.map((q, i) => (
                    <ReviewCard key={q.id} q={q} index={i} />
                  ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="pt-4 pb-8 text-center space-y-3"
                >
                  <p className="text-sm text-muted-foreground">
                    Review complete. Ready to improve your score?
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/dashboard/practice">
                      <Button className="rounded-2xl px-8 font-heading font-bold h-12">
                        Start Practice Mode →
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="outline" className="rounded-2xl px-8 font-heading font-bold h-12 gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Back to Dashboard
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </>
  );
}