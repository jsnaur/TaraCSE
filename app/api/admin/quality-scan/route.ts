import { NextRequest, NextResponse } from "next/server";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewQuestionBatch, QuestionForReview } from "@/services/ai/quality";

// Batched AI quality audit. Reviews `unreviewed` questions one batch per call,
// mirroring the embedding panel: the client calls repeatedly until remaining=0.
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const batchSize = Math.min(
    typeof body.batchSize === "number" ? body.batchSize : 25,
    40
  );

  const supabase = createAdminClient();

  const { data: questions, error: fetchError } = await supabase
    .from("questions")
    .select("id, level, category, difficulty, question_text, options, explanation")
    .eq("quality_status", "unreviewed")
    .limit(batchSize);

  if (fetchError) {
    return NextResponse.json(
      { status: "error", reviewed: 0, flagged: 0, remaining: 0, firstError: `DB fetch error: ${fetchError.message}` },
      { status: 200 }
    );
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json({
      status: "success",
      reviewed: 0,
      flagged: 0,
      remaining: 0,
      firstError: null,
      message: "No unreviewed questions remaining.",
    });
  }

  let reviewed = 0;
  let flagged = 0;
  let firstError: string | null = null;

  try {
    const verdicts = await reviewQuestionBatch(questions as QuestionForReview[]);
    const reviewedAt = new Date().toISOString();

    for (const v of verdicts) {
      const { error: updateError } = await supabase
        .from("questions")
        .update({
          quality_status: v.verdict === "flag" ? "flagged" : "approved",
          quality_score: v.score,
          quality_flags: { codes: v.flags, reason: v.reason },
          quality_reviewed_at: reviewedAt,
        })
        .eq("id", v.id);

      if (updateError) {
        if (!firstError) firstError = `Supabase update failed: ${updateError.message}`;
        continue;
      }
      reviewed++;
      if (v.verdict === "flag") flagged++;
    }
  } catch (err: unknown) {
    firstError = err instanceof Error ? err.message : String(err);
    console.error("[Quality Scan] Batch review failed:", firstError);
  }

  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("quality_status", "unreviewed");

  return NextResponse.json({
    status: reviewed === 0 && firstError ? "error" : "success",
    reviewed,
    flagged,
    remaining: count ?? 0,
    firstError,
    message: `Reviewed ${reviewed} questions. Flagged ${flagged}. Pending: ${count ?? 0}.`,
  });
}
