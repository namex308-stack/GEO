import type { User } from "@supabase/supabase-js";

export const PROFILE_UPDATED_EVENT = "convaudit:profile-updated";

export type ProfileUpdatedDetail = {
  displayName?: string | null;
};

/** Signup / form placeholders that must never appear in chrome. */
const PLACEHOLDER_NAME = /^(name\s*x|your\s+name|full\s+name|enter\s+your\s+name)$/i;

export function sanitizeDisplayName(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return null;
  if (PLACEHOLDER_NAME.test(name)) return null;
  return name;
}

export function notifyProfileUpdated(displayName?: string | null): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ProfileUpdatedDetail>(PROFILE_UPDATED_EVENT, {
      detail: { displayName: sanitizeDisplayName(displayName) },
    })
  );
}

export function getUserDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    sanitizeDisplayName(typeof meta.full_name === "string" ? meta.full_name : null) ||
    sanitizeDisplayName(typeof meta.name === "string" ? meta.name : null) ||
    "";
  if (fromMeta) return fromMeta;
  if (user.email) return user.email.split("@")[0] ?? user.email;
  return "User";
}

export function resolvePreferredDisplayName(
  preferred: string | null | undefined,
  user: User | null
): string {
  return sanitizeDisplayName(preferred) || (user ? getUserDisplayName(user) : "") || "";
}

export function getUserInitials(user: User): string {
  return initialsFromDisplayName(getUserDisplayName(user));
}

export function initialsFromDisplayName(name: string): string {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase() || "U";
}
