import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { setGrowthTaskCompletionForUser } from "@/lib/db/growth-tasks-repository";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "معرّف المهمة مطلوب." }, { status: 400 });
  }

  let body: { completed?: boolean } = {};
  try {
    body = (await request.json()) as { completed?: boolean };
  } catch {
    body = {};
  }

  if (typeof body.completed !== "boolean") {
    return NextResponse.json(
      { error: "يرجى إرسال completed: true|false." },
      { status: 400 }
    );
  }

  const task = await setGrowthTaskCompletionForUser({
    taskId: id,
    userId: auth.user.id,
    completed: body.completed,
  });

  if (!task) {
    return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });
  }

  return NextResponse.json({ task });
}
