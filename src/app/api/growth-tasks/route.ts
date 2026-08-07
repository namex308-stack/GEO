import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { listGrowthTasksForUser } from "@/lib/db/growth-tasks-repository";
import { groupTasksByHorizon } from "@/lib/growth-tasks/sync";
import type { GrowthTasksOverview } from "@/lib/growth-tasks/types";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const tasks = await listGrowthTasksForUser(auth.user.id);
  const overview: GrowthTasksOverview = {
    groups: groupTasksByHorizon(tasks),
    openCount: tasks.filter((t) => t.status === "open").length,
    doneCount: tasks.filter((t) => t.status === "done").length,
    autoResolvedCount: tasks.filter((t) => t.status === "auto_resolved").length,
    totalCount: tasks.length,
  };

  return NextResponse.json({ tasks: overview });
}
