"use client";

import { useState } from "react";
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
  Users,
  Award,
  Shield,
  Swords,
  Sparkles,
} from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type AchievementCategory =
  | "Milestone"
  | "Mastery"
  | "Dedication"
  | "Consistency"
  | "Completion"
  | "Competition"
  | "Social";

interface Achievement {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  lore: string;
  category: AchievementCategory;
  xp: number;
  unlocked: boolean;
  unlockedDate: string | null;
  requirement: string;
  progress: number;
  total: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const USER = {
  name: "Maria Santos",
  initials: "MS",
  rank: "Civil Servant I",
  nextRank: "Civil Servant II",
  xp: 2_340,
  xpToNext: 3_000,
  level: 7,
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    icon: Swords,
    title: "First Blood",
    description: "Complete your first practice test and enter the arena.",
    lore: "Every Civil Servant begins their journey with a single step — and a single test. You've drawn first blood in the battle for excellence. The path ahead is long, but you've proven you have what it takes to begin.",
    category: "Milestone",
    xp: 50,
    unlocked: true,
    unlockedDate: "Jan 12, 2025",
    requirement: "Complete 1 practice test",
    progress: 1,
    total: 1,
  },
  {
    id: 2,
    icon: Brain,
    title: "Math Wizard",
    description: "Score 90% or higher in Numerical Reasoning.",
    lore: "Numbers bow to your will. Where others see chaos in figures and formulas, you see order and patterns. The ancient art of calculation is your weapon — and you wield it with devastating precision.",
    category: "Mastery",
    xp: 200,
    unlocked: true,
    unlockedDate: "Jan 19, 2025",
    requirement: "Score 90%+ in Numerical Reasoning",
    progress: 1,
    total: 1,
  },
  {
    id: 3,
    icon: Moon,
    title: "Night Owl",
    description: "Complete a full review session after midnight.",
    lore: "While others slept, you studied. In the quiet hours between dusk and dawn, when the world is still, you sharpened your mind against the grindstone of knowledge. Dedication is your hallmark.",
    category: "Dedication",
    xp: 75,
    unlocked: true,
    unlockedDate: "Feb 3, 2025",
    requirement: "Start a review session after 12:00 AM",
    progress: 1,
    total: 1,
  },
  {
    id: 4,
    icon: Clock,
    title: "Marathoner",
    description: "Study for 3 consecutive hours without a break.",
    lore: "The mind is a muscle, and you have pushed it past the point of comfort — past the fatigue, past the doubt — into the realm where champions are forged. Endurance is the mark of a true civil servant.",
    category: "Dedication",
    xp: 150,
    unlocked: true,
    unlockedDate: "Feb 10, 2025",
    requirement: "Study for 3+ hours in a single session",
    progress: 1,
    total: 1,
  },
  {
    id: 5,
    icon: Target,
    title: "Perfect Score",
    description: "Achieve 100% on any subject area quiz.",
    lore: "Perfection. Not a near-miss, not 99% — a flawless, unblemished score. You have demonstrated that excellence isn't just a goal; it is your standard. This badge is rarely given, and rightly earned.",
    category: "Mastery",
    xp: 500,
    unlocked: true,
    unlockedDate: "Mar 1, 2025",
    requirement: "Score 100% on any quiz",
    progress: 1,
    total: 1,
  },
  {
    id: 6,
    icon: Flame,
    title: "On Fire",
    description: "Maintain a 7-day study streak.",
    lore: "Seven days. Seven sunrises faced with resolve. Your streak burns like a signal fire — a beacon that tells the world you are not someone who gives up after a single day or a single setback.",
    category: "Consistency",
    xp: 300,
    unlocked: false,
    unlockedDate: null,
    requirement: "Study 7 days in a row",
    progress: 4,
    total: 7,
  },
  {
    id: 7,
    icon: BookOpen,
    title: "The Bibliophile",
    description: "Complete all lessons in the Verbal Reasoning module.",
    lore: "Words are the currency of civilization, and you have invested wisely. Every passage read, every synonym memorized, every idiom understood — they add up to a mastery of language that will serve you in the examination hall and beyond.",
    category: "Completion",
    xp: 250,
    unlocked: false,
    unlockedDate: null,
    requirement: "Finish all Verbal Reasoning lessons",
    progress: 8,
    total: 12,
  },
  {
    id: 8,
    icon: Calculator,
    title: "Analytical Engine",
    description: "Answer 500 Analytical Ability questions.",
    lore: "Logic is the skeleton of the mind. Five hundred questions — five hundred moments of structured, methodical thought. You have built a mind that can dissect any problem, any argument, any pattern. The examination is ready for you.",
    category: "Mastery",
    xp: 400,
    unlocked: false,
    unlockedDate: null,
    requirement: "Answer 500 Analytical Ability questions",
    progress: 312,
    total: 500,
  },
  {
    id: 9,
    icon: Trophy,
    title: "Top Gun",
    description: "Rank in the top 5% on a mock exam leaderboard.",
    lore: "Competition sharpens the blade. To sit atop the leaderboard — above the hundreds who also studied, also sacrificed, also wanted this — is to prove that your preparation was not just sufficient, but exceptional.",
    category: "Competition",
    xp: 600,
    unlocked: false,
    unlockedDate: null,
    requirement: "Top 5% on any mock exam leaderboard",
    progress: 0,
    total: 1,
  },
  {
    id: 10,
    icon: Users,
    title: "Study Buddy",
    description: "Join a group study session with 3+ other users.",
    lore: "No one rises alone. The greatest civil servants understand the power of collective knowledge — that two minds are sharper than one, and four sharper still. You have taken the first step toward a legacy built with others.",
    category: "Social",
    xp: 100,
    unlocked: false,
    unlockedDate: null,
    requirement: "Join a group study session",
    progress: 0,
    total: 1,
  },
  {
    id: 11,
    icon: Shield,
    title: "Fortress of Knowledge",
    description: "Complete 5 full mock exams.",
    lore: "A mock exam is not a simulation — it is a rehearsal for excellence. Five times you have sat down, cleared your mind, and faced the full breadth of the Civil Service Exam. Your mind is now a fortress, and knowledge its walls.",
    category: "Milestone",
    xp: 350,
    unlocked: false,
    unlockedDate: null,
    requirement: "Complete 5 mock exams",
    progress: 3,
    total: 5,
  },
  {
    id: 12,
    icon: Sparkles,
    title: "Renaissance Reviewer",
    description: "Score 80%+ across all five subject areas.",
    lore: "The true civil servant is not a specialist but a generalist — versed in numbers, words, logic, and law alike. To conquer all five pillars of the exam is to become something rare: a well-rounded, unstoppable force.",
    category: "Mastery",
    xp: 750,
    unlocked: false,
    unlockedDate: null,
    requirement: "Score 80%+ in all 5 subject areas",
    progress: 2,
    total: 5,
  },
];

