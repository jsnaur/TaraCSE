import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const rpc = (level, cats, diff, lim) =>
  db.rpc("get_random_practice_questions", { p_level: level, p_categories: cats, p_difficulty: diff, p_limit: lim });
function line() { console.log("─".repeat(70)); }

const count = async (build) => {
  let q = db.from("questions").select("id", { count: "exact", head: true });
  q = build(q);
  const { count: c } = await q;
  return c ?? 0;
};

(async () => {
  // Paginate the whole table to get TRUE distinct category/level values.
  line(); console.log("FULL TABLE SCAN (paginated)");
  line();
  const cat = {}, lvl = {}, diff = {}, levelCat = {};
  let from = 0;
  const PAGE = 1000;
  let total = 0;
  for (;;) {
    const { data, error } = await db
      .from("questions")
      .select("level, category, difficulty")
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    for (const r of data) {
      total++;
      cat[String(r.category)] = (cat[String(r.category)] ?? 0) + 1;
      lvl[String(r.level)] = (lvl[String(r.level)] ?? 0) + 1;
      diff[String(r.difficulty)] = (diff[String(r.difficulty)] ?? 0) + 1;
      const k = `${r.level} ||| ${r.category}`;
      levelCat[k] = (levelCat[k] ?? 0) + 1;
    }
    from += PAGE;
    if (data.length < PAGE) break;
  }
  console.log(`  rows scanned: ${total}`);
  console.log(`  levels:       ${JSON.stringify(lvl)}`);
  console.log(`  difficulties: ${JSON.stringify(diff)}`);
  console.log(`  categories:`);
  for (const [k, v] of Object.entries(cat).sort((a, b) => b[1] - a[1]))
    console.log(`    ${JSON.stringify(k)}: ${v}`);

  const PRACTICE_CATS = ["Verbal Ability", "Numerical Ability", "Analytical Ability", "Clerical Operations", "General Information"];
  line(); console.log("PRACTICE-REACHABLE MATRIX  (what users can actually pull)");
  line();
  const levels = Object.keys(lvl);
  for (const L of levels) {
    console.log(`  Level: ${L}`);
    for (const C of PRACTICE_CATS) {
      const n = levelCat[`${L} ||| ${C}`] ?? 0;
      const flag = n === 0 ? "   <-- EMPTY: users selecting this get a Session Error" : "";
      console.log(`    ${C.padEnd(22)} ${String(n).padStart(5)}${flag}`);
    }
  }
  const unreachable = total - Object.entries(levelCat)
    .filter(([k]) => PRACTICE_CATS.includes(k.split(" ||| ")[1]))
    .reduce((s, [, v]) => s + v, 0);
  console.log(`\n  Questions NOT reachable via practice (unmapped category): ${unreachable}`);

  // RPC level-filter correctness for each level
  line(); console.log("RPC LEVEL FILTER — returned rows actually match requested level?");
  line();
  for (const L of levels) {
    const { data } = await rpc(L, PRACTICE_CATS, "Mixed", 60);
    const ids = (data ?? []).map((q) => q.id);
    let wrong = 0;
    for (let i = 0; i < ids.length; i += 25) {
      const { data: qr } = await db.from("questions").select("level").in("id", ids.slice(i, i + 25));
      for (const r of qr ?? []) if (r.level !== L) wrong++;
    }
    console.log(`  p_level=${L}: returned ${ids.length}, wrong-level rows = ${wrong}`);
  }

  line(); console.log("DONE");
})();
