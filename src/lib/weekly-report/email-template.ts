import { getSiteUrl } from "@/lib/site-url";
import type { ScoreChange, WeeklyReportPayload } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function deltaBadge(change: ScoreChange): string {
  const delta = change.delta;
  const label = delta > 0 ? `+${delta}` : String(delta);
  const color =
    delta > 0 ? "#0f766e" : delta < 0 ? "#b91c1c" : "#64748b";
  return `<span style="color:${color};font-weight:700">${escapeHtml(label)}</span>`;
}

function scoreRow(label: string, change: ScoreChange): string {
  const current = change.current == null ? "—" : String(change.current);
  const emphasis = change.meaningful
    ? "background:#f8fafc;"
    : "background:#ffffff;opacity:0.85;";
  return `<tr style="${emphasis}">
    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${escapeHtml(label)}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:center">${escapeHtml(current)}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:center">${deltaBadge(change)}</td>
  </tr>`;
}

function issueList(title: string, items: { problem: string }[]): string {
  if (!items.length) {
    return `<p style="margin:0 0 16px;color:#64748b;font-size:14px">${escapeHtml(title)}: لا يوجد.</p>`;
  }
  const lis = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;font-size:14px;line-height:1.5">${escapeHtml(item.problem)}</li>`
    )
    .join("");
  return `<h3 style="margin:20px 0 8px;font-size:16px">${escapeHtml(title)}</h3><ul style="padding-inline-start:18px;margin:0">${lis}</ul>`;
}

/**
 * Email-ready HTML (inline styles, RTL Arabic). Safe to store and send via Resend/SMTP.
 */
export function renderWeeklyReportEmailHtml(
  payload: WeeklyReportPayload,
  reportId: string
): string {
  const site = getSiteUrl();
  const reportUrl = `${site}/reports/weekly/${reportId}`;
  const periodLabel = `${payload.periodStart.slice(0, 10)} → ${payload.periodEnd.slice(0, 10)}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>التقرير الأسبوعي — ${escapeHtml(payload.storeName)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Tahoma,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
          <tr>
            <td style="padding:24px 24px 8px;background:linear-gradient(135deg,#0f766e,#134e4a);color:#fff">
              <div style="font-size:12px;opacity:0.85;margin-bottom:6px">ConvAudit · التقرير الأسبوعي</div>
              <h1 style="margin:0;font-size:22px;line-height:1.35">${escapeHtml(payload.storeName)}</h1>
              <p style="margin:8px 0 0;font-size:13px;opacity:0.9">${escapeHtml(periodLabel)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px">
              <h2 style="margin:0 0 8px;font-size:18px">الملخص التنفيذي</h2>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6">${escapeHtml(payload.executiveSummary.headline)}</p>
              <ul style="margin:0 0 20px;padding-inline-start:18px">
                ${payload.executiveSummary.bullets
                  .map(
                    (b) =>
                      `<li style="margin:0 0 6px;font-size:14px;line-height:1.5">${escapeHtml(b)}</li>`
                  )
                  .join("")}
              </ul>

              <h2 style="margin:0 0 10px;font-size:18px">تغيّر الدرجات</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
                <tr style="background:#f8fafc">
                  <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b">المقياس</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b">الحالي</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b">التغيير</th>
                </tr>
                ${scoreRow("الدرجة الإجمالية", payload.overallScoreChange)}
                ${scoreRow("GEO", payload.geoScoreChange)}
                ${scoreRow("SEO", payload.seoScoreChange)}
                ${scoreRow("الثقة", payload.trustScoreChange)}
                ${scoreRow("التحويل", payload.conversionScoreChange)}
              </table>

              ${issueList("مشاكل جديدة", payload.newIssues)}
              ${issueList("مشاكل تم حلها", payload.resolvedIssues)}
              ${issueList(
                "أعلى أولويات العمل",
                payload.highestPriorityActions.map((a) => ({ problem: a.problem }))
              )}

              <h2 style="margin:24px 0 8px;font-size:18px">ملخص AI التنفيذي</h2>
              <p style="margin:0;font-size:14px;line-height:1.7;background:#f8fafc;border-radius:12px;padding:14px;border:1px solid #e2e8f0">${escapeHtml(payload.aiExecutiveSummary)}</p>

              <div style="margin:28px 0 8px;text-align:center">
                <a href="${escapeHtml(reportUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px;font-weight:700">عرض التقرير الكامل</a>
              </div>
              <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center">يُرسل تلقائياً كل 7 أيام للمتاجر النشطة.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