const CATEGORY_COLORS: Record<
  AchievementCategory,
  { bg: string; text: string; border: string }
> = {
  Milestone: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  Mastery: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
  Dedication: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20" },
  Consistency: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  Completion: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20" },
  Competition: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
  Social: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RankHeroCard() {
  const pct = Math.round((USER.xp / USER.xpToNext) * 100);

  return (
    <Card className="rounded-2xl border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Decorative top strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-secondary" />

        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
            <Avatar className="w-20 h-20 border-2 border-primary/30 relative">
              <AvatarFallback className="bg-primary/10 text-primary font-heading text-xl font-bold">
                {USER.initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center font-heading">
              {USER.level}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-sm mb-0.5">Current Rank</p>
            <h2 className="font-heading text-2xl font-bold text-foreground leading-tight mb-1">
              {USER.rank}
            </h2>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-accent shrink-0" />
              <span className="font-heading text-sm font-bold text-accent">
                {USER.xp.toLocaleString()} XP
              </span>
              <span className="text-muted-foreground text-sm">
                · {(USER.xpToNext - USER.xp).toLocaleString()} to {USER.nextRank}
              </span>
            </div>
            <Progress value={pct} className="h-2.5 rounded-full bg-muted" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {pct}% toward next rank
            </p>
          </div>

          {/* Stats */}
          <div className="flex sm:flex-col gap-4 sm:gap-2 shrink-0">
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-foreground leading-none">
                {ACHIEVEMENTS.filter((a) => a.unlocked).length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Unlocked</p>
            </div>
            <Separator orientation="vertical" className="h-8 sm:hidden" />
            <Separator orientation="horizontal" className="hidden sm:block w-full" />
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-foreground leading-none">
                {ACHIEVEMENTS.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
};

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
  onClick: (achievement: Achievement) => void;
}

function AchievementCard({ achievement, index, onClick }: AchievementCardProps) {
  const { icon: Icon, title, description, xp, unlocked, unlockedDate, category, progress, total } = achievement;
  const cat = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Social;
  const pct = Math.round((progress / total) * 100);

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
          {/* Icon + Badge row */}
          <div className="flex items-start justify-between gap-2">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                unlocked ? "bg-primary/10" : "bg-muted/60"
              }`}
            >
              {unlocked ? (
                <Icon className="w-5 h-5 text-primary" />
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

          {/* Text */}
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

          {/* Footer */}
          <div className="pt-1">
            {unlocked ? (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {unlockedDate}
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
                    {progress}/{total}
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

interface AchievementDialogProps {
  achievement: Achievement | null;
  onClose: () => void;
}

function AchievementDialog({ achievement, onClose }: AchievementDialogProps) {
  if (!achievement) return null;
  const {
    icon: Icon,
    title,
    lore,
    xp,
    unlocked,
    unlockedDate,
    requirement,
    category,
    progress,
    total,
  } = achievement;
  const pct = Math.round((progress / total) * 100);
  const cat = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Social;

  return (
    <Dialog open={!!achievement} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border-border bg-card p-0 overflow-hidden">
        {/* Top strip */}
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
                  <Icon className="w-7 h-7 text-primary" />
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

          {/* Lore */}
          <div className="bg-muted/40 rounded-xl p-4 mb-4">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              &quot;{lore}&quot;
            </p>
          </div>

          {/* Details */}
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
                  <p className="text-xs font-semibold text-foreground mb-0.5">Unlocked</p>
                  <p className="text-xs text-primary font-medium">{unlockedDate}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-foreground">Progress</p>
                  <p className="text-xs text-muted-foreground">
                    {progress} / {total} ({pct}%)
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AchievementsDashboard() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selected, setSelected] = useState<Achievement | null>(null);

  const filtered = ACHIEVEMENTS.filter((a) => {
    if (activeTab === "unlocked") return a.unlocked;
    if (activeTab === "inprogress") return !a.unlocked && a.progress > 0;
    if (activeTab === "locked") return !a.unlocked && a.progress === 0;
    return true;
  });

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  const inProgressCount = ACHIEVEMENTS.filter((a) => !a.unlocked && a.progress > 0).length;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
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

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <RankHeroCard />
        </motion.div>

        {/* Tabs + Grid */}
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
                  {ACHIEVEMENTS.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="unlocked"
                className="rounded-lg text-sm font-semibold font-heading data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                Unlocked
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                  {unlockedCount}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="inprogress"
                className="rounded-lg text-sm font-semibold font-heading data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                In Progress
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                  {inProgressCount}
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

        {/* Footer hint */}
        <motion.p
          className="text-center text-xs text-muted-foreground/50 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Click any card to view its lore and requirements.
        </motion.p>
      </div>

      {/* Achievement Detail Dialog */}
      <AchievementDialog achievement={selected} onClose={() => setSelected(null)} />
    </div>
  );
}