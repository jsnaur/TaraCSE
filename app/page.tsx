import Link from "next/link";
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
} from "lucide-react";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

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
      "Untimed, self-paced questions with instant feedback after every answer. Build fluency at your own pace.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Clock,
    title: "Mock Exam Mode",
    description:
      "Full-length exams under strict time limits, replicating the exact pressure and format of the real CSE.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description:
      "Visualize your performance per topic. Know exactly where you're losing points so you study smarter.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  {
    icon: Brain,
    title: "AI Explanations",
    description:
      "Don't just see the correct answer — understand *why*. AI-powered rationales build real comprehension.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
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
  { label: "Verbal, Numerical & CS coverage", included: false },
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
   COMPONENTS
───────────────────────────────────────────── */

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
        <BookOpen className="w-4 h-4 text-primary-foreground" />
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
   SECTION: NAVBAR
───────────────────────────────────────────── */

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-muted/50 hover:border-primary/40 transition-all duration-200"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 active:scale-[0.97]"
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
   SECTION: HERO
───────────────────────────────────────────── */

function HeroDashboardMockup() {
  return (
    <div className="relative w-full max-w-xl mx-auto select-none">
      {/* Outer glow */}
      <div className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 blur-2xl" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xl shadow-black/30">
        {/* Fake browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/80">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-3 h-5 rounded-md bg-muted/60 flex items-center px-2">
            <span className="text-[10px] text-muted-foreground/60 font-mono">
              app.taracse.ph/exam
            </span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 space-y-4">
          {/* Top stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Score", value: "84%", color: "text-primary", sub: "↑ +6 pts" },
              { label: "Rank", value: "#12", color: "text-secondary", sub: "Top 5%" },
              { label: "Streak", value: "7d", color: "text-accent", sub: "Keep going!" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-background border border-border/60 p-3 text-center"
              >
                <p className="text-[10px] text-muted-foreground mb-0.5">{s.label}</p>
                <p className={`font-heading text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground/60">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Mock exam question */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Verbal Ability · Q14 of 40
              </span>
              <div className="flex items-center gap-1 text-accent">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-mono font-bold">12:43</span>
              </div>
            </div>

            <p className="text-xs text-foreground font-medium leading-relaxed">
              Choose the word most similar in meaning to{" "}
              <span className="text-primary font-semibold">PERSPICACIOUS</span>.
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {["A. Shrewd", "B. Confused", "C. Timid", "D. Verbose"].map(
                (opt, i) => (
                  <button
                    key={opt}
                    className={`text-left text-[10px] rounded-lg px-2.5 py-1.5 border transition-all ${
                      i === 0
                        ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              Topic Mastery
            </p>
            {[
              { label: "Verbal Ability", pct: 78, color: "bg-primary" },
              { label: "Numerical Ability", pct: 61, color: "bg-secondary" },
              { label: "Civil Service Topics", pct: 90, color: "bg-accent" },
            ].map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground">{b.label}</span>
                  <span className="text-[10px] font-bold text-foreground">{b.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.color}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge — AI explanation */}
      <div className="absolute -right-4 top-1/3 w-44 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-sm p-3 shadow-xl shadow-primary/10">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-primary mb-0.5">AI Explanation</p>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              "Perspicacious" means having a ready insight, making "Shrewd" the closest match.
            </p>
          </div>
        </div>
      </div>

      {/* Floating badge — streak */}
      <div className="absolute -left-4 bottom-16 w-36 rounded-xl border border-accent/30 bg-card/95 backdrop-blur-sm p-3 shadow-xl shadow-accent/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-accent">7-day streak!</p>
            <p className="text-[9px] text-muted-foreground">Keep it up 🔥</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-6 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              For Professional &amp; Subprofessional Levels
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-foreground leading-[1.08] tracking-tight">
              Pass the Civil Service Exam.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Smarter, not harder.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
              Ditch the static PDFs sold on Facebook groups.{" "}
              <strong className="text-foreground font-semibold">TaraCSE</strong> replaces
              them with an interactive exam simulator that tracks every wrong answer,
              explains every concept, and tells you exactly what to study next.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 active:scale-[0.97]"
              >
                Start Practicing for Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                How it works
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Social proof micro-text */}
            <div className="flex items-center gap-3 justify-center lg:justify-start pt-2">
              <div className="flex -space-x-2">
                {["CR", "JM", "PG", "AL", "RS"].map((av) => (
                  <div
                    key={av}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background flex items-center justify-center text-[9px] font-bold text-white"
                  >
                    {av}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">2,400+</span> reviewees already
                practicing
              </p>
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="hidden lg:block">
            <HeroDashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION: WHY TARACSE (Value Prop / Pain vs Solution)
───────────────────────────────────────────── */

function WhyTaraCSE() {
  return (
    <section id="why" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center space-y-3 mb-14">
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

        {/* Comparison grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pain side */}
          <div className="rounded-2xl border border-red-500/20 bg-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-heading text-base font-bold text-foreground">
                  Static PDF Reviewers
                </p>
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

          {/* Solution side */}
          <div className="rounded-2xl border border-primary/30 bg-card p-6 sm:p-8 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-2 relative">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-heading text-base font-bold text-foreground">
                  TaraCSE Platform
                </p>
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
   SECTION: FEATURES
───────────────────────────────────────────── */

function Features() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-14">
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

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, color, bg, border }) => (
            <div
              key={title}
              className={`group rounded-2xl border ${border} bg-card p-6 space-y-4 hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5`}
            >
              <div className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="space-y-1.5">
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
   SECTION: PRICING
───────────────────────────────────────────── */

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-semibold text-secondary">
            <CreditCard className="w-3.5 h-3.5" />
            Pricing
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Start free. Go premium when you're ready.
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            No credit card required to start. Upgrade to Premium via{" "}
            <strong className="text-foreground">GCash</strong> — verified through Facebook
            Messenger for fast, hassle-free activation.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free tier */}
          <div className="rounded-2xl border border-border bg-card p-7 flex flex-col">
            <div className="mb-6">
              <p className="font-heading text-lg font-bold text-foreground mb-1">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-extrabold text-foreground">₱0</span>
                <span className="text-muted-foreground text-sm">/ forever</span>
              </div>
              <p className="text-muted-foreground text-xs mt-1.5">
                Great for getting a feel for the platform.
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

          {/* Premium tier */}
          <div className="rounded-2xl border-2 border-primary/50 bg-card p-7 flex flex-col relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            {/* Badge */}
            <div className="absolute top-5 right-5">
              <span className="text-[10px] font-bold tracking-wide bg-gradient-to-r from-primary to-secondary text-white px-2.5 py-1 rounded-full">
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 active:scale-[0.97]"
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

        {/* GCash process note */}
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
                Send ₱199 to our GCash number, then message us your receipt screenshot via
                Facebook Messenger. Our team manually activates your Premium account within{" "}
                <strong className="text-foreground">15–30 minutes</strong> during operating
                hours (8AM – 8PM daily).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION: TESTIMONIALS
───────────────────────────────────────────── */

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-14">
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

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, role, avatar, quote, stars }) => (
            <div
              key={name}
              className="rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
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
   SECTION: CTA BANNER
───────────────────────────────────────────── */

function CTABanner() {
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden p-10 sm:p-14 text-center">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/20" />
          <div className="absolute inset-0 border border-primary/20 rounded-3xl" />

          {/* Decorative dots */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Glow blobs */}
          <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />

          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90">
              <Zap className="w-3.5 h-3.5" />
              No credit card required
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your exam date is closer than you think.
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
              Start your free account now and find out exactly how ready you are — before
              it matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold bg-white text-primary hover:bg-white/95 shadow-xl shadow-black/20 transition-all duration-200 active:scale-[0.97]"
              >
                Start for free — today
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold border border-white/25 text-white hover:bg-white/10 transition-all duration-200"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION: FOOTER
───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <Logo />
            <p className="text-xs text-muted-foreground">
              The smarter way to pass the CSE.
            </p>
          </div>

          {/* Links */}
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
            © {new Date().getFullYear()} TaraCSE. All rights reserved. Not affiliated with
            the Civil Service Commission (CSC) of the Philippines.
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
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
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
  );
}