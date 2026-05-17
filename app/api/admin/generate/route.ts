import { NextResponse } from "next/server";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQuestions, targetBuckets, DiscoveredStyle } from "@/services/ai/generation";
import { embedText, buildEmbeddableText } from "@/services/ai/embeddings";
import { reviewQuestionBatch, QuestionForReview } from "@/services/ai/quality";

const BATCH_SIZE = 30;       // questions generated per call
const DEDUP_THRESHOLD = 0.9; // cosine similarity above which a candidate is a duplicate

// Generates one batch for the most-under-target bucket per call. The client
// calls repeatedly until remaining=0 (same pattern as the embedding panel).
export async function POST() {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // ── 1. Gap analysis: find the bucket with the largest deficit ─────────────
  const { data: rows, error: countError } = await supabase
    .from("questions")
    .select("level, category, difficulty");
  if (countError) {
    return NextResponse.json(
      { status: "error", firstError: `Count query failed: ${countError.message}` },
      { status: 200 }
    );
  }

  const counts = new Map<string, number>();
  for (const r of rows ?? []) {
    const key = `${r.level}|${r.category}|${r.difficulty}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const buckets = targetBuckets().map((b) => {
    const current = counts.get(`${b.level}|${b.category}|${b.difficulty}`) ?? 0;
    return { ...b, current, deficit: Math.max(0, b.target - current) };
  });

  const remainingTotal = buckets.reduce((sum, b) => sum + b.deficit, 0);
  const bucket = [...buckets].sort((a, b) => b.deficit - a.deficit)[0];

  if (!bucket || bucket.deficit === 0) {
    return NextResponse.json({
      status: "success",
      inserted: 0,
      duplicates: 0,
      invalid: 0,
      flagged: 0,
      remaining: 0,
      message: "All target buckets are full.",
    });
  }

  // ── 2. Load enabled styles for this section ───────────────────────────────
  const { data: styleRows, error: styleError } = await supabase
    .from("question_styles")
    .select("style_name, description")
    .eq("level", bucket.level)
    .eq("category", bucket.category)
    .eq("is_enabled", true);

  if (styleError) {
    return NextResponse.json(
      { status: "error", firstError: `Style query failed: ${styleError.message}` },
      { status: 200 }
    );
  }
  if (!styleRows || styleRows.length === 0) {
    return NextResponse.json(
      {
        status: "error",
        remaining: remainingTotal,
        firstError: `No enabled styles for ${bucket.level} · ${bucket.category}. Run Discovery first.`,
      },
      { status: 200 }
    );
  }
  const styles: DiscoveredStyle[] = styleRows.map((s) => ({
    style_name: s.style_name,
    description: s.description ?? "",
  }));

  // ── 3. Anti-duplication anchors: recent questions in this bucket ──────────
  const { data: avoidRows } = await supabase
    .from("questions")
    .select("question_text")
    .eq("level", bucket.level)
    .eq("category", bucket.category)
    .eq("difficulty", bucket.difficulty)
    .order("created_at", { ascending: false })
    .limit(25);
  const avoidQuestions = (avoidRows ?? []).map((r) => r.question_text as string);

  // ── 4. Generate ───────────────────────────────────────────────────────────
  const count = Math.min(bucket.deficit, BATCH_SIZE);
  let candidates;
  try {
    candidates = await generateQuestions({
      level: bucket.level,
      category: bucket.category,
      difficulty: bucket.difficulty,
      count,
      styles,
      avoidQuestions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "error", remaining: remainingTotal, firstError: message },
      { status: 200 }
    );
  }

  let invalid = 0;
  let duplicates = 0;
  let firstError: string | null = null;

  // ── 5. Validate + embed + de-duplicate ────────────────────────────────────
  const unique: { question: (typeof candidates)[number]["question"]; embedding: number[] }[] = [];
  const seenText = new Set<string>();

  for (const candidate of candidates) {
    if (candidate.issues.length > 0) {
      invalid++;
      continue;
    }
    const textKey = candidate.question.question_text.toLowerCase().trim();
    if (seenText.has(textKey)) {
      duplicates++;
      continue;
    }
    seenText.add(textKey);

    try {
      const embedding = await embedText(buildEmbeddableText(candidate.question));

      const { data: matches } = await supabase.rpc("match_questions_admin", {
        query_embedding: embedding,
        match_count: 1,
        match_threshold: DEDUP_THRESHOLD,
      });

      if (matches && (matches as unknown[]).length > 0) {
        duplicates++;
        continue;
      }
      unique.push({ question: candidate.question, embedding });
    } catch (err: unknown) {
      if (!firstError) firstError = err instanceof Error ? err.message : String(err);
      invalid++;
    }
    await new Promise((r) => setTimeout(r, 50)); // gentle pacing for the embed API
  }

  // ── 6. Auto quality-assurance ─────────────────────────────────────────────
  let verdicts: Awaited<ReturnType<typeof reviewQuestionBatch>> = [];
  if (unique.length > 0) {
    try {
      const forReview: QuestionForReview[] = unique.map((u, i) => ({
        id: String(i),
        ...u.question,
      }));
      verdicts = await reviewQuestionBatch(forReview);
    } catch (err: unknown) {
      if (!firstError) firstError = err instanceof Error ? err.message : String(err);
    }
  }

  // ── 7. Insert into the review queue (is_active=false) ─────────────────────
  const reviewedAt = new Date().toISOString();
  let inserted = 0;
  let flagged = 0;

  for (let i = 0; i < unique.length; i++) {
    const { question, embedding } = unique[i];
    const verdict = verdicts[i];

    const row: Record<string, unknown> = {
      level: question.level,
      category: question.category,
      difficulty: question.difficulty,
      question_text: question.question_text,
      options: question.options,
      explanation: question.explanation,
      is_active: false,
      source: "ai_generated",
      embedding,
      is_embedded: true,
      embedded_at: reviewedAt,
    };

    if (verdict) {
      row.quality_status = verdict.verdict === "flag" ? "flagged" : "approved";
      row.quality_score = verdict.score;
      row.quality_flags = { codes: verdict.flags, reason: verdict.reason };
      row.quality_reviewed_at = reviewedAt;
      if (verdict.verdict === "flag") flagged++;
    }

    const { error: insertError } = await supabase.from("questions").insert(row);
    if (insertError) {
      if (!firstError) firstError = `Insert failed: ${insertError.message}`;
      continue;
    }
    inserted++;
  }

  return NextResponse.json({
    status: inserted === 0 && firstError ? "error" : "success",
    bucket: `${bucket.level} · ${bucket.category} · ${bucket.difficulty}`,
    inserted,
    duplicates,
    invalid,
    flagged,
    remaining: Math.max(0, remainingTotal - inserted),
    firstError,
    message: `Generated for ${bucket.difficulty} ${bucket.category} (${bucket.level}): ${inserted} added, ${duplicates} duplicates, ${invalid} invalid.`,
  });
}
