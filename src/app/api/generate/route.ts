import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scrapePage } from "@/lib/firecrawl";
import { generateContent } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/redis";

const Body = z.object({
  productUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
    const { success } = await checkRateLimit(ip, "pro");
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const page = await scrapePage(parsed.data.productUrl);
    if (!page) {
      return NextResponse.json({ error: "Could not read the page" }, { status: 422 });
    }

    const content = await generateContent(page);
    return NextResponse.json({ content, demoMode: !process.env.GEMINI_API_KEY });
  } catch (err) {
    console.error("[api/generate] error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
