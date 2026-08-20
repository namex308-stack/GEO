import type { TranslationKey } from "@/lib/i18n";

export type AuthErrorLike = {
  message?: string;
  code?: string;
};

export function mapAuthErrorMessage(
  error: AuthErrorLike | string,
  t: (key: TranslationKey) => string
): string {
  const message = (typeof error === "string" ? error : error.message ?? "").trim();
  const code = (typeof error === "string" ? "" : error.code ?? "").trim().toLowerCase();
  const lower = `${code} ${message}`.toLowerCase();

  if (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return t("auth.error.invalidCredentials");
  }
  if (code === "email_not_confirmed" || lower.includes("email not confirmed")) {
    return t("auth.error.emailNotConfirmed");
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already been registered") ||
    code === "user_already_exists"
  ) {
    return t("auth.error.alreadyRegistered");
  }
  if (
    (lower.includes("email address") &&
      (lower.includes("invalid") || lower.includes("is invalid"))) ||
    lower.includes("unable to validate email") ||
    lower.includes("valid email") ||
    code === "email_address_invalid"
  ) {
    return t("auth.error.invalidEmail");
  }
  if (
    (lower.includes("password") && (lower.includes("weak") || lower.includes("at least"))) ||
    code === "weak_password"
  ) {
    return t("auth.error.weakPassword");
  }
  if (
    lower.includes("rate limit") ||
    lower.includes("too many") ||
    code === "over_request_rate_limit"
  ) {
    return t("auth.error.rateLimited");
  }
  return message || t("auth.error.generic");
}
