/**
 * Upgrade a user to Business for local tryouts.
 * Usage: node scripts/unlock-user-plan.mjs [userId|email]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const target = process.argv[2] ?? "5980aa65-fb6f-4be8-bde0-5f7b48019bd6";

if (!url || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveUserId(input) {
  if (/^[0-9a-f-]{36}$/i.test(input)) return input;
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === input.toLowerCase());
  if (!user) throw new Error(`User not found: ${input}`);
  return user.id;
}

async function main() {
  const userId = await resolveUserId(target);
  const now = new Date();
  const end = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const { error: profileError } = await admin
    .from("profiles")
    .update({ plan: "business", updated_at: now.toISOString() })
    .eq("id", userId);
  if (profileError) throw profileError;

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    user_id: userId,
    plan_id: "business",
    status: "active",
    kashier_subscription_id: "dev-unlock-all-features",
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
    billing_period: "yearly",
  };

  if (existing?.id) {
    const { error } = await admin.from("subscriptions").update(row).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("subscriptions").insert(row);
    if (error) throw error;
  }

  const { data: profile } = await admin.from("profiles").select("plan").eq("id", userId).single();
  console.log(`Unlocked Business for ${userId} (plan=${profile?.plan})`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
