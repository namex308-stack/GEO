import "server-only";

export type ServiceKey =
  | "supabase"
  | "google"
  | "gemini"
  | "firecrawl"
  | "paddle"
  | "redis";

export interface ServiceStatus {
  key: ServiceKey;
  name: string;
  configured: boolean;
  missing: string[];
  docs: string;
}

const CHECKS: Record<ServiceKey, { name: string; vars: string[]; docs: string }> = {
  supabase: {
    name: "Supabase",
    vars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    docs: "https://supabase.com/dashboard/project/_/settings/api",
  },
  google: {
    name: "Google OAuth",
    vars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    docs: "https://console.cloud.google.com/apis/credentials",
  },
  gemini: {
    name: "Gemini AI",
    vars: ["GEMINI_API_KEY"],
    docs: "https://aistudio.google.com/app/apikey",
  },
  firecrawl: {
    name: "Firecrawl",
    vars: ["FIRECRAWL_API_KEY"],
    docs: "https://www.firecrawl.dev/",
  },
  paddle: {
    name: "Paddle",
    vars: ["PADDLE_VENDOR_ID", "PADDLE_VENDOR_AUTH_CODE", "PADDLE_PUBLIC_KEY", "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"],
    docs: "https://vendors.paddle.com/developer-tools/authentication",
  },
  redis: {
    name: "Upstash Redis",
    vars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    docs: "https://console.upstash.com/",
  },
};

export function getServiceStatus(key: ServiceKey): ServiceStatus {
  const cfg = CHECKS[key];
  const missing = cfg.vars.filter((v) => !process.env[v]);
  return {
    key,
    name: cfg.name,
    configured: missing.length === 0,
    missing,
    docs: cfg.docs,
  };
}

export function getAllServices(): ServiceStatus[] {
  return (Object.keys(CHECKS) as ServiceKey[]).map(getServiceStatus);
}

export function isFullyConfigured(): boolean {
  return getAllServices().every((s) => s.configured);
}

export function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}
