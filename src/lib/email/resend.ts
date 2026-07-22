import "server-only";

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "convaudit <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured — skipping send");
    return { ok: false, error: "Email not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text ?? params.html.replace(/<[^>]+>/g, ""),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] send failed:", res.status, body);
      return { ok: false, error: body };
    }

    return { ok: true };
  } catch (err) {
    console.error("[email] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

export function buildReportEmail(params: {
  siteLabel: string;
  score: number;
  totalPages?: number;
  pagesWithIssues?: number;
  appUrl: string;
}): { subject: string; html: string } {
  const subject = `Weekly report: ${params.siteLabel} scored ${params.score}/100`;
  const html = `
    <h2>convaudit Weekly Report</h2>
    <p>Your monitored site <strong>${params.siteLabel}</strong> was audited successfully.</p>
    <p><strong>Overall score:</strong> ${params.score}/100</p>
    ${params.totalPages ? `<p><strong>Pages analyzed:</strong> ${params.totalPages}</p>` : ""}
    ${params.pagesWithIssues != null ? `<p><strong>Pages with issues:</strong> ${params.pagesWithIssues}</p>` : ""}
    <p><a href="${params.appUrl}/watch">View monitoring dashboard</a></p>
  `;
  return { subject, html };
}

export function buildAlertEmail(params: {
  siteLabel: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  appUrl: string;
}): { subject: string; html: string } {
  const subject = `Score alert: ${params.siteLabel} dropped to ${params.currentScore}/100`;
  const html = `
    <h2>convaudit Score Alert</h2>
    <p>Your monitored site <strong>${params.siteLabel}</strong> score decreased.</p>
    <p><strong>Previous:</strong> ${params.previousScore}/100</p>
    <p><strong>Current:</strong> ${params.currentScore}/100 (${params.delta})</p>
    <p><a href="${params.appUrl}/watch">Review changes</a></p>
  `;
  return { subject, html };
}

export function buildIssueEmail(params: {
  siteLabel: string;
  issues: string[];
  appUrl: string;
}): { subject: string; html: string } {
  const subject = `New issues detected on ${params.siteLabel}`;
  const list = params.issues.map((i) => `<li>${i}</li>`).join("");
  const html = `
    <h2>convaudit Issue Notification</h2>
    <p>New issues were detected on <strong>${params.siteLabel}</strong>:</p>
    <ul>${list}</ul>
    <p><a href="${params.appUrl}/watch/alerts">View alerts</a></p>
  `;
  return { subject, html };
}
