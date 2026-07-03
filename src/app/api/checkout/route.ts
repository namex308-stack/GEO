import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckout, isPaddleConfigured } from "@/lib/paddle";

const Body = z.object({
  planId: z.enum(["pro", "business"]),
  period: z.enum(["monthly", "yearly"]),
  customerEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { planId, period, customerEmail } = parsed.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await createCheckout({
      planId,
      period,
      customerEmail,
      successUrl: `${appUrl}/dashboard?upgraded=${planId}`,
    });

    return NextResponse.json({
      ...checkout,
      configured: isPaddleConfigured(),
    });
  } catch (err) {
    console.error("[api/checkout] error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
