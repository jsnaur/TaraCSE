"use client";

import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Check, X, Sparkles, ArrowRight, ArrowLeft, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      {/* Desktop Sidebar - Hidden on mobile, flex on md and above */}
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="px-4 md:px-5 h-[52px] min-h-[52px] border-b border-border flex items-center gap-3 bg-background transition-colors duration-200">
          
          {/* Mobile Hamburger Menu */}
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
          
          <div className="hidden sm:flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs text-primary font-semibold shrink-0">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            12-day streak
          </div>
          
          <div className="ml-auto flex items-center gap-2 md:gap-4 text-[11px] text-muted-foreground shrink-0">
            <span className="hidden lg:inline">Saturday, Apr 18 &nbsp;&middot;&nbsp; CSE Exam in 47 days</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4">
          
          {/* Hero Card */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col-reverse md:grid md:grid-cols-[1fr_auto] gap-5 items-center md:items-center text-center md:text-left">
            <div className="w-full">
              <div className="text-xs text-muted-foreground mb-0.5">Magandang umaga,</div>
              <div className="font-heading text-[22px] font-extrabold tracking-tight mb-1.5">Juan Reyes</div>
              <div className="text-xs text-muted-foreground leading-relaxed max-w-[460px] mx-auto md:mx-0">
                You&apos;re 62% toward <strong className="font-semibold text-foreground">Dalubhasa</strong> rank. Complete today&apos;s exam set to earn +120 XP and unlock your next achievement badge.
              </div>
              <div className="mt-4 md:mt-3.5">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>Mag-aaral II</span>
                  <span><strong className="text-primary font-semibold">620</strong> / 1,000 XP &rarr; Dalubhasa I</span>
                </div>
                <div className="h-2 bg-border rounded-full w-full">
                  <div className="h-full rounded-full bg-primary relative" style={{ width: "62%" }}>
                    <div className="absolute -right-px top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/40 border-2 border-background"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rank Ring Graphic */}
            <div className="relative w-[84px] h-[84px] shrink-0 mx-auto md:mx-0">
              <svg viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="42" cy="42" r="36" stroke="var(--border)" strokeWidth="6" />
                <circle cx="42" cy="42" r="36" stroke="var(--primary)" strokeWidth="6"
                  strokeDasharray="141.4 226.2" strokeDashoffset="56.6" strokeLinecap="round" transform="rotate(-90 42 42)" />
                <circle cx="42" cy="42" r="28" fill="var(--card)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-heading text-base font-extrabold leading-none">62%</div>
                <div className="text-[9px] text-muted-foreground mt-px tracking-[0.05em]">TO RANK UP</div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="bg-card border border-border rounded-xl p-4 md:p-3.5">
              <div className="font-heading text-[26px] font-extrabold tracking-tight leading-none">1,248</div>
              <div className="text-[11px] text-muted-foreground mt-1">Questions answered</div>
              <div className="text-[10px] font-semibold text-primary mt-1.5">+84 this week</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 md:p-3.5">
              <div className="font-heading text-[26px] font-extrabold tracking-tight leading-none text-[var(--spark-correct-text)]">73%</div>
              <div className="text-[11px] text-muted-foreground mt-1">Overall accuracy</div>
              <div className="text-[10px] font-semibold text-primary mt-1.5">+4% vs last week</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 md:p-3.5">
              <div className="font-heading text-[26px] font-extrabold tracking-tight leading-none text-accent">18</div>
              <div className="text-[11px] text-muted-foreground mt-1">Badges earned</div>
              <div className="text-[10px] font-semibold text-primary mt-1.5">3 new this month</div>
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            
            {/* Subject Mastery */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-heading text-[13px] font-bold tracking-tight">Subject mastery</h3>
                <span className="text-[11px] text-primary cursor-pointer hover:underline">View all &rarr;</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { icon: "V", name: "Verbal Ability", pct: "84%", bgIcon: "#0D2B1D", colorIcon: "#74C69D", fillBg: "#2D6A4F", textColor: "var(--spark-correct-text)" },
                  { icon: "N", name: "Numerical Ability", pct: "61%", bgIcon: "#0A1F2E", colorIcon: "#6BA3E0", fillBg: "#854F0B", textColor: "var(--accent)" },
                  { icon: "A", name: "Analytical Ability", pct: "78%", bgIcon: "#2A1F08", colorIcon: "#F0B060", fillBg: "#276749", textColor: "var(--spark-correct-text)" },
                  { icon: "G", name: "General Information", pct: "54%", bgIcon: "#1D0E2E", colorIcon: "#C080E0", fillBg: "#6B2020", textColor: "var(--spark-wrong-text)" }
                ].map((subj, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-2.5 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold font-heading shrink-0" style={{ background: subj.bgIcon, color: subj.colorIcon }}>{subj.icon}</div>
                      <div className="text-xs font-semibold flex-1">{subj.name}</div>
                      <div className="text-[11px] font-bold" style={{ color: subj.textColor }}>{subj.pct}</div>
                    </div>
                    <div className="h-[3px] bg-border rounded-full w-full">
                      <div className="h-full rounded-full" style={{ width: subj.pct, background: subj.fillBg }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity & Leaderboard */}
            <div className="flex flex-col gap-4">
              {/* Activity */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-heading text-[13px] font-bold tracking-tight">Recent activity</h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="bg-card border border-border rounded-lg p-3 md:p-2.5 flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary"></div>
                    <div className="text-xs text-muted-foreground flex-1 leading-snug">Completed Mock Exam #14 &mdash; Verbal Ability</div>
                    <div className="text-[11px] font-bold text-accent shrink-0">+80 XP</div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3 md:p-2.5 flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-accent"></div>
                    <div className="text-xs text-muted-foreground flex-1 leading-snug">Unlocked badge: &quot;Root Word Ranger&quot;</div>
                    <div className="text-[11px] font-bold text-accent shrink-0">+25 XP</div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3 md:p-2.5 flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--spark-correct-text)]"></div>
                    <div className="text-xs text-muted-foreground flex-1 leading-snug">Flashcard session &mdash; Philippine History</div>
                    <div className="text-[11px] font-bold text-accent shrink-0">+40 XP</div>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-heading text-[13px] font-bold tracking-tight">Top reviewees</h3>
                  <Link href="/dashboard/leaderboard" className="text-[11px] text-primary hover:underline">Full board &rarr;</Link>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-card border border-border rounded-lg">
                    <div className="font-heading text-[13px] font-extrabold min-w-[20px] text-accent">1</div>
                    <div className="w-6.5 h-6.5 rounded-full bg-[#2A1F08] text-[#F0B060] flex items-center justify-center text-[9px] font-bold font-heading shrink-0">MA</div>
                    <div className="text-xs font-semibold flex-1">Maria A.</div>
                    <div className="text-[11px] font-bold text-primary/80">3,840 XP</div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-primary/10 border border-primary rounded-lg">
                    <div className="font-heading text-[13px] font-extrabold min-w-[20px] text-primary">8</div>
                    <div className="w-6.5 h-6.5 rounded-full bg-primary/20 text-primary border-2 border-primary flex items-center justify-center text-[9px] font-bold font-heading shrink-0">JR</div>
                    <div className="text-xs font-semibold flex-1 text-primary">Juan R. (you)</div>
                    <div className="text-[11px] font-bold text-primary/80">620 XP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Exam Section */}
          <div className="text-[11px] font-bold text-muted-foreground tracking-[0.08em] uppercase pt-3 pb-1.5 border-t border-border mt-1">
            &#9654; Continue today&apos;s exam set &mdash; Analytical Ability
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Exam Header */}
            <div className="px-3 md:px-4 py-3 border-b border-border flex flex-wrap items-center gap-x-2.5 gap-y-2 bg-sidebar">
              <div className="text-[9px] font-bold tracking-[0.1em] uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
                Analytical Ability
              </div>
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">Question 3 of 40</div>
              <div className="hidden sm:flex gap-1 ml-2">
                <div className="w-5 h-[3px] rounded-full bg-primary"></div>
                <div className="w-5 h-[3px] rounded-full bg-primary"></div>
                <div className="w-5 h-[3px] rounded-full bg-primary/50"></div>
                <div className="w-5 h-[3px] rounded-full bg-border"></div>
              </div>
              <div className="ml-auto text-[11px] text-muted-foreground tabular-nums font-medium w-full sm:w-auto text-right">
                Time left: <span className="text-foreground font-bold">41:22</span>
              </div>
            </div>

            {/* Question Body */}
            <div className="p-4 md:p-5">
              <div className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase mb-2">Item 3 &nbsp;&middot;&nbsp; Coding &amp; Decoding</div>
              <div className="text-sm leading-relaxed font-medium mb-4">
                In a certain code, <em className="text-primary not-italic font-bold">MANILA</em> is written as <em className="text-primary not-italic font-bold">NAMLAI</em>. Using the same pattern, how would <em className="text-primary not-italic font-bold">BATAAN</em> be written?
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2">
                {[
                  { ltr: "A", text: "TAABNA" },
                  { ltr: "B", text: "ATAANB", isCorrect: true },
                  { ltr: "C", text: "NAATAB" },
                  { ltr: "D", text: "AABNAT" }
                ].map((opt) => {
                  const isSelected = selectedOption === opt.ltr;
                  const isWrongSelected = isSelected && !opt.isCorrect;
                  const showCorrect = selectedOption && opt.isCorrect;

                  let optClass = "border-border bg-sidebar hover:border-primary/50";
                  let checkIcon = null;

                  if (showCorrect) {
                    optClass = "bg-[var(--spark-correct-bg)] border-[var(--spark-correct-border)] text-[var(--spark-correct-text)] shadow-sm";
                    checkIcon = <Check className="w-4 h-4 ml-auto font-bold shrink-0" />;
                  } else if (isWrongSelected) {
                    optClass = "bg-[var(--spark-wrong-bg)] border-[var(--spark-wrong-border)] text-[var(--spark-wrong-text)]";
                    checkIcon = <X className="w-4 h-4 ml-auto font-bold shrink-0" />;
                  }

                  return (
                    <button 
                      key={opt.ltr}
                      onClick={() => setSelectedOption(opt.ltr)}
                      disabled={!!selectedOption}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md border text-[13px] text-muted-foreground transition-all text-left ${optClass} ${!selectedOption && "hover:text-foreground"}`}
                    >
                      <span className={`font-heading text-[11px] font-extrabold min-w-[16px] shrink-0 ${showCorrect ? "text-[var(--spark-correct-text)]" : isWrongSelected ? "text-[var(--spark-wrong-text)]" : "text-muted-foreground"}`}>
                        {opt.ltr}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {checkIcon}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Block */}
            {selectedOption && (
              <div className="mx-4 md:mx-5 mb-4 md:mb-5 bg-[var(--spark-ai-bg)] border border-[var(--spark-ai-border)] rounded-md p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-5 h-5 bg-primary/20 border border-[var(--spark-ai-border)] rounded flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-[var(--spark-ai-text)]" />
                  </div>
                  <div className="text-[9px] font-extrabold tracking-[0.1em] uppercase text-primary">Tutor insight</div>
                  <div className="ml-auto text-[8px] font-extrabold tracking-[0.08em] uppercase bg-accent text-[#1a0f00] px-2 py-0.5 rounded-full">Premium</div>
                </div>
                <div className="text-xs leading-relaxed text-[var(--spark-ai-text)]">
                  The pattern swaps letter pairs: positions 1&harr;2, 3&harr;4, 5&harr;6. So MA&rarr;AM, NI&rarr;IN, LA&rarr;AL would give AMINLA &mdash; but checking MANILA&rarr;NAMLAI confirms the pattern is 2-1-4-3-6-5. Apply to B-A-T-A-A-N: positions rearrange to A-B-A-T-N-A &rarr; <strong className="font-bold">ATAANB</strong>. Option B is correct.
                </div>
              </div>
            )}

            {/* Exam Footer */}
            <div className="px-3 md:px-5 py-3 border-t border-border flex flex-wrap items-center justify-between sm:justify-start gap-2 bg-card">
              <button className="px-3 md:px-4 py-2 rounded-md font-sans text-xs font-semibold text-muted-foreground hover:bg-sidebar hover:text-foreground transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start border border-transparent">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button className="px-3 md:px-4 py-2 rounded-md font-sans text-xs font-semibold bg-[var(--spark-ai-bg)] border border-[var(--spark-ai-border)] text-[var(--spark-ai-text)] hover:opacity-85 transition-opacity flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
                <Sparkles className="w-3.5 h-3.5" /> Hint
              </button>
              <button 
                className="sm:ml-auto px-4 py-2 rounded-md font-sans text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-sm"
                onClick={() => setSelectedOption(null)}
              >
                Next question <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-4 md:h-2 shrink-0"></div>
        </div>
      </main>
    </div>
  );
}