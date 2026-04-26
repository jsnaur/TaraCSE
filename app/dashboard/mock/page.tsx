import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Lock,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  ChevronRight,
  BarChart2,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  FileText,
  Zap,
  ArrowRight,
  Info,
  Sparkles,
  FlaskConical,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExamSession = {
  id: string;
  user_id: string;
  mode: string;
  level: string;
  score: number;
  total_questions: number;
  time_spent_seconds: number;
  completed_at: string;
  exam_type: "diagnostic" | "full_prof" | "full_subprof" | null;
};

// ─── Static Mock Data for Readiness Ring (Until Backend is Built) ─────────────

const READINESS = {
  score: 67,
  label: "Developing",
  verdict: "You're making progress, but key areas need reinforcement before exam day.",
  breakdown: [
    { area: "Verbal Ability", pct: 82, weight: 30 },
    { area: "Numerical Ability", pct: 55, weight: 25 },
    { area: "Analytical Ability", pct: 70, weight: 25 },
    { area: "General Information", pct: 61, weight: 20 },
  ],
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ReadinessRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color =
    score >= 80
      ? "var(--spark-correct-text)"
      : score >= 60
      ? "var(--accent)"
      : "var(--spark-wrong-text)";

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x="70" y="66"
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fontFamily="var(--font-space-grotesk, sans-serif)"
        fill={color}
      >
        {score}
      </text>
      <text
        x="70" y="83"
        textAnchor="middle"
        fontSize="11"
        fill="var(--muted-foreground)"
        fontFamily="var(--font-inter, sans-serif)"
      >
        / 100
      </text>
    </svg>
  );
}

function BreakdownBar({ area, pct, weight }: { area: string; pct: number; weight: number }) {
  const color =
    pct >= 80
      ? "var(--spark-correct-text)"
      : pct >= 65
      ? "var(--accent)"
      : "var(--spark-wrong-text)";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-36 shrink-0 truncate" style={{ color: "var(--muted-foreground)" }}>
        {area}
      </span>
      <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ background: "var(--muted)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color, transition: "width 1s ease" }}
        />
      </div>
      <span className="text-xs font-heading font-bold w-8 text-right" style={{ color }}>
        {pct}%
      </span>
      <span className="text-[10px] w-14 text-right" style={{ color: "var(--muted-foreground)" }}>
        ({weight}% wt.)
      </span>
    </div>
  );
}

