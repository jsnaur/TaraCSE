// Verifies get_random_practice_questions: filtering by user params + randomization.
// Run: node scripts/verify-question-pull.mjs
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const CATEGORIES = [
  "Verbal Ability",
  "Numerical Ability",
  "Analytical Ability",
  "Clerical Operations",
  "General Information",
];

function line() { console.log("─".repeat(70)); }

async function inventory() {
  line();
  console.log("QUESTION BANK INVENTORY");
  line();
  const { count: total } = await db.from("questions").select("id", { count: "exact", head: true });
  const { count: active } = await db.from("questions").select("id", { count: "exact", head: true }).eq("is_active", true);
  console.log(`Total questions:        ${total}`);
  console.log(`Active (is_active=t):   ${active}`);
  console.log(`Inactive:               ${total - active}`);

  // Distinct levels
  const { data: lvlRows } = await db.from("questions").select("level").limit(10000);
  const levels = [...new Set((lvlRows ?? []).map((r) => r.level))];
  console.log(`Distinct levels:        ${JSON.stringify(levels)}`);

  // Distinct difficulties
  const { data: diffRows } = await db.from("questions").select("difficulty").limit(10000);
  const diffs = [...new Set((diffRows ?? []).map((r) => r.difficulty))];
  console.log(`Distinct difficulties:  ${JSON.stringify(diffs)}`);

  console.log("\nActive question counts by level x category x difficulty:");
  for (const level of levels) {
    for (const cat of CATEGORIES) {
      const row = {};
      for (const d of [...diffs, "ALL"]) {
        let q = db.from("questions").select("id", { count: "exact", head: true })
          .eq("is_active", true).eq("level", level).eq("category", cat);
        if (d !== "ALL") q = q.eq("difficulty", d);
        const { count } = await q;
        row[d] = count ?? 0;
      }
      console.log(`  ${level} / ${cat}: ${JSON.stringify(row)}`);
    }
  }
  return { levels, diffs };
}

async function callRpc(level, categories, difficulty, limit) {
  const { data, error } = await db.rpc("get_random_practice_questions", {
    p_level: level,
    p_categories: categories,
    p_difficulty: difficulty,
    p_limit: limit,
  });
  if (error) return { error };
  return { data: data ?? [] };
}

async function testFiltering(levels, diffs) {
  line();
  console.log("FILTER CORRECTNESS — does the RPC honor user params?");
  line();
  for (const level of levels) {
    for (const difficulty of ["Mixed", ...diffs]) {
      // single category
      const cats = ["Verbal Ability"];
      const { data, error } = await callRpc(level, cats, difficulty, 50);
      if (error) { console.log(`  ${level}/${difficulty}: RPC ERROR ${error.message}`); continue; }
      const ids = data.map((q) => q.id);
      const uniqueIds = new Set(ids);
      // verify each returned row really matches by re-reading from questions
      let badLevel = 0, badCat = 0, badDiff = 0, inactive = 0;
      if (ids.length) {
        const { data: rows } = await db.from("questions")
          .select("id, level, category, difficulty, is_active").in("id", ids);
        const byId = new Map((rows ?? []).map((r) => [r.id, r]));
        for (const id of ids) {
          const r = byId.get(id);
          if (!r) continue;
          if (r.level !== level) badLevel++;
          if (!cats.includes(r.category)) badCat++;
          if (difficulty !== "Mixed" && r.difficulty !== difficulty) badDiff++;
          if (r.is_active === false) inactive++;
        }
      }
      console.log(
        `  ${level} / ${difficulty} / [Verbal]: returned=${ids.length} unique=${uniqueIds.size}` +
        ` | wrongLevel=${badLevel} wrongCat=${badCat} wrongDiff=${badDiff} inactive=${inactive}`
      );
    }
  }

  // multi-category test
  console.log("\n  Multi-category request (all 5 categories), limit 100:");
  for (const level of levels) {
    const { data, error } = await callRpc(level, CATEGORIES, "Mixed", 100);
    if (error) { console.log(`    ${level}: ERROR ${error.message}`); continue; }
    const catCounts = {};
    for (const q of data) catCounts[q.category] = (catCounts[q.category] ?? 0) + 1;
    console.log(`    ${level}: returned=${data.length} spread=${JSON.stringify(catCounts)}`);
  }
}

async function testLimit(levels) {
  line();
  console.log("LIMIT CORRECTNESS — does p_limit cap the result?");
  line();
  const level = levels[0];
  for (const lim of [1, 5, 30, 100, 500]) {
    const { data, error } = await callRpc(level, CATEGORIES, "Mixed", lim);
    if (error) { console.log(`  limit=${lim}: ERROR ${error.message}`); continue; }
    console.log(`  requested limit=${lim} -> returned=${data.length}`);
  }
}

async function testRandomization(levels) {
  line();
  console.log("RANDOMIZATION — repeated identical calls");
  line();
  const level = levels[0];
  const RUNS = 6;
  const LIMIT = 30;
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const { data, error } = await callRpc(level, CATEGORIES, "Mixed", LIMIT);
    if (error) { console.log(`  run ${i}: ERROR ${error.message}`); return; }
    runs.push(data.map((q) => q.id));
  }

  // Set overlap between run 0 and others (which questions were selected)
  const set0 = new Set(runs[0]);
  console.log(`  ${RUNS} runs, limit ${LIMIT} each:`);
  for (let i = 1; i < RUNS; i++) {
    const overlap = runs[i].filter((id) => set0.has(id)).length;
    const orderIdentical = runs[i].join() === runs[0].join();
    const sameSet = new Set(runs[i]).size === set0.size && runs[i].every((id) => set0.has(id));
    console.log(
      `    run0 vs run${i}: sameQuestionsSelected=${overlap}/${LIMIT}` +
      ` | identicalSet=${sameSet} | identicalOrder=${orderIdentical}`
    );
  }

  // How many DISTINCT questions appeared across all runs (selection randomness)
  const all = new Set(runs.flat());
  console.log(`  distinct questions seen across ${RUNS} runs: ${all.size} (limit was ${LIMIT})`);

  // Order randomness: for a fixed small pool, does order shuffle?
  console.log("\n  Order check on a small pool (limit 5):");
  const small = [];
  for (let i = 0; i < 5; i++) {
    const { data } = await callRpc(level, ["Clerical Operations"], "Mixed", 5);
    small.push((data ?? []).map((q) => q.id.slice(0, 8)).join(","));
  }
  small.forEach((s, i) => console.log(`    run${i}: ${s}`));
  const allOrdersSame = small.every((s) => s === small[0]);
  console.log(`    all 5 runs identical order: ${allOrdersSame}`);
}

(async () => {
  try {
    const { levels, diffs } = await inventory();
    await testFiltering(levels, diffs);
    await testLimit(levels);
    await testRandomization(levels);
    line();
    console.log("DONE");
  } catch (e) {
    console.error("FATAL", e);
    process.exit(1);
  }
})();
