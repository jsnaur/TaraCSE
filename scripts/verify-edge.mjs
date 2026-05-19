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
  // 1. Order randomization on a real category
  line(); console.log("ORDER RANDOMIZATION — Verbal Ability, limit 8");
  line();
  for (let i = 0; i < 5; i++) {
    const { data } = await rpc("Professional", ["Verbal Ability"], "Mixed", 8);
    console.log(`  run${i}: ${(data ?? []).map((q) => q.id.slice(0, 6)).join(" ")}`);
  }

  // 2. Mixed difficulty distribution (single category, large sample)
  line(); console.log("MIXED DIFFICULTY SPREAD — Verbal Ability, limit 300");
  line();
  {
    const { data } = await rpc("Professional", ["Verbal Ability"], "Mixed", 300);
    const ids = (data ?? []).map((q) => q.id);
    const { data: rows } = await db.from("questions").select("id, difficulty").in("id", ids);
    const c = {};
    for (const r of rows ?? []) c[r.difficulty] = (c[r.difficulty] ?? 0) + 1;
    console.log(`  pool: Easy 206 / Medium 268 / Hard 138 (total 612)`);
    console.log(`  sample of 300: ${JSON.stringify(c)}`);
  }

  // 3. Empty category — Clerical Operations only
  line(); console.log("EMPTY CATEGORY — Clerical Operations only");
  line();
  {
    const { data, error } = await rpc("Professional", ["Clerical Operations"], "Mixed", 30);
    console.log(`  error=${error ? error.message : "none"}  returned=${(data ?? []).length}`);
    console.log(`  -> a user picking ONLY Clerical gets ${(data ?? []).length} questions (Session Error screen)`);
  }

  // 4. Non-existent level — Subprofessional
  line(); console.log("UNKNOWN LEVEL — Subprofessional (question_styles allows it)");
  line();
  {
    const { data, error } = await rpc("Subprofessional", ["Verbal Ability"], "Mixed", 30);
    console.log(`  error=${error ? error.message : "none"}  returned=${(data ?? []).length}`);
  }

  // 5. profiles.exam_category values actually in use
  line(); console.log("PROFILE exam_category VALUES IN USE");
  line();
  {
    const { data } = await db.from("profiles").select("exam_category").limit(10000);
    const c = {};
    for (const r of data ?? []) c[String(r.exam_category)] = (c[String(r.exam_category)] ?? 0) + 1;
    console.log(`  ${JSON.stringify(c)}`);
  }

  // 6. quality_status of questions the RPC can serve
  line(); console.log("QUALITY STATUS of active questions");
  line();
  {
    for (const st of ["unreviewed", "flagged", "approved"]) {
      const { count } = await db.from("questions").select("id", { count: "exact", head: true })
        .eq("is_active", true).eq("quality_status", st);
      console.log(`  ${st}: ${count}`);
    }
    // does the RPC exclude flagged?
    const { data } = await rpc("Professional", ["Verbal Ability"], "Mixed", 600);
    const ids = (data ?? []).map((q) => q.id);
    const { data: rows } = await db.from("questions").select("quality_status").in("id", ids);
    const c = {};
    for (const r of rows ?? []) c[r.quality_status] = (c[r.quality_status] ?? 0) + 1;
    console.log(`  RPC sample of 600 Verbal by quality_status: ${JSON.stringify(c)}`);
  }

  line(); console.log("DONE");
})();
