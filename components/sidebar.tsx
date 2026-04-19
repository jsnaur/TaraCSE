// components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  Timer,
  Layers,
  BookOpen,
  PieChart,
  Award,
  Trophy,
  Settings,
  Lock,
} from "lucide-react";

// Added className prop to allow conditional hiding/styling in the main layout
export function Sidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      iconBg: "bg-[#2A2055] text-[#A89FE8]",
    },
    {
      href: "/dashboard/practice",
      label: "Practice Mode",
      icon: BrainCircuit,
      iconBg: "bg-[#0B1D24] text-[#7DD9D8]",
    },
    {
      href: "/dashboard/mock",
      label: "Mock Exams",
      icon: Timer,
      iconBg: "bg-[#1B1125] text-[#D9B7FF]",
    },
    {
      href: "#",
      label: "Flash Cards",
      icon: Layers,
      iconBg: "bg-[var(--spark-wrong-bg)] text-[var(--spark-wrong-text)]",
    },
    {
      href: "#",
      label: "Reviewers",
      icon: BookOpen,
      iconBg: "bg-[#0A1F2E] text-[#6BA3E0]",
    },
  ];

  const getNavClasses = (active: boolean) =>
    `flex items-center gap-2.5 py-2 px-2.5 mx-2 rounded-md text-[13px] transition-colors ${
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
    }`;

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <aside className={`w-[220px] min-w-[220px] bg-sidebar border-r border-border flex flex-col h-full overflow-y-auto transition-colors duration-200 ${className}`}>
      {/* Brand */}
      <div className="pt-5 pb-4 px-4.5 border-b border-border shrink-0">
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
        {navItems.map((item) => {
          const active = item.href !== "#" && isActive(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.href} className={getNavClasses(active)}>
              <div className={`w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 ${item.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}

        {/* Progress Section */}
        <div className="pt-4 pb-1.5 px-4 text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Progress
        </div>
        
        {/* UPDATE HERE: Changed Analytics href to /dashboard/analytics */}
        <Link href="/dashboard/analytics" className={getNavClasses(isActive("/dashboard/analytics"))}>
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[#2A1F08] text-accent">
            <PieChart className="w-4 h-4" />
          </div>
          Analytics
        </Link>
        
        <Link href="#" className={getNavClasses(false)}>
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[#1D0E2E] text-[#C080E0]">
            <Award className="w-4 h-4" />
          </div>
          Achievements
        </Link>
        <Link href="/dashboard/leaderboard" className={getNavClasses(isActive("/dashboard/leaderboard"))}>
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-[#0A1F1E] text-[#60C0A8]">
            <Trophy className="w-4 h-4" />
          </div>
          Leaderboard
        </Link>

        {/* Account Section */}
        <div className="pt-4 pb-1.5 px-4 text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Account
        </div>
        <Link href="/dashboard/settings" className={getNavClasses(isActive("/dashboard/settings"))}>
          <div className="w-6.5 h-6.5 rounded flex items-center justify-center shrink-0 bg-card text-muted-foreground border border-border">
            <Settings className="w-4 h-4" />
          </div>
          Settings
        </Link>
      </nav>

      {/* Sidebar Bottom (User Info) */}
      <div className="mt-auto p-3.5 border-t border-border shrink-0 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[11px] font-bold text-primary shrink-0 font-heading">
            JR
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">Juan Reyes</div>
            <div className="text-[10px] text-muted-foreground mt-px">Mag-aaral II &middot; 620 XP</div>
          </div>
        </div>
        <Link
          href="/admin/verifications"
          className="absolute right-3 bottom-3 rounded-full p-2 opacity-80 text-muted-foreground hover:text-primary transition-colors"
          aria-label="Admin verifications dashboard"
        >
          <Lock className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
}