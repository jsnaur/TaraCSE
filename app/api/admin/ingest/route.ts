import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with the Service Role Key to bypass RLS for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // 1. Security Check: Require a custom authorization header
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_API_SECRET;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    // 2. Parse the incoming request payload
    const body = await request.json();
    const { tsvData } = body;

    if (!tsvData || typeof tsvData !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid tsvData in request body.' }, { status: 400 });
    }

    // 3. Parse the TSV string
    const rows = tsvData.trim().split('\n');
    
    // Extract and discard the header row
    const headers = rows.shift();
    if (!headers) {
      return NextResponse.json({ error: 'TSV data appears to be empty.' }, { status: 400 });
    }

    const questionsToInsert = [];

    // 4. Transform data into the database schema
    for (const row of rows) {
      // Skip empty lines
      if (!row.trim()) continue;

      const columns = row.split('\t');
      
      // Ensure we have the correct number of columns
      if (columns.length < 10) {
        console.warn('Skipping malformed row:', row);
        continue;
      }

      const [
        level,
        category,
        difficulty,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation
      ] = columns.map(col => col.trim());

      // Map options to the JSONB structure required by the database
      const options = [
        { text: option_a, is_correct: correct_answer.toUpperCase() === 'A' },
        { text: option_b, is_correct: correct_answer.toUpperCase() === 'B' },
        { text: option_c, is_correct: correct_answer.toUpperCase() === 'C' },
        { text: option_d, is_correct: correct_answer.toUpperCase() === 'D' },
      ];

      questionsToInsert.push({
        level,
        category,
        difficulty,
        question_text,
        options,
        explanation,
        is_active: true
      });
    }

    // 5. Bulk insert into Supabase
    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert(questionsToInsert)
      .select('id'); // Select ID to confirm successful insertion

    if (error) {
      console.error('Supabase Insertion Error:', error);
      return NextResponse.json({ error: 'Failed to insert records into database.', details: error.message }, { status: 500 });
    }

    // 6. Return success response
    return NextResponse.json({ 
      success: true, 
      message: `Successfully inserted ${data.length} questions.` 
    }, { status: 200 });

  } catch (err: any) {
    console.error('Server Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
