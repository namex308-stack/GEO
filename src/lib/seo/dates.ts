/**
 * Calendar-date helpers for Article JSON-LD (not sitemap lastmod).
 * Sitemap omits lastModified when no reliable file/CMS timestamp exists.
 */

export function parseCalendarDate(isoDate: string): Date {
  // Noon UTC avoids off-by-one in western timezones for date-only stamps.
  return new Date(`${isoDate}T12:00:00.000Z`);
}

/** Include schema dates only when they are not in the future (calendar UTC day). */
export function isCalendarDateOnOrBeforeToday(isoDate: string, now = new Date()): boolean {
  const stamp = parseCalendarDate(isoDate).getTime();
  if (Number.isNaN(stamp)) return false;
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)
  );
  return stamp <= today.getTime();
}
