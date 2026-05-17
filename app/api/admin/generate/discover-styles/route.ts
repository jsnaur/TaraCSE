import { NextRequest, NextResponse } from "next/server";
import { verifyAdminStatus } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { discoverStyles, CATEGORY_TARGETS } from "@/services/ai/generation";

// The 8 CSE-authentic level×category pairs.
function validPairs(): { level: string; category: string }[] {
  const pairs: { level: string; category: string }[] = [];
  for (const [level, categories] of Object.entries(CATEGORY_TARGETS)) {
    for (const category of Object.keys(categories)) {
      pairs.push({ level, category });
    }
  }
  return pairs;
}

// Runs the Discovery prompt for one level×category pair per call. The client
// calls repeatedly until remaining=0 (same pattern as the embedding panel).
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();
  const pairs = validPairs();

  // Which pairs already have styles?
  const { data: existing } = await supabase
    .from("question_styles")
    .select("level, category");
  const covered = new Set(
    (existing ?? []).map((r) => `${r.level}|${r.category}`)
  );

  // Pick the pair to process: explicit from body, else first uncovered.
  let target: { level: string; category: string } | undefined;
  if (typeof body.level === "string" && typeof body.category === "string") {
    target = pairs.find((p) => p.level === body.level && p.category === body.category);
  } else {
    target = pairs.find((p) => !covered.has(`${p.level}|${p.category}`));
  }

  if (!target) {
    return NextResponse.json({
      status: "success",
      discovered: 0,
      remaining: 0,
      message: "All sections already have a style map.",
    });
  }

  try {
    const styles = await discoverStyles(target.level, target.category);

    if (styles.length === 0) {
      return NextResponse.json(
        { status: "error", discovered: 0, remaining: 0, firstError: "Model returned no styles." },
        { status: 200 }
      );
    }

    const { error: upsertError } = await supabase
      .from("question_styles")
      .upsert(
        styles.map((s) => ({
          level: target!.level,
          category: target!.category,
          style_name: s.style_name,
          description: s.description,
          is_enabled: true,
        })),
        { onConflict: "level,category,style_name", ignoreDuplicates: true }
      );

    if (upsertError) {
      return NextResponse.json(
        { status: "error", discovered: 0, remaining: 0, firstError: `DB error: ${upsertError.message}` },
        { status: 200 }
      );
    }

    covered.add(`${target.level}|${target.category}`);
    const remaining = pairs.filter((p) => !covered.has(`${p.level}|${p.category}`)).length;

    return NextResponse.json({
      status: "success",
      level: target.level,
      category: target.category,
      discovered: styles.length,
      remaining,
      message: `Discovered ${styles.length} styles for ${target.level} · ${target.category}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "error", discovered: 0, remaining: 0, firstError: message },
      { status: 200 }
    );
  }
}
