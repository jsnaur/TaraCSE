"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
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
  Menu,
  X,
  UserPlus,
  GraduationCap,
  Send,
  HelpCircle,
  ChevronUp,
  Users,
  Shield,
  Smartphone,
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
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Practice Mode",
    description:
      "Untimed, self-paced questions with instant feedback. Build fluency at your own pace, category by category.",
    color: "text-primary",
    bg: "bg-primary/10",
    delay: "0ms",
  },
  {
    icon: Clock,
    title: "Mock Exam Mode",
    description:
      "Full-length timed exams replicating the exact pressure and format of the real CSE. No mercy, no shortcuts.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    delay: "100ms",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description:
      "Visualize performance per topic. Know exactly where you're losing points so you study smarter, not harder.",
    color: "text-accent",
    bg: "bg-accent/10",
    delay: "200ms",
  },
  {
    icon: Brain,
    title: "AI Explanations",
    description:
      "Don't just see the correct answer — understand why. AI-powered rationales build real comprehension.",
    color: "text-primary",
    bg: "bg-primary/10",
    delay: "300ms",
  },
  {
    icon: Target,
    title: "Full CSE Coverage",
    description:
      "Verbal Ability, Numerical Ability, Analytical Ability, General Information, and Clerical Operations — all five categories covered.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    delay: "400ms",
  },
  {
    icon: Smartphone,
    title: "Study Anywhere",
    description:
      "Fully responsive. Review on your phone during commute, on your tablet at home, or desktop at work. Progress syncs everywhere.",
    color: "text-accent",
    bg: "bg-accent/10",
    delay: "500ms",
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

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create your free account",
    description: "Sign up in 30 seconds. No credit card, no strings attached. Start reviewing immediately.",
  },
  {
    step: "02",
    icon: BookOpen,
    title: "Practice & simulate",
    description: "Choose Practice Mode for learning or Mock Exam for real pressure. Kukot AI explains every answer.",
  },
  {
    step: "03",
    icon: GraduationCap,
    title: "Track progress & pass",
    description: "Analytics pinpoint your weak spots. Study smart, walk into exam day knowing you're ready.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Ano ang covered na subjects?",
    a: "Lahat ng lima: Verbal Ability, Numerical Ability, Analytical Ability, General Information, at Clerical Operations — para sa Professional at Sub-Professional level.",
  },
  {
    q: "Paano mag-upgrade sa Premium?",
    a: "Pay ₱99 via GCash, send the screenshot to our Messenger page, and you'll be activated within the hour. Fast, secure, no hassle.",
  },
  {
    q: "Legit ba ang mga questions?",
    a: "Yes. Our question bank is curated and regularly updated based on actual CSE coverage areas and difficulty levels. Hindi recycled PDF — fresh and accurate.",
  },
  {
    q: "Pwede ba gamitin offline?",
    a: "TaraCSE requires internet connection para sa AI explanations, real-time analytics, and progress syncing. But it works great on mobile data — very lightweight.",
  },
  {
    q: "Available ba for Sub-Professional?",
    a: "Absolutely. You choose your level — Professional or Sub-Professional — during setup. Questions, mock exams, and analytics are tailored to your chosen level.",
  },
  {
    q: "May refund ba?",
    a: "Dahil manual ang activation at very affordable ang ₱99, we don't offer refunds. But you can try the free tier first to make sure TaraCSE works for you before upgrading.",
  },
];

/* ─────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────── */

function useInView(threshold = 0.15) {
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

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 sm:gap-2.5 group shrink-0">
      <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/30">
        <Image src={LOGO_URL} alt="TaraCSE Logo" fill className="object-cover rounded-2xl" unoptimized />
      </div>
      {!compact && (
        <div className="text-left shrink-0">
          <p className="text-sm sm:text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            Tara<span className="text-primary">CSE</span>
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium hidden sm:block">Smart review</p>
        </div>
      )}
    </Link>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, index) => (
        <Star key={index} className="h-3.5 w-3.5 fill-accent text-accent" />
      ))}
    </div>
  );
}

