import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModels } from "@/lib/ai/models";

let _client: GoogleGenerativeAI | null = null;
let _clientKey: string | undefined;

export function getGeminiApiKey(): string | undefined {
  const key = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)?.trim();
  return key || undefined;
}

export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey();
}

function getClient(): GoogleGenerativeAI | null {
  const key = getGeminiApiKey();
  if (!key) return null;
  if (!_client || _clientKey !== key) {
    _client = new GoogleGenerativeAI(key);
    _clientKey = key;
  }
  return _client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryDelayMs(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const e = err as {
    errorDetails?: { "@type"?: string; retryDelay?: string }[];
    message?: string;
  };

  for (const detail of e.errorDetails ?? []) {
    if (detail["@type"]?.includes("RetryInfo") && detail.retryDelay) {
      const sec = parseFloat(String(detail.retryDelay).replace(/s$/i, ""));
      if (!Number.isNaN(sec)) return Math.ceil(sec * 1000);
    }
  }

  const match = e.message?.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (match?.[1]) return Math.ceil(parseFloat(match[1]) * 1000);
  return null;
}

function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  return (err as { status?: number }).status;
}

function isRateLimited(err: unknown): boolean {
  const status = getErrorStatus(err);
  return status === 429 || status === 503;
}

function isModelError(err: unknown): boolean {
  const status = getErrorStatus(err);
  return status === 400 || status === 404;
}

async function generateWithModel(
  client: GoogleGenerativeAI,
  modelName: string,
  prompt: string,
  maxRetries: number
): Promise<string> {
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: 0.35, responseMimeType: "application/json" },
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (isRateLimited(err) && attempt < maxRetries) {
        const delay = Math.min(parseRetryDelayMs(err) ?? (attempt + 1) * 8000, 45000);
        console.warn(`[gemini] ${modelName} rate limited — retrying in ${Math.round(delay / 1000)}s`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  throw new Error(`[gemini] ${modelName} exhausted retries`);
}

export interface GenerateJsonResult<T> {
  data: T;
  aiEnhanced: boolean;
}

export async function generateJson<T>(prompt: string, fallback: T): Promise<GenerateJsonResult<T>> {
  const client = getClient();
  if (!client) return { data: fallback, aiEnhanced: false };

  const models = getGeminiModels();

  for (const modelName of models) {
    try {
      const text = await generateWithModel(client, modelName, prompt, 2);
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const data = JSON.parse(cleaned) as T;
      console.info(`[gemini] OK — ${modelName}`);
      return { data, aiEnhanced: true };
    } catch (err) {
      const status = getErrorStatus(err);
      const msg = err instanceof Error ? err.message.slice(0, 200) : String(err);
      console.error(`[gemini] ${modelName} failed${status ? ` (${status})` : ""}: ${msg}`);
      if (!isRateLimited(err) && !isModelError(err)) break;
    }
  }

  return { data: fallback, aiEnhanced: false };
}

/** Plain-text generation for copy rewriting (Content Improver). */
export async function generateText(prompt: string, fallback: string): Promise<{ text: string; aiEnhanced: boolean }> {
  const client = getClient();
  if (!client) return { text: fallback, aiEnhanced: false };

  const models = getGeminiModels();

  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.7 },
      });

      let text = "";
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          text = result.response.text().trim();
          break;
        } catch (err) {
          if (isRateLimited(err) && attempt < 2) {
            const delay = Math.min(parseRetryDelayMs(err) ?? (attempt + 1) * 8000, 45000);
            await sleep(delay);
            continue;
          }
          throw err;
        }
      }

      if (text) {
        console.info(`[gemini] text OK — ${modelName}`);
        return { text, aiEnhanced: true };
      }
    } catch (err) {
      const status = getErrorStatus(err);
      const msg = err instanceof Error ? err.message.slice(0, 200) : String(err);
      console.error(`[gemini] text ${modelName} failed${status ? ` (${status})` : ""}: ${msg}`);
      if (!isRateLimited(err) && !isModelError(err)) break;
    }
  }

  return { text: fallback, aiEnhanced: false };
}
