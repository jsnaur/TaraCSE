import { ThemeToggle } from "../components/theme-toggle";
import { Sidebar } from "../components/sidebar";
import { getRank } from "../lib/ranks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { BookOpen, Target, Sparkles, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  // Mock User Data for visualization
  const mockUserXp = 350;
  const currentRank = getRank(mockUserXp);
  const nextRankXp = currentRank.maxXp ? currentRank.maxXp + 1 : mockUserXp;
  const progressPercentage = currentRank.maxXp 
    ? ((mockUserXp - currentRank.minXp) / (currentRank.maxXp - currentRank.minXp)) * 100 
    : 100;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-8 shrink-0">
          <h1 className="font-heading text-xl font-bold tracking-tight">Magandang araw, Reviewer!</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 px-3 py-1 text-sm font-medium">
              {mockUserXp} XP
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8 max-w-6xl w-full mx-auto">
          
          {/* Gamification Status Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-muted-foreground flex items-center gap-2">
                <Target className="w-5 h-5" />
                Current Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between mb-2">
                <h2 className="font-heading text-3xl font-bold text-primary">{currentRank.name}</h2>
                <span className="text-sm text-muted-foreground font-medium">
                  {currentRank.maxXp ? `${mockUserXp} / ${nextRankXp} XP to next rank` : 'Max Rank Reached!'}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3 bg-muted" />
            </CardContent>
          </Card>

          {/* Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Standard Primary Card */}
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Take a Mock Exam
                </CardTitle>
                <CardDescription>Practice under time pressure with full CSE coverage.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-md inline-block">
                  Subprofessional & Professional
                </div>
              </CardContent>
            </Card>

            {/* Correct/Success Themed Card */}
            <Card className="border-[var(--spark-correct-border)] bg-[var(--spark-correct-bg)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--spark-correct-text)]">
                  <CheckCircle2 className="w-5 h-5" />
                  Review Mistakes
                </CardTitle>
                <CardDescription className="text-[var(--spark-correct-text)] opacity-80">
                  You have 12 concepts to review today via Active Recall.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* AI Themed Card */}
            <Card className="border-[var(--spark-ai-border)] bg-[var(--spark-ai-bg)] hover:shadow-[0_0_15px_rgba(108,99,224,0.15)] transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--spark-ai-text)]">
                  <Sparkles className="w-5 h-5" />
                  Ask AI Tutor
                </CardTitle>
                <CardDescription className="text-[var(--spark-ai-text)] opacity-80">
                  Stuck on a tricky math or logic problem? Let AI explain it step-by-step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <Badge className="bg-[var(--spark-ai-text)] hover:bg-[var(--spark-ai-text)] text-white border-none">
                  Unlimited (Premium)
                 </Badge>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}