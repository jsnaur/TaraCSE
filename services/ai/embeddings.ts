import { createAdminClient } from "@/lib/supabase/admin";

export function buildEmbeddableText(question: {
  question_text: string;
  explanation: string;
  category: string;
}): string {
  return `Category: ${question.category}\nQuestion: ${question.question_text}\nExplanation: ${question.explanation}`;
}

// Direct REST call — bypasses the @google/generative-ai SDK entirely.
// Uses gemini-embedding-001 on v1beta (confirmed available by ListModels).
// outputDimensionality: 768 matches our vector(768) Supabase schema exactly.
const EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

/**
 * Parse GEMINI_API_KEY into a key pool.
 *
 * The Gemini free tier caps embedding at 1000 requests/day *per project*
 * (quota id: EmbedContentRequestsPerDayPerProjectPerModel-FreeTier). To embed
 * a backlog larger than 1000, set GEMINI_API_KEY to a comma-separated list of
 * keys from different projects — the batch job rotates through them and only
 * gives up once every key has hit its daily quota.
 *
 *   GEMINI_API_KEY=keyFromProjectA,keyFromProjectB,keyFromProjectC
 *
 * A single key (no commas) works exactly as before.
 */
export function getGeminiApiKeys(): string[] {
  const raw = process.env.GEMINI_API_KEY;
  if (!raw) throw new Error("GEMINI_API_KEY is not set in environment variables");
  const keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (keys.length === 0) throw new Error("GEMINI_API_KEY is empty");
  return keys;
}

type EmbedCall =
  | { ok: true; embedding: number[] }
  | {
      ok: false;
      status: number;
      /** 429 naming the per-day metric — this key is spent until quota reset. */
      dailyQuota: boolean;
      /** Suggested retry delay in ms (from the API's RetryInfo), 0 if absent. */
      retryMs: number;
      message: string;
    };

