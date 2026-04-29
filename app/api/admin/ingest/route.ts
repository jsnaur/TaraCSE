import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminStatus } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// --- Configuration & Security Enforcements ---
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB Limit

const VALID_LEVELS = new Set(['Professional', 'Subprofessional']);
const VALID_CATEGORIES = new Set([
  'Verbal Ability', 
  'Numerical Ability', 
  'Analytical Ability', 
  'General Information', 
  'Clerical Operations'
]);
const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard']);
const VALID_ANSWERS = new Set(['A', 'B', 'C', 'D']);

// Basic XSS Sanitization: Strips HTML tags
function sanitizeHTML(text: string): string {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').trim();
}

interface ParsedQuestion {
  level: string;
  category: string;
  difficulty: string;
  question_text: string;
  options: any; // JSONB array
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    // Phase 1: Boundary Defense & Authentication
    const isAdmin = await verifyAdminStatus();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized Access. Admin privileges required.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Payload Too Large. Maximum file size is 5MB.' }, { status: 413 });
    }

    // Read the file as text
    const fileText = await file.text();
    if (!fileText.trim()) {
      return NextResponse.json({ error: 'The uploaded file is empty.' }, { status: 400 });
    }

    // Phase 2: Memory Parsing & Validation (Dry Run)
    const lines = fileText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File contains no data rows.' }, { status: 400 });
    }

    // Skip the header row
    const dataLines = lines.slice(1);
    
    const errors: { row: number; issues: string[] }[] = [];
    const validRows: ParsedQuestion[] = [];

    dataLines.forEach((line, index) => {
      const rowNumber = index + 2; 
      const columns = line.split('\t').map(col => col.trim());
      const rowErrors: string[] = [];

      // Expected format: level | category | difficulty | question_text | option_a | option_b | option_c | option_d | correct_answer | explanation
      if (columns.length < 10) {
        errors.push({ row: rowNumber, issues: ['Incomplete row. Missing required columns (Needs 10 columns).'] });
        return; 
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
        rawExplanation
      ] = columns;

      // 1. Enum Validations
      if (!VALID_LEVELS.has(rawLevel)) rowErrors.push(`Invalid Level: '${rawLevel}'`);
      if (!VALID_CATEGORIES.has(rawCategory)) rowErrors.push(`Invalid Category: '${rawCategory}'`);
      if (!VALID_DIFFICULTIES.has(rawDifficulty)) rowErrors.push(`Invalid Difficulty: '${rawDifficulty}'`);

      // 2. Text Validations & Sanitization
      const sanitizedQuestion = sanitizeHTML(rawQuestionText);
      const sanitizedExplanation = sanitizeHTML(rawExplanation);
      const cleanCorrect = rawCorrect.toUpperCase();

      if (!sanitizedQuestion) rowErrors.push('Question text is missing.');
      if (!sanitizedExplanation) rowErrors.push('Explanation text is missing.');
      if (!VALID_ANSWERS.has(cleanCorrect)) rowErrors.push(`Invalid Correct Answer: '${rawCorrect}'. Must be A, B, C, or D.`);

      // 3. Build & Validate the JSONB Options Array
      const optA = sanitizeHTML(rawOptA);
      const optB = sanitizeHTML(rawOptB);
      const optC = sanitizeHTML(rawOptC);
      const optD = sanitizeHTML(rawOptD);

      if (!optA || !optB || !optC || !optD) {
        rowErrors.push('One or more options (A, B, C, or D) are missing text.');
      }

      const parsedOptions = [
        { text: optA, is_correct: cleanCorrect === 'A' },
        { text: optB, is_correct: cleanCorrect === 'B' },
        { text: optC, is_correct: cleanCorrect === 'C' },
        { text: optD, is_correct: cleanCorrect === 'D' },
      ];

      if (rowErrors.length > 0) {
        errors.push({ row: rowNumber, issues: rowErrors });
      } else {
        validRows.push({
          level: rawLevel,
          category: rawCategory,
          difficulty: rawDifficulty,
          question_text: sanitizedQuestion,
          options: parsedOptions,
          explanation: sanitizedExplanation,
        });
      }
    });

    // Phase 3: Transactional Integrity
    if (errors.length > 0) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Validation failed. Fix the following errors and re-upload.',
        errors: errors 
      }, { status: 400 });
    }

    // Phase 4: Anti-Duplication Strategy
    const supabaseAdmin = createAdminClient();
    
    const { data: existingQuestions, error: fetchError } = await supabaseAdmin
      .from('questions')
      .select('question_text, category');

    if (fetchError) {
      return NextResponse.json({ error: 'Database check for duplicates failed.' }, { status: 500 });
    }

    const existingSet = new Set(
      existingQuestions.map(q => `${q.category}|${q.question_text}`)
    );

    const newQuestionsToInsert = validRows.filter(
      row => !existingSet.has(`${row.category}|${row.question_text}`)
    );

    const skippedCount = validRows.length - newQuestionsToInsert.length;

    if (newQuestionsToInsert.length === 0) {
      return NextResponse.json({ 
        status: 'success', 
        message: `Processed ${validRows.length} rows. All questions were already in the database. 0 new inserts.`,
        inserted: 0,
        skipped: skippedCount,
        insertedIds: []
      }, { status: 200 });
    }

    // NOTE: Added .select('id') here to get the inserted IDs for the revert feature
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('questions')
      .insert(newQuestionsToInsert)
      .select('id');

    if (insertError) {
      return NextResponse.json({ error: 'Failed to insert questions into the database. Transaction aborted.' }, { status: 500 });
    }

    const insertedIds = insertedData?.map(q => q.id) || [];

    return NextResponse.json({ 
      status: 'success', 
      message: `Successfully ingested ${newQuestionsToInsert.length} new questions. Skipped ${skippedCount} duplicates.`,
      inserted: newQuestionsToInsert.length,
      skipped: skippedCount,
      insertedIds: insertedIds
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'An unexpected server error occurred during ingestion.' }, { status: 500 });
  }
}