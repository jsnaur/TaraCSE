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
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment variables");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
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

export async function batchEmbedQuestions(
  batchSize = 50
): Promise<{ embedded: number; failed: number; remaining: number; firstError: string | null }> {
  const supabase = createAdminClient();

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

  if (!questions || questions.length === 0) {
    // Nothing left to embed — count remaining to confirm
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .is("embedding", null)
      .eq("is_active", true);

    return { embedded: 0, failed: 0, remaining: count ?? 0, firstError: null };
  }

  let embedded = 0;
  let failed = 0;
  let firstError: string | null = null;

  for (const question of questions) {
    try {
      const embedding = await embedText(buildEmbeddableText(question));

      const { error: updateError } = await supabase
        .from("questions")
        .update({
          embedding,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (!firstError) firstError = message;
      failed++;
    }

    // 50ms between Gemini calls — well within free tier limits
    await new Promise((r) => setTimeout(r, 50));
  }

  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .is("embedding", null)
    .eq("is_active", true);

  return { embedded, failed, remaining: count ?? 0, firstError };
}
