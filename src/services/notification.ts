import "server-only";

import { sendEmail } from "@/lib/email/resend";

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://convaudit.ai";
}

/**
 * Transactional email helpers (Resend).
 * Safe no-op when RESEND_API_KEY is missing.
 */
export async function sendWelcomeEmail(params: {
  to: string;
  name?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const name = params.name?.trim() || "there";
  const appUrl = appBaseUrl();
  return sendEmail({
    to: params.to,
    subject: "Welcome to convaudit",
    html: `
      <h2>Welcome to convaudit, ${name}!</h2>
      <p>You can run up to 3 free audits per month and see your store's conversion, SEO, GEO, and trust scores.</p>
      <p><a href="${appUrl}/audit/new">Run your first audit</a></p>
      <p>Need help? Reply to this email or visit <a href="${appUrl}/contact">Contact</a>.</p>
    `,
  });
}

export async function sendWeeklyReportEmail(params: {
  to: string;
  siteLabel: string;
  currentScore: number;
  previousScore: number;
  scoreDelta: number;
  summaryHtml?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = appBaseUrl();
  const deltaLabel =
    params.scoreDelta > 0
      ? `+${params.scoreDelta}`
      : `${params.scoreDelta}`;
  return sendEmail({
    to: params.to,
    subject: `Weekly report: ${params.siteLabel} scored ${params.currentScore}/100`,
    html: `
      <h2>convaudit Weekly Report</h2>
      <p>Site: <strong>${params.siteLabel}</strong></p>
      <p><strong>Current score:</strong> ${params.currentScore}/100</p>
      <p><strong>Previous score:</strong> ${params.previousScore}/100 (${deltaLabel})</p>
      ${params.summaryHtml ?? ""}
      <p><a href="${appUrl}/dashboard">Open dashboard</a></p>
    `,
  });
}

export async function sendUpgradeEmail(params: {
  to: string;
  plan: "pro" | "business";
  period?: "monthly" | "yearly";
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = appBaseUrl();
  const planLabel = params.plan === "pro" ? "Pro" : "Business";
  const periodLabel = params.period === "yearly" ? "yearly" : "monthly";
  return sendEmail({
    to: params.to,
    subject: `Your ${planLabel} plan is active`,
    html: `
      <h2>Upgrade successful</h2>
      <p>Your <strong>${planLabel}</strong> (${periodLabel}) subscription is now active.</p>
      <p><a href="${appUrl}/settings/billing">Manage billing</a> · <a href="${appUrl}/audit/new">Run an audit</a></p>
    `,
  });
}

export async function sendAuditCompleteEmail(params: {
  to: string;
  productName: string;
  score: number;
  auditId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = appBaseUrl();
  return sendEmail({
    to: params.to,
    subject: `Audit complete: ${params.productName} scored ${params.score}/100`,
    html: `
      <h2>Your audit is ready</h2>
      <p><strong>${params.productName}</strong> scored <strong>${params.score}/100</strong>.</p>
      <p><a href="${appUrl}/audit/${params.auditId}/report">View full report</a></p>
    `,
  });
}
