"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Star,
  Clock,
  BarChart3,
  Sparkles,
  CheckCircle2,
  XCircle,
  Zap,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  ArrowRight,
  Brain,
  TrendingUp,
  FileText,
  AlertTriangle,
  Target,
  Play,
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

const MASCOT_URL =
  "https://loaroehobtglndxigbjm.supabase.co/storage/v1/object/public/Kukot_3D/hello_kukot.png";
const THINKING_MASCOT_URL =
  "https://loaroehobtglndxigbjm.supabase.co/storage/v1/object/public/Kukot_3D/thinking_kukot.png";
const LOGO_URL =
  "https://loaroehobtglndxigbjm.supabase.co/storage/v1/object/public/Kukot_3D/taracse_logo.png";

const DIALOGUES = [
  "CSE, Ano Tara?",
  "Kaya mo 'yan!",
  "Let's review today!",
  "Papasa ka, claim it!",
  "One step closer!",
  "Aral muna, bago laro!",
  "Kaya mo, nandito ako!",
];

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Practice Mode",
    description:
      "Untimed, self-paced questions with instant feedback. Build fluency at your own pace, category by category.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    delay: "0ms",
  },
  {
    icon: Clock,
    title: "Mock Exam Mode",
    description:
      "Full-length timed exams replicating the exact pressure and format of the real CSE. No mercy.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
    delay: "100ms",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description:
      "Visualize performance per topic. Know exactly where you're losing points so you study smarter.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
    delay: "200ms",
  },
  {
    icon: Brain,
    title: "AI Explanations",
    description:
      "Don't just see the correct answer — understand why. AI-powered rationales build real comprehension.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    delay: "300ms",
  },
];

const PAIN_POINTS = [
  "Static PDF reviewers with no way to track progress",
  "No timer — no idea how slow you actually are",
  "Answers with zero explanation",
  "Outdated content sold on Facebook groups",
  "No personalized weak-spot analysis",
];

const SOLUTIONS = [
  "Interactive questions with instant, tracked results",
  "Strict exam-mode timer matching CSE conditions",
  "AI-generated rationales for every single answer",
  "Curated, up-to-date question bank maintained regularly",
  "Detailed per-topic analytics dashboard",
];

const FREE_FEATURES = [
  { label: "50 practice questions per day", included: true },
  { label: "Basic performance stats", included: true },
  { label: "Practice Mode only", included: true },
  { label: "Full 200-item mock exams", included: false },
  { label: "Complete question bank (3,000+ items)", included: false },
  { label: "AI answer explanations", included: false },
  { label: "Advanced analytics & weak-spot tracking", included: false },
];

const PREMIUM_FEATURES = [
  { label: "Unlimited practice questions", included: true },
  { label: "Advanced performance analytics", included: true },
  { label: "Practice Mode + Mock Exam Mode", included: true },
  { label: "Full 200-item mock exams (unlimited)", included: true },
  { label: "Complete question bank (3,000+ items)", included: true },
  { label: "AI answer explanations for every item", included: true },
  { label: "Advanced analytics & weak-spot tracking", included: true },
  { label: "All subjects: Verbal, Numerical & CS", included: true },
];

const TESTIMONIALS = [
  {
    name: "Camille R.",
    role: "Passed CSE Professional, March 2024",
    avatar: "CR",
    quote:
      "Nagalaw yung score ko ng malaki after 2 weeks sa TaraCSE. Ang ganda ng analytics — alam ko exactly kung saan ako mahina.",
    stars: 5,
  },
  {
    name: "Jonel M.",
    role: "Passed CSE Sub-Professional, 2024",
    avatar: "JM",
    quote:
      "Dati bumibili pa ko ng PDF sa Facebook. Sayang pera. TaraCSE lang ang kailangan — real exam conditions talaga.",
    stars: 5,
  },
  {
    name: "Patricia G.",
    role: "Government Employee, Quezon City",
    avatar: "PG",
    quote:
      "Yung AI explanation feature is a game-changer. Hindi lang ako nagsasaulo ng sagot — naiintindihan ko na bakit.",
    stars: 5,
  },
];

