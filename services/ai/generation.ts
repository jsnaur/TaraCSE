// services/ai/generation.ts
// AI question generation — discovers the question-style taxonomy per CSE
// section, then generates original questions to fill the bank to target.
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import {
  ValidatedQuestion,
  buildOptions,
  validateQuestion,
  sanitizeHTML,
  VALID_ANSWERS,
} from "@/lib/question-validation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Target distribution (CSE-authentic weighting) ───────────────────────────
// Clerical Operations is Sub-Professional only; Analytical Ability is
// Professional only. Off-exam level×category pairs are intentionally absent.
export const CATEGORY_TARGETS: Record<string, Record<string, number>> = {
  Professional: {
    "Verbal Ability": 525,
    "Numerical Ability": 450,
    "Analytical Ability": 300,
    "General Information": 225,
  },
  Subprofessional: {
    "Verbal Ability": 525,
    "Numerical Ability": 450,
    "Clerical Operations": 300,
    "General Information": 225,
  },
};

export const DIFFICULTY_SPLIT: Record<string, number> = {
  Easy: 0.3,
  Medium: 0.45,
  Hard: 0.25,
};

export interface BucketTarget {
  level: string;
  category: string;
  difficulty: string;
  target: number;
}

/** The 24 generation buckets and their target counts. */
export function targetBuckets(): BucketTarget[] {
  const buckets: BucketTarget[] = [];
  for (const [level, categories] of Object.entries(CATEGORY_TARGETS)) {
    for (const [category, categoryTotal] of Object.entries(categories)) {
      for (const [difficulty, share] of Object.entries(DIFFICULTY_SPLIT)) {
        buckets.push({
          level,
          category,
          difficulty,
          target: Math.round(categoryTotal * share),
        });
      }
    }
  }
  return buckets;
}

// ── Step 1: Discovery ───────────────────────────────────────────────────────
export interface DiscoveredStyle {
  style_name: string;
  description: string;
}

const discoverySchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      style_name: { type: SchemaType.STRING },
      description: { type: SchemaType.STRING },
    },
    required: ["style_name", "description"],
  },
};

/**
 * Runs the Discovery prompt for one CSE section, returning the list of
 * question styles that section is built from. Image/graph-dependent styles
 * are explicitly excluded.
 */
export async function discoverStyles(
  level: string,
  category: string
): Promise<DiscoveredStyle[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: discoverySchema,
    },
  });

  const prompt = `Act as an expert Philippine Civil Service Exam (CSE) reviewer and test creator. I am building a practice database for the "${category}" category at the "${level}" level.

Break down this category: list all the common question variations, sub-topics, or specific problem styles that typically appear in this exact section of the CSE. Provide a clear 1-sentence description of what each style tests.

IMPORTANT EXCLUSIONS — do NOT list any style that:
- requires an image, graph, chart, diagram, table, or figure to be answered.
- depends on a separate reading passage that would have to be shown alongside the question.

Return 6 to 14 distinct, text-only styles.`;

  const result = await model.generateContent(prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.response.text());
  } catch {
    throw new Error("Discovery model returned non-JSON output");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Discovery model did not return an array");
  }

  const seen = new Set<string>();
  const styles: DiscoveredStyle[] = [];
  for (const raw of parsed as Record<string, unknown>[]) {
    const name = sanitizeHTML(String(raw?.style_name ?? "")).slice(0, 120);
    const description = sanitizeHTML(String(raw?.description ?? "")).slice(0, 400);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    styles.push({ style_name: name, description });
  }
  return styles;
}

// ── Step 2: Generation ──────────────────────────────────────────────────────
export interface GenerateParams {
  level: string;
  category: string;
  difficulty: string;
  count: number;
  styles: DiscoveredStyle[];
  avoidQuestions: string[]; // existing question texts to not duplicate
}

const generationSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      question_text: { type: SchemaType.STRING },
      option_a: { type: SchemaType.STRING },
      option_b: { type: SchemaType.STRING },
      option_c: { type: SchemaType.STRING },
      option_d: { type: SchemaType.STRING },
      correct_answer: { type: SchemaType.STRING, format: "enum", enum: ["A", "B", "C", "D"] },
      explanation: { type: SchemaType.STRING },
    },
    required: [
      "question_text",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct_answer",
      "explanation",
    ],
  },
};

function buildGenerationPrompt(params: GenerateParams): string {
  const styleList = params.styles
    .map((s, i) => `${i + 1}. ${s.style_name} — ${s.description}`)
    .join("\n");

  const avoidBlock =
    params.avoidQuestions.length > 0
      ? `\n\nDO NOT duplicate or lightly reword any of these existing questions:\n${params.avoidQuestions
          .map((q) => `- ${q}`)
          .join("\n")}`
      : "";

  return `Act as an original Philippine Civil Service Exam (CSE) test creator. Generate completely new, original, copyright-free practice questions.

TARGET:
- Level: "${params.level}"
- Category: "${params.category}"
- Difficulty: every question must be "${params.difficulty}" difficulty.
- Generate exactly ${params.count} questions, spread as evenly as possible across the question styles below.

QUESTION STYLES (cycle through these for variety):
${styleList}

HARD RULES:
1. Each question must be fully answerable from its own text — NEVER reference an image, graph, chart, diagram, figure, table, or a separate reading passage.
2. Exactly one of the four options is correct; the other three must be plausible but clearly wrong.
3. Math formatting (MANDATORY): output all numbers, fractions, equations, and math symbols in LaTeX. Inline math uses single dollar signs (e.g. the value of $x$). Standalone equations use double dollar signs. Use \\times for multiplication and \\div for division.
4. Use Philippine peso for any currency. Never use USD or other currencies.
5. Never use acronyms — spell every term out in full.
6. The explanation must be a concise 1-2 sentence justification of the correct answer (use LaTeX for any math).
7. Keep every question genuinely "${params.difficulty}" in difficulty — do not drift easier or harder.${avoidBlock}`;
}

export interface GeneratedCandidate {
  question: ValidatedQuestion;
  issues: string[]; // non-empty means the candidate failed validation
}

/**
 * Generates a batch of questions for one bucket. Each candidate is converted
 * to a ValidatedQuestion and checked; invalid candidates are returned with
 * their issues so the caller can decide what to do.
 */
export async function generateQuestions(
  params: GenerateParams
): Promise<GeneratedCandidate[]> {
  if (params.count <= 0) return [];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.85,
      // Must cover thinking tokens + every question's JSON. A 30-question
      // batch easily exceeds 8192 and truncates the JSON mid-array, so the
      // cap is set high enough for the largest batch we generate.
      maxOutputTokens: 32768,
      responseMimeType: "application/json",
      responseSchema: generationSchema,
    },
  });

  const result = await model.generateContent(buildGenerationPrompt(params));

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.response.text());
  } catch {
    throw new Error("Generation model returned non-JSON output");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Generation model did not return an array");
  }

  const answerSet = new Set<string>(VALID_ANSWERS);

  return (parsed as Record<string, unknown>[]).map((raw) => {
    const correct = String(raw?.correct_answer ?? "").trim().toUpperCase();
    const question: ValidatedQuestion = {
      level: params.level,
      category: params.category,
      difficulty: params.difficulty,
      question_text: sanitizeHTML(String(raw?.question_text ?? "")),
      options: buildOptions(
        sanitizeHTML(String(raw?.option_a ?? "")),
        sanitizeHTML(String(raw?.option_b ?? "")),
        sanitizeHTML(String(raw?.option_c ?? "")),
        sanitizeHTML(String(raw?.option_d ?? "")),
        answerSet.has(correct) ? correct : "A"
      ),
      explanation: sanitizeHTML(String(raw?.explanation ?? "")),
    };
    const issues = validateQuestion(question);
    if (!answerSet.has(correct)) issues.push("Model did not return a valid correct answer.");
    return { question, issues };
  });
}
