import Link from "next/link";
import { LayoutDashboard, BookOpen, Sparkles, Settings, FileText } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-sidebar hidden md:flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 text-primary font-heading font-bold text-2xl tracking-tight">
          <Sparkles className="w-6 h-6 text-accent" />
          <span>TaraCSE</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Civil Service Review</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/10 text-primary font-medium transition-colors"
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link 
          href="#" 
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <FileText className="w-5 h-5 text-muted-foreground" />
          Mock Exams
        </Link>
        <Link 
          href="#" 
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <BookOpen className="w-5 h-5 text-muted-foreground" />
          Active Recall
        </Link>
        <Link 
          href="#" 
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Sparkles className="w-5 h-5 text-[var(--spark-ai-text)]" />
          AI Tutor
        </Link>
      </nav>

      <div className="p-4 border-t border-border">
        <Link 
          href="#" 
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
          Settings
        </Link>
      </div>
    </aside>
  );
}