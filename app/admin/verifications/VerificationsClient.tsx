"use client";

import { ElementType, useState, useMemo, useEffect } from "react";
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
import { Toaster } from "@/components/ui/toaster";
import {
  Search,
  ShieldCheck,
  ShieldOff,
  Crown,
  Clock,
  UserCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { processUserAction } from "./actions";

// ─── Types ─────────────────────────────────────────────────────────────────

export type UserStatus = "free" | "pending" | "premium";
export type ActionType = "upgrade" | "revoke";
type SortField = "name" | "dateRegistered" | "status";
type SortDir = "asc" | "desc";

export interface User {
  id: string;
  name: string;
  email: string;
  gcashRef: string | null;
  verificationId: string | null;
  dateRegistered: string;
  status: UserStatus;
  avatarInitials: string;
  avatarColor: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatGCashRef(ref: string): string {
  return ref.replace(/(\d{4})(\d{4})(\d{5})/, "$1-$2-$3");
}

const STATUS_CONFIG: Record<
  UserStatus,
  { label: string; icon: ElementType; className: string }
> = {
  free: {
    label: "Free",
    icon: Users,
    className:
      "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  },
  premium: {
    label: "Premium",
    icon: Crown,
    className:
      "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UserStatus }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
  return sortDir === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 text-primary" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-primary" />
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  delay,
}: {
  label: string;
  value: number;
  icon: ElementType;
  colorClass: string;
  delay: number;
}) {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VerificationsClient({ initialUsers }: { initialUsers: User[] }) {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | UserStatus>("all");
  const [sortField, setSortField] = useState<SortField>("dateRegistered");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Sync state if server revalidates data
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // AlertDialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    userId: string;
    userName: string;
    type: ActionType;
    verificationId: string | null;
  } | null>(null);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: users.length,
      pending: users.filter((u) => u.status === "pending").length,
      premium: users.filter((u) => u.status === "premium").length,
      free: users.filter((u) => u.status === "free").length,
    }),
    [users]
  );

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = users.filter((u) => {
      const matchesTab = activeTab === "all" || u.status === activeTab;
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.gcashRef?.includes(q) ?? false);
      return matchesTab && matchesSearch;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "dateRegistered")
        cmp = new Date(a.dateRegistered).getTime() - new Date(b.dateRegistered).getTime();
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, search, activeTab, sortField, sortDir]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function triggerAction(user: User, type: ActionType) {
    setPendingAction({ userId: user.id, userName: user.name, type, verificationId: user.verificationId });
    setDialogOpen(true);
  }

  async function handleConfirm() {
    if (!pendingAction) return;
    const { userId, userName, type, verificationId } = pendingAction;

    // Optimistic UI Update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: type === "upgrade" ? "premium" : "free" }
          : u
      )
    );

    setDialogOpen(false);
    
    try {
      await processUserAction(userId, type, verificationId);
      toast({
        title: type === "upgrade" ? "✅ Account Upgraded" : "⚠️ Access Revoked",
        description: type === "upgrade" 
          ? `${userName} has been granted Premium access.` 
          : `${userName}'s Premium access has been revoked.`,
      });
      setPendingAction(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Action Failed",
        description: "There was an error updating the database.",
      });
      // Revert optimistic state on failure
      setUsers(initialUsers);
    }
  }

  async function handleCopyRef(ref: string) {
    await navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 1800);
  }

  const TAB_COUNTS: Record<string, number> = {
    all: stats.total,
    pending: stats.pending,
    premium: stats.premium,
    free: stats.free,
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Toaster />

      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto space-y-7">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  TaraCSE Admin
                </span>
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-black text-foreground">
                Payment Verifications
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review GCash submissions and manage user access levels.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.pending > 0 && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {stats.pending} pending review
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={stats.total} icon={Users} colorClass="bg-primary/10 text-primary" delay={0.05} />
            <StatCard label="Pending" value={stats.pending} icon={Clock} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400" delay={0.1} />
            <StatCard label="Premium" value={stats.premium} icon={Crown} colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400" delay={0.15} />
            <StatCard label="Free Tier" value={stats.free} icon={UserCheck} colorClass="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" delay={0.2} />
          </div>

          {/* ── Control Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="bg-card border border-border rounded-2xl p-4 space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Search by name, email, or GCash reference…"
                className="pl-10 h-10 rounded-xl border-border bg-background text-sm"
              />
            </div>

            {/* Filter Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "all" | UserStatus)}
            >
              <TabsList className="h-9 rounded-xl gap-1 bg-muted/60 p-1">
                {(["all", "pending", "premium", "free"] as const).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-lg px-3.5 text-xs font-semibold capitalize data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] font-bold data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      {TAB_COUNTS[tab]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </motion.div>

          {/* ── Table ── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {/* User — sortable */}
                    <TableHead className="pl-6 w-[220px]">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        User
                        <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="w-[160px]">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        GCash Ref
                      </span>
                    </TableHead>
                    {/* Date — sortable */}
                    <TableHead className="w-[140px] hidden sm:table-cell">
                      <button
                        onClick={() => handleSort("dateRegistered")}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Registered
                        <SortIcon field="dateRegistered" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    {/* Status — sortable */}
                    <TableHead className="w-[110px]">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Status
                        <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="text-right pr-6 w-[200px]">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Actions
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Search className="w-8 h-8 opacity-30" />
                            <p className="text-sm font-medium">No users match your search.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.045, duration: 0.3 }}
                          className="border-border hover:bg-muted/30 transition-colors group"
                        >
                          {/* User Cell */}
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${user.avatarColor}`}
                              >
                                {user.avatarInitials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground font-heading truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* GCash Ref Cell */}
                          <TableCell className="py-4">
                            {user.gcashRef ? (
                              <button
                                onClick={() => handleCopyRef(user.gcashRef!)}
                                className="group/ref flex items-center gap-1.5 hover:text-primary transition-colors"
                                title="Copy reference"
                              >
                                <code className="text-xs font-mono text-foreground/80 group-hover/ref:text-primary transition-colors">
                                  {formatGCashRef(user.gcashRef)}
                                </code>
                                {copiedRef === user.gcashRef ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Copy className="w-3 h-3 text-muted-foreground/40 group-hover/ref:text-primary shrink-0 transition-colors" />
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                — not provided
                              </span>
                            )}
                          </TableCell>

                          {/* Date Cell */}
                          <TableCell className="py-4 hidden sm:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(user.dateRegistered)}
                            </span>
                          </TableCell>

                          {/* Status Cell */}
                          <TableCell className="py-4">
                            <StatusBadge status={user.status} />
                          </TableCell>

                          {/* Actions Cell */}
                          <TableCell className="py-4 pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {user.status !== "premium" && (
                                <Button
                                  size="sm"
                                  onClick={() => triggerAction(user, "upgrade")}
                                  className="h-8 px-3 text-xs rounded-xl font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Verify & Upgrade
                                </Button>
                              )}
                              {user.status === "premium" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => triggerAction(user, "revoke")}
                                  className="h-8 px-3 text-xs rounded-xl font-semibold gap-1.5"
                                >
                                  <ShieldOff className="w-3.5 h-3.5" />
                                  Revoke
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Table footer */}
            <div className="border-t border-border px-6 py-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">{filteredUsers.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{users.length}</span> users
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── AlertDialog ── */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-border max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  pendingAction?.type === "upgrade"
                    ? "bg-emerald-100 dark:bg-emerald-900"
                    : "bg-destructive/10"
                }`}
              >
                {pendingAction?.type === "upgrade" ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-destructive-foreground" />
                )}
              </div>
              <AlertDialogTitle className="font-heading text-lg font-black">
                {pendingAction?.type === "upgrade"
                  ? "Confirm Upgrade"
                  : "Confirm Revocation"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed pl-[52px]">
              {pendingAction?.type === "upgrade" ? (
                <>
                  Are you sure you want to upgrade{" "}
                  <span className="font-semibold text-foreground">
                    {pendingAction.userName}
                  </span>{" "}
                  to <span className="font-semibold text-violet-600 dark:text-violet-400">Premium</span>? This will grant them full access to all TaraCSE review materials.
                </>
              ) : (
                <>
                  Are you sure you want to revoke{" "}
                  <span className="font-semibold text-foreground">
                    {pendingAction?.userName}
                  </span>
                  's Premium access? They will be downgraded to the Free tier immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={`rounded-xl font-semibold ${
                pendingAction?.type === "upgrade"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }`}
            >
              {pendingAction?.type === "upgrade" ? (
                <><ShieldCheck className="w-4 h-4 mr-1.5" /> Yes, Upgrade to Premium</>
              ) : (
                <><ShieldOff className="w-4 h-4 mr-1.5" /> Yes, Revoke Access</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}