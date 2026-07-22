import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getUserBillingContext } from "@/lib/billing/usage";
import { getPlanLimits } from "@/lib/billing/entitlements";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getUserBillingContext(user.id);
    const limits = getPlanLimits(ctx.plan);

    return NextResponse.json({
      plan: ctx.plan,
      auditsUsed: ctx.auditsUsed,
      generationsUsed: ctx.generationsUsed,
      billingPeriod: ctx.billingPeriod ?? null,
      currentPeriodEnd: ctx.currentPeriodEnd ?? null,
      subscriptionStatus: ctx.subscriptionStatus ?? null,
      limits: {
        auditsPerMonth: limits.auditsPerMonth,
        canCrawl: limits.canCrawl,
        crawlMaxPages: limits.crawlMaxPages,
        hasMonitoring: limits.hasMonitoring,
        monitoringMaxSites: limits.monitoringMaxSites,
        hasEmailNotifications: limits.hasEmailNotifications,
        canCompare: limits.canCompare,
        canExportPdf: limits.canExportPdf,
      },
    });
  } catch (err) {
    console.error("[api/billing] GET error:", err);
    return NextResponse.json({ error: "Failed to load billing info." }, { status: 500 });
  }
}
