"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Star, Menu, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeaderboardData } from "./actions";
import type { LeaderboardData, LeaderboardEntry } from "@/lib/analytics/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "??";
}

// ─── Rank visual metadata (podium positions 1-3) ──────────────────────────────

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

// ─── Podium Cards (Ranks 1-3) ──────────────────────────────────────────────────

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const meta = rankMeta[entry.position] ?? rankMeta[3];
  const heightClass = entry.position === 1 ? "pt-0" : entry.position === 2 ? "pt-4" : "pt-8";

  return (
    <div className={cn("flex flex-col items-center gap-3", heightClass)}>
      <div className="relative">
        <Avatar className={cn("h-16 w-16 text-base font-semibold", meta.ringClass, meta.avatarClass)}>
          <AvatarFallback className={meta.avatarClass}>{initialsOf(entry.username)}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700">
          {meta.icon}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-semibold text-zinc-100 leading-tight max-w-[100px] truncate">
          {entry.username}{entry.isCurrentUser ? " (you)" : ""}
        </p>
        <Badge variant="outline" className={cn("text-xs font-mono px-2 py-0.5", meta.badgeClass)}>
          {entry.xp.toLocaleString()} XP
        </Badge>
        <span className="text-[11px] text-zinc-500">{entry.rankName}</span>
      </div>

      <div
        className={cn(
          "w-24 rounded-t-md flex items-center justify-center text-xs font-bold font-mono tracking-widest",
          entry.position === 1 && "h-16 bg-amber-500/20 text-amber-400 border border-amber-500/30",
          entry.position === 2 && "h-12 bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
          entry.position === 3 && "h-8  bg-amber-800/20 text-amber-700 border border-amber-700/30",
        )}
      >
        #{entry.position}
      </div>
    </div>
  );
}

// ─── List Row (Ranks 4+) ──────────────────────────────────────────────────────

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
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
      <span className="w-7 shrink-0 text-center font-mono text-sm font-semibold text-zinc-500">
        {entry.position}
      </span>

      <Avatar className="h-9 w-9 shrink-0 text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
        <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">{initialsOf(entry.username)}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-zinc-200">{entry.username}</span>
        {entry.isCurrentUser && (
          <Badge variant="outline" className="shrink-0 border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0">
            You
          </Badge>
        )}
      </div>

      <span className="hidden sm:block shrink-0 text-xs text-zinc-500 truncate max-w-[110px]">
        {entry.rankName}
      </span>

      <span className="shrink-0 font-mono text-sm font-bold text-zinc-100 tabular-nums w-20 text-right">
        {entry.xp.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Current User Row (sticky callout) ────────────────────────────────────────

function CurrentUserRow({ entry, totalUsers }: { entry: LeaderboardEntry; totalUsers: number }) {
  return (
    <div className="mt-4 rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-3.5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-400">
        <Star className="h-3 w-3" /> Your Standing
      </p>
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="w-7 shrink-0 text-center font-mono text-sm font-bold text-blue-400">
          {entry.position}
        </span>
        <Avatar className="h-9 w-9 shrink-0 border border-blue-500/40 bg-blue-500/10 text-blue-300 text-xs font-semibold">
          <AvatarFallback className="bg-blue-500/10 text-blue-300 text-xs">{initialsOf(entry.username)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-zinc-100">{entry.username}</span>
            <Badge variant="outline" className="shrink-0 border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0">
              You
            </Badge>
          </div>
          <span className="text-[11px] text-zinc-500">
            {entry.rankName} · rank {entry.position} of {totalUsers}
          </span>
        </div>
        <span className="shrink-0 font-mono text-sm font-bold text-blue-300 tabular-nums w-20 text-right">
          {entry.xp.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Leaderboard Panel ─────────────────────────────────────────────────────────

function LeaderboardPanel({ data }: { data: LeaderboardData }) {
  const top3 = data.entries.filter((e) => e.position <= 3);
  const rest = data.entries.filter((e) => e.position > 3);
  const userInList = data.entries.some((e) => e.isCurrentUser);

  if (data.entries.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-none">
        <CardContent className="p-10 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
          <p className="font-semibold text-zinc-300">No ranked reviewees yet</p>
          <p className="text-sm text-zinc-500 mt-1">
            Complete practice sessions to earn XP and claim a spot on the board.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Podium — order 2nd | 1st | 3rd */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-none">
        <CardContent className="px-4 pb-0 pt-6">
          <div className="flex items-end justify-center gap-4 sm:gap-8">
            {[top3[1], top3[0], top3[2]].map((entry) =>
              entry ? <PodiumCard key={entry.userId} entry={entry} /> : null
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ranks 4+ */}
      {rest.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-none">
          <CardContent className="p-3 sm:p-4 space-y-1">
            <div className="flex items-center gap-3 sm:gap-4 px-4 pb-2">
              <span className="w-7 shrink-0 text-center text-[10px] uppercase tracking-widest text-zinc-600">#</span>
              <span className="flex-1 text-[10px] uppercase tracking-widest text-zinc-600">Reviewee</span>
              <span className="hidden sm:block shrink-0 max-w-[110px] text-[10px] uppercase tracking-widest text-zinc-600">Rank</span>
              <span className="w-20 text-right text-[10px] uppercase tracking-widest text-zinc-600">XP</span>
            </div>
            {rest.map((entry, i) => (
              <LeaderboardRow key={entry.userId} entry={entry} index={i} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Caller's standing — only when they're outside the visible board */}
      {data.currentUser && !userInList && (
        <CurrentUserRow entry={data.currentUser} totalUsers={data.totalUsers} />
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="border border-zinc-800 rounded-lg bg-zinc-900/60 p-6">
        <div className="flex items-end justify-center gap-4 sm:gap-8">
          {[4, 16, 8].map((pt, i) => (
            <div key={i} className="flex flex-col items-center gap-3" style={{ paddingTop: pt }}>
              <div className="h-16 w-16 rounded-full bg-zinc-800" />
              <div className="h-12 w-24 rounded-t-md bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
      <div className="border border-zinc-800 rounded-lg bg-zinc-900/60 p-3 sm:p-4 space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl">
            <div className="w-7 h-5 rounded bg-zinc-800" />
            <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1 h-5 rounded bg-zinc-800" />
            <div className="w-20 h-5 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Topbar (shared between loading + loaded states) ──────────────────────────

function Topbar() {
  return (
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
        <ThemeToggle />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboardData(25).then(({ data, error }) => {
      if (error) setError(error);
      else setData(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">

              {/* Header */}
              <div className="mb-8 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-6 w-6 text-amber-400" />
                  <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
                    Global Leaderboard
                  </h1>
                </div>
                <p className="font-sans text-sm text-zinc-400 leading-relaxed flex items-center gap-1.5 flex-wrap">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  Ranked by XP — earned from correct answers and completed sessions.
                  <span className="text-zinc-300 font-medium">Keep pushing, every point counts.</span>
                </p>
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                  Could not load the leaderboard. Please refresh the page.
                </div>
              ) : loading || !data ? (
                <LeaderboardSkeleton />
              ) : (
                <LeaderboardPanel data={data} />
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
