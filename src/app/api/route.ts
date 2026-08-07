import { NextResponse } from "next/server";
import { getAllServices } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = getAllServices();
  return NextResponse.json({
    name: "ConvAudit API",
    version: "1.0.0",
    status: "ok",
    endpoints: {
      "POST /api/audit": "Run an AI audit on a product URL",
      "GET /api/audit/:id": "Load an audit report",
      "DELETE /api/audit/:id": "Delete an audit",
      "POST /api/audit/:id": "Resolve retry URLs for an existing audit",
      "GET /api/audits": "List workspace audits",
      "GET /api/dashboard": "Dashboard stats from Supabase",
      "GET /api/usage": "Usage meters from usage_events",
      "GET|PATCH /api/profile": "Account profile (Supabase profiles)",
      "GET|PATCH /api/onboarding": "Load / save enterprise onboarding profile",
      "POST /api/generate": "Generate AI copy (title, description, FAQ, meta, ads)",
      "POST /api/checkout": "Create a Kashier checkout session",
      "POST /api/webhook/kashier": "Kashier payment webhook",
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
