import { NextResponse } from "next/server";
import { getAllServices } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = getAllServices();
  return NextResponse.json({
    name: "StorePulse AI API",
    version: "1.0.0",
    status: "ok",
    endpoints: {
      "POST /api/audit": "Run an AI audit on a product URL",
      "POST /api/generate": "Generate AI copy (title, description, FAQ, meta, ads)",
      "POST /api/checkout": "Create a Paddle checkout session",
      "GET /api/oauth/google": "Start Google OAuth via Supabase",
      "GET /api/oauth/callback": "OAuth callback handler",
      "GET /api/status": "Check which integrations are configured",
    },
    integrations: services.map((s) => ({
      name: s.name,
      configured: s.configured,
      ...(s.configured ? {} : { missing: s.missing, docs: s.docs }),
    })),
  });
}
