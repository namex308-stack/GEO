/**
 * Build the `redirect` query value when sending unauthenticated users to login.
 * Must preserve pathname + search so `/checkout?plan=…&period=…` survives auth.
 */
export function buildLoginRedirectTarget(
  pathname: string,
  search: string,
  options?: { isOnboardingRoute?: boolean }
): string {
  if (options?.isOnboardingRoute) return "/onboarding";
  const q = search.startsWith("?") || search === "" ? search : `?${search}`;
  return `${pathname}${q}`;
}
