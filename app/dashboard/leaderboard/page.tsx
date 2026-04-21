"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Clock, ChevronUp, ChevronDown, Minus, Star, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProfile } from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamineeEntry {
  rank: number;
  name: string;
  score: string;
  scoreNum: number;
  timeTaken: string;
  avatarFallback: string;
  trend: "up" | "down" | "same";
  isCurrentUser?: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const professionalData: ExamineeEntry[] = [
  { rank: 1,  name: "Maria Santos",       score: "97.8%", scoreNum: 97.8, timeTaken: "1h 02m", avatarFallback: "MS", trend: "same" },
  { rank: 2,  name: "Juan dela Cruz",     score: "96.3%", scoreNum: 96.3, timeTaken: "1h 08m", avatarFallback: "JC", trend: "up"   },
  { rank: 3,  name: "Ana Reyes",          score: "95.1%", scoreNum: 95.1, timeTaken: "0h 58m", avatarFallback: "AR", trend: "up"   },
  { rank: 4,  name: "Carlo Mendoza",      score: "93.7%", scoreNum: 93.7, timeTaken: "1h 19m", avatarFallback: "CM", trend: "down" },
  { rank: 5,  name: "Liza Villanueva",    score: "92.5%", scoreNum: 92.5, timeTaken: "1h 15m", avatarFallback: "LV", trend: "up"   },
  { rank: 6,  name: "Miguel Torres",      score: "91.0%", scoreNum: 91.0, timeTaken: "1h 22m", avatarFallback: "MT", trend: "same" },
  { rank: 7,  name: "Rosa Aquino",        score: "90.4%", scoreNum: 90.4, timeTaken: "1h 30m", avatarFallback: "RA", trend: "down" },
  { rank: 8,  name: "Patrick Lim",        score: "89.8%", scoreNum: 89.8, timeTaken: "1h 10m", avatarFallback: "PL", trend: "up"   },
  { rank: 9,  name: "Grace Bautista",     score: "88.6%", scoreNum: 88.6, timeTaken: "1h 25m", avatarFallback: "GB", trend: "same" },
  { rank: 10, name: "Nico Castillo",      score: "87.9%", scoreNum: 87.9, timeTaken: "1h 35m", avatarFallback: "NC", trend: "down" },
  { rank: 42, name: "Alex Macaraeg",      score: "78.4%", scoreNum: 78.4, timeTaken: "1h 48m", avatarFallback: "AM", trend: "up", isCurrentUser: true },
];