/* ─────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────── */

function useIntersectionObserver(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */

function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 group">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary via-violet-500 to-secondary shadow-lg shadow-primary/30 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
        <Image src={LOGO_URL} alt="TaraCSE Logo" fill className="object-cover rounded-[1.25rem]" unoptimized />
      </div>
      <div className="space-y-0.5 text-left">
        <p className="text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
          Tara<span className="text-primary">CSE</span>
        </p>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Smart review</p>
      </div>
    </Link>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-sm" />
      ))}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl shadow-sm border-b border-border/50 py-3" : "bg-transparent py-5"}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden md:flex items-center gap-8 rounded-full bg-white/50 dark:bg-slate-900/50 px-6 py-2 backdrop-blur-md border border-border/50">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:inline-flex items-center justify-center text-sm font-semibold text-foreground transition-colors hover:text-primary">
            Log in
          </Link>
          <Link href="/register" className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/25 active:scale-95">
            Sign up free
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function FloatingBadge({ children, className, show = true }: { children: React.ReactNode; className?: string; show?: boolean }) {
  return (
    <div className={`absolute z-20 rounded-2xl border border-white/20 bg-white/90 dark:bg-slate-900/90 p-3 sm:p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95 pointer-events-none"} ${className}`}>
      {children}
    </div>
  );
}

function Hero() {
  const [mounted, setMounted] = useState(false);
  const [dialogue, setDialogue] = useState(DIALOGUES[0]);
  const [badgesVisible, setBadgesVisible] = useState(Array(4).fill(false));

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDialogue(DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const delays = [600, 900, 1200, 1500];
    const ids = delays.map((delay, index) =>
      window.setTimeout(() => {
        setBadgesVisible((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      }, delay)
    );
    return () => ids.forEach(clearTimeout);
  }, [mounted]);

  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-20 sm:pt-40 sm:pb-24 lg:px-8">
      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-[800px] w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="absolute right-0 top-32 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />
      
      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        
        {/* Left Content */}
        <div className="space-y-10">
          <div className={`inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur-md transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <ShieldCheck className="h-4 w-4" />
            Built for Professional & Subprofessional
          </div>

          <div className={`space-y-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1]">
              Pass the CSE with review that is{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-secondary pb-2">
                smart, fast, and modern.
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Ditch the old PDFs and outdated reviewers. TaraCSE gives you real exam simulations, instant AI explanations, and analytics that pinpoint exactly what to study next.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:scale-95">
                <Play className="h-5 w-5 fill-current" />
                Start practicing free
              </Link>
              <Link href="#features" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border/80 bg-background px-8 py-4 text-base font-bold text-foreground shadow-sm transition-all hover:bg-muted/50 hover:-translate-y-0.5">
                See features
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/50">
              <div>
                <p className="text-3xl font-black text-foreground">3k+</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Questions</p>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground">89%</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pass rate</p>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground">24/7</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Mascot & UI Showcase */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          {/* Running Light Border Container */}
          <div className={`relative p-[3px] overflow-hidden rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_120px_rgba(15,23,42,0.6)] transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}>
            
            {/* Background Base */}
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800" />

            {/* The Spinning Light Edge (Explicit Hex to guarantee visibility) */}
            <div className="absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_75%,#8b5cf6_100%)] opacity-90 blur-[1px]" />

            {/* Inner Main Card Area */}
            <div className="relative z-10 w-full h-full rounded-[2.35rem] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8">
              
              {/* Feature Bars Container */}
              <div className="space-y-3">
                {/* Practice Mode Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-background border border-border/60 px-4 py-3 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Practice Mode</p>
                      <p className="text-sm font-semibold text-foreground">Guided Learning</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-primary/10 border border-primary/10 px-3 py-1.5 text-[10px] sm:text-[11px] font-bold text-primary w-full sm:w-auto text-center">
                    KOT AI - Klarong Obhetibong Tugon
                  </div>
                </div>

                {/* Mock Exam Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-background border border-border/60 px-4 py-3 shadow-sm hover:border-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                      <Clock className="h-4 w-4 text-secondary animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mock Exam</p>
                      <p className="text-sm font-semibold text-foreground">Full CSE Simulation</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-secondary/10 border border-secondary/10 px-3 py-1.5 text-[10px] sm:text-[11px] font-bold text-secondary w-full sm:w-auto text-center">
                    <Target className="h-3 w-3" />
                    Strict Timer • No AI Help
                  </div>
                </div>
              </div>

              {/* Mascot Showcase Stage */}
              <div className="relative mt-12 sm:mt-16 flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-[80px] rounded-full z-0" />
                
                {/* Floating Mascot & Speech Bubble */}
                <div className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 animate-float-slow">
                  
                  {/* Speech Bubble */}
                  <div className="absolute -top-6 -right-4 sm:-right-8 rounded-2xl bg-white dark:bg-slate-800 px-5 py-3.5 shadow-2xl border border-border/50 animate-float-soft z-20 hidden sm:block">
                    <p className="text-sm font-bold text-primary whitespace-nowrap">"{dialogue}"</p>
                    {/* Speech Bubble Tail */}
                    <div className="absolute -bottom-[9px] left-6 w-4 h-4 bg-white dark:bg-slate-800 border-b border-r border-border/50 rotate-45 transform origin-center" />
                  </div>

                  <Image src={MASCOT_URL} alt="Kukot AI Buddy" fill className="object-contain drop-shadow-2xl" unoptimized priority />
                </div>

                <div className="relative z-10 text-center mt-6 space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                    <Sparkles className="h-3 w-3" />
                    Meet Kukot
                  </div>
                  <h3 className="text-2xl font-black text-foreground">Your AI Review Buddy</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                    Smart explanations and instant feedback to keep you moving.
                  </p>
                </div>
              </div>

              {/* Bottom Metrics */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/50 bg-background/50 p-4 text-center transition-colors hover:bg-background">
                  <p className="text-2xl font-black text-foreground">84%</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">Avg. Score Boost</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/50 p-4 text-center transition-colors hover:bg-background">
                  <p className="text-2xl font-black text-foreground">7d</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">Active Streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          <FloatingBadge show={badgesVisible[0]} className="-left-8 top-48 w-[210px] hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mastery Level</p>
                <p className="font-bold text-foreground">84% Ready</p>
              </div>
            </div>
          </FloatingBadge>

          <FloatingBadge show={badgesVisible[1]} className="-right-12 lg:-right-16 top-[20rem] lg:top-[22rem] w-[210px] hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Insights</p>
                <p className="font-bold text-foreground">Guided Learning</p>
              </div>
            </div>
          </FloatingBadge>
        </div>
      </div>
    </section>
  );
}

function WhyTaraCSE() {
  const { ref, visible } = useIntersectionObserver();

  return (
    <section id="why" ref={ref} className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 py-24 px-4 sm:px-6 lg:px-8 border-y border-border/50">
      <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      
      <div className="relative mx-auto max-w-7xl">
        <div className={`space-y-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Sound familiar?
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">The old way is holding you back.</h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Traditional reviewers leave you guessing. TaraCSE gives you a modern, data-driven edge with practice, timing, and intelligent insights all in one place.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Bad Way */}
          <div className="group relative rounded-[2.5rem] border-2 border-red-100 dark:border-red-900/30 bg-white dark:bg-slate-950 p-8 sm:p-10 shadow-xl shadow-red-900/5 transition-all hover:shadow-2xl hover:shadow-red-900/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Static PDFs</p>
                <p className="text-sm font-medium text-muted-foreground">The outdated Facebook way</p>
              </div>
            </div>
            <ul className="space-y-5">
              {PAIN_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Good Way */}
          <div className="group relative rounded-[2.5rem] border-2 border-primary/20 bg-white dark:bg-slate-950 p-8 sm:p-10 shadow-xl shadow-primary/5 transition-all hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
            <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1.5 text-xs font-bold text-white shadow-lg">
              The Solution
            </div>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">TaraCSE Platform</p>
                <p className="text-sm font-medium text-muted-foreground">The smarter way to review</p>
              </div>
            </div>
            <ul className="space-y-5">
              {SOLUTIONS.map((solution) => (
                <li key={solution} className="flex items-start gap-3 text-foreground font-medium">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="leading-relaxed">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { ref, visible } = useIntersectionObserver();

  return (
    <section id="features" ref={ref} className="bg-background py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className={`space-y-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Core features
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">Everything you need to pass.</h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Built from the ground up to simulate the real exam, track your weak points, and explain the hardest logic simply.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, color, bg, border, delay }) => (
            <div
              key={title}
              className={`group relative rounded-[2rem] border border-border/60 bg-white dark:bg-slate-900/50 p-8 shadow-lg shadow-slate-900/5 transition-all duration-500 hover:-translate-y-2 hover:border-${color.split('-')[1]}/30 hover:shadow-2xl ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
              style={{ transitionDelay: visible ? delay : "0ms" }}
            >
              <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${bg} transition-transform group-hover:scale-110 duration-300`}>
                <Icon className={`h-8 w-8 ${color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { ref, visible } = useIntersectionObserver();

  return (
    <section id="pricing" ref={ref} className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/30 py-24 px-4 sm:px-6 lg:px-8 border-t border-border/50">
      <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-secondary/5 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className={`space-y-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary">
            <CreditCard className="h-3.5 w-3.5" />
            Pricing
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">Start free. Go premium when ready.</h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            No credit card required. Upgrade via GCash and get fast manual activation through Messenger.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Free Tier */}
          <div className="rounded-[2.5rem] border border-border bg-white dark:bg-slate-950 p-8 sm:p-10 shadow-xl shadow-slate-900/5 transition-all hover:shadow-2xl lg:ml-auto w-full max-w-lg">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Free Starter</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-black text-foreground">₱0</span>
              <span className="mb-2 text-base font-medium text-muted-foreground">/ forever</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Perfect for getting a feel of the platform with daily practice.</p>
            
            <div className="my-8 h-px w-full bg-border/60" />
            
            <ul className="space-y-4 text-sm font-medium">
              {FREE_FEATURES.map(({ label, included }) => (
                <li key={label} className="flex items-center gap-3">
                  {included ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> : <XCircle className="h-5 w-5 text-muted-foreground/30 shrink-0" />}
                  <span className={included ? "text-foreground" : "text-muted-foreground/50"}>{label}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-10 inline-flex w-full items-center justify-center rounded-full border-2 border-border/80 bg-background px-6 py-4 text-base font-bold text-foreground transition-all hover:bg-muted hover:border-foreground/20">
              Get started free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="relative rounded-[2.5rem] border-2 border-primary bg-white dark:bg-slate-950 p-8 sm:p-10 shadow-2xl shadow-primary/20 scale-100 lg:scale-105 w-full max-w-lg mx-auto lg:mr-auto z-10">
            <div className="absolute -top-5 inset-x-0 flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/30">
                Most Popular
              </div>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary mt-2">Premium</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">₱99</span>
              <span className="mb-2 text-base font-medium text-muted-foreground">/ month</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">Full unrestricted access. Everything you need to guarantee a pass.</p>
            
            <div className="my-8 h-px w-full bg-border/60" />
            
            <ul className="space-y-4 text-sm font-semibold text-foreground">
              {PREMIUM_FEATURES.map(({ label }) => (
                <li key={label} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <Link href="/upgrade" className="mt-10 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 text-base font-bold text-background shadow-xl transition-all hover:bg-primary hover:text-primary-foreground hover:-translate-y-1">
              <Zap className="h-5 w-5 fill-current" />
              Unlock Premium via GCash
            </Link>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              Fast manual verification via Messenger
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const { ref, visible } = useIntersectionObserver();

  return (
    <section id="testimonials" ref={ref} className="bg-background py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className={`space-y-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            Testimonials
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">Real passers. Real results.</h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Hear from reviewees who threw away their PDF stacks and passed with TaraCSE.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map(({ name, role, avatar, quote, stars }, index) => (
            <article
              key={name}
              className={`group relative rounded-[2rem] border border-border/80 bg-slate-50 dark:bg-slate-900/40 p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
              style={{ transitionDelay: visible ? `${index * 150}ms` : "0ms" }}
            >
              <StarRating count={stars} />
              <p className="mt-6 text-base leading-relaxed text-foreground font-medium">"{quote}"</p>
              <div className="mt-8 flex items-center gap-4 border-t border-border/50 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-md">
                  {avatar}
                </div>
                <div>
                  <p className="font-bold text-foreground">{name}</p>
                  <p className="text-xs font-medium text-muted-foreground">{role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  const { ref, visible } = useIntersectionObserver(0.2);

  return (
    <section ref={ref} className="bg-background py-20 px-4 sm:px-6 lg:px-8 pb-32">
      <div className={`relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] border border-border bg-foreground dark:bg-slate-900 shadow-2xl shadow-slate-950/20 transition-all duration-1000 ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10"}`}>
        
        {/* Abstract Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[3rem]">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/30 blur-[100px]" />
          <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-secondary/30 blur-[100px]" />
        </div>

        <div className="relative grid gap-12 p-10 sm:p-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8 text-center lg:text-left">
            <h2 className="text-4xl font-black tracking-tight text-background dark:text-white sm:text-5xl leading-tight">
              Your exam date is closer than you think.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-background/80 dark:text-slate-300 mx-auto lg:mx-0">
              Start your free account now and find out exactly how ready you are — before it actually matters.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-1 active:scale-95">
                Start for free today
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#pricing" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-background/20 dark:border-white/20 bg-transparent px-8 py-4 text-base font-bold text-background dark:text-white transition-all hover:bg-background/10">
                See pricing
              </Link>
            </div>
            <p className="text-sm font-medium text-background/60 dark:text-slate-400 flex items-center justify-center lg:justify-start gap-2">
              <Zap className="h-4 w-4" /> No credit card required.
            </p>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[340px] rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl animate-float-slow">
              <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-50" />
                <div className="relative z-10 w-full h-48 sm:h-56">
                   <Image src={THINKING_MASCOT_URL} alt="Kukot thinking" fill className="object-contain" unoptimized />
                </div>
                <div className="relative z-10 mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/5 text-left">
                  <p className="font-bold text-white text-lg">Ready to pass?</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">Jump into mock exams, practice sessions, and analytics in one polished platform.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3 text-center sm:text-left">
            <Logo />
            <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto sm:mx-0">The smarter, data-driven way to pass the Civil Service Exam.</p>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-6 text-sm font-medium text-muted-foreground">
            {[
              { label: "Log in", href: "/login" },
              { label: "Register", href: "/register" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} TaraCSE. All rights reserved.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold text-center sm:text-right">
            Not affiliated with the Civil Service Commission (CSC)
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-16px); }
        }
        @keyframes float-soft {
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-8px); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-soft { animation: float-soft 4s ease-in-out infinite; }
      `}</style>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
        <Navbar />
        <main>
          <Hero />
          <WhyTaraCSE />
          <Features />
          <Pricing />
          <Testimonials />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </>
  );
}