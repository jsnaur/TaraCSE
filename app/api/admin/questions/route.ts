import { NextRequest, NextResponse } from "next/server";
import { verifyAdminStatus } from "@/lib/admin-auth";
import {
  fetchQuestions,
  fetchQuestionStats,
  type QuestionFilters,
} from "@/app/admin/questions/actions";
import { DEFAULT_QUESTION_FILTERS } from "@/app/admin/questions/constants";

// Backs the admin Question Bank list. The server component renders only page 1;
// every subsequent page / filter change in QuestionsClient POSTs here instead
// of shipping the entire bank to the browser. Stats are returned alongside the
// page so mutation-driven refreshes pick up new counts in a single round trip.
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const page =
    typeof body.page === "number" && body.page > 0 ? Math.floor(body.page) : 1;
  // Merge over the defaults so a partial / malformed filter object can't drop
  // required keys and break the query builder.
  const filters: QuestionFilters = {
    ...DEFAULT_QUESTION_FILTERS,
    ...(body.filters && typeof body.filters === "object" ? body.filters : {}),
  };

  try {
    const [data, stats] = await Promise.all([
      fetchQuestions({ page, filters }),
      fetchQuestionStats(),
    ]);
    return NextResponse.json({ data, stats });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
