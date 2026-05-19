import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const rpc = (level, cats, diff, lim) =>
  db.rpc("get_random_practice_questions", { p_level: level, p_categories: cats, p_difficulty: diff, p_limit: lim });
function line() { console.log("─".repeat(70)); }

(async () => {
  // 1. ALL distinct category values + counts
  line(); console.log("ALL DISTINCT category VALUES IN questions");
  line();
  const { data: rows } = await db.from("questions").select("category, level").limit(10000);
  const catCount = {};
  const lvlCount = {};
  for (const r of rows ?? []) {
    catCount[String(r.category)] = (catCount[String(r.category)] ?? 0) + 1;
    lvlCount[String(r.level)] = (lvlCount[String(r.level)] ?? 0) + 1;
  }
  console.log("  category counts:");
  for (const [k, v] of Object.entries(catCount).sort((a, b) => b[1] - a[1]))
    console.log(`    ${JSON.stringify(k)}: ${v}`);
  console.log("  level counts:");
  for (const [k, v] of Object.entries(lvlCount)) console.log(`    ${JSON.stringify(k)}: ${v}`);

  const PRACTICE_CATS = ["Verbal Ability", "Numerical Ability", "Analytical Ability", "Clerical Operations", "General Information"];
  const reachable = PRACTICE_CATS.reduce((s, c) => s + (catCount[c] ?? 0), 0);
  console.log(`\n  reachable via practice (5 mapped categories): ${reachable}`);
  console.log(`  UNREACHABLE (category not in the map):          ${(rows ?? []).length - reachable}`);

  // 2. Does the RPC filter by level? bogus level
  line(); console.log("LEVEL FILTER TEST");
  line();
  for (const lvl of ["Professional", "Subprofessional", "TOTALLY_BOGUS_LEVEL"]) {
    const { data } = await rpc(lvl, ["Verbal Ability"], "Mixed", 20);
    console.log(`  p_level=${JSON.stringify(lvl)} -> returned ${(data ?? []).length}`);
  }

  // 3. Does the RPC filter by quality_status? small-batch verify
  line(); console.log("QUALITY STATUS of RPC results (small batch)");
  line();
  {
    const { data } = await rpc("Professional", ["General Information"], "Mixed", 90);
    const ids = (data ?? []).map((q) => q.id);
    const c = {};
    // chunk the .in() to avoid URL-length limits
    for (let i = 0; i < ids.length; i += 30) {
      const { data: qr } = await db.from("questions").select("quality_status").in("id", ids.slice(i, i + 30));
      for (const r of qr ?? []) c[r.quality_status] = (c[r.quality_status] ?? 0) + 1;
    }
    console.log(`  RPC sample of ${ids.length} General Info by quality_status: ${JSON.stringify(c)}`);
  }

  // 4. Max returnable across everything
  line(); console.log("MAX RETURNABLE");
  line();
  for (const lim of [2000, 5000]) {
    const { data } = await rpc("Professional", PRACTICE_CATS, "Mixed", lim);
    console.log(`  limit=${lim} -> returned ${(data ?? []).length}`);
  }

  line(); console.log("DONE");
})();
