import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (code) {
    return NextResponse.redirect(`${redirectTo}/onboarding/platform?auth=success`);
  }
  return NextResponse.redirect(`${redirectTo}/auth?error=no_code`);
}
