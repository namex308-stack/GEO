import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { getAccountProfile, updateAccountProfile } from "@/lib/db/workspace-stats";
import { normalizeAppLocale } from "@/lib/locale";

const PatchBody = z.object({
  fullName: z.string().trim().max(120).optional(),
  /** Accepted for backward compatibility; always persisted as Arabic. */
  locale: z.string().trim().max(16).optional(),
  timezone: z.string().trim().max(64).optional(),
  businessName: z.string().trim().max(120).optional(),
  country: z.string().trim().max(40).optional(),
});

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const profile = await getAccountProfile(auth.user.id, auth.user.email ?? "");
  if (!profile) {
    return NextResponse.json({ error: "تعذّر تحميل الملف الشخصي." }, { status: 503 });
  }
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات JSON غير صالحة." }, { status: 400 });
  }

  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات الملف الشخصي غير صالحة", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await updateAccountProfile(
    auth.user.id,
    {
      ...parsed.data,
      locale: normalizeAppLocale(parsed.data.locale),
    },
    auth.user.email ?? ""
  );
  if (!updated) {
    return NextResponse.json({ error: "تعذّر حفظ الملف الشخصي." }, { status: 503 });
  }

  return NextResponse.json({ profile: updated });
}