/* ── Navbar ────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-2xl shadow-sm border-b border-border/40 py-2.5"
            : "bg-transparent py-3 sm:py-5"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 rounded-full bg-card/60 dark:bg-card/40 px-2 py-1.5 backdrop-blur-md border border-border/40">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-muted-foreground px-4 py-1.5 rounded-full transition-colors hover:text-primary hover:bg-primary/5"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center text-sm font-semibold text-foreground transition-colors hover:text-primary shrink-0"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full bg-primary px-3 py-1.5 sm:px-5 sm:py-2.5 text-[11px] sm:text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-95 shrink-0"
            >
              <span className="sm:hidden">Sign Up</span>
              <span className="hidden sm:inline">Sign up free</span>
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex md:hidden items-center justify-center h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl bg-muted/60 text-foreground transition-colors hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-foreground/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 w-[280px] h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <Logo compact />
              <button
                onClick={() => setMobileOpen(false)}
                className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-border/60 my-3" />
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
            </nav>
            <div className="p-4 border-t border-border/60">
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                <Zap className="h-4 w-4" />
                Start reviewing free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Hero ──────────────────────────────────── */

function Hero() {
  const [mounted, setMounted] = useState(false);
  const [dialogue, setDialogue] = useState(DIALOGUES[0]);

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

  // Calculate days until next CSE (August 3, 2026)
  const nextExamDate = new Date("2026-08-03");
  const today = new Date();
  const daysUntil = Math.ceil((nextExamDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-12 sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20">
      {/* Background effects */}
      <div className="absolute top-0 inset-x-0 h-[600px] sm:h-[800px] w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background pointer-events-none" />
      <div className="absolute right-0 top-20 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
      <div className="absolute left-0 bottom-0 h-[200px] w-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:items-center">

          {/* ── Left: Copy ── */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Urgency chip */}
            <div
              className={`inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 dark:bg-accent/10 px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-accent-foreground dark:text-accent">
                Next CSE: August 2026 — {daysUntil} days left
              </span>
            </div>

            {/* Heading */}
            <div
              className={`space-y-4 sm:space-y-5 transition-all duration-700 delay-100 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
                Pass the Civil Service Exam —{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                  the smart way.
                </span>
              </h1>
              <p className="max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground mx-auto lg:mx-0">
                Ditch outdated PDF reviewers. TaraCSE gives you timed mock exams, AI-powered explanations, and analytics that tell you exactly what to study next.
              </p>
            </div>

            {/* CTA buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start transition-all duration-700 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                Start practicing — it&apos;s free
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border/60 bg-card/50 dark:bg-card/30 px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-bold text-foreground transition-all hover:bg-muted/50 hover:-translate-y-0.5"
              >
                How it works
                <ChevronDown className="h-4 w-4" />
              </Link>
            </div>

            {/* Inline stats */}
            <div
              className={`flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-2 transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {[
                { value: "3,000+", label: "questions" },
                { value: "5", label: "CSE categories" },
                { value: "24/7", label: "access" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5 text-sm">
                  <span className="font-black text-foreground">{stat.value}</span>
                  <span className="text-muted-foreground font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Mascot showcase ── */}
          <div
            className={`relative mx-auto w-full max-w-sm lg:max-w-none transition-all duration-1000 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
            }`}
          >
            {/* Gold glow ring */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-accent/20 via-primary/10 to-secondary/20 blur-[40px] pointer-events-none" />

            <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-border/60 bg-card shadow-2xl shadow-primary/5 dark:shadow-primary/10">
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Preview</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-border" />
                  <div className="h-2 w-2 rounded-full bg-border" />
                  <div className="h-2 w-8 rounded-full bg-border" />
                </div>
              </div>

              {/* Content area */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Practice mode mini-card */}
                <div className="flex items-center gap-3 rounded-xl bg-background/80 border border-border/40 px-3.5 py-3 transition-colors hover:border-primary/30">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">Practice Mode</p>
                    <p className="text-[10px] text-muted-foreground">Self-paced with AI help</p>
                  </div>
                  <div className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">Active</div>
                </div>

                {/* Mock exam mini-card */}
                <div className="flex items-center gap-3 rounded-xl bg-background/80 border border-border/40 px-3.5 py-3 transition-colors hover:border-secondary/30">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                    <Clock className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">Mock Exam</p>
                    <p className="text-[10px] text-muted-foreground">200 items • Strict timer</p>
                  </div>
                  <div className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent-foreground dark:text-accent">Premium</div>
                </div>
              </div>

              {/* Mascot area */}
              <div className="relative flex flex-col items-center px-6 pb-6">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

                <div className="relative w-40 h-40 sm:w-48 sm:h-48 animate-float-slow">
                  {/* Speech bubble */}
                  <div className="absolute -top-3 -right-2 sm:-right-6 z-20 rounded-xl bg-card px-3 py-2 shadow-lg border border-border/60 animate-float-soft">
                    <p className="text-[11px] sm:text-xs font-bold text-primary whitespace-nowrap">&ldquo;{dialogue}&rdquo;</p>
                    <div className="absolute -bottom-[6px] left-4 w-3 h-3 bg-card border-b border-r border-border/60 rotate-45" />
                  </div>
                  <Image src={MASCOT_URL} alt="Kukot — your AI review buddy" fill className="object-contain drop-shadow-xl" unoptimized priority />
                </div>

                <div className="text-center mt-3 space-y-1">
                  <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-primary">
                    <Sparkles className="h-2.5 w-2.5" />
                    Meet Kukot
                  </div>
                  <p className="text-sm sm:text-base font-black text-foreground">Your AI Review Buddy</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground max-w-[220px] mx-auto">
                    Smart explanations for every question — so you understand, not just memorize.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Trust strip ──────────────────────────── */

function TrustStrip() {
  const { ref, visible } = useInView(0.3);

  return (
    <section ref={ref} className="border-y border-border/40 bg-muted/20 dark:bg-muted/10 py-5 sm:py-6">
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
          {[
            { icon: Users, text: "2,000+ reviewees" },
            { icon: Target, text: "3,000+ questions" },
            { icon: Star, text: "5-star rated", iconClass: "fill-accent text-accent" },
            { icon: ShieldCheck, text: "Pro & Sub-Pro levels" },
          ].map(({ icon: Icon, text, iconClass }) => (
            <div key={text} className="flex items-center gap-2 text-muted-foreground">
              <Icon className={`h-4 w-4 ${iconClass || ""}`} />
              <span className="font-semibold">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ─────────────────────────── */

function HowItWorks() {
  const { ref, visible } = useInView();

  return (
    <section id="how-it-works" ref={ref} className="bg-background py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div
          className={`space-y-3 sm:space-y-4 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary">
            <Play className="h-3.5 w-3.5 fill-current" />
            How it works
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground">Three steps to exam-ready.</h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            No complicated setup. No payment walls. Just sign up and start reviewing.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }, index) => (
            <div
              key={step}
              className={`group relative rounded-2xl sm:rounded-[2rem] border border-border/60 bg-card p-6 sm:p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: visible ? `${index * 150}ms` : "0ms" }}
            >
              {/* Step number */}
              <div className="absolute -top-3 left-6 sm:left-8 rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1 text-[10px] font-black text-white shadow-md">
                Step {step}
              </div>

              <div className="mt-3 sm:mt-4">
                <div className="mb-4 sm:mb-5 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 duration-300">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>

              {/* Connector arrow (desktop only) */}
              {index < 2 && (
                <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-card border border-border/60 text-muted-foreground shadow-sm">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ─────────────────────────────── */

function Features() {
  const { ref, visible } = useInView();

  return (
    <section id="features" ref={ref} className="bg-muted/20 dark:bg-muted/10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-border/40">
      <div className="mx-auto max-w-7xl">
        <div
          className={`space-y-3 sm:space-y-4 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Core features
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground">Everything you need to pass.</h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            Built from scratch to simulate the real exam, track your weak spots, and explain the hardest logic simply.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, color, bg, delay }) => (
            <div
              key={title}
              className={`group relative rounded-2xl sm:rounded-[2rem] border border-border/50 bg-card p-6 sm:p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: visible ? delay : "0ms" }}
            >
              <div
                className={`mb-4 sm:mb-6 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${bg} transition-transform group-hover:scale-110 duration-300`}
              >
                <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${color}`} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{title}</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why TaraCSE (Pain vs Solution) ───────── */

function WhyTaraCSE() {
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className="bg-background py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <div className="pointer-events-none absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

        <div
          className={`space-y-3 sm:space-y-4 text-center relative z-10 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Sound familiar?
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            The old way is holding you back.
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            Traditional reviewers leave you guessing. TaraCSE gives you a modern, data-driven edge.
          </p>
        </div>

        <div className="relative z-10 mt-12 sm:mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Bad Way */}
          <div className="group rounded-2xl sm:rounded-[2.5rem] border-2 border-destructive/30 dark:border-destructive/40 bg-card p-6 sm:p-8 lg:p-10 shadow-lg transition-all hover:shadow-xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">Static PDFs</p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">The outdated Facebook way</p>
              </div>
            </div>
            <ul className="space-y-3.5 sm:space-y-5">
              {PAIN_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 sm:gap-3 text-muted-foreground text-sm">
                  <XCircle className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-destructive-foreground" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Good Way */}
          <div className="group relative rounded-2xl sm:rounded-[2.5rem] border-2 border-primary/30 bg-card p-6 sm:p-8 lg:p-10 shadow-lg transition-all hover:border-primary/50 hover:shadow-xl">
            <div className="absolute top-0 right-6 sm:right-8 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1.5 text-[10px] sm:text-xs font-bold text-white shadow-lg">
              The Solution
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">TaraCSE Platform</p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">The smarter way to review</p>
              </div>
            </div>
            <ul className="space-y-3.5 sm:space-y-5">
              {SOLUTIONS.map((solution) => (
                <li key={solution} className="flex items-start gap-2.5 sm:gap-3 text-foreground font-medium text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary" />
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

/* ── Pricing ──────────────────────────────── */

function Pricing() {
  const { ref, visible } = useInView();

  return (
    <section id="pricing" ref={ref} className="relative overflow-hidden bg-muted/20 dark:bg-muted/10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-border/40">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <div
          className={`space-y-3 sm:space-y-4 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent-foreground dark:text-accent">
            <CreditCard className="h-3.5 w-3.5" />
            Pricing
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Start free. Go premium when ready.
          </h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            No credit card required. Upgrade via GCash when you&apos;re ready for the full experience.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8 items-start max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="rounded-2xl sm:rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 lg:p-10 shadow-lg transition-all hover:shadow-xl">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-muted-foreground">Free Starter</p>
            <div className="mt-3 sm:mt-4 flex items-end gap-2">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground">₱0</span>
              <span className="mb-1 sm:mb-2 text-sm sm:text-base font-medium text-muted-foreground">/ forever</span>
            </div>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Perfect for getting a feel of the platform before committing.
            </p>

            <div className="my-6 sm:my-8 h-px w-full bg-border/60" />

            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm font-medium">
              {FREE_FEATURES.map(({ label, included }) => (
                <li key={label} className="flex items-center gap-2.5 sm:gap-3">
                  {included ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/25 shrink-0" />
                  )}
                  <span className={included ? "text-foreground" : "text-muted-foreground/40"}>{label}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 sm:mt-10 inline-flex w-full items-center justify-center rounded-full border-2 border-border/60 bg-card px-6 py-3 sm:py-4 text-sm sm:text-base font-bold text-foreground transition-all hover:bg-muted hover:border-foreground/20"
            >
              Get started free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="relative rounded-2xl sm:rounded-[2.5rem] border-2 border-accent bg-card p-6 sm:p-8 lg:p-10 shadow-2xl shadow-accent/10 z-10">
            <div className="absolute -top-4 sm:-top-5 inset-x-0 flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-accent to-accent/80 px-5 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/20">
                Recommended
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-accent mt-2">Premium</p>
            <div className="mt-3 sm:mt-4 flex items-end gap-2">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                ₱99
              </span>
              <span className="mb-1 sm:mb-2 text-sm sm:text-base font-medium text-muted-foreground">/ month</span>
            </div>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-foreground/80">
              Full unrestricted access. Everything you need to guarantee a pass.
            </p>

            <div className="my-6 sm:my-8 h-px w-full bg-border/60" />

            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm font-semibold text-foreground">
              {PREMIUM_FEATURES.map(({ label }) => (
                <li key={label} className="flex items-start gap-2.5 sm:gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 sm:mt-10 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 sm:py-4 text-sm sm:text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
              Unlock Premium
            </Link>
          </div>
        </div>

        {/* GCash Trust Flow */}
        <div
          className={`mt-10 sm:mt-14 mx-auto max-w-2xl transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <p className="text-center text-xs sm:text-sm font-bold text-foreground mb-4">
              How to upgrade via GCash — simple & secure
            </p>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { step: "1", icon: CreditCard, text: "Pay ₱99 via GCash" },
                { step: "2", icon: Send, text: "Send screenshot to Messenger" },
                { step: "3", icon: Zap, text: "Activated in < 1 hour" },
              ].map(({ step, icon: Icon, text }) => (
                <div key={step} className="text-center space-y-2">
                  <div className="mx-auto flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-accent/10 text-accent-foreground dark:text-accent">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground leading-tight">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="font-medium">Questions? Message us anytime on Facebook Messenger</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/60 rounded-xl sm:rounded-2xl bg-card overflow-hidden transition-colors hover:border-primary/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left"
      >
        <span className="text-sm sm:text-base font-bold text-foreground pr-2">{q}</span>
        <div className={`shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted/60 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4 sm:px-6 sm:pb-5 pt-0">
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">{a}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQ() {
  const { ref, visible } = useInView();

  return (
    <section id="faq" ref={ref} className="bg-background py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div
          className={`space-y-3 sm:space-y-4 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Common questions, straight answers.</h2>
        </div>

        <div className="mt-10 sm:mt-12 space-y-3">
          {FAQ_ITEMS.map(({ q, a }) => (
            <FAQItem key={q} q={q} a={a} />
          ))}
        </div>

        <div className="mt-8 sm:mt-10 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Still have questions?{" "}
            <a href="https://m.me/TaraCSE" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
              Message us on Messenger
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────── */

function Testimonials() {
  const { ref, visible } = useInView();

  return (
    <section id="testimonials" ref={ref} className="bg-muted/20 dark:bg-muted/10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-border/40">
      <div className="mx-auto max-w-7xl">
        <div
          className={`space-y-3 sm:space-y-4 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent-foreground dark:text-accent">
            <Star className="h-3.5 w-3.5 fill-current" />
            Testimonials
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground">Real passers. Real results.</h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            From reviewees who threw away their PDF stacks and passed with TaraCSE.
          </p>
        </div>

        {/* Mobile: horizontal scroll | Desktop: grid */}
        <div className="mt-10 sm:mt-16">
          {/* Mobile scroll view */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:hidden scrollbar-hide">
            {TESTIMONIALS.map(({ name, role, avatar, quote, stars }) => (
              <TestimonialCard key={name} name={name} role={role} avatar={avatar} quote={quote} stars={stars} className="snap-center shrink-0 w-[85vw]" />
            ))}
          </div>

          {/* Desktop grid */}
          <div className="hidden sm:grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, avatar, quote, stars }, index) => (
              <TestimonialCard
                key={name}
                name={name}
                role={role}
                avatar={avatar}
                quote={quote}
                stars={stars}
                className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: visible ? `${index * 150}ms` : "0ms" }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  name, role, avatar, quote, stars, className = "", style,
}: {
  name: string; role: string; avatar: string; quote: string; stars: number; className?: string; style?: React.CSSProperties;
}) {
  return (
    <article
      className={`group relative rounded-2xl sm:rounded-[2rem] border border-border/60 bg-card p-6 sm:p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${className}`}
      style={style}
    >
      <StarRating count={stars} />
      <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-foreground font-medium">&ldquo;{quote}&rdquo;</p>
      <div className="mt-5 sm:mt-8 flex items-center gap-3 sm:gap-4 border-t border-border/40 pt-4 sm:pt-6">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs sm:text-sm font-bold text-white shadow-md">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{name}</p>
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{role}</p>
        </div>
      </div>
      <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary/60">
        <Shield className="h-3 w-3" />
        Verified TaraCSE user
      </div>
    </article>
  );
}

/* ── CTA Banner ───────────────────────────── */

function CTABanner() {
  const { ref, visible } = useInView(0.2);

  return (
    <section ref={ref} className="bg-background py-12 sm:py-20 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-32">
      <div
        className={`relative mx-auto max-w-5xl overflow-hidden rounded-2xl sm:rounded-[3rem] border border-border/60 bg-gradient-to-br from-[#0F1D35] via-[#080F1E] to-[#162040] shadow-2xl transition-all duration-1000 ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10"
        }`}
      >
        {/* Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -left-20 -top-20 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-primary/20 blur-[80px] sm:blur-[100px]" />
          <div className="absolute -right-20 -bottom-20 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-accent/15 blur-[80px] sm:blur-[100px]" />
        </div>

        <div className="relative grid gap-8 sm:gap-12 p-6 sm:p-10 lg:p-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5 sm:space-y-8 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Your exam date is closer than you think.
            </h2>
            <p className="max-w-xl text-sm sm:text-lg leading-relaxed text-white/70 mx-auto lg:mx-0">
              Start your free account now and find out exactly how ready you are — before it actually matters.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-accent-foreground shadow-xl shadow-accent/20 transition-all hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Start for free today
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-transparent px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-white transition-all hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/50 flex items-center justify-center lg:justify-start gap-2">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> No credit card required. Free forever plan available.
            </p>
          </div>

          {/* Kukot thinking */}
          <div className="hidden lg:flex justify-center">
            <div className="relative w-full max-w-[280px] rounded-[2.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl animate-float-slow">
              <div className="relative overflow-hidden rounded-[2rem] bg-white/5 p-5 border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent opacity-50" />
                <div className="relative z-10 w-full h-44">
                  <Image src={THINKING_MASCOT_URL} alt="Kukot thinking" fill className="object-contain" unoptimized />
                </div>
                <div className="relative z-10 mt-4 rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/5 text-left">
                  <p className="font-bold text-white text-sm">Ready to pass?</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                    Mock exams, practice sessions, and analytics — all in one platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Sticky Mobile CTA ────────────────────── */

function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const heroThreshold = 300;

      // Show after scrolling past hero
      setVisible(y > heroThreshold);

      // Hide when scrolling up (less annoying)
      setHidden(y < lastScroll.current && y > heroThreshold);

      lastScroll.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 sm:hidden transition-all duration-300 ${
        visible && !hidden
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-[150%] opacity-0 pointer-events-none"
      }`}
    >
      <Link
        href="/register"
        className="flex items-center justify-center gap-2 w-full max-w-[320px] rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-2xl shadow-primary/30 border border-primary-foreground/10 transition-all active:scale-[0.98]"
      >
        <Play className="h-4 w-4 fill-current" />
        Start reviewing — it&apos;s free
      </Link>
    </div>
  );
}

/* ── Footer ───────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3 text-center sm:text-left">
            <Logo />
            <p className="text-xs sm:text-sm font-medium text-muted-foreground max-w-xs mx-auto sm:mx-0">
              The smarter, data-driven way to pass the Philippine Civil Service Exam.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
              <a
                href="https://m.me/TaraCSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Messenger
              </a>
            </div>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-medium text-muted-foreground">
            {[
              { label: "Log in", href: "/login" },
              { label: "Register", href: "/register" },
              { label: "Terms", href: "/terms" },
              { label: "Privacy", href: "/privacy" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} TaraCSE. All rights reserved.
          </p>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold text-center sm:text-right">
            Not affiliated with the Civil Service Commission (CSC)
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-soft { animation: float-soft 4s ease-in-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
        <Navbar />
        <main>
          <Hero />
          <TrustStrip />
          <HowItWorks />
          <Features />
          <WhyTaraCSE />
          <Pricing />
          <FAQ />
          <Testimonials />
          <CTABanner />
        </main>
        <Footer />
        <StickyMobileCTA />
      </div>
    </>
  );
}