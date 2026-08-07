import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  backfillGeoHistoryFromSignals,
  listGeoHistoryForUser,
} from "@/lib/db/geo-history-repository";
import { buildGeoTrackingSummary } from "@/lib/geo-tracking/analytics";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  let points = await listGeoHistoryForUser(auth.user.id, 48);
  if (!points.length) {
    await backfillGeoHistoryFromSignals(auth.user.id);
    points = await listGeoHistoryForUser(auth.user.id, 48);
  }

  const tracking = buildGeoTrackingSummary(points, { locale: "ar", limit: 48 });
  return NextResponse.json({ tracking });
}
