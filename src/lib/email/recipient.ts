/**
 * Recipient guards for outbound product email.
 * Prevents sends to empty / malformed addresses.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalize and validate an email address for outbound delivery.
 * Returns the trimmed address or null when unsafe / empty.
 */
export function normalizeEmailRecipient(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  if (!email || email.length > 320) return null;
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

/** Whether a candidate address is safe to use as a Resend `to` recipient. */
export function isAuthorizedEmailRecipient(
  value: string | null | undefined
): boolean {
  return normalizeEmailRecipient(value) !== null;
}
