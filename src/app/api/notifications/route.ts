import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  listNotificationsForUser,
  markAllNotificationsReadForUser,
} from "@/lib/db/notifications-repository";
import type {
  NotificationCategory,
  NotificationsOverview,
} from "@/lib/notifications/types";
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications/types";

function parseFilter(
  value: string | null
): NotificationCategory | "all" | "archived" {
  if (!value || value === "all") return "all";
  if (value === "archived") return "archived";
  if ((NOTIFICATION_CATEGORIES as string[]).includes(value)) {
    return value as NotificationCategory;
  }
  return "all";
}

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const filter = parseFilter(url.searchParams.get("category"));
  const listed = await listNotificationsForUser(auth.user.id, {
    category: filter,
    limit: 80,
  });

  const overview: NotificationsOverview = {
    notifications: listed.notifications,
    unreadCount: listed.unreadCount,
    archivedCount: listed.archivedCount,
    categoryCounts: listed.categoryCounts,
    filter,
  };

  return NextResponse.json({ notifications: overview });
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  let body: { action?: string } = {};
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    body = {};
  }

  if (body.action !== "read_all") {
    return NextResponse.json({ error: "إجراء غير مدعوم." }, { status: 400 });
  }

  const updated = await markAllNotificationsReadForUser(auth.user.id);
  return NextResponse.json({ updated });
}
