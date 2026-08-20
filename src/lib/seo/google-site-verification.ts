/**
 * Google Search Console HTML-tag verification token.
 * Read from GOOGLE_SITE_VERIFICATION — never hard-code the token in source.
 */
export function getGoogleSiteVerification(): string | undefined {
  const raw = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return raw || undefined;
}

/**
 * Next.js `metadata.verification` fragment when a token is configured.
 */
export function googleSiteVerificationMetadata():
  | { verification: { google: string } }
  | Record<string, never> {
  const token = getGoogleSiteVerification();
  if (!token) return {};
  return { verification: { google: token } };
}
