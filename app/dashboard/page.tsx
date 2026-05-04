"use client";

import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Check, X, Sparkles, ArrowRight, ArrowLeft, Menu, ShieldCheck, ClipboardList, ChevronRight, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getProfile, saveExamCategory } from "./actions";
import { getDashboardStats, type DashboardStats, type CategoryStat } from "./analytics/actions";

type ExamLevel = "professional" | "subprofessional";

interface LevelOption {
  id: ExamLevel;
  label: string;
  tagline: string;
  description: string;
  subjects: string[];
  badge: string;
  difficulty: string;
  accentClass: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    id: "professional",
    label: "Professional",
    tagline: "Full exam coverage",
    description: "For bachelor's degree holders targeting career advancement in government service.",
    subjects: ["Verbal Ability", "Numerical Ability", "Analytical Ability", "General Information"],
    badge: "Most common",
    difficulty: "Higher",
    accentClass: "professional",
  },
  {
    id: "subprofessional",
    label: "Subprofessional",
    tagline: "Focused track",
    description: "For applicants targeting first-level positions with clerical and operational roles.",
    subjects: ["Verbal Ability", "Numerical Ability", "Clerical Operations", "General Information"],
    badge: "First-level",
    difficulty: "Standard",
    accentClass: "subprofessional",
  },
];

const PROFESSIONAL_CATS = ["Verbal Ability", "Numerical Ability", "Analytical Ability", "General Information"];
const SUBPROFESSIONAL_CATS = ["Verbal Ability", "Numerical Ability", "Clerical Operations", "General Information"];

const SUBJECT_CONFIG: Record<string, {
  icon: string; bgIcon: string; colorIcon: string; fillColor: string; textColor: string;
}> = {
  "Verbal Ability":      { icon: "V", bgIcon: "#0D2B1D", colorIcon: "#74C69D", fillColor: "#2D6A4F", textColor: "var(--spark-correct-text)" },
  "Numerical Ability":   { icon: "N", bgIcon: "#0A1F2E", colorIcon: "#6BA3E0", fillColor: "#1D4E89", textColor: "var(--accent)" },
  "Analytical Ability":  { icon: "A", bgIcon: "#2A1F08", colorIcon: "#F0B060", fillColor: "#276749", textColor: "var(--spark-correct-text)" },
  "General Information": { icon: "G", bgIcon: "#1D0E2E", colorIcon: "#C080E0", fillColor: "#6B2020", textColor: "var(--spark-wrong-text)" },
  "Clerical Operations": { icon: "C", bgIcon: "#1A1A2E", colorIcon: "#8080FF", fillColor: "#3A3A6A", textColor: "var(--spark-ai-text)" },
};

