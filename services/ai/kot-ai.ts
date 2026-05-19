// services/ai/kot-ai.ts
//
// Shared KOT AI explanation pipeline. Both the on-demand route
// (app/api/ai/kot-ai/route.ts) and the admin pre-warm batch
// (app/api/admin/prewarm-kot-ai/route.ts) call into here so the two paths
// can never diverge in generation quality.
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText, buildEmbeddableText } from "@/services/ai/embeddings";
import { getKotAiResponse, RetrievedContext } from "@/services/ai/gemini";

// The exact column set a question row needs to flow through the pipeline.
// Exported so the route's question fetch stays in sync with this module.
export const KOT_AI_QUESTION_COLUMNS =
  "id, question_text, explanation, category, options, embedding, kot_ai_explanation";

export type KotAiQuestionRow = {
  id: string;
  question_text: string;
  explanation: string;
  category: string;
  options: { text: string; is_correct: boolean }[];
  embedding: number[] | null;
  kot_ai_explanation: string | null;
};

/**
 * Returns the KOT AI explanation for a question.
 *
 * Cache HIT  → returns the stored explanation, no API calls.
 * Cache MISS → runs the RAG pipeline (embed → similarity → generate),
 *              persists the result, and returns it.
 *
 * A failed/empty generation is NOT persisted, so the next request retries
 * rather than serving a poisoned cache entry.
 */
export async function resolveKotAiExplanation(
  question: KotAiQuestionRow
): Promise<string> {
  if (question.kot_ai_explanation) return question.kot_ai_explanation;

  const admin = createAdminClient();

  // 1. Resolve a query embedding — reuse the stored one when present.
  const queryEmbedding: number[] =
    question.embedding ??
    (await embedText(
      buildEmbeddableText({
        question_text: question.question_text,
        explanation: question.explanation,
        category: question.category,
      })
    ));

  // 2. Similarity search for RAG context. match_questions is SECURITY DEFINER
  //    and granted to service_role (migration 0003), so the admin client may
  //    call it directly — no end-user token required.
  const { data: similar } = await admin.rpc("match_questions", {
    query_embedding: queryEmbedding,
    match_count: 4,
    match_threshold: 0.4,
  });

  const retrievedContext = ((similar as RetrievedContext[]) || [])
    .filter((s) => s.id !== question.id)
    .slice(0, 3);

  // 3. Generate.
  const correctOption = question.options?.find((o) => o.is_correct);
  const aiResponse = await getKotAiResponse({
    currentQuestion: {
      id: question.id,
      text: question.question_text,
      category: question.category,
      explanation: question.explanation,
      correctAnswerText: correctOption?.text ?? "N/A",
    },
    retrievedContext,
  });

  // 4. Persist only a non-empty result.
  if (aiResponse.trim().length > 0) {
    await admin
      .from("questions")
      .update({
        kot_ai_explanation: aiResponse,
        kot_ai_generated_at: new Date().toISOString(),
      })
      .eq("id", question.id);
  }

  return aiResponse;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Spacing between Gemini generateContent calls. The free tier caps
// gemini-2.5-flash at a low requests-per-minute rate, so calls are paced
// to stay under it. The daily quota is enforced by Gemini itself (429).
const PER_CALL_DELAY_MS = 4500;

/** A 429 / quota error means there is no point continuing this run. */
function isRateLimited(message: string): boolean {
  return /\b429\b|RESOURCE_EXHAUSTED|quota|rate limit/i.test(message);
}

export type PrewarmResult = {
  generated: number;
  failed: number;
  remaining: number;
  /** True when the run stopped early because Gemini's quota was hit. */
  quotaReached: boolean;
  firstError: string | null;
};

/**
 * Generates and caches KOT AI explanations for up to `batchSize` un-cached
 * active questions. Designed to be called repeatedly by the admin panel until
 * `remaining` reaches 0 — each call processes one small, rate-limited batch.
 */
export async function batchPrewarmKotAi(
  batchSize: number
): Promise<PrewarmResult> {
  const admin = createAdminClient();

  const countRemaining = async (): Promise<number> => {
    const { count } = await admin
      .from("questions")
      .select("id", { count: "exact", head: true })
      .is("kot_ai_explanation", null)
      .eq("is_active", true);
    return count ?? 0;
  };

  const { data: questions, error: fetchError } = await admin
    .from("questions")
    .select(KOT_AI_QUESTION_COLUMNS)
    .is("kot_ai_explanation", null)
    .eq("is_active", true)
    .limit(batchSize);

  if (fetchError) {
    return {
      generated: 0,
      failed: 0,
      remaining: 0,
      quotaReached: false,
      firstError: `DB fetch error: ${fetchError.message}`,
    };
  }

  if (!questions || questions.length === 0) {
    return {
      generated: 0,
      failed: 0,
      remaining: await countRemaining(),
      quotaReached: false,
      firstError: null,
    };
  }

  let generated = 0;
  let failed = 0;
  let quotaReached = false;
  let firstError: string | null = null;

  for (let i = 0; i < questions.length; i++) {
    try {
      const text = await resolveKotAiExplanation(
        questions[i] as KotAiQuestionRow
      );
      if (text.trim().length > 0) {
        generated++;
      } else {
        failed++;
        if (!firstError) firstError = "Gemini returned an empty response.";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (!firstError) firstError = message;

      // A quota / rate-limit error means every remaining call would also
      // fail — stop now so the admin can resume after the quota resets.
      if (isRateLimited(message)) {
        quotaReached = true;
        break;
      }
      failed++;
    }

    // Pace the next call; no need to wait after the final item.
    if (i < questions.length - 1) await sleep(PER_CALL_DELAY_MS);
  }

  return {
    generated,
    failed,
    remaining: await countRemaining(),
    quotaReached,
    firstError,
  };
}
