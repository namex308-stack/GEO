/** Quick Gemini connectivity test — run: node scripts/test-gemini.mjs */
import { readFileSync } from "fs";
import { resolve } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const envPath = resolve(process.cwd(), ".env.local");
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
} catch {
  console.error("No .env.local found");
  process.exit(1);
}

const key = process.env.GEMINI_API_KEY?.trim();
if (!key) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}

const models = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b",
];

const client = new GoogleGenerativeAI(key);
const prompt = 'Return ONLY JSON: {"ok":true,"model":"test"}';

for (const modelName of models) {
  try {
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(`✓ ${modelName}: ${text.slice(0, 80)}`);
    process.exit(0);
  } catch (err) {
    const status = err?.status ?? "?";
    const msg = err?.message?.split("\n")[0] ?? String(err);
    console.log(`✗ ${modelName} (${status}): ${msg.slice(0, 120)}`);
  }
}

console.error("\nAll models failed — check quota/billing at https://aistudio.google.com");
process.exit(1);
