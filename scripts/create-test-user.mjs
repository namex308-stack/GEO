/**
 * Creates (or resets) a confirmed test user for automated E2E testing
 * (TestSprite / CI). Marks onboarding as complete so protected routes
 * are reachable straight after login.
 *
 * Usage: node scripts/create-test-user.mjs
 * Reads Supabase credentials from .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TEST_EMAIL = "storepulse.testsprite@gmail.com";
const TEST_PASSWORD = "TestSprite!2026";

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

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ONBOARDING_COMPLETE = {
  platform: "shopify",
  storeStage: "growing",
  challenge: "traffic_low_sales",
  primaryGoal: "boost_conversions",
  priceRange: "100_500",
  trafficSource: "organic_search",
};

async function main() {
  let userId;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "TestSprite User" },
  });

  if (createError) {
    if (!/already.*(registered|exists)/i.test(createError.message)) {
      console.error("createUser failed:", createError.message);
      process.exit(1);
    }
    // User exists — find it and reset the password so credentials are known.
    const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      console.error("listUsers failed:", listError.message);
      process.exit(1);
    }
    const existing = list.users.find((u) => u.email === TEST_EMAIL);
    if (!existing) {
      console.error("User reported as existing but not found in list.");
      process.exit(1);
    }
    userId = existing.id;
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (updateError) {
      console.error("updateUserById failed:", updateError.message);
      process.exit(1);
    }
    console.log("Existing test user updated:", userId);
  } else {
    userId = created.user.id;
    console.log("Test user created:", userId);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: TEST_EMAIL,
      name: "TestSprite User",
      onboarding: ONBOARDING_COMPLETE,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("Profile upsert failed:", profileError.message);
    process.exit(1);
  }

  console.log("Profile ready with completed onboarding.");
  console.log(`Credentials -> email: ${TEST_EMAIL} | password: ${TEST_PASSWORD}`);
}

main().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});
