import Link from "next/link";
import { 
  LayoutDashboard, Play, Layers, BookOpen, 
  PieChart, Award, Trophy, Settings, Sparkles 
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-[220px] min-w-[220px] bg-sidebar border-r border-border flex flex-col h-full overflow-y-auto transition-colors duration-200">
      {/* Brand */}
      <div className="pt-5 pb-4 px-4.5 border-b border-border">
        <div className="font-heading text-xl font-extrabold text-foreground tracking-tight leading-none">
          Tara<span className="text-primary">CSE</span>
        </div>
        <div className="text-[9px] tracking-[0.12em] text-muted-foreground mt-1 uppercase">
          Civil Service Review
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pb-4">
        {/* Study Section */}
        <div className="pt-4 pb-1.5 px-4 text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Study
        </div>
        <Link href="/" className="flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] bg-primary/10 text-primary font-semibold transition-colors">
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[#2A2055] text-[#A89FE8]">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          Dashboard
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
        </Link>
        <Link href="#" className="flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[var(--spark-correct-bg)] text-[var(--spark-correct-text)]">
            <Play className="w-4 h-4" />
          </div>
          Mock Exam
        </Link>
        <Link href="#" className="flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[var(--spark-wrong-bg)] text-[var(--spark-wrong-text)]">
            <Layers className="w-4 h-4" />
          </div>
          Flash Cards
        </Link>
        <Link href="#" className="flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[#0A1F2E] text-[#6BA3E0]">
            <BookOpen className="w-4 h-4" />
          </div>
          Reviewers
        </Link>

        {/* Progress Section */}
        <div className="pt-4 pb-1.5 px-4 text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Progress
        </div>
        <Link href="#" className="flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[#2A1F08] text-accent">
            <PieChart className="w-4 h-4" />
          </div>
          Analytics
        </Link>
        <Link href="#" className="flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[#1D0E2E] text-[#C080E0]">
            <Award className="w-4 h-4" />
          </div>
          Achievements
        </Link>
        <Link href="#" className="flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[#0A1F1E] text-[#60C0A8]">
            <Trophy className="w-4 h-4" />
          </div>
          Leaderboard
        </Link>

        {/* Account Section */}
        <div className="pt-4 pb-1.5 px-4 text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Account
        </div>
        <Link href="#" className="flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-card text-muted-foreground border border-border">
            <Settings className="w-4 h-4" />
          </div>
          Settings
        </Link>
      </nav>

      {/* Sidebar Bottom (User Info) */}
      <div className="mt-auto p-3.5 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[11px] font-bold text-primary shrink-0 font-heading">
            JR
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">Juan Reyes</div>
            <div className="text-[10px] text-muted-foreground mt-px">Mag-aaral II · 620 XP</div>
          </div>
        </div>
      </div>
    </aside>
  );
}