/**
 * Seeds a completed audit for the E2E test user so report, history,
 * comparison, and PDF flows have real data during automated testing.
 *
 * Usage: node scripts/seed-test-audit.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TEST_EMAIL = "storepulse.testsprite@gmail.com";

function loadEnvLocal() {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

loadEnvLocal();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const breakdown = [
  { pillar: "conversion", score: 18, max: 25, label: "Conversion", summary: "Strong CTA placement, but product images lack zoom and reviews are below the fold." },
  { pillar: "seo", score: 18, max: 25, label: "SEO", summary: "Title and meta description present; missing structured data for offers and breadcrumbs." },
  { pillar: "geo", score: 15, max: 25, label: "AI Visibility", summary: "Content is parseable but lacks FAQ schema and clear spec tables AI engines prefer." },
  { pillar: "trust", score: 21, max: 25, label: "Trust", summary: "HTTPS, return policy and contact info present. Add visible security badges near checkout." },
];

const competitorBreakdown = [
  { pillar: "conversion", score: 16, max: 25, label: "Conversion", summary: "Competitor has weaker CTA hierarchy." },
  { pillar: "seo", score: 20, max: 25, label: "SEO", summary: "Competitor ships full product schema." },
  { pillar: "geo", score: 17, max: 25, label: "AI Visibility", summary: "Competitor includes an FAQ section." },
  { pillar: "trust", score: 15, max: 25, label: "Trust", summary: "Competitor missing return policy link." },
];

const recommendations = [
  { id: "rec-1", pillar: "seo", severity: "critical", problem: "Missing Product structured data (schema.org)", why: "Search engines and AI assistants cannot extract price, availability, or ratings.", solution: "Add JSON-LD Product schema with offers, aggregateRating, and brand fields.", impact: "high", effort: "quick", estimatedLift: "+12% organic CTR" },
  { id: "rec-2", pillar: "conversion", severity: "warning", problem: "Reviews are below the fold", why: "Social proof is a primary conversion driver on product pages.", solution: "Move the review summary (stars + count) directly under the product title.", impact: "medium", effort: "quick", estimatedLift: "+5% add-to-cart" },
  { id: "rec-3", pillar: "geo", severity: "warning", problem: "No FAQ section for AI engines", why: "ChatGPT and Perplexity favor pages with question-answer content.", solution: "Add an FAQ block with 4-6 common questions and FAQPage schema.", impact: "high", effort: "medium", estimatedLift: "+20% AI citation likelihood" },
  { id: "rec-4", pillar: "trust", severity: "opportunity", problem: "No security badges near the buy button", solution: "Display payment provider logos and an SSL badge next to the CTA.", impact: "low", effort: "quick" },
];

async function main() {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", TEST_EMAIL)
    .single();

  if (profileError || !profile) {
    console.error("Test user profile not found. Run scripts/create-test-user.mjs first.");
    process.exit(1);
  }

  const { data: existing } = await admin
    .from("audits")
    .select("id")
    .eq("user_id", profile.id)
    .eq("status", "complete")
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Completed audit already seeded:", existing[0].id);
    return;
  }

  const { data: audit, error: auditError } = await admin
    .from("audits")
    .insert({
      user_id: profile.id,
      product_url: "https://demo-store.example.com/products/wireless-earbuds",
      store_url: "https://demo-store.example.com",
      competitor_url: "https://rival-store.example.com/products/wireless-earbuds",
      status: "complete",
      overall_score: 72,
      competitor_score: 68,
      breakdown,
      competitor_breakdown: competitorBreakdown,
      geo_readability: { chatgpt: 74, perplexity: 69, googleAI: 78 },
      recommendations,
      product_name: "Wireless Earbuds Pro",
      store_name: "Demo Store",
      engine_results: { aiEnhanced: true },
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (auditError) {
    console.error("Audit insert failed:", auditError.message);
    process.exit(1);
  }

  console.log("Seeded completed audit:", audit.id);
}

main().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});
