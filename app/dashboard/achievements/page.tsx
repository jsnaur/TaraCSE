"use client";

import { useState, useEffect, createElement } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Lock,
  Star,
  Zap,
  Moon,
  Clock,
  BookOpen,
  Target,
  Trophy,
  Flame,
  Brain,
  Calculator,
  Award,
  Shield,
  Swords,
  Sparkles,
  Crosshair,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAchievementsData } from "./actions";
import type { AchievementsData } from "./types";
import type { EvaluatedAchievement, AchievementCategory } from "@/lib/analytics/achievements";

// ─── Icon registry ────────────────────────────────────────────────────────────
// Achievement definitions store icon NAMES (plain strings, server-safe). The
// client maps them to components here. Unknown names fall back to Award.

const ICONS: Record<string, LucideIcon> = {
  Swords, Brain, Moon, Clock, Target, Flame,
  BookOpen, Calculator, Trophy, Shield, Crosshair, Sparkles,
};

/**
 * Renders the lucide icon registered under `name` (falls back to Award).
 * Uses createElement so the dynamic component is never assigned to a render-
 * scoped variable — keeping it compatible with the react-hooks lint rules.
 */
function AchievementIcon({ name, className }: { name: string; className?: string }) {
  return createElement(ICONS[name] ?? Award, { className });
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<
  AchievementCategory,
  { bg: string; text: string; border: string }
> = {
  Milestone: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  Mastery: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
  Dedication: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20" },
  Consistency: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  Competition: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
};

function categoryColor(category: AchievementCategory) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Milestone;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "??";
}

