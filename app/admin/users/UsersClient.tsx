"use client";

import { useState, useMemo, useEffect, ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Users,
  Crown,
  ShieldAlert,
  Bot,
  RefreshCw,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { AdminUser, togglePremiumStatus, resetAiUses } from "./actions";

const AVATAR_COLORS = [
  "bg-primary", "bg-emerald-500", "bg-secondary",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500"
];

function getAvatarData(username: string, index: number) {
  return {
    initials: (username || "U").substring(0, 2).toUpperCase(),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatCard({ label, value, icon: Icon, colorClass, delay }: { label: string; value: number; icon: ElementType; colorClass: string; delay: number; }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-heading font-black text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

export default function UsersClient({ initialUsers }: { initialUsers: AdminUser[] }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "premium" | "free" | "admin">("all");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUser;
    type: "toggle_premium" | "reset_ai";
  } | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const stats = useMemo(() => ({
    total: users.length,
    premium: users.filter((u) => u.is_premium).length,
    free: users.filter((u) => !u.is_premium && !u.is_admin).length,
    admins: users.filter((u) => u.is_admin).length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchesTab = 
        activeTab === "all" ? true :
        activeTab === "premium" ? u.is_premium :
        activeTab === "free" ? (!u.is_premium && !u.is_admin) :
        activeTab === "admin" ? u.is_admin : true;
        
      const matchesSearch = !q || (u.username && u.username.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [users, search, activeTab]);

  function triggerAction(user: AdminUser, type: "toggle_premium" | "reset_ai") {
    setPendingAction({ user, type });
    setDialogOpen(true);
  }

  async function handleConfirm() {
    if (!pendingAction) return;
    const { user, type } = pendingAction;
    
    setUsers((prev) => prev.map((u) => {
      if (u.id === user.id) {
        if (type === "toggle_premium") return { ...u, is_premium: !u.is_premium };
        if (type === "reset_ai") return { ...u, free_kot_ai_uses_remaining: 3 };
      }
      return u;
    }));
    
    setDialogOpen(false);

    try {
      if (type === "toggle_premium") {
        await togglePremiumStatus(user.id, user.is_premium);
        toast({
          title: !user.is_premium ? "✅ Premium Granted" : "⚠️ Premium Revoked",
          description: `Updated status for ${user.username}.`,
        });
      } else {
        await resetAiUses(user.id);
        toast({
          title: "🤖 AI Tokens Reset",
          description: `${user.username} now has 3 KOT AI tokens.`,
        });
      }
      setPendingAction(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Action Failed",
        description: "There was an error updating the database.",
      });
      setUsers(initialUsers); 
    }
  }

  return (
    <div className="space-y-7">
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-black text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">View and manage all registered accounts on TaraCSE.</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={stats.total} icon={Users} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50" delay={0.05} />
        <StatCard label="Premium Tier" value={stats.premium} icon={Crown} colorClass="bg-accent/10 text-accent-foreground dark:bg-accent/15" delay={0.1} />
        <StatCard label="Free Tier" value={stats.free} icon={Users} colorClass="bg-slate-100 text-slate-600 dark:bg-slate-800" delay={0.15} />
        <StatCard label="Admins" value={stats.admins} icon={ShieldAlert} colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/50" delay={0.2} />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by username..."
            className="pl-10 h-10 rounded-xl border-border bg-background text-sm"
          />
        </div>
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="h-9 rounded-xl gap-1 bg-muted/60 p-1 w-full sm:w-fit">
            <TabsTrigger value="all" className="rounded-lg px-3 sm:px-4 text-xs font-semibold data-[state=active]:bg-card flex-1 sm:flex-none">All</TabsTrigger>
            <TabsTrigger value="premium" className="rounded-lg px-3 sm:px-4 text-xs font-semibold data-[state=active]:bg-card text-accent dark:text-accent flex-1 sm:flex-none">Premium</TabsTrigger>
            <TabsTrigger value="free" className="rounded-lg px-3 sm:px-4 text-xs font-semibold data-[state=active]:bg-card flex-1 sm:flex-none">Free</TabsTrigger>
            <TabsTrigger value="admin" className="rounded-lg px-3 sm:px-4 text-xs font-semibold data-[state=active]:bg-card text-rose-600 dark:text-rose-400 flex-1 sm:flex-none">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.45 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-6 w-[250px]"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">User</span></TableHead>
                <TableHead className="w-[150px]"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</span></TableHead>
                <TableHead className="w-[120px]"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tier</span></TableHead>
                <TableHead className="w-[140px]"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">KOT AI Uses</span></TableHead>
                <TableHead className="text-right pr-6 w-[180px]"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">No users found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, i) => {
                    const avatar = getAvatarData(user.username, i);
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: (i % 10) * 0.04, duration: 0.3 }}
                        className="border-border hover:bg-muted/30 transition-colors group"
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatar.color}`}>
                              {avatar.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground font-heading truncate flex items-center gap-1">
                                {user.username}
                                {user.is_admin && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">Joined {formatDate(user.created_at)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {user.exam_category ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                              {user.exam_category === "Professional" ? "Prof" : "SubProf"}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">None</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {user.is_premium ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent-foreground text-[11px] font-bold dark:bg-accent/15 dark:text-accent">
                              <Crown className="w-3 h-3" /> Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold dark:bg-slate-800 dark:text-slate-400">
                              Free
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {!user.is_premium ? (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3].map((num) => (
                                  <div key={num} className={`w-2 h-4 rounded-sm ${num <= user.free_kot_ai_uses_remaining ? "bg-emerald-500" : "bg-muted"}`} />
                                ))}
                              </div>
                              <span className={`text-[11px] font-bold ${user.free_kot_ai_uses_remaining === 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                                {user.free_kot_ai_uses_remaining}/3
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-accent flex items-center gap-1">
                              <Bot className="w-3.5 h-3.5" /> Unlimited
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 pr-6">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Reset AI Uses"
                              onClick={() => triggerAction(user, "reset_ai")}
                              disabled={user.is_premium}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-lg ${user.is_premium ? "hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30" : "hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/15"}`}
                              title={user.is_premium ? "Revoke Premium" : "Grant Premium"}
                              onClick={() => triggerAction(user, "toggle_premium")}
                              disabled={user.is_admin} 
                            >
                              <ArrowUpDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-border max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              {pendingAction?.type === "toggle_premium" 
                ? (pendingAction.user.is_premium ? "Revoke Premium?" : "Grant Premium?") 
                : "Reset AI Tokens?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "toggle_premium" 
                ? `Are you sure you want to change the premium status for ${pendingAction.user.username}?`
                : `Are you sure you want to reset the free KOT AI tokens for ${pendingAction?.user.username} back to 3?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className={`rounded-xl ${pendingAction?.type === "toggle_premium" && pendingAction.user.is_premium ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}`}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}