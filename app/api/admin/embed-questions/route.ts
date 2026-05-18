import { NextRequest, NextResponse } from "next/server";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { batchEmbedQuestions } from "@/services/ai/embeddings";

// Each question is rate-limited (~0.8s/key), so a batch of 20 takes ~16s.
// Raise the function ceiling above the platform default to be safe.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Keep batches small: each question is throttled (~0.8s/key) to stay under
  // the Gemini free-tier rate limit, so a large batch would risk a serverless
  // function timeout. The client loops this endpoint until the backlog drains.
  const body = await request.json().catch(() => ({}));
  const batchSize = Math.min(
    typeof body.batchSize === "number" ? body.batchSize : 20,
    50
  );

  const result = await batchEmbedQuestions(batchSize);

  return NextResponse.json({
    status: result.failed > 0 && result.embedded === 0 ? "error" : "success",
    embedded: result.embedded,
    failed: result.failed,
    remaining: result.remaining,
    firstError: result.firstError,
    message: `Embedded ${result.embedded} questions. Failed: ${result.failed}. Still pending: ${result.remaining}.`,
  });
}
