import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { getStoreHealthForUser } from "@/lib/db/store-health-repository";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const health = await getStoreHealthForUser(auth.user.id);
  return NextResponse.json({ health });
}
