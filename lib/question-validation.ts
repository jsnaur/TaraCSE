// lib/question-validation.ts
// Shared validation for CSE questions. Used by the bulk TSV ingest route and
// by the AI generation pipeline so both enforce identical rules.

export const VALID_LEVELS = ["Professional", "Subprofessional"] as const;
export const VALID_CATEGORIES = [
  "Verbal Ability",
  "Numerical Ability",
  "Analytical Ability",
  "General Information",
  "Clerical Operations",
] as const;
export const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export const VALID_ANSWERS = ["A", "B", "C", "D"] as const;

export type Level = (typeof VALID_LEVELS)[number];
export type Category = (typeof VALID_CATEGORIES)[number];
export type Difficulty = (typeof VALID_DIFFICULTIES)[number];

const LEVEL_SET = new Set<string>(VALID_LEVELS);
const CATEGORY_SET = new Set<string>(VALID_CATEGORIES);
const DIFFICULTY_SET = new Set<string>(VALID_DIFFICULTIES);
const ANSWER_SET = new Set<string>(VALID_ANSWERS);

export interface QuestionOption {
  text: string;
  is_correct: boolean;
}

export interface ValidatedQuestion {
  level: string;
  category: string;
  difficulty: string;
  question_text: string;
  options: QuestionOption[];
  explanation: string;
}

// Basic XSS hardening: strips HTML tags. LaTeX (e.g. $\frac{1}{2}$) is preserved
// because it contains no angle brackets.
export function sanitizeHTML(text: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>?/gm, "").trim();
}

/**
 * Validates a fully-built question object against the CSE schema rules.
 * Returns a list of human-readable issues — empty means the question is valid.
 */
export function validateQuestion(q: Partial<ValidatedQuestion>): string[] {
  const issues: string[] = [];

  if (!q.level || !LEVEL_SET.has(q.level)) issues.push(`Invalid Level: '${q.level ?? ""}'`);
  if (!q.category || !CATEGORY_SET.has(q.category)) issues.push(`Invalid Category: '${q.category ?? ""}'`);
  if (!q.difficulty || !DIFFICULTY_SET.has(q.difficulty)) issues.push(`Invalid Difficulty: '${q.difficulty ?? ""}'`);

  if (!q.question_text || !q.question_text.trim()) issues.push("Question text is missing.");
  if (!q.explanation || !q.explanation.trim()) issues.push("Explanation text is missing.");

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    issues.push("Exactly 4 options are required.");
  } else {
    if (q.options.some((o) => !o || !o.text || !o.text.trim())) {
      issues.push("One or more options (A, B, C, or D) are missing text.");
    }
    const correctCount = q.options.filter((o) => o && o.is_correct).length;
    if (correctCount !== 1) {
      issues.push(`Exactly one correct answer is required (found ${correctCount}).`);
    }
  }

  return issues;
}

/** Builds the 4-option array from raw option text + a correct letter (A-D). */
export function buildOptions(
  optA: string,
  optB: string,
  optC: string,
  optD: string,
  correctLetter: string
): QuestionOption[] {
  const c = correctLetter.trim().toUpperCase();
  return [
    { text: optA, is_correct: c === "A" },
    { text: optB, is_correct: c === "B" },
    { text: optC, is_correct: c === "C" },
    { text: optD, is_correct: c === "D" },
  ];
}

export interface ParsedRow {
  rowNumber: number;
  question: ValidatedQuestion | null;
  issues: string[];
}

// Expected TSV column order:
// level | category | difficulty | question_text |
// option_a | option_b | option_c | option_d | correct_answer | explanation
export function parseTsvRow(line: string, rowNumber: number): ParsedRow {
  const columns = line.split("\t").map((col) => col.trim());

  if (columns.length < 10) {
    return {
      rowNumber,
      question: null,
      issues: ["Incomplete row. Missing required columns (Needs 10 columns)."],
    };
  }

  const [
    rawLevel,
    rawCategory,
    rawDifficulty,
    rawQuestionText,
    rawOptA,
    rawOptB,
    rawOptC,
    rawOptD,
    rawCorrect,
    rawExplanation,
  ] = columns;

  const issues: string[] = [];
  const cleanCorrect = rawCorrect.toUpperCase();
  if (!ANSWER_SET.has(cleanCorrect)) {
    issues.push(`Invalid Correct Answer: '${rawCorrect}'. Must be A, B, C, or D.`);
  }

  const question: ValidatedQuestion = {
    level: rawLevel,
    category: rawCategory,
    difficulty: rawDifficulty,
    question_text: sanitizeHTML(rawQuestionText),
    options: buildOptions(
      sanitizeHTML(rawOptA),
      sanitizeHTML(rawOptB),
      sanitizeHTML(rawOptC),
      sanitizeHTML(rawOptD),
      ANSWER_SET.has(cleanCorrect) ? cleanCorrect : "A"
    ),
    explanation: sanitizeHTML(rawExplanation),
  };

  issues.push(...validateQuestion(question));

  return {
    rowNumber,
    question: issues.length === 0 ? question : null,
    issues,
  };
}

export interface ParsedDocument {
  validRows: (ValidatedQuestion & { rowNumber: number })[];
  errors: { row: number; issues: string[] }[];
}

/** Parses a full TSV document (header row + data rows). */
export function parseTsvDocument(text: string): ParsedDocument {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const validRows: ParsedDocument["validRows"] = [];
  const errors: ParsedDocument["errors"] = [];

  if (lines.length < 2) return { validRows, errors };

  // Skip the header row; data rows start at line 2.
  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const parsed = parseTsvRow(line, rowNumber);
    if (parsed.question) {
      validRows.push({ ...parsed.question, rowNumber });
    } else {
      errors.push({ row: rowNumber, issues: parsed.issues });
    }
  });

  return { validRows, errors };
}
