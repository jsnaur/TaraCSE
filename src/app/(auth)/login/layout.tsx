import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, Trophy, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "TaraCSE – Civil Service Exam Review",
  description:
    "The modern, gamified review platform for Filipino CSE aspirants.",
};

const FEATURES = [
  {
    icon: Zap,
    title: "Adaptive Mock Exams",
    desc: "Simulate the real CSE experience with timed, randomized exams.",
  },
  {
    icon: Trophy,
    title: "Track Your Progress",
    desc: "Visual dashboards show exactly where you need to improve.",
  },
  {
    icon: CheckCircle2,
    title: "Curated Reviewers",
    desc: "Coverage for all CSE subtopics — Verbal, Numerical, and CS topics.",
  },
  {
    icon: BookOpen,
    title: "Detailed Explanations",
    desc: "Every answer comes with a clear rationale to deepen understanding.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* ── LEFT PANEL – Branding (hidden on mobile) ── */}
      <aside className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between overflow-hidden p-10 xl:p-14">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-secondary/10" />

        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Decorative glows */}
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-secondary/15 blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 w-fit group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground tracking-tight">
              Tara<span className="text-primary">CSE</span>
            </span>
          </Link>

          {/* Hero copy */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                For Filipino CSE Aspirants
              </div>

              <h1 className="font-heading text-4xl xl:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
                Your smartest{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  path to passing
                </span>{" "}
                the CSE.
              </h1>

              <p className="text-muted-foreground text-base xl:text-lg leading-relaxed max-w-sm">
                Stop guessing what to review. TaraCSE adapts to your strengths
                and gaps so every minute you study counts.
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3.5 group">
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading text-sm font-semibold text-foreground">
                      {title}
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer testimonial */}
          <div className="space-y-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-accent fill-accent"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-muted-foreground text-xs italic leading-relaxed max-w-xs">
              "Pumasa ako sa CSE Professional level sa first try dahil sa
              TaraCSE. Highly recommend sa lahat ng reviewees!"
            </blockquote>
            <p className="text-muted-foreground/60 text-xs font-medium">
              — Jessa M., Passed CSE Professional 2024
            </p>
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL – Form area ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-8 relative">
        {/* Mobile logo (visible only on small screens) */}
        <Link
          href="/"
          className="flex lg:hidden items-center gap-2 mb-8 group"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">
            Tara<span className="text-primary">CSE</span>
          </span>
        </Link>

        {/* Subtle background glow for right panel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}