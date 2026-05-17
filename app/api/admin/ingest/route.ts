// app/api/admin/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminStatus } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { embedAndStoreQuestion } from '@/services/ai/embeddings';
import { parseTsvDocument, ValidatedQuestion } from '@/lib/question-validation';

// --- Configuration & Security Enforcements ---
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB Limit

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

    // Shared parser — identical rules to the AI generation pipeline.
    const { validRows, errors } = parseTsvDocument(fileText);

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

    const newQuestionsToInsert: ValidatedQuestion[] = [];
    const skippedItems: { row: number; question_text: string; category: string }[] = [];

    validRows.forEach(row => {
      if (existingSet.has(`${row.category}|${row.question_text}`)) {
        skippedItems.push({
          row: row.rowNumber,
          question_text: row.question_text,
          category: row.category
        });
      } else {
        const { rowNumber, ...dbRow } = row; // Strip rowNumber before database insertion
        newQuestionsToInsert.push(dbRow);
      }
    });

    if (newQuestionsToInsert.length === 0) {
      return NextResponse.json({ 
        status: 'success', 
        message: `Processed ${validRows.length} rows. All questions were already in the database. 0 new inserts.`,
        inserted: 0,
        skipped: skippedItems.length,
        skippedItems: skippedItems,
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

    // Fire-and-forget: embed each new question asynchronously.
    // Do not await — return the ingest success response immediately.
    for (const id of insertedIds) {
      embedAndStoreQuestion(id).catch((err) =>
        console.error(`[Embed] Failed for question ${id}:`, err?.message)
      );
    }

    return NextResponse.json({
      status: 'success', 
      message: `Successfully ingested ${newQuestionsToInsert.length} new questions. Skipped ${skippedItems.length} duplicates.`,
      inserted: newQuestionsToInsert.length,
      skipped: skippedItems.length,
      skippedItems: skippedItems,
      insertedIds: insertedIds
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'An unexpected server error occurred during ingestion.' }, { status: 500 });
  }
}