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
  Trophy,
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

const STATS = [
  { value: "2,400+", label: "Active Reviewees", icon: Trophy },
  { value: "3,000+", label: "Question Bank", icon: FileText },
  { value: "89%", label: "Pass Rate", icon: Target },
  { value: "4.9★", label: "User Rating", icon: Star },
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
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
      <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
        <Image
          src={LOGO_URL}
          alt="TaraCSE Logo"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="font-heading text-lg font-bold text-foreground tracking-tight">
        Tara<span className="text-primary">CSE</span>
      </span>
    </Link>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-muted/50 hover:border-primary/40 transition-all duration-200"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/40 transition-all duration-200 active:scale-[0.97]"
          >
            Sign up free
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */

function FloatingBadge({
  children,
  className,
  delay = "0ms",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={`absolute rounded-2xl border bg-card/95 backdrop-blur-sm shadow-2xl p-3 animate-float ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}

function Hero() {
  const [mounted, setMounted] = useState(false);
  const [dialogue, setDialogue] = useState(DIALOGUES[0]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Rotate dialogue randomly every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDialogue(DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)]);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background flex items-center py-16">
      {/* Background animated elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Moving abstract shapes */}
        <div className="absolute top-20 left-[10%] w-24 h-24 bg-primary/20 rounded-full animate-float-shape blur-xl" />
        <div className="absolute bottom-40 right-[15%] w-32 h-32 bg-secondary/10 rounded-3xl rotate-45 animate-float-shape blur-2xl" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-[40%] w-16 h-16 bg-accent/20 rounded-full animate-float-shape blur-lg" style={{ animationDelay: '4s' }} />

        {/* Radial glows */}
        <div className="absolute top-0 left-1/3 w-[700px] h-[700px] rounded-full bg-primary/8 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* LEFT: Copy */}
          <div
            className={`space-y-7 text-center lg:text-left transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              For Professional &amp; Subprofessional Levels
            </div>

            {/* Headline */}
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-[4rem] font-extrabold text-foreground leading-[1.05] tracking-tight">
              CSE, Ano Tara? <br />
              <span className="relative inline-block mt-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary animate-gradient bg-[length:200%_auto]">
                  Review the smarter way.
                </span>
              </span>
            </h1>

            {/* Sub */}
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
              Ditch the static PDFs sold on Facebook groups.{" "}
              <strong className="text-foreground font-semibold">TaraCSE</strong> gives you
              a real exam simulator, AI-powered explanations, and analytics that show you{" "}
              <em>exactly</em> what to study next.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 active:scale-[0.97]"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Practicing for Free
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                See how it works
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 justify-center lg:justify-start pt-2">
              <div className="flex -space-x-2">
                {["CR", "JM", "PG", "AL", "RS"].map((av) => (
                  <div
                    key={av}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                  >
                    {av}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">2,400+</span> reviewees already practicing
              </p>
            </div>
          </div>

          {/* RIGHT: Mascot */}
          <div
            className={`relative flex items-center justify-center transition-all duration-700 delay-200 mt-12 lg:mt-0 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            {/* Glow ring behind mascot */}
            <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl animate-pulse-soft" />

            {/* Grounded Mascot Base/Shadow */}
            <div className="relative z-10 flex flex-col items-center">
              
              {/* Dynamic Speech Bubble */}
              <div className="absolute -top-12 sm:-top-16 z-20 animate-bounce-slow">
                <div className="relative bg-white text-primary px-5 py-2.5 rounded-2xl shadow-xl shadow-primary/20 border border-primary/10 font-bold text-sm sm:text-base tracking-tight whitespace-nowrap">
                  {dialogue}
                  {/* Speech Tail */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-primary/10 rotate-45" />
                </div>
              </div>

              {/* Enlarged, Grounded Image */}
              <Image
                src={MASCOT_URL}
                alt="Kukot — TaraCSE mascot"
                width={500}
                height={500}
                className="w-80 sm:w-96 lg:w-[30rem] xl:w-[34rem] h-auto drop-shadow-[0_20px_30px_rgba(108,99,224,0.4)] transition-transform duration-500 hover:scale-[1.02]"
                unoptimized
                priority
              />

              {/* Ground Shadow - anchors the mascot to prevent floating look */}
              <div className="absolute -bottom-4 w-3/4 h-8 bg-black/20 blur-[14px] rounded-[100%]" />
            </div>

            {/* Floating badge: Score */}
            <FloatingBadge
              className="border-primary/30 shadow-primary/15 -left-2 sm:-left-8 top-20 w-44 z-20"
              delay="0ms"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Your Score</p>
                  <p className="font-heading text-base font-bold text-primary">84% ↑+6</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Floating badge: AI */}
            <FloatingBadge
              className="border-purple-500/30 shadow-purple-500/10 -right-2 sm:-right-8 top-1/3 w-48 z-20"
              delay="500ms"
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-primary mb-0.5">AI Explanation</p>
                  <p className="text-[9px] text-muted-foreground leading-snug">
                    "Perspicacious" means having ready insight. "Shrewd" is the best match.
                  </p>
                </div>
              </div>
            </FloatingBadge>

            {/* Floating badge: Streak */}
            <FloatingBadge
              className="border-accent/30 shadow-accent/10 -left-4 sm:-left-12 bottom-28 w-36 z-20"
              delay="250ms"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-accent">7-day streak!</p>
                  <p className="text-[9px] text-muted-foreground">Keep it up 🔥</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Floating badge: Rank */}
            <FloatingBadge
              className="border-secondary/30 shadow-secondary/10 right-0 sm:-right-6 bottom-16 w-36 z-20"
              delay="750ms"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-secondary">Rank #12</p>
                  <p className="text-[9px] text-muted-foreground">Top 5% 🎉</p>
                </div>
              </div>
            </FloatingBadge>
          </div>
        </div>

        {/* Stats row */}
        <div
          className={`mt-20 lg:mt-24 grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {STATS.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="group rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 text-center hover:border-primary/30 hover:bg-card transition-all duration-300"
            >
              <Icon className="w-5 h-5 text-primary mx-auto mb-2.5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" />
              <p className="font-heading text-2xl font-extrabold text-foreground">{value}</p>
              <p className="text-[12px] font-medium text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   WHY TARACSE
───────────────────────────────────────────── */

function WhyTaraCSE() {
  const { ref, visible } = useIntersectionObserver();

  return (
    <section id="why" ref={ref} className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`text-center space-y-3 mb-14 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
            <AlertTriangle className="w-3.5 h-3.5" />
            Sound familiar?
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Why TaraCSE beats the old way
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
            Traditional reviewers leave you guessing. TaraCSE gives you a data-driven edge.
          </p>
        </div>

        <div
          className={`grid md:grid-cols-2 gap-6 transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Pain */}
          <div className="rounded-2xl border border-red-500/20 bg-card p-6 sm:p-8 space-y-4 hover:border-red-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-heading text-base font-bold text-foreground">Static PDF Reviewers</p>
                <p className="text-xs text-muted-foreground">The old way (Facebook PDFs)</p>
              </div>
            </div>
            <ul className="space-y-3">
              {PAIN_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div className="rounded-2xl border border-primary/30 bg-card p-6 sm:p-8 space-y-4 relative overflow-hidden hover:border-primary/60 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-2 relative">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-heading text-base font-bold text-foreground">TaraCSE Platform</p>
                <p className="text-xs text-muted-foreground">The smarter way to review</p>
              </div>
            </div>
            <ul className="space-y-3 relative">
              {SOLUTIONS.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FEATURES
───────────────────────────────────────────── */

function Features() {
  const { ref, visible } = useIntersectionObserver();

  return (
    <section id="features" ref={ref} className="py-24 bg-background relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`text-center space-y-3 mb-14 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Core Features
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Everything you need to pass
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
            TaraCSE is designed around one goal: getting you through that exam on your first try.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, color, bg, border, delay }, i) => (
            <div
              key={title}
              className={`group rounded-2xl border ${border} bg-card p-6 space-y-4 hover:border-opacity-80 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/8 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDelay: visible ? delay : "0ms",
                transitionDuration: "600ms",
              }}
            >
              <div
                className={`w-12 h-12 rounded-xl ${bg} border ${border} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
              >
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div className="space-y-2">
                <h3 className={`font-heading text-base font-bold ${color}`}>{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MASCOT BREAK SECTION
───────────────────────────────────────────── */

function MascotCallout() {
  const { ref, visible } = useIntersectionObserver(0.2);

  return (
    <section ref={ref} className="py-16 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`relative rounded-3xl overflow-hidden transition-all duration-700 ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Gradient BG */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/15" />
          <div className="absolute inset-0 border border-primary/20 rounded-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 sm:p-12">
            {/* Mascot small */}
            <div className="flex-shrink-0 w-40 sm:w-48 animate-float-slow">
              <Image
                src={MASCOT_URL}
                alt="Kukot mascot"
                width={240}
                height={240}
                className="w-full h-auto drop-shadow-[0_20px_40px_rgba(108,99,224,0.4)]"
                unoptimized
              />
            </div>

            {/* Text */}
            <div className="text-center md:text-left space-y-4 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <Zap className="w-3 h-3" /> Hi, I'm Kukot!
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Your study buddy for the CSE.
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg">
                Ako si <strong className="text-foreground">Kukot</strong>, ang inyong guide sa paghahanda para sa Civil Service Exam. 
                Kasama ninyo ako sa bawat practice question, mock exam, at AI explanation para siguruhing pumasa kayo!
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-200 active:scale-[0.97]"
              >
                Practice with Kukot
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PRICING
───────────────────────────────────────────── */

function Pricing() {
  const { ref, visible } = useIntersectionObserver();

  return (
    <section id="pricing" ref={ref} className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-primary/6 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`text-center space-y-3 mb-14 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-semibold text-secondary">
            <CreditCard className="w-3.5 h-3.5" />
            Pricing
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Start free. Go premium when ready.
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            No credit card required. Upgrade via{" "}
            <strong className="text-foreground">GCash</strong> — verified through Facebook Messenger.
          </p>
        </div>

        <div
          className={`grid md:grid-cols-2 gap-6 max-w-3xl mx-auto transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Free */}
          <div className="rounded-2xl border border-border bg-card p-7 flex flex-col hover:border-border/80 transition-all duration-300">
            <div className="mb-6">
              <p className="font-heading text-lg font-bold text-foreground mb-1">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-extrabold text-foreground">₱0</span>
                <span className="text-muted-foreground text-sm">/ forever</span>
              </div>
              <p className="text-muted-foreground text-xs mt-1.5">
                Perfect for getting started.
              </p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-7">
              {FREE_FEATURES.map(({ label, included }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  {included ? (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  )}
                  <span className={included ? "text-foreground" : "text-muted-foreground/50 line-through"}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              Get started free
            </Link>
          </div>

          {/* Premium */}
          <div className="rounded-2xl border-2 border-primary/50 bg-card p-7 flex flex-col relative overflow-hidden hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/15 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute top-5 right-5">
              <span className="text-[10px] font-bold tracking-wide bg-gradient-to-r from-primary to-secondary text-white px-2.5 py-1 rounded-full shadow-lg shadow-primary/30">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-6 relative">
              <p className="font-heading text-lg font-bold text-foreground mb-1">Premium</p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  ₱199
                </span>
                <span className="text-muted-foreground text-sm">/ month</span>
              </div>
              <p className="text-muted-foreground text-xs mt-1.5">
                Full access. Pay via GCash, verified on Messenger.
              </p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-7 relative">
              {PREMIUM_FEATURES.map(({ label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{label}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 relative">
              <Link
                href="/upgrade"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 active:scale-[0.97]"
              >
                <Zap className="w-4 h-4" />
                Unlock Premium via GCash
              </Link>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Verified through Facebook Messenger within minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* GCash note */}
        <div className="mt-10 max-w-2xl mx-auto rounded-2xl border border-secondary/20 bg-secondary/5 p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground mb-1">
                How Premium activation works
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Send ₱199 to our GCash number, then message us your receipt screenshot via Facebook Messenger.
                Our team manually activates your Premium account within{" "}
                <strong className="text-foreground">15–30 minutes</strong> during operating hours (8AM – 8PM daily).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────── */

function Testimonials() {
  const { ref, visible } = useIntersectionObserver();

  return (
    <section id="testimonials" ref={ref} className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`text-center space-y-3 mb-14 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
            <Star className="w-3.5 h-3.5 fill-accent" />
            Testimonials
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Real passers. Real results.
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm sm:text-base">
            Hear from reviewees who replaced their PDF stacks with TaraCSE.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, role, avatar, quote, stars }, i) => (
            <div
              key={name}
              className={`rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/8 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: visible ? `${i * 100}ms` : "0ms" }}
            >
              <StarRating count={stars} />
              <p className="text-sm text-foreground leading-relaxed italic">"{quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA BANNER (Uses Thinking Mascot)
───────────────────────────────────────────── */

function CTABanner() {
  const { ref, visible } = useIntersectionObserver(0.2);

  return (
    <section ref={ref} className="py-20 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div
          className={`relative rounded-3xl overflow-hidden transition-all duration-700 ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/35 via-primary/15 to-secondary/25" />
          <div className="absolute inset-0 border border-primary/20 rounded-3xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-secondary/25 blur-3xl pointer-events-none" />

          {/* Content */}
          <div className="relative flex flex-col lg:flex-row items-center gap-8 p-10 sm:p-14">
            {/* Text side */}
            <div className="flex-1 text-center lg:text-left space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90">
                <Zap className="w-3.5 h-3.5" />
                No credit card required
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your exam date is closer than you think.
              </h2>
              <p className="text-white/70 text-sm sm:text-base max-w-md">
                Start your free account now and find out exactly how ready you are — before it matters.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold bg-white text-primary hover:bg-white/95 shadow-xl shadow-black/20 transition-all duration-200 active:scale-[0.97]"
                >
                  Start for free — today
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold border border-white/25 text-white hover:bg-white/10 transition-all duration-200"
                >
                  See pricing
                </Link>
              </div>
            </div>

            {/* Mascot CTA (Thinking variant) */}
            <div className="flex-shrink-0 w-48 sm:w-56 lg:w-60 animate-float-slow">
              <Image
                src={THINKING_MASCOT_URL}
                alt="Kukot thinking"
                width={300}
                height={300}
                className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <Logo />
            <p className="text-xs text-muted-foreground">The smarter way to pass the CSE.</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[
              { label: "Log in", href: "/login" },
              { label: "Register", href: "/register" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TaraCSE. All rights reserved. Not affiliated with the Civil Service Commission (CSC) of the Philippines.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   PAGE ROOT
───────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }
        @keyframes float-shape {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-float-shape {
          animation: float-shape 6s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
        .animate-pulse-soft {
          animation: pulse-soft 4s ease-in-out infinite;
        }
      `}</style>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
        <Navbar />
        <main>
          <Hero />
          <WhyTaraCSE />
          <Features />
          <MascotCallout />
          <Pricing />
          <Testimonials />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </>
  );
}