import { readFileSync } from "node:fs";
import { join } from "node:path";

const sqlPath = join(process.cwd(), "supabase", "migrations", "004_fix_handle_new_user.sql");
const sql = readFileSync(sqlPath, "utf8");

console.log(`
OAuth signup is failing because handle_new_user() on your Supabase project is empty.

Run this SQL in Supabase Dashboard → SQL Editor:
https://supabase.com/dashboard/project/ukptgpodvlvqpaemryuw/sql/new

--- Copy everything below this line ---

${sql}

--- End of SQL ---

After running it, try signing in with Google again.
`);
