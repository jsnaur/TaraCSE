import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, Crown, CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import SetupClient from "./SetupClient";

// ─── Exhausted Locked State Server Component ───────────────────────────────────

function ExhaustedLockout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "var(--background)" }}>
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.08] blur-[120px] rounded-full"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-sm w-full mx-auto px-6 flex flex-col items-center text-center gap-8">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-[2rem] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #78350F 0%, #451A03 100%)",
              boxShadow: "0 0 60px rgba(245,158,11,0.25)",
            }}
          >
            <Lock size={40} color="white" strokeWidth={1.5} />
          </div>
          <div
            className="absolute -top-2 -right-2 w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", boxShadow: "0 2px 12px rgba(245,158,11,0.4)" }}
          >
            <Crown size={18} color="white" strokeWidth={2} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className="inline-flex items-center gap-1.5 mx-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{ background: "var(--spark-correct-bg)", color: "var(--spark-correct-text)", border: "1px solid var(--spark-correct-border)" }}
          >
            <CheckCircle2 size={11} /> Free Diagnostic Completed
          </div>
          <h1 className="font-heading text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            You've Finished<br />Your Free Exam
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            You've used your one free Diagnostic Exam. To continue practicing with full-length Professional and Subprofessional mock exams, upgrade to Premium.
          </p>
        </div>

        <div
          className="w-full rounded-3xl border p-5 flex flex-col gap-3 text-left"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <p className="font-heading text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Premium includes
          </p>
          {[
            "Unlimited full-length mock exams",
            "Detailed category score breakdown",
            "AI-powered review & explanations",
            "Score trend tracking over time",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--spark-correct-bg)", border: "1px solid var(--spark-correct-border)" }}
              >
                <CheckCircle2 size={11} style={{ color: "var(--spark-correct-text)" }} />
              </div>
              <span className="text-sm" style={{ color: "var(--foreground)" }}>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col w-full gap-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-heading text-4xl font-bold" style={{ color: "var(--accent)" }}>₱99</span>
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>one-time</span>
          </div>

          <Link href="/pricing" className="w-full">
            <Button
              className="w-full rounded-2xl gap-2 font-heading font-bold text-base py-6 relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
                color: "white",
                boxShadow: "0 6px 30px rgba(245,158,11,0.4)",
              }}
            >
              <Crown size={17} />
              Upgrade to Premium
              <Sparkles size={15} />
            </Button>
          </Link>

          <Link href="/dashboard/mock" className="w-full">
            <Button
              variant="outline"
              className="w-full rounded-2xl gap-2 font-heading font-bold text-sm"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "transparent" }}
            >
              <ArrowLeft size={14} /> Back to Mock Exams
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Server Page ─────────────────────────────────────────────────────────

export default async function MockSetupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;
  if (!token) redirect("/login");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (!user || userError) redirect("/login");

  const [profileResult, sessionsResult] = await Promise.all([
    supabase.from("profiles").select("is_premium").eq("id", user.id).single(),
    supabase.from("exam_sessions").select("exam_type").eq("user_id", user.id).eq("mode", "Mock"),
  ]);

  const isPremium = profileResult.data?.is_premium || false;
  const dbPastAttempts = sessionsResult.data || [];
  
  const hasTakenDiagnostic = dbPastAttempts.some((s) => s.exam_type === "diagnostic");
  const userState = isPremium ? "premium" : (hasTakenDiagnostic ? "free_exhausted" : "free_eligible");

  // Prevent exhausted users from even loading the client setup logic
  if (userState === "free_exhausted") {
    return <ExhaustedLockout />;
  }

  return <SetupClient userState={userState} />;
}