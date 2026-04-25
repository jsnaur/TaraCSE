'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize the standard client for safe public reads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Initialize the admin client for secure server-side grading and inserts
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for actions.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchSanitizedQuestions(
  limit: number = 10,
  category?: string,
  difficulty?: string
) {
  try {
    // 🔴 CHANGED: We now use supabaseAdmin here to securely bypass RLS on the server, 
    // fetch the raw data, and sanitize it before the client ever sees it.
    let query = supabaseAdmin
      .from('questions')
      .select('id, level, category, difficulty, question_text, options') 
      .eq('is_active', true)
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Supabase Query Error:', error);
      throw new Error('Failed to fetch questions.');
    }

    // Strip the 'is_correct' flag before sending to the client
    const sanitizedQuestions = questions.map((q) => {
      const sanitizedOptions = q.options.map((opt: any) => ({
        text: opt.text
      }));

      return {
        ...q,
        options: sanitizedOptions,
      };
    });

    return { success: true, data: sanitizedQuestions };

  } catch (error: any) {
    console.error('Server Action Error:', error);
    return { success: false, error: error.message || 'Error fetching questions.' };
  }
}

// --- NEW GRADING LOGIC ---

// Define the expected structure of the incoming answers
export interface UserSubmission {
  question_id: string;
  selected_answer: string;
  category: string;
  time_taken_seconds: number;
}

export async function submitExam(
  userId: string,
  mode: 'Practice' | 'Mock',
  level: 'Professional' | 'Subprofessional',
  timeSpentSeconds: number,
  submissions: UserSubmission[]
) {
  try {
    // 1. Fetch the master copies of the submitted questions to get the true answers
    const questionIds = submissions.map(sub => sub.question_id);
    const { data: masterQuestions, error: masterError } = await supabaseAdmin
      .from('questions')
      .select('id, options')
      .in('id', questionIds);

    if (masterError || !masterQuestions) {
      throw new Error('Failed to retrieve master questions for grading.');
    }

    // 2. Grade the submissions
    let score = 0;
    const gradedResponses = submissions.map((sub) => {
      // Find the matching master question
      const masterQ = masterQuestions.find(q => q.id === sub.question_id);
      let isCorrect = false;

      if (masterQ) {
        // Find the correct option in the JSONB array
        const correctOption = masterQ.options.find((opt: any) => opt.is_correct === true);
        // Compare the user's text to the correct option text
        if (correctOption && correctOption.text === sub.selected_answer) {
          isCorrect = true;
          score++;
        }
      }

      return {
        ...sub,
        is_correct: isCorrect
      };
    });

    // 3. Create the Exam Session record
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('exam_sessions')
      .insert({
        user_id: userId,
        mode: mode,
        level: level,
        score: score,
        total_questions: submissions.length,
        time_spent_seconds: timeSpentSeconds
      })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      throw new Error('Failed to save exam session.');
    }

    const sessionId = sessionData.id;

    // 4. Format and insert the individual graded responses
    const responsesToInsert = gradedResponses.map((res) => ({
      session_id: sessionId,
      user_id: userId,
      question_id: res.question_id,
      category: res.category,
      is_correct: res.is_correct,
      selected_answer: res.selected_answer,
      time_taken_seconds: res.time_taken_seconds
    }));

    const { error: responseError } = await supabaseAdmin
      .from('user_responses')
      .insert(responsesToInsert);

    if (responseError) {
      console.error('Failed to save individual responses:', responseError);
      // We don't necessarily throw here, as the session itself was saved, 
      // but you could add rollback logic in a production environment.
    }

    // 5. Return success and the final score
    return { 
      success: true, 
      data: {
        sessionId: sessionId,
        score: score,
        total: submissions.length
      } 
    };

  } catch (error: any) {
    console.error('Submission Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred during submission.' };
  }
}

// --- PRACTICE MODE SECURE CHECK ---
export async function checkPracticeAnswer(questionId: string) {
  try {
    // We use the Admin client here because the answer/explanation is technically 
    // sensitive data that shouldn't be publicly queried directly by users.
    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('options, explanation')
      .eq('id', questionId)
      .single();

    if (error || !data) {
      throw new Error('Failed to retrieve question details.');
    }

    const correctOption = data.options.find((opt: any) => opt.is_correct === true);

    return {
      success: true,
      correctText: correctOption?.text,
      explanation: data.explanation
    };
  } catch (error: any) {
    console.error('Check Answer Error:', error);
    return { success: false, error: error.message };
  }
}

