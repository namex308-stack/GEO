/** Auth error codes that mean the stored refresh token is unusable. */
const INVALID_REFRESH_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
]);

export function isInvalidRefreshTokenError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;
  if (error.code && INVALID_REFRESH_CODES.has(error.code)) return true;
  const msg = (error.message ?? "").toLowerCase();
  if (!msg.includes("refresh token") && !msg.includes("refresh_token")) return false;
  return (
    msg.includes("not found") ||
    msg.includes("invalid") ||
    msg.includes("not valid") ||
    msg.includes("already used") ||
    error.code === "validation_failed"
  );
}