/** Renders a raw progress value according to its achievement's unit. */
function formatProgress(unit: EvaluatedAchievement["unit"], value: number): string {
  if (unit === "duration") {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
  return value.toLocaleString();
}

// ─── Rank hero card ───────────────────────────────────────────────────────────

function RankHeroCard({ data }: { data: AchievementsData }) {
  const { rank, xp } = data;

  return (
    <Card className="rounded-2xl border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-secondary" />

        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
            <Avatar className="w-20 h-20 border-2 border-primary/30 relative">
              <AvatarFallback className="bg-primary/10 text-primary font-heading text-xl font-bold">
                {initialsOf(data.username)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center font-heading">
              {rank.current.level}
            </div>
          </div>

          {/* Rank + XP progress */}
          <div className="flex-1 min-w-0 w-full">
            <p className="text-muted-foreground text-sm mb-0.5">Current Rank</p>
            <h2 className="font-heading text-2xl font-bold text-foreground leading-tight mb-1">
              {rank.current.name}
            </h2>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Zap className="w-4 h-4 text-accent shrink-0" />
              <span className="font-heading text-sm font-bold text-accent">
                {xp.toLocaleString()} XP
              </span>
              {rank.next && (
                <span className="text-muted-foreground text-sm">
                  · {rank.xpToNext.toLocaleString()} to {rank.next.name}
                </span>
              )}
            </div>
            <Progress value={rank.pct} className="h-2.5 rounded-full bg-muted" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {rank.next ? `${rank.pct}% toward next rank` : "Highest rank reached — outstanding!"}
            </p>
          </div>

          {/* Achievement tally */}
          <div className="flex sm:flex-col gap-4 sm:gap-2 shrink-0">
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-foreground leading-none">
                {data.unlockedCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Unlocked</p>
            </div>
            <Separator orientation="vertical" className="h-8 sm:hidden" />
            <Separator orientation="horizontal" className="hidden sm:block w-full" />
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-foreground leading-none">
                {data.achievements.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Achievement card ─────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
};

interface AchievementCardProps {
  achievement: EvaluatedAchievement;
  index: number;
  onClick: (achievement: EvaluatedAchievement) => void;
}

function AchievementCard({ achievement, index, onClick }: AchievementCardProps) {
  const { iconName, title, description, xp, unlocked, category, progress, total, pct, unit } = achievement;
  const cat = categoryColor(category);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer h-full"
      onClick={() => onClick(achievement)}
    >
      <Card
        className={`h-full rounded-xl border transition-colors duration-200 ${
          unlocked
            ? "border-border hover:border-primary/40 bg-card"
            : "border-border/40 bg-card/60 hover:border-border"
        }`}
      >
        <CardContent className="p-4 flex flex-col gap-3 h-full">
          <div className="flex items-start justify-between gap-2">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                unlocked ? "bg-primary/10" : "bg-muted/60"
              }`}
            >
              {unlocked ? (
                <AchievementIcon name={iconName} className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground/50" />
              )}
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${cat.bg} ${cat.text} ${cat.border}`}
            >
              {category}
            </Badge>
          </div>

          <div className="flex-1">
            <h3
              className={`font-heading font-bold text-sm leading-snug mb-1 ${
                unlocked ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {title}
            </h3>
            <p
              className={`text-xs leading-relaxed ${
                unlocked ? "text-muted-foreground" : "text-muted-foreground/60"
              }`}
            >
              {description}
            </p>
          </div>

          <div className="pt-1">
            {unlocked ? (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                  <Award className="w-3 h-3" /> Unlocked
                </span>
                <span className="flex items-center gap-1 text-accent text-xs font-bold font-heading">
                  <Zap className="w-3 h-3" />
                  +{xp} XP
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatProgress(unit, progress)} / {formatProgress(unit, total)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 font-semibold">
                    {pct}%
                  </span>
                </div>
                <Progress value={pct} className="h-1.5 rounded-full bg-muted/60" />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Achievement detail dialog ────────────────────────────────────────────────

function AchievementDialog({
  achievement,
  onClose,
}: {
  achievement: EvaluatedAchievement | null;
  onClose: () => void;
}) {
  if (!achievement) return null;
  const { iconName, title, lore, xp, unlocked, requirement, category, progress, total, pct, unit } = achievement;
  const cat = categoryColor(category);

  return (
    <Dialog open={!!achievement} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border-border bg-card p-0 overflow-hidden">
        <div
          className={`h-1.5 w-full ${
            unlocked ? "bg-gradient-to-r from-primary via-accent to-secondary" : "bg-muted"
          }`}
        />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  unlocked ? "bg-primary/10" : "bg-muted/60"
                }`}
              >
                {unlocked ? (
                  <AchievementIcon name={iconName} className="w-7 h-7 text-primary" />
                ) : (
                  <Lock className="w-7 h-7 text-muted-foreground/40" />
                )}
              </div>
              <div>
                <DialogTitle className="font-heading text-lg font-bold text-foreground leading-tight">
                  {title}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border mt-1 ${cat.bg} ${cat.text} ${cat.border}`}
                >
                  {category}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-muted/40 rounded-xl p-4 mb-4">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              &quot;{lore}&quot;
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">Requirement</p>
                <p className="text-xs text-muted-foreground">{requirement}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">XP Reward</p>
                <p className="text-xs text-accent font-bold font-heading">+{xp} XP</p>
              </div>
            </div>

            {unlocked ? (
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">Status</p>
                  <p className="text-xs text-primary font-medium">Unlocked</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-foreground">Progress</p>
                  <p className="text-xs text-muted-foreground">
                    {formatProgress(unit, progress)} / {formatProgress(unit, total)} ({pct}%)
                  </p>
                </div>
                <Progress value={pct} className="h-2 rounded-full bg-muted" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <Card className="rounded-2xl border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="h-1.5 w-full bg-muted" />
        <div className="p-6 flex items-center gap-6 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-6 w-40 rounded bg-muted" />
            <div className="h-2.5 w-full rounded bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="h-full rounded-xl border-border/40 bg-card/60">
          <CardContent className="p-4 space-y-3 animate-pulse">
            <div className="flex justify-between">
              <div className="w-11 h-11 rounded-xl bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-1.5 w-full rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AchievementsDashboard() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selected, setSelected] = useState<EvaluatedAchievement | null>(null);
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAchievementsData().then(({ data, error }) => {
      if (error) setError(error);
      else setData(data);
      setLoading(false);
    });
  }, []);

  const achievements = data?.achievements ?? [];
  const filtered = achievements.filter((a) => {
    if (activeTab === "unlocked") return a.unlocked;
    if (activeTab === "inprogress") return !a.unlocked && a.progress > 0;
    if (activeTab === "locked") return !a.unlocked && a.progress === 0;
    return true;
  });

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
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
          <div className="font-heading text-[15px] font-bold tracking-tight truncate">
            Achievements
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-accent" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  TaraCSE
                </span>
              </div>
              <h1 className="font-heading text-4xl font-bold text-foreground tracking-tight">
                Achievements
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your progress and earn rewards on your path to success.
              </p>
            </motion.div>

            {error ? (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-500">
                Could not load achievements. Please refresh the page.
              </div>
            ) : loading || !data ? (
              <>
                <HeroSkeleton />
                <GridSkeleton />
              </>
            ) : (
              <>
                {/* Hero */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                >
                  <RankHeroCard data={data} />
                </motion.div>

                {/* Tabs + grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-muted/50 rounded-xl mb-6 h-10 p-1">
                      <TabsTrigger
                        value="all"
                        className="rounded-lg text-sm font-semibold font-heading data-[state=active]:bg-card data-[state=active]:text-foreground"
                      >
                        All
                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                          {achievements.length}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="unlocked"
                        className="rounded-lg text-sm font-semibold font-heading data-[state=active]:bg-card data-[state=active]:text-foreground"
                      >
                        Unlocked
                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                          {data.unlockedCount}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="inprogress"
                        className="rounded-lg text-sm font-semibold font-heading data-[state=active]:bg-card data-[state=active]:text-foreground"
                      >
                        In Progress
                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                          {data.inProgressCount}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="locked"
                        className="rounded-lg text-sm font-semibold font-heading data-[state=active]:bg-card data-[state=active]:text-foreground"
                      >
                        Locked
                      </TabsTrigger>
                    </TabsList>

                    {["all", "unlocked", "inprogress", "locked"].map((tab) => (
                      <TabsContent
                        key={tab}
                        value={tab}
                        forceMount
                        className={activeTab !== tab ? "hidden" : ""}
                      >
                        <AnimatePresence mode="wait">
                          {filtered.length === 0 ? (
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center py-16 text-muted-foreground"
                            >
                              <Lock className="w-8 h-8 mx-auto mb-3 opacity-30" />
                              <p className="font-heading font-bold text-foreground/60">
                                Nothing here yet
                              </p>
                              <p className="text-sm mt-1">
                                Keep studying to unlock achievements!
                              </p>
                            </motion.div>
                          ) : (
                            <div
                              key="grid"
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                            >
                              {filtered.map((a, i) => (
                                <AchievementCard
                                  key={a.id}
                                  achievement={a}
                                  index={i}
                                  onClick={setSelected}
                                />
                              ))}
                            </div>
                          )}
                        </AnimatePresence>
                      </TabsContent>
                    ))}
                  </Tabs>
                </motion.div>

                <motion.p
                  className="text-center text-xs text-muted-foreground/50 pb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Click any card to view its lore and requirements.
                </motion.p>
              </>
            )}
          </div>
        </div>

        <AchievementDialog achievement={selected} onClose={() => setSelected(null)} />
      </main>
    </div>
  );
}