function LockedBreakdown() {
  return (
    <div className="flex-1 w-full flex flex-col gap-3 relative">
      <div className="flex flex-col gap-3 blur-[5px] select-none pointer-events-none opacity-60">
        {READINESS.breakdown.map((b) => (
          <BreakdownBar key={b.area} {...b} />
        ))}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
        style={{ background: "linear-gradient(to bottom, transparent 0%, var(--card) 35%)" }}
      >
        <div
          className="flex flex-col items-center gap-2 rounded-2xl border px-5 py-4 text-center shadow-lg"
          style={{ background: "var(--card)", borderColor: "var(--spark-ai-border)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--spark-ai-bg)" }}
          >
            <Lock size={16} style={{ color: "var(--spark-ai-text)" }} />
          </div>
          <p className="font-heading text-sm font-bold" style={{ color: "var(--foreground)" }}>
            Reveal your weaknesses
          </p>
          <p className="text-[11px] leading-relaxed max-w-[180px]" style={{ color: "var(--muted-foreground)" }}>
            Upgrade to Premium to see your score breakdown by category.
          </p>
          <Link href="/pricing">
            <Button
              size="sm"
              className="rounded-xl gap-1.5 font-bold text-xs mt-1 transition-all duration-200 hover:scale-105"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Crown size={11} /> Upgrade for ₱99
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TrendChip({ trend, delta }: { trend: "up" | "down" | "neutral"; delta: number }) {
  if (trend === "neutral")
    return (
      <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
        <Minus size={11} /> —
      </span>
    );
  const up = trend === "up";
  return (
    <span
      className="flex items-center gap-0.5 text-xs font-bold"
      style={{ color: up ? "var(--spark-correct-text)" : "var(--spark-wrong-text)" }}
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? "+" : ""}{delta}
    </span>
  );
}

function AttemptRow({ attempt }: { attempt: any }) {
  const passed = attempt.score >= attempt.passing;
  return (
    <Link
      href={`/dashboard/mock/review/${attempt.id}`}
      className="group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.005]"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div
        className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl shrink-0"
        style={{
          background: passed ? "var(--spark-correct-bg)" : "var(--spark-wrong-bg)",
          border: `1.5px solid ${passed ? "var(--spark-correct-border)" : "var(--spark-wrong-border)"}`,
        }}
      >
        <span
          className="font-heading text-lg font-bold leading-none"
          style={{ color: passed ? "var(--spark-correct-text)" : "var(--spark-wrong-text)" }}
        >
          {attempt.score}
        </span>
        <span
          className="text-[9px] font-medium mt-0.5"
          style={{ color: passed ? "var(--spark-correct-text)" : "var(--spark-wrong-text)" }}
        >
          {passed ? "PASSED" : "FAILED"}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-heading text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {attempt.level}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          >
            {attempt.total} items
          </span>
        </div>
        <span className="text-xs mt-0.5 block" style={{ color: "var(--muted-foreground)" }}>
          {attempt.date} · {attempt.correct}/{attempt.total} correct
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1.5">
        <Timer size={13} style={{ color: "var(--muted-foreground)" }} />
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {attempt.timeUsed}
        </span>
      </div>

      <div className="hidden sm:block">
        <TrendChip trend={attempt.trend} delta={attempt.delta} />
      </div>

      <ChevronRight
        size={15}
        className="opacity-30 group-hover:opacity-70 transition-opacity shrink-0"
        style={{ color: "var(--foreground)" }}
      />
    </Link>
  );
}

function Sparkline({ scores }: { scores: number[] }) {
  const w = 200;
  const h = 48;
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - ((s - min) / (max - min)) * h;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {scores.map((s, i) => {
        const x = (i / (scores.length - 1)) * w;
        const y = h - ((s - min) / (max - min)) * h;
        return (
          <circle
            key={i}
            cx={x} cy={y}
            r={i === scores.length - 1 ? 5 : 3}
            fill={i === scores.length - 1 ? "var(--primary)" : "var(--card)"}
            stroke="var(--primary)"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

function PremiumCTA() {
  return (
    <div
      className="sm:col-span-3 relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between gap-6 border"
      style={{
        background: "linear-gradient(145deg, var(--primary) 0%, #312E81 60%, #1E1B4B 100%)",
        borderColor: "transparent",
        minHeight: "200px",
      }}
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 30px, white 30px, white 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, white 30px, white 31px)",
      }} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} color="rgba(255,255,255,0.6)" />
          <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
            Full Simulation · 150 items · 3 hours
          </span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-white leading-tight">
          Take a Full<br />Mock Exam
        </h2>
      </div>
      <div className="relative z-10">
        <Link href="/dashboard/mock/setup">
          <Button
            className="w-full sm:w-auto rounded-2xl gap-2 font-heading font-bold text-sm transition-all duration-200 hover:scale-105 hover:shadow-xl"
            style={{ background: "white", color: "var(--primary)" }}
          >
            <Zap size={15} fill="var(--primary)" strokeWidth={0} />
            Start Mock Exam
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FreeEligibleCTA() {
  return (
    <div
      className="sm:col-span-3 relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between gap-6 border"
      style={{
        background: "linear-gradient(145deg, #0F766E 0%, #134E4A 60%, #0D2D29 100%)",
        borderColor: "transparent",
        minHeight: "200px",
      }}
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 30px, white 30px, white 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, white 30px, white 31px)",
      }} />
      <div className="absolute top-4 right-4 z-10">
        <span
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(4px)" }}
        >
          <Star size={9} fill="white" strokeWidth={0} /> FREE
        </span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical size={14} color="rgba(255,255,255,0.6)" />
          <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
            Diagnostic Exam · 75 items · 1.5 hours
          </span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-white leading-tight">
          Take Your Free<br />Diagnostic Exam
        </h2>
        <p className="text-white/60 text-xs mt-2 leading-relaxed max-w-xs">
          A half-length baseline exam to check where you stand across all four CSE subject areas.
        </p>
      </div>
      <div className="relative z-10">
        <Link href="/dashboard/mock/setup">
          <Button
            className="w-full sm:w-auto rounded-2xl gap-2 font-heading font-bold text-sm transition-all duration-200 hover:scale-105 hover:shadow-xl"
            style={{ background: "white", color: "#0F766E" }}
          >
            <Zap size={15} fill="#0F766E" strokeWidth={0} />
            Start Diagnostic Exam
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FreeExhaustedCTA() {
  return (
    <div
      className="sm:col-span-3 relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between gap-6 border"
      style={{ background: "var(--card)", borderColor: "var(--border)", minHeight: "200px" }}
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.04] rounded-3xl" style={{
        backgroundImage: "repeating-linear-gradient(45deg, var(--foreground) 0px, var(--foreground) 1px, transparent 1px, transparent 14px)",
      }} />
      <div className="absolute top-4 right-4 z-10">
        <span
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl"
          style={{
            background: "var(--spark-correct-bg)",
            color: "var(--spark-correct-text)",
            border: "1px solid var(--spark-correct-border)",
          }}
        >
          <CheckCircle2 size={9} /> Completed
        </span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={14} style={{ color: "var(--muted-foreground)" }} />
          <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "var(--muted-foreground)" }}>
            Free Diagnostic Used
          </span>
        </div>
        <h2 className="font-heading text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
          Free Diagnostic<br />Completed
        </h2>
        <p className="text-xs mt-2 leading-relaxed max-w-xs" style={{ color: "var(--muted-foreground)" }}>
          You've used your one free exam. Upgrade to Premium for unlimited full-length mock exams.
        </p>
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row items-start gap-3">
        <Button
          disabled
          className="rounded-2xl gap-2 font-heading font-bold text-sm opacity-40 cursor-not-allowed"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <Lock size={14} /> Full Exams Locked
        </Button>
        <Link href="/pricing">
          <Button
            className="rounded-2xl gap-2 font-heading font-bold text-sm transition-all duration-200 hover:scale-105 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(245,158,11,0.4)",
            }}
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)" }}
            />
            <Crown size={14} /> Upgrade to Premium — ₱99
            <Sparkles size={13} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Server Component ────────────────────────────────────────────────────

