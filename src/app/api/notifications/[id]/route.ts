import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  archiveNotificationForUser,
  markNotificationReadForUser,
} from "@/lib/db/notifications-repository";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "معرّف الإشعار مطلوب." }, { status: 400 });
  }

  let body: { action?: "read" | "archive" } = {};
  try {
    body = (await request.json()) as { action?: "read" | "archive" };
  } catch {
    body = {};
  }

  if (body.action === "archive") {
    const notification = await archiveNotificationForUser(id, auth.user.id);
    if (!notification) {
      return NextResponse.json({ error: "الإشعار غير موجود." }, { status: 404 });
    }
    return NextResponse.json({ notification });
  }

  if (body.action === "read" || body.action == null) {
    const notification = await markNotificationReadForUser(id, auth.user.id);
    if (!notification) {
      return NextResponse.json({ error: "الإشعار غير موجود." }, { status: 404 });
    }
    return NextResponse.json({ notification });
  }

  return NextResponse.json({ error: "إجراء غير مدعوم." }, { status: 400 });
}
