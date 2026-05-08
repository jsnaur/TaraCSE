import { NextRequest, NextResponse } from "next/server";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { batchEmbedQuestions } from "@/services/ai/embeddings";

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const batchSize = Math.min(
    typeof body.batchSize === "number" ? body.batchSize : 50,
    100
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