function OnboardingModal({ onComplete }: { onComplete: (level: ExamLevel) => void }) {
  const [hovered, setHovered] = useState<ExamLevel | null>(null);
  const [selected, setSelected] = useState<ExamLevel | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleSelect(id: ExamLevel) {
    setSelected(id);
  }

  function handleConfirm() {
    if (!selected) return;
    setConfirming(true);
    setTimeout(() => onComplete(selected), 480);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }}
    >
      <div
        className={`
          w-full max-w-[560px] my-auto bg-card border border-border rounded-2xl overflow-hidden shadow-2xl
          transition-all duration-500
          ${confirming ? "scale-95 opacity-0" : "scale-100 opacity-100"}
        `}
      >
        <div className="px-6 pt-7 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-heading text-[13px] font-bold tracking-tight text-primary">TaraCSE</span>
          </div>

          <h1 className="font-heading text-[22px] font-extrabold tracking-tight leading-tight mb-1">
            Choose your exam path
          </h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[400px]">
            Select the Civil Service Examination level you&apos;re preparing for. You can update this later in Settings.
          </p>
        </div>

        <div className="p-5 flex flex-col sm:flex-row gap-3">
          {LEVEL_OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  relative flex-1 text-left rounded-xl border p-4 transition-all duration-150 outline-none
                  focus-visible:ring-2 focus-visible:ring-primary/60
                  ${isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-sidebar hover:border-primary/40 hover:bg-card"
                  }
                `}
              >
                <div
                  className={`absolute top-3.5 right-3.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150
                    ${isSelected ? "border-primary bg-primary" : "border-border bg-card"}`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                </div>

                <div
                  className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center transition-colors
                    ${isSelected ? "bg-primary/15" : "bg-border/50"}`}
                >
                  {opt.id === "professional"
                    ? <ShieldCheck className={`w-5 h-5 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    : <ClipboardList className={`w-5 h-5 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  }
                </div>

                <div className="mb-1.5">
                  <span
                    className={`inline-block text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full
                      ${isSelected ? "bg-primary/10 text-primary" : "bg-border text-muted-foreground"}`}
                  >
                    {opt.badge}
                  </span>
                </div>

                <div className="font-heading text-[16px] font-extrabold tracking-tight mb-0.5">{opt.label}</div>
                <div className={`text-[11px] font-semibold mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                  {opt.tagline}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  {opt.description}
                </p>

                <ul className="flex flex-col gap-1">
                  {opt.subjects.map((s) => (
                    <li key={s} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <div className={`w-1 h-1 rounded-full shrink-0 ${isSelected ? "bg-primary" : "bg-muted-foreground/40"}`} />
                      {s}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Difficulty</span>
                  <span className={`text-[10px] font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                    {opt.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground leading-relaxed hidden sm:block">
            This sets your study plan, practice questions, and mock exams.
          </p>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className={`
              ml-auto flex items-center gap-2 px-5 py-2.5 rounded-lg font-heading text-[13px] font-bold tracking-tight
              transition-all duration-150 shrink-0
              ${selected
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-border text-muted-foreground cursor-not-allowed"
              }
            `}
          >
            Start reviewing
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card skeleton ───────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-3.5 space-y-2 animate-pulse">
      <div className="h-7 w-20 rounded bg-muted" />
      <div className="h-3 w-28 rounded bg-muted" />
      <div className="h-3 w-16 rounded bg-muted" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [username, setUsername] = useState("Student");
  const [examCategory, setExamCategory] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const res = await getProfile();

      if (res?.error) {
        router.push("/login");
        return;
      }

      if (res?.profile) {
        setUsername(res.profile.username || "Student");
        setExamCategory(res.profile.exam_category ?? null);
        if (!res.profile.exam_category) {
          setShowOnboarding(true);
        }
      }
      setIsLoading(false);
    }

    async function loadStats() {
      const { data } = await getDashboardStats();
      setStats(data);
      setStatsLoading(false);
    }

    loadProfile();
    loadStats();
  }, [router]);

  function handleOnboardingComplete(level: ExamLevel) {
    const option = LEVEL_OPTIONS.find((o) => o.id === level);
    if (option) {
      saveExamCategory(option.label);
      setExamCategory(option.label);
    }
    setShowOnboarding(false);
  }

  if (isLoading) {
    return <div className="flex h-screen w-full bg-background" />;
  }

  // Determine which subject categories to display
  const examCats =
    examCategory?.toLowerCase().includes("sub")
      ? SUBPROFESSIONAL_CATS
      : PROFESSIONAL_CATS;

  // Build subject mastery rows — real accuracy where available, 0% otherwise
  const subjectRows = examCats.map((cat) => {
    const found = stats?.categoryStats.find((s: CategoryStat) => s.category === cat);
    const cfg = SUBJECT_CONFIG[cat] ?? SUBJECT_CONFIG["Verbal Ability"];
    return {
      name: cat,
      accuracy: found?.accuracy ?? 0,
      total: found?.total ?? 0,
      cfg,
    };
  });

  // Recent sessions for activity feed
  const recentSessions = stats?.recentSessions ?? [];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="px-4 md:px-5 h-[52px] min-h-[52px] border-b border-border flex items-center gap-3 bg-background transition-colors duration-200">

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground shrink-0">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[220px] border-r-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar className="flex border-none" />
            </SheetContent>
          </Sheet>

          <div className="font-heading text-[15px] font-bold text-foreground tracking-tight truncate">
            Dashboard
          </div>

          {/* Real streak chip */}
          {!statsLoading && stats && stats.streak > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs text-orange-500 font-semibold shrink-0">
              <Flame className="w-3.5 h-3.5" />
              {stats.streak}-day streak
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 md:gap-4 text-[11px] text-muted-foreground shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4">

          {/* Hero Card */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col-reverse md:grid md:grid-cols-[1fr_auto] gap-5 items-center md:items-center text-center md:text-left">
            <div className="w-full">
              <div className="text-xs text-muted-foreground mb-0.5">Magandang araw,</div>
              <div className="font-heading text-[22px] font-extrabold tracking-tight mb-1.5">{username}</div>
              <div className="text-xs text-muted-foreground leading-relaxed max-w-[460px] mx-auto md:mx-0">
                {stats && stats.totalAnswered > 0
                  ? `You've answered ${stats.totalAnswered.toLocaleString()} questions with a ${stats.overallAccuracy}% accuracy. Keep up the momentum!`
                  : "Start your first practice session to begin tracking your progress and building your streak."}
              </div>
              <div className="mt-4 md:mt-3.5 flex gap-3 flex-wrap justify-center md:justify-start">
                <Link
                  href="/dashboard/practice"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  Practice now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="px-4 py-2 rounded-lg border border-border bg-card text-xs font-semibold hover:border-primary/40 transition-colors"
                >
                  View analytics
                </Link>
              </div>
            </div>

            {/* Accuracy Ring Graphic */}
            <div className="relative w-[84px] h-[84px] shrink-0 mx-auto md:mx-0">
              {statsLoading ? (
                <div className="w-full h-full rounded-full animate-pulse bg-muted" />
              ) : (
                <>
                  <svg viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="42" cy="42" r="36" stroke="var(--border)" strokeWidth="6" />
                    <circle
                      cx="42" cy="42" r="36"
                      stroke="var(--primary)" strokeWidth="6"
                      strokeDasharray={`${(stats?.overallAccuracy ?? 0) * 2.262} 226.2`}
                      strokeDashoffset="56.6"
                      strokeLinecap="round"
                      transform="rotate(-90 42 42)"
                    />
                    <circle cx="42" cy="42" r="28" fill="var(--card)" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-heading text-base font-extrabold leading-none">
                      {stats?.overallAccuracy ?? 0}%
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-px tracking-[0.05em]">ACCURACY</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {statsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)
            ) : (
              <>
                <div className="bg-card border border-border rounded-xl p-4 md:p-3.5">
                  <div className="font-heading text-[26px] font-extrabold tracking-tight leading-none">
                    {stats ? stats.totalAnswered.toLocaleString() : "0"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Questions answered</div>
                  {stats && stats.totalAnswered > 0 && (
                    <div className="text-[10px] font-semibold text-primary mt-1.5">
                      {stats.totalCorrect.toLocaleString()} correct
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-4 md:p-3.5">
                  <div
                    className="font-heading text-[26px] font-extrabold tracking-tight leading-none"
                    style={{ color: "var(--spark-correct-text)" }}
                  >
                    {stats ? `${stats.overallAccuracy}%` : "—"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Overall accuracy</div>
                  {stats && stats.totalAnswered === 0 && (
                    <div className="text-[10px] text-muted-foreground mt-1.5">No sessions yet</div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-4 md:p-3.5">
                  <div className="font-heading text-[26px] font-extrabold tracking-tight leading-none text-orange-500 flex items-center gap-1.5">
                    {stats ? stats.streak : 0}
                    <Flame className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Day streak</div>
                  <div className="text-[10px] font-semibold text-primary mt-1.5">
                    {stats && stats.streak > 0 ? "Keep it going!" : "Start today!"}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* Subject Mastery */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-heading text-[13px] font-bold tracking-tight">Subject mastery</h3>
                <Link href="/dashboard/analytics" className="text-[11px] text-primary hover:underline">
                  Full analytics &rarr;
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {statsLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-2.5 animate-pulse space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-muted shrink-0" />
                          <div className="h-3 w-28 bg-muted rounded flex-1" />
                          <div className="h-3 w-8 bg-muted rounded" />
                        </div>
                        <div className="h-[3px] bg-muted rounded-full w-full" />
                      </div>
                    ))
                  : subjectRows.map((subj) => (
                      <div
                        key={subj.name}
                        className="bg-card border border-border rounded-lg p-2.5 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold font-heading shrink-0"
                            style={{ background: subj.cfg.bgIcon, color: subj.cfg.colorIcon }}
                          >
                            {subj.cfg.icon}
                          </div>
                          <div className="text-xs font-semibold flex-1">{subj.name}</div>
                          <div className="text-[11px] font-bold" style={{ color: subj.cfg.textColor }}>
                            {subj.accuracy}%
                          </div>
                        </div>
                        <div className="h-[3px] bg-border rounded-full w-full">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${subj.accuracy}%`, background: subj.cfg.fillColor }}
                          />
                        </div>
                        {subj.total > 0 && (
                          <div className="text-[9px] text-muted-foreground mt-1">
                            {subj.total} question{subj.total !== 1 ? "s" : ""} attempted
                          </div>
                        )}
                      </div>
                    ))
                }
              </div>
            </div>

            {/* Activity & Leaderboard */}
            <div className="flex flex-col gap-4">
              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-heading text-[13px] font-bold tracking-tight">Recent activity</h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  {statsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-3 md:p-2.5 flex items-center gap-2.5 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                        <div className="h-3 bg-muted rounded flex-1" />
                        <div className="h-3 w-12 bg-muted rounded shrink-0" />
                      </div>
                    ))
                  ) : recentSessions.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground">No sessions yet.</p>
                      <Link
                        href="/dashboard/practice"
                        className="text-xs text-primary hover:underline mt-1 block"
                      >
                        Start your first practice &rarr;
                      </Link>
                    </div>
                  ) : (
                    recentSessions.map((session) => {
                      const pct =
                        session.computed_score_pct !== null
                          ? session.computed_score_pct
                          : session.score !== null && session.total_questions
                          ? Math.round((session.score / session.total_questions) * 100)
                          : null;
                      const dotColor =
                        pct === null ? "bg-muted-foreground" : pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-primary" : "bg-rose-500";
                      return (
                        <div
                          key={session.id}
                          className="bg-card border border-border rounded-lg p-3 md:p-2.5 flex items-center gap-2.5"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                          <div className="text-xs text-muted-foreground flex-1 leading-snug">
                            Completed {session.mode} &mdash; {session.level}
                          </div>
                          <div className="text-[11px] font-bold text-primary shrink-0">
                            {pct !== null ? `${pct}%` : "—"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Leaderboard stub */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-heading text-[13px] font-bold tracking-tight">Top reviewees</h3>
                  <Link href="/dashboard/leaderboard" className="text-[11px] text-primary hover:underline">Full board &rarr;</Link>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-card border border-border rounded-lg">
                    <div className="font-heading text-[13px] font-extrabold min-w-[20px] text-accent">1</div>
                    <div className="w-6 h-6 rounded-full bg-[#2A1F08] text-[#F0B060] flex items-center justify-center text-[9px] font-bold font-heading shrink-0">MA</div>
                    <div className="text-xs font-semibold flex-1">Maria A.</div>
                    <div className="text-[11px] font-bold text-primary/80">3,840 XP</div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-primary/10 border border-primary rounded-lg">
                    <div className="font-heading text-[13px] font-extrabold min-w-[20px] text-primary">—</div>
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border-2 border-primary flex items-center justify-center text-[9px] font-bold font-heading shrink-0">
                      {username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs font-semibold flex-1 text-primary">{username} (you)</div>
                    <div className="text-[11px] font-bold text-muted-foreground">Coming soon</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <Link
              href="/dashboard/practice"
              className="bg-primary/5 border border-primary/20 rounded-xl p-4 hover:bg-primary/10 hover:border-primary/40 transition-colors group"
            >
              <div className="font-heading text-sm font-bold mb-1 group-hover:text-primary transition-colors">
                Practice Mode
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Untimed sessions with instant feedback and AI explanations.
              </div>
              <div className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
                Start practice <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
            <Link
              href="/dashboard/mock"
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors group"
            >
              <div className="font-heading text-sm font-bold mb-1 group-hover:text-primary transition-colors">
                Mock Exam
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Timed full-length exam to simulate the real CSE experience.
              </div>
              <div className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
                Take mock exam <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          <div className="h-4 md:h-2 shrink-0" />
        </div>
      </main>
    </div>
  );
}
