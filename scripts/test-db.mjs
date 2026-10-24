import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

try {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
  const { count, error } = await supabase
    .from("atlas_papers")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  console.log(`DB connection OK. Rows in atlas_papers: ${count}`);
} catch (error) {
  console.error(`DB connection FAILED: ${error.message}`);
  process.exitCode = 1;
}
