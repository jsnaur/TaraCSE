import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveKotAiExplanation,
  KOT_AI_QUESTION_COLUMNS,
} from "@/services/ai/kot-ai";

// ── In-memory rate limiter ──────────────────────────────────────────────────
// 10 requests per user per minute. Resets on cold start — acceptable for
// free-tier serverless where cold starts act as natural window resets.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) return true;

  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Authentication ───────────────────────────────────────────────────
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Rate limiting ────────────────────────────────────────────────────
    if (isRateLimited(user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // ── 3. Parse & validate request body ───────────────────────────────────
    const body = await request.json().catch(() => null);
    if (!body || typeof body.questionId !== "string") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { questionId } = body as { questionId: string };

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    // ── 4. Check usage limits ───────────────────────────────────────────────
    const adminClient = createAdminClient();

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("is_premium, free_kot_ai_uses_remaining")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    if (!profile.is_premium && profile.free_kot_ai_uses_remaining <= 0) {
      return NextResponse.json({ error: "exhausted" }, { status: 403 });
    }

    // ── 5. Fetch question ───────────────────────────────────────────────────
    const { data: question, error: questionError } = await adminClient
      .from("questions")
      .select(KOT_AI_QUESTION_COLUMNS)
      .eq("id", questionId)
      .eq("is_active", true)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // ── 6. Resolve the explanation ──────────────────────────────────────────
    // Cache hit returns instantly; a miss runs the RAG pipeline and persists
    // the result. CSE questions are immutable, so a generated explanation is
    // valid forever — updateQuestion() clears the cache on any admin edit, so
    // a stale explanation can never be served.
    const aiResponse = await resolveKotAiExplanation(question);

    // ── 7. Decrement usage for free users ───────────────────────────────────
    // Runs on both cache hit and miss: the 3 free uses gate the premium
    // FEATURE, independent of whether an API call was actually made.
    let remaining: number | "unlimited" = "unlimited";

    if (!profile.is_premium) {
      const newRemaining = profile.free_kot_ai_uses_remaining - 1;
      await adminClient
        .from("profiles")
        .update({ free_kot_ai_uses_remaining: newRemaining })
        .eq("id", user.id);
      remaining = newRemaining;
    }

    return NextResponse.json({ response: aiResponse, remaining });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[KOT AI]", message);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
