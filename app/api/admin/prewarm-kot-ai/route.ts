import { NextRequest, NextResponse } from "next/server";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { batchPrewarmKotAi } from "@/services/ai/kot-ai";

// Each question costs one rate-limited Gemini generateContent call (~4.5s
// spacing). A small batch keeps the function well under the timeout ceiling;
// the admin panel loops this endpoint until the backlog drains.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const batchSize = Math.min(
    typeof body.batchSize === "number" && body.batchSize > 0
      ? body.batchSize
      : 5,
    10
  );

  const result = await batchPrewarmKotAi(batchSize);

  return NextResponse.json({
    status:
      result.failed > 0 && result.generated === 0 ? "error" : "success",
    generated: result.generated,
    failed: result.failed,
    remaining: result.remaining,
    quotaReached: result.quotaReached,
    firstError: result.firstError,
    message:
      `Generated ${result.generated} explanation(s). ` +
      `Failed: ${result.failed}. Still pending: ${result.remaining}.` +
      (result.quotaReached
        ? " Gemini daily quota reached — resume after it resets."
        : ""),
  });
}
