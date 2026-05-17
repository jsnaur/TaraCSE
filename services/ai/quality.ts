// services/ai/quality.ts
// AI quality gate — scores CSE questions against a rubric and flags vague,
// broken, or off-exam items. Used both to audit the existing bank and to
// gate AI-generated questions before they enter the review queue.
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const QUALITY_FLAG_CODES = [
  "needs_image",          // refers to a figure/diagram/graph that isn't present
  "missing_passage",      // refers to a passage/paragraph that isn't included
  "ambiguous_answer",     // no single option is clearly correct
  "multiple_correct",     // two or more options are actually correct
  "too_vague",            // not enough context/specificity to be answerable
  "weak_distractors",     // wrong options are implausible / obviously wrong
  "explanation_mismatch", // explanation doesn't support the marked answer
  "factual_error",        // the marked answer is factually wrong
  "wrong_level",          // difficulty or CSE level is mismatched
  "off_topic",            // not relevant to the Civil Service Exam
] as const;

export type QualityFlagCode = (typeof QUALITY_FLAG_CODES)[number];

export interface QuestionForReview {
  id: string;
  level: string;
  category: string;
  difficulty: string;
  question_text: string;
  options: { text: string; is_correct: boolean }[];
  explanation: string;
}

export interface QuestionVerdict {
  id: string;
  score: number; // 1 (unusable) … 5 (excellent)
  verdict: "keep" | "flag";
  flags: QualityFlagCode[];
  reason: string; // short human-readable summary
}

const FLAG_SET = new Set<string>(QUALITY_FLAG_CODES);

// Any of these alone forces a "flag" verdict regardless of score.
const BLOCKING_FLAGS = new Set<QualityFlagCode>([
  "needs_image",
  "missing_passage",
  "ambiguous_answer",
  "multiple_correct",
  "factual_error",
  "off_topic",
]);

function buildRubricPrompt(): string {
  return `You are a senior Philippine Civil Service Exam (CSE) item reviewer. You audit multiple-choice questions for a practice database and decide which ones are fit for students.

You will receive a JSON array of questions. Evaluate EACH one independently against this rubric and return one verdict per question.

FLAG CODES — apply any that are true:
- needs_image: the question cannot be answered without a figure, diagram, chart, graph, or image that is not included as text.
- missing_passage: the question refers to "the passage/paragraph/text above" (reading comprehension) but no passage is included.
- ambiguous_answer: no single option is clearly and defensibly correct.
- multiple_correct: two or more options are genuinely correct.
- too_vague: the question lacks the context or specificity needed to be answerable on its own.
- weak_distractors: the wrong options are implausible, nonsensical, or obviously wrong, making the answer trivially guessable.
- explanation_mismatch: the explanation does not justify, or contradicts, the marked correct answer.
- factual_error: the marked correct answer is factually wrong.
- wrong_level: the difficulty label or Professional/Subprofessional level is clearly mismatched to the content.
- off_topic: the content is not relevant to the Philippine CSE.

SCORING (1-5):
- 5 = excellent, exam-ready, no flags.
- 4 = good, minor wording only, no blocking flags.
- 3 = usable but weak; minor flags.
- 2 = poor; should likely be removed.
- 1 = unusable.

VERDICT:
- "flag" if score <= 3 OR any of these blocking flags apply: needs_image, missing_passage, ambiguous_answer, multiple_correct, factual_error, off_topic.
- "keep" otherwise.

The "reason" must be one short sentence in plain English explaining the verdict. Echo back the exact "id" you were given for each question. Return exactly one verdict per input question, in the same order.`;
}

const responseSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING },
      score: { type: SchemaType.INTEGER },
      verdict: { type: SchemaType.STRING, format: "enum", enum: ["keep", "flag"] },
      flags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      reason: { type: SchemaType.STRING },
    },
    required: ["id", "score", "verdict", "flags", "reason"],
  },
};

function toModelInput(q: QuestionForReview) {
  const letters = ["A", "B", "C", "D"];
  return {
    id: q.id,
    level: q.level,
    category: q.category,
    difficulty: q.difficulty,
    question: q.question_text,
    options: q.options.map((o, i) => `${letters[i] ?? i}. ${o.text}`),
    correct_answer: q.options.find((o) => o.is_correct)?.text ?? "(none marked)",
    explanation: q.explanation,
  };
}

function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, v));
}

/**
 * Reviews a batch of questions in a single Gemini call.
 * Returns one verdict per input question. If the model omits a question,
 * a conservative fallback verdict (flag, score 3) is substituted so the
 * caller can always make progress.
 */
export async function reviewQuestionBatch(
  questions: QuestionForReview[]
): Promise<QuestionVerdict[]> {
  if (questions.length === 0) return [];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildRubricPrompt(),
    generationConfig: {
      temperature: 0.1,
      // gemini-2.5-flash spends output tokens on internal "thinking" before
      // emitting JSON; this SDK can't disable it, so the cap must be high
      // enough for thinking + every verdict or the JSON truncates mid-string.
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const result = await model.generateContent(
    JSON.stringify(questions.map(toModelInput))
  );

  const finishReason = result.response.candidates?.[0]?.finishReason;

  let rawText = "";
  try {
    rawText = result.response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Quality model returned no usable text (finishReason: ${finishReason ?? "unknown"}) — ${message}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(
      finishReason === "MAX_TOKENS"
        ? "Quality model hit the output token limit before finishing — reduce the batch size."
        : `Quality model returned non-JSON output (finishReason: ${finishReason ?? "unknown"})`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Quality model did not return an array");
  }

  const byId = new Map<string, QuestionVerdict>();
  for (const raw of parsed as Record<string, unknown>[]) {
    const id = String(raw?.id ?? "");
    if (!id) continue;
    const flags = Array.isArray(raw?.flags)
      ? (raw.flags as unknown[])
          .map((f) => String(f))
          .filter((f): f is QualityFlagCode => FLAG_SET.has(f))
      : [];
    const score = clampScore(raw?.score);
    // Recompute the verdict deterministically — don't trust the model's field.
    const hasBlockingFlag = flags.some((f) => BLOCKING_FLAGS.has(f));
    const verdict: "keep" | "flag" =
      score >= 4 && !hasBlockingFlag ? "keep" : "flag";
    byId.set(id, {
      id,
      score,
      verdict,
      flags,
      reason: String(raw?.reason ?? "").slice(0, 280),
    });
  }

  // Guarantee one verdict per input, in input order.
  return questions.map(
    (q) =>
      byId.get(q.id) ?? {
        id: q.id,
        score: 3,
        verdict: "flag" as const,
        flags: [],
        reason: "Model did not return a verdict for this question.",
      }
  );
}
