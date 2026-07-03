import { NextResponse } from "next/server";
import { getAllServices, isFullyConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = getAllServices();
  return NextResponse.json({
    fullyConfigured: isFullyConfigured(),
    services,
    demoMode: !isFullyConfigured(),
  });
}
