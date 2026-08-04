import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";
  if (fromMeta) return fromMeta;
  if (user.email) return user.email.split("@")[0] ?? user.email;
  return "User";
}

export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user).trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "U";
}