const subprofessionalData: ExamineeEntry[] = [
  { rank: 1,  name: "Ella Pascual",       score: "98.2%", scoreNum: 98.2, timeTaken: "0h 55m", avatarFallback: "EP", trend: "same" },
  { rank: 2,  name: "Ramon Gutierrez",    score: "96.7%", scoreNum: 96.7, timeTaken: "1h 00m", avatarFallback: "RG", trend: "down" },
  { rank: 3,  name: "Claire Navarro",     score: "94.9%", scoreNum: 94.9, timeTaken: "1h 05m", avatarFallback: "CN", trend: "up"   },
  { rank: 4,  name: "Jonas Flores",       score: "93.2%", scoreNum: 93.2, timeTaken: "1h 12m", avatarFallback: "JF", trend: "same" },
  { rank: 5,  name: "Tessa Morales",      score: "91.5%", scoreNum: 91.5, timeTaken: "1h 18m", avatarFallback: "TM", trend: "up"   },
  { rank: 6,  name: "Dante Ramos",        score: "90.1%", scoreNum: 90.1, timeTaken: "1h 28m", avatarFallback: "DR", trend: "down" },
  { rank: 7,  name: "Shirley Domingo",    score: "89.5%", scoreNum: 89.5, timeTaken: "1h 33m", avatarFallback: "SD", trend: "same" },
  { rank: 8,  name: "Leo Soriano",        score: "88.0%", scoreNum: 88.0, timeTaken: "1h 20m", avatarFallback: "LS", trend: "up"   },
  { rank: 9,  name: "Iris Dela Rosa",     score: "87.3%", scoreNum: 87.3, timeTaken: "1h 40m", avatarFallback: "IR", trend: "down" },
  { rank: 10, name: "Freddie Ocampo",     score: "86.6%", scoreNum: 86.6, timeTaken: "1h 38m", avatarFallback: "FO", trend: "same" },
  { rank: 29, name: "Alex Macaraeg",      score: "81.1%", scoreNum: 81.1, timeTaken: "1h 42m", avatarFallback: "AM", trend: "up", isCurrentUser: true },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const rankMeta: Record<number, { icon: React.ReactNode; ringClass: string; avatarClass: string; badgeClass: string }> = {
  1: {
    icon: <Trophy className="h-4 w-4 text-amber-400" />,
    ringClass: "ring-2 ring-amber-400/60",
    avatarClass: "bg-amber-500/20 text-amber-300",
    badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  2: {
    icon: <Medal className="h-4 w-4 text-zinc-300" />,
    ringClass: "ring-2 ring-zinc-400/60",
    avatarClass: "bg-zinc-500/20 text-zinc-300",
    badgeClass: "border-zinc-400/40 bg-zinc-500/10 text-zinc-300",
  },
  3: {
    icon: <Medal className="h-4 w-4 text-amber-700" />,
    ringClass: "ring-2 ring-amber-700/60",
    avatarClass: "bg-amber-800/20 text-amber-600",
    badgeClass: "border-amber-700/40 bg-amber-800/10 text-amber-600",
  },
};

function TrendIcon({ trend }: { trend: ExamineeEntry["trend"] }) {
  if (trend === "up")   return <ChevronUp   className="h-3.5 w-3.5 text-emerald-400" />;
  if (trend === "down") return <ChevronDown className="h-3.5 w-3.5 text-rose-400"    />;
  return <Minus className="h-3.5 w-3.5 text-zinc-500" />;
}

// ─── Podium Cards (Ranks 1-3) ──────────────────────────────────────────────────

function PodiumCard({ entry }: { entry: ExamineeEntry }) {
  const meta = rankMeta[entry.rank];
  const heightClass = entry.rank === 1 ? "pt-0" : entry.rank === 2 ? "pt-4" : "pt-8";

  return (
    <div className={cn("flex flex-col items-center gap-3", heightClass)}>
      {/* Rank icon badge */}
      <div className="relative">
        <Avatar className={cn("h-16 w-16 text-base font-semibold", meta.ringClass, meta.avatarClass)}>
          <AvatarFallback className={meta.avatarClass}>{entry.avatarFallback}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700">
          {meta.icon}
        </span>
      </div>

      {/* Name + score */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-semibold text-zinc-100 leading-tight max-w-[100px] truncate">{entry.name}</p>
        <Badge variant="outline" className={cn("text-xs font-mono px-2 py-0.5", meta.badgeClass)}>
          {entry.score}
        </Badge>
        <span className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
          <Clock className="h-3 w-3" />{entry.timeTaken}
        </span>
      </div>

      {/* Podium base */}
      <div
        className={cn(
          "w-24 rounded-t-md flex items-center justify-center text-xs font-bold font-mono tracking-widest",
          entry.rank === 1 && "h-16 bg-amber-500/20 text-amber-400 border border-amber-500/30",
          entry.rank === 2 && "h-12 bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
          entry.rank === 3 && "h-8  bg-amber-800/20 text-amber-700 border border-amber-700/30",
        )}
      >
        #{entry.rank}
      </div>
    </div>
  );
}

// ─── List Row (Ranks 4-10) ────────────────────────────────────────────────────

function LeaderboardRow({ entry, index }: { entry: ExamineeEntry; index: number }) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl transition-colors duration-150",
        entry.isCurrentUser
          ? "bg-blue-500/10 border border-blue-500/30"
          : "hover:bg-zinc-800/50 border border-transparent",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Rank */}
      <span className="w-7 shrink-0 text-center font-mono text-sm font-semibold text-zinc-500">
        {entry.rank}
      </span>

      {/* Avatar */}
      <Avatar className="h-9 w-9 shrink-0 text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
        <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">{entry.avatarFallback}</AvatarFallback>
      </Avatar>

      {/* Name + badge */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-zinc-200">{entry.name}</span>
        {entry.isCurrentUser && (
          <Badge variant="outline" className="shrink-0 border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0">
            You
          </Badge>
        )}
      </div>

      {/* Time */}
      <span className="hidden sm:flex items-center gap-1 shrink-0 font-mono text-xs text-zinc-500">
        <Clock className="h-3 w-3" />{entry.timeTaken}
      </span>

      {/* Trend */}
      <span className="shrink-0">
        <TrendIcon trend={entry.trend} />
      </span>

      {/* Score */}
      <span className="shrink-0 font-mono text-sm font-bold text-zinc-100 tabular-nums w-14 text-right">
        {entry.score}
      </span>
    </div>
  );
}

// ─── Current User Row (sticky bottom) ────────────────────────────────────────

function CurrentUserRow({ entry }: { entry: ExamineeEntry }) {
  return (
    <div className="mt-4 rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-3.5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-400">
        <Star className="h-3 w-3" /> Your Standing
      </p>
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="w-7 shrink-0 text-center font-mono text-sm font-bold text-blue-400">
          {entry.rank}
        </span>
        <Avatar className="h-9 w-9 shrink-0 border border-blue-500/40 bg-blue-500/10 text-blue-300 text-xs font-semibold">
          <AvatarFallback className="bg-blue-500/10 text-blue-300 text-xs">{entry.avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-100">{entry.name}</span>
          <Badge variant="outline" className="shrink-0 border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0">
            You
          </Badge>
        </div>
        <span className="hidden sm:flex items-center gap-1 shrink-0 font-mono text-xs text-zinc-500">
          <Clock className="h-3 w-3" />{entry.timeTaken}
        </span>
        <TrendIcon trend={entry.trend} />
        <span className="shrink-0 font-mono text-sm font-bold text-blue-300 tabular-nums w-14 text-right">
          {entry.score}
        </span>
      </div>
    </div>
  );
}

// ─── Leaderboard Panel ─────────────────────────────────────────────────────────

function LeaderboardPanel({ data }: { data: ExamineeEntry[] }) {
  const top3       = data.filter((e) => e.rank <= 3 && !e.isCurrentUser);
  const rest       = data.filter((e) => e.rank > 3  && !e.isCurrentUser);
  const currentUser = data.find((e) => e.isCurrentUser);

  return (
    <div className="space-y-6">
      {/* ── Podium ── */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-none">
        <CardContent className="px-4 pb-0 pt-6">
          <div className="flex items-end justify-center gap-4 sm:gap-8">
            {/* Order: 2nd | 1st | 3rd */}
            {[top3[1], top3[0], top3[2]].map((entry) =>
              entry ? <PodiumCard key={entry.rank} entry={entry} /> : null
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Ranks 4-10 ── */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-none">
        <CardContent className="p-3 sm:p-4 space-y-1">
          {/* Column header */}
          <div className="flex items-center gap-3 sm:gap-4 px-4 pb-2">
            <span className="w-7 shrink-0 text-center text-[10px] uppercase tracking-widest text-zinc-600">#</span>
            <span className="flex-1 text-[10px] uppercase tracking-widest text-zinc-600">Examinee</span>
            <span className="hidden sm:block shrink-0 w-16 text-[10px] uppercase tracking-widest text-zinc-600">Time</span>
            <span className="w-4 shrink-0" />
            <span className="w-14 text-right text-[10px] uppercase tracking-widest text-zinc-600">Score</span>
          </div>

          {rest.map((entry, i) => (
            <LeaderboardRow key={entry.rank} entry={entry} index={i} />
          ))}
        </CardContent>
      </Card>

      {/* ── Current user callout ── */}
      {currentUser && <CurrentUserRow entry={currentUser} />}
    </div>
  );
}

// ─── Skeleton Loading ──────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded bg-zinc-800" />
          <div className="h-8 w-48 rounded bg-zinc-800" />
        </div>
        <div className="h-4 w-72 rounded bg-zinc-800" />
      </div>

      <div className="border border-zinc-800 rounded-lg bg-zinc-900/60 p-6 mb-6">
        <div className="flex items-end justify-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center gap-3 pt-4">
            <div className="h-16 w-16 rounded-full bg-zinc-800" />
            <div className="h-16 w-24 rounded-t-md bg-zinc-800" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-zinc-800" />
            <div className="h-12 w-24 rounded-t-md bg-zinc-800" />
          </div>
          <div className="flex flex-col items-center gap-3 pt-8">
            <div className="h-16 w-16 rounded-full bg-zinc-800" />
            <div className="h-8 w-24 rounded-t-md bg-zinc-800" />
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-lg bg-zinc-900/60 p-3 sm:p-4 space-y-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl">
            <div className="w-7 h-5 rounded bg-zinc-800" />
            <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1 h-5 rounded bg-zinc-800" />
            <div className="hidden sm:block w-16 h-5 rounded bg-zinc-800" />
            <div className="w-4 h-4 rounded bg-zinc-800" />
            <div className="w-14 h-5 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [examCategory, setExamCategory] = useState<string>("Professional");

  useEffect(() => {
    async function load() {
      const res = await getProfile();
      if (res?.profile?.exam_category) {
        setExamCategory(res.profile.exam_category);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden">
        <Sidebar className="hidden md:flex" />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="px-4 md:px-5 h-[52px] min-h-[52px] border-b border-zinc-800 flex items-center gap-3 bg-zinc-950">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-zinc-400 shrink-0">
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
              Leaderboard
            </div>

            <div className="ml-auto flex items-center gap-2 md:gap-4 text-[11px] text-zinc-400 shrink-0">
              <span className="hidden lg:inline">Saturday, Apr 18 · Ranked top 5%</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl">
                <LeaderboardSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isSubProf = examCategory === "Subprofessional";
  const targetData = isSubProf ? subprofessionalData : professionalData;
  const levelText = isSubProf ? "Subprofessional Level" : "Professional Level";

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-4 md:px-5 h-[52px] min-h-[52px] border-b border-zinc-800 flex items-center gap-3 bg-zinc-950 transition-colors duration-200">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-zinc-400 shrink-0">
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
            Leaderboard
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-4 text-[11px] text-zinc-400 shrink-0">
            <span className="hidden lg:inline">Saturday, Apr 18 · Ranked top 5%</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">

              {/* ── Header ── */}
              <div className="mb-8 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-6 w-6 text-amber-400" />
                  <h1 className="font-['geist-sans'] text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
                    Global Leaderboard
                  </h1>
                </div>
                <p className="font-['geist-sans'] text-sm text-zinc-400 leading-relaxed">
                  See how you rank among the country's top <span className="text-zinc-200 font-semibold">{levelText}</span> reviewees.{" "}
                  <span className="text-zinc-300 font-medium">Keep pushing — every point counts.</span>
                </p>
              </div>

              {/* ── Leaderboard Data ── */}
              <LeaderboardPanel data={targetData} />

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}