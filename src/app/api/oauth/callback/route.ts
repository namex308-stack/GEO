/**
 * OAuth callback for /api/oauth/google.
 * Reuses the existing session-exchange handler (defaults → /dashboard,
 * or resumes guided onboarding when incomplete).
 */
export { GET } from "@/app/auth/callback/route";