/** One raw embedding request against a single key. Never throws on HTTP errors. */
async function callGeminiEmbed(text: string, apiKey: string): Promise<EmbedCall> {
  const res = await fetch(`${EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return { ok: true, embedding: data.embedding.values as number[] };
  }

  const body = await res.text();
  // A 429 mentioning the per-day metric means the key's daily quota is gone
  // until midnight Pacific. A 429 without it is the per-minute rate limit,
  // which clears after a short wait.
  const dailyQuota =
    res.status === 429 && /per[\s_]?day|free_tier_requests/i.test(body);
  const retryMatch = body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  const retryMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) : 0;
  return {
    ok: false,
    status: res.status,
    dailyQuota,
    retryMs,
    message: `Gemini API ${res.status}: ${body}`,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Single-shot embed. Tries each key in the pool in order until one succeeds,
 * so a key that has hit its daily quota transparently falls back to the next.
 *
 * Signature is preserved (text -> number[], throws on failure) for the
 * kot-ai / generate / embedAndStoreQuestion callers.
 */
export async function embedText(text: string): Promise<number[]> {
  const keys = getGeminiApiKeys();
  let lastError = "Embedding failed: no keys available";

  for (const key of keys) {
    const outcome = await callGeminiEmbed(text, key);
    if (outcome.ok) return outcome.embedding;

    lastError = outcome.message;
    // Quota / rate-limit on this key -> try the next one. Any other error
    // (bad request, 5xx, network) won't be fixed by another key, so stop.
    if (outcome.status !== 429) break;
  }

  throw new Error(lastError);
}

export async function embedAndStoreQuestion(questionId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: question, error } = await supabase
    .from("questions")
    .select("id, question_text, explanation, category")
    .eq("id", questionId)
    .single();

  if (error || !question) throw new Error(`Question ${questionId} not found`);

  const embedding = await embedText(buildEmbeddableText(question));

  // Pass as a plain JS array — PostgREST serialises this correctly for vector columns
  const { error: updateError } = await supabase
    .from("questions")
    .update({
      embedding,
      is_embedded: true,
      embedded_at: new Date().toISOString(),
    })
    .eq("id", questionId);

  if (updateError) throw new Error(`Failed to store embedding: ${updateError.message}`);
}

// Longest we will pause for a per-minute rate-limit retry before giving up.
const MAX_RETRY_WAIT_MS = 65_000;

export async function batchEmbedQuestions(
  batchSize = 50
): Promise<{ embedded: number; failed: number; remaining: number; firstError: string | null }> {
  const supabase = createAdminClient();

  let keys: string[];
  try {
    keys = getGeminiApiKeys();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { embedded: 0, failed: 0, remaining: 0, firstError: message };
  }

  // Spread requests so no single key exceeds the free tier's ~100/min ceiling.
  // With N keys round-robin, each key is hit once every N requests, so the
  // per-key gap is perCallDelayMs * N.
  const perCallDelayMs = Math.max(200, Math.ceil(800 / keys.length));

  // Query by embedding IS NULL — avoids boolean serialisation issues with .eq("is_embedded", false)
  const { data: questions, error: fetchError } = await supabase
    .from("questions")
    .select("id, question_text, explanation, category")
    .is("embedding", null)
    .eq("is_active", true)
    .limit(batchSize);

  if (fetchError) {
    return { embedded: 0, failed: 0, remaining: 0, firstError: `DB fetch error: ${fetchError.message}` };
  }

  const countRemaining = async (): Promise<number> => {
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .is("embedding", null)
      .eq("is_active", true);
    return count ?? 0;
  };

  if (!questions || questions.length === 0) {
    return { embedded: 0, failed: 0, remaining: await countRemaining(), firstError: null };
  }

  let embedded = 0;
  let failed = 0;
  let firstError: string | null = null;

  // Key-pool state: keys that hit their daily quota are retired for this run.
  const retired = new Set<number>();
  let cursor = 0;

  for (const question of questions) {
    // Every key is spent — stop early instead of burning the rest of the batch
    // on requests that are all guaranteed to 429.
    if (retired.size >= keys.length) {
      if (!firstError) {
        firstError =
          `All ${keys.length} Gemini API key(s) have hit the free-tier daily limit ` +
          `(1000 embeds/day per key). Add more keys to GEMINI_API_KEY (comma-separated) ` +
          `or retry after the quota resets at midnight Pacific time.`;
      }
      break;
    }

    const text = buildEmbeddableText(question);
    let stored = false;
    let attempts = 0;
    const maxAttempts = keys.length * 2 + 3;

    while (!stored && retired.size < keys.length && attempts < maxAttempts) {
      attempts++;

      // Advance to the next key that hasn't been retired this run.
      while (retired.has(cursor % keys.length)) cursor++;
      const keyIdx = cursor % keys.length;

      const outcome = await callGeminiEmbed(text, keys[keyIdx]);

      if (outcome.ok) {
        const { error: updateError } = await supabase
          .from("questions")
          .update({
            embedding: outcome.embedding,
            is_embedded: true,
            embedded_at: new Date().toISOString(),
          })
          .eq("id", question.id);

        if (updateError) {
          if (!firstError) firstError = `Supabase update failed: ${updateError.message}`;
          failed++;
        } else {
          embedded++;
        }
        stored = true;
        cursor++; // round-robin to the next key for the following question
        await sleep(perCallDelayMs);
      } else if (outcome.dailyQuota) {
        // This key is done for the day — retire it and retry on the next key.
        retired.add(keyIdx);
        cursor++;
      } else if (outcome.status === 429) {
        // Per-minute rate limit — pause the suggested delay, then retry.
        await sleep(Math.min(outcome.retryMs || 30_000, MAX_RETRY_WAIT_MS));
      } else {
        // Non-quota error (bad request, 5xx, network) — count it and move on.
        if (!firstError) firstError = outcome.message;
        failed++;
        stored = true;
        cursor++;
      }
    }

    // Ran out of retry attempts without storing (persistent rate-limiting).
    if (!stored && retired.size < keys.length) {
      if (!firstError) firstError = "Embedding retries exhausted (persistent rate-limiting).";
      failed++;
    }
  }

  return { embedded, failed, remaining: await countRemaining(), firstError };
}
