import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  listAlertsForUser,
  markAllAlertsReadForUser,
} from "@/lib/db/alerts-repository";
import type { AlertsOverview } from "@/lib/alerts/types";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const alerts = await listAlertsForUser(auth.user.id, 60);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const overview: AlertsOverview = {
    alerts,
    unreadCount,
    channels: {
      inApp: true,
      // Email channel reserved — delivery not implemented yet.
      email: false,
    },
  };

  return NextResponse.json({ alerts: overview });
}

/** Mark all workspace alerts as read for the current user. */
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

  const updated = await markAllAlertsReadForUser(auth.user.id);
  return NextResponse.json({ updated });
}