export default async function MockExamHubPage() {
  // 1. Authenticate user & connect to Supabase
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;
  if (!token) redirect("/login");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (!user || userError) redirect("/login");

  // 2. Fetch User Profile (Premium check) and Past Attempts (Diagnostic Check)
  const [profileResult, sessionsResult] = await Promise.all([
    supabase.from("profiles").select("is_premium").eq("id", user.id).single(),
    supabase.from("exam_sessions").select("*").eq("user_id", user.id).eq("mode", "Mock").order("completed_at", { ascending: false }),
  ]);

  const isPremium = profileResult.data?.is_premium || false;
  const dbPastAttempts: ExamSession[] = sessionsResult.data || [];
  
  // 3. Determine the dynamic state
  const hasTakenDiagnostic = dbPastAttempts.some((s) => s.exam_type === "diagnostic");
  const USER_STATE = isPremium ? "premium" : (hasTakenDiagnostic ? "free_exhausted" : "free_eligible");

  const isFreeEligible = USER_STATE === "free_eligible";
  const isFreeExhausted = USER_STATE === "free_exhausted";

  // 4. Map the raw DB data to the UI's expected format
  const PAST_ATTEMPTS = dbPastAttempts.map((session, index, arr) => {
    const prevSession = arr[index + 1];
    let trend: "up" | "down" | "neutral" = "neutral";
    let delta = 0;

    if (prevSession) {
      delta = (session.score || 0) - (prevSession.score || 0);
      if (delta > 0) trend = "up";
      else if (delta < 0) trend = "down";
    }

    const total = session.total_questions || 150;
    const score = session.score || 0;
    const correct = Math.round((score / 100) * total); // Assume score is out of 100
    
    // Convert seconds to hrs and mins
    const hrs = Math.floor((session.time_spent_seconds || 0) / 3600);
    const mins = Math.floor(((session.time_spent_seconds || 0) % 3600) / 60);
    const timeUsed = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    let levelLabel = session.level || "Professional";
    if (session.exam_type === "diagnostic") levelLabel = "Diagnostic";

    return {
      id: session.id,
      date: new Date(session.completed_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      level: levelLabel,
      score,
      passing: 80, // passing is always 80% for CSE
      timeUsed,
      totalTime: session.exam_type === "diagnostic" ? "1h 30m" : "3h 00m",
      correct,
      total,
      trend,
      delta: Math.abs(delta),
    };
  });

  const scores = PAST_ATTEMPTS.map((a) => a.score).reverse();
  const latest = PAST_ATTEMPTS[0] ?? null;

  const readinessColor =
    READINESS.score >= 80
      ? "var(--spark-correct-text)"
      : READINESS.score >= 60
      ? "var(--accent)"
      : "var(--spark-wrong-text)";

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--background)" }}>
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 right-0 w-[600px] h-[500px] opacity-[0.12] blur-[140px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          transform: "translate(35%,-35%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-[0.08] blur-[100px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          transform: "translate(-40%,40%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-28 flex flex-col gap-8">
        {/* ── Header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
            <span className="text-xs uppercase tracking-[0.18em] font-medium" style={{ color: "var(--primary)" }}>
              Simulation Center
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight" style={{ color: "var(--foreground)" }}>
                Mock Exams
              </h1>
              <p className="text-sm mt-1 max-w-md" style={{ color: "var(--muted-foreground)" }}>
                {isPremium
                  ? "Full-length, timed simulations that replicate actual CSE conditions. Track your readiness and close the gaps before exam day."
                  : isFreeEligible
                  ? "Start with a free 75-item diagnostic to find your baseline. Upgrade for unlimited full-length practice."
                  : "You've completed your free diagnostic. Upgrade to unlock unlimited full-length mock exams."}
              </p>
            </div>
            {!isPremium && (
              <div
                className="flex items-center gap-2 rounded-2xl border px-3 py-2 shrink-0"
                style={{ background: "#FFF8E7", borderColor: "#FDE68A" }}
              >
                <Crown size={15} style={{ color: "var(--accent)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                  Free Plan
                </span>
              </div>
            )}
          </div>
        </header>

        {/* ── Readiness panel ─────────────────────────────────── */}
        <section
          className="rounded-3xl border p-6 flex flex-col gap-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Target size={14} style={{ color: "var(--primary)" }} />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
              Exam Readiness
            </h2>
            <button title="Based on your practice accuracy weighted by CSE item distribution." className="ml-auto">
              <Info size={13} style={{ color: "var(--muted-foreground)" }} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <ReadinessRing score={READINESS.score} />
              <span className="font-heading text-sm font-bold" style={{ color: readinessColor }}>
                {READINESS.label}
              </span>
            </div>

            {isFreeExhausted ? (
              <LockedBreakdown />
            ) : (
              <div className="flex-1 w-full flex flex-col gap-3">
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {READINESS.verdict}
                </p>
                {READINESS.breakdown.map((b) => (
                  <BreakdownBar key={b.area} {...b} />
                ))}
                <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <AlertTriangle size={11} style={{ color: "var(--accent)" }} />
                  CSE passing score is{" "}
                  <strong style={{ color: "var(--accent)" }}>80%</strong>. You need +13 pts.
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── CTA + score trend ────────────────────────────────── */}
        <div className="grid sm:grid-cols-5 gap-4">
          {/* CTA Conditional Renders */}
          {isPremium && <PremiumCTA />}
          {isFreeEligible && <FreeEligibleCTA />}
          {isFreeExhausted && <FreeExhaustedCTA />}

          {/* Score trend panel */}
          <div
            className="sm:col-span-2 rounded-3xl border p-5 flex flex-col gap-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <BarChart2 size={14} style={{ color: "var(--primary)" }} />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
                Score Trend
              </h3>
            </div>

            {scores.length > 1 ? (
              <>
                <Sparkline scores={scores} />
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Latest attempt</p>
                    <p className="font-heading text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                      {latest?.score}
                      <span className="text-sm font-normal ml-1" style={{ color: "var(--muted-foreground)" }}>/ 100</span>
                    </p>
                  </div>
                  {latest && <TrendChip trend={latest.trend} delta={latest.delta} />}
                </div>
                {latest && (
                  <div
                    className="flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 border"
                    style={{
                      background: "var(--spark-wrong-bg)",
                      borderColor: "var(--spark-wrong-border)",
                      color: "var(--spark-wrong-text)",
                    }}
                  >
                    <XCircle size={12} />
                    {latest.passing - latest.score} pts below passing ({latest.passing}%)
                  </div>
                )}
              </>
            ) : latest ? (
              // Single attempt (free_exhausted with 1 exam)
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Diagnostic score</p>
                    <p className="font-heading text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                      {latest.score}
                      <span className="text-sm font-normal ml-1" style={{ color: "var(--muted-foreground)" }}>/ 100</span>
                    </p>
                  </div>
                  <TrendChip trend={latest.trend} delta={latest.delta} />
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 border"
                  style={{
                    background: "var(--spark-wrong-bg)",
                    borderColor: "var(--spark-wrong-border)",
                    color: "var(--spark-wrong-text)",
                  }}
                >
                  <XCircle size={12} />
                  {latest.passing - latest.score} pts below passing ({latest.passing}%)
                </div>
                <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  Take more mock exams to build a trend line.
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                No attempts yet. Take your first exam to see your trend.
              </p>
            )}
          </div>
        </div>

        {/* ── Premium upsell banner (free users only) ──────────── */}
        {!isPremium && (
          <div
            className="rounded-2xl border p-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FEF3C7" }}>
                <Crown size={17} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-sm font-heading font-bold" style={{ color: "#92400E" }}>
                  Unlock unlimited mock exams
                </p>
                <p className="text-xs" style={{ color: "#B45309" }}>
                  {isFreeEligible
                    ? "Free plan includes 1 diagnostic exam. Upgrade for ₱99 to unlock unlimited access, detailed analytics & AI review."
                    : "You've used your free exam. Upgrade for ₱99 to continue practicing with full-length mocks."}
                </p>
              </div>
            </div>
            <Link href="/pricing" className="shrink-0">
              <Button
                size="sm"
                className="rounded-xl gap-1.5 font-bold text-xs transition-all duration-200 hover:scale-105"
                style={{ background: "var(--accent)", color: "white" }}
              >
                <Crown size={12} /> Upgrade — ₱99
              </Button>
            </Link>
          </div>
        )}

        {/* ── Past attempts ────────────────────────────────────── */}
        {PAST_ATTEMPTS.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: "var(--primary)" }} />
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
                  Past Attempts
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                >
                  {PAST_ATTEMPTS.length}
                </span>
              </div>
              {PAST_ATTEMPTS.length > 3 && (
                <Link
                  href="/dashboard/mock/history"
                  className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{ color: "var(--primary)" }}
                >
                  View All <ChevronRight size={12} />
                </Link>
              )}
            </div>

            <div className="hidden sm:grid grid-cols-[52px_1fr_auto_auto_32px] gap-4 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted-foreground)" }}>
              <span>Score</span>
              <span>Session</span>
              <span>Time Used</span>
              <span>Trend</span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {PAST_ATTEMPTS.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}
            </div>
          </section>
        )}

        {/* ── Tips strip ──────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ background: "var(--spark-ai-bg)", borderColor: "var(--spark-ai-border)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "var(--spark-ai-border)", color: "var(--spark-ai-text)" }}
          >
            <CheckCircle2 size={15} />
          </div>
          <div>
            <p className="text-sm font-heading font-bold" style={{ color: "var(--foreground)" }}>
              Pro tip: Simulate real conditions
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Take your mock exam in one sitting with zero interruptions. Pace yourself at roughly{" "}
              <strong style={{ color: "var(--spark-ai-text)" }}>72 seconds per question</strong>{" "}
              for the full Professional exam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}