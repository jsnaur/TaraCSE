import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, ReceiptText, FileQuestion, ScrollText, ArrowRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function AdminOverviewPage() {
  // Defense-in-depth — layout already gates this, but never trust a single check.
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) redirect("/dashboard");

  const adminDb = createAdminClient();

  // Run the metric queries in parallel — middleware + layout have already
  // authenticated the caller, so this is the hot path that should be fast.
  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: pendingVerifs },
    { count: totalQuestions },
    { data: recentAudits },
  ] = await Promise.all([
    adminDb.from("profiles").select("id", { head: true, count: "exact" }),
    adminDb.from("profiles").select("id", { head: true, count: "exact" }).eq("is_premium", true),
    adminDb.from("payment_verifications").select("id", { head: true, count: "exact" }).eq("status", "Pending"),
    adminDb.from("questions").select("id", { head: true, count: "exact" }),
    adminDb.from("audit_logs").select("id, action_type, target_resource, created_at, admin_id").order("created_at", { ascending: false }).limit(8),
  ]);

  const metrics = [
    { label: "Total Users", value: totalUsers ?? 0, icon: Users, accent: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
    { label: "Premium Users", value: premiumUsers ?? 0, icon: Crown, accent: "text-amber-600 bg-amber-100 dark:bg-amber-900/40" },
    { label: "Pending Verifications", value: pendingVerifs ?? 0, icon: ReceiptText, accent: "text-rose-600 bg-rose-100 dark:bg-rose-900/40", href: "/admin/verifications" },
    { label: "Total Questions", value: totalQuestions ?? 0, icon: FileQuestion, accent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40", href: "/admin/questions" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitor platform metrics and pending actions.</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Inner = (
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.label}</CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.accent}`}>
                  <m.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-black">{m.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
          return m.href ? (
            <Link key={m.label} href={m.href} className="block transition-transform hover:-translate-y-0.5">{Inner}</Link>
          ) : (
            <div key={m.label}>{Inner}</div>
          );
        })}
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">Recent Admin Activity</CardTitle>
          </div>
          <Link href="/admin/audit" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {!recentAudits || recentAudits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No admin actions logged yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentAudits.map((a) => (
                <li key={a.id} className="py-3 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <Badge variant="outline" className="font-mono text-[10px] mb-1">{a.action_type}</Badge>
                    <p className="text-xs text-muted-foreground truncate">{a.target_resource ?? "—"}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
