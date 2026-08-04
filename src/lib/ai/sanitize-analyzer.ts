import { z } from "zod";
import type { AnalyzerJsonResult, CategorySlug } from "@/lib/db/types";
import {
  normalizePillarModuleResult,
  PILLAR_LABELS_AR,
  type PillarScoreModuleResult,
} from "@/lib/audit/score-modules";

const CategorySlugSchema = z.enum(["conversion", "seo", "geo", "trust"]);

const ScoreSchema = z.object({
  categorySlug: CategorySlugSchema,
  score: z.number(),
  max: z.number().optional(),
  label: z.string().optional(),
  summary: z.string().optional(),
});

const PillarModuleSchema = z.object({
  score: z.number(),
  findings: z.array(z.string()).optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
  summary: z.string().optional(),
});

const RecommendationSchema = z.object({
  externalKey: z.string().optional(),
  categorySlug: CategorySlugSchema,
  severity: z.enum(["critical", "warning", "opportunity"]),
  impact: z.enum(["high", "medium", "low"]),
  effort: z.enum(["quick", "medium", "involved"]).optional(),
  problem: z.string().min(1).max(2000),
  solution: z.string().min(1).max(4000),
  confidence: z.number().optional(),
  affectedPage: z.string().optional(),
  projectedImpact: z.string().optional(),
  beforePreview: z.string().optional(),
  afterPreview: z.string().optional(),
  estimatedLift: z.string().optional(),
  source: z.enum(["firecrawl", "gemini", "rule_engine"]).optional(),
  fixType: z.enum(["manual", "generated", "automatic"]).optional(),
});

const AnalyzerResultSchema = z.object({
  scores: z.array(ScoreSchema).optional(),
  competitorScores: z.array(ScoreSchema).nullable().optional(),
  recommendations: z.array(RecommendationSchema).optional(),
  geoReadability: z
    .object({
      chatgpt: z.number(),
      perplexity: z.number(),
      googleAI: z.number(),
    })
    .optional(),
  overallScoreHint: z.number().optional(),
  competitorScoreHint: z.number().nullable().optional(),
  tokensUsed: z.number().optional(),
  estimatedCost: z.number().optional(),
});

/** Single Gemini response covering conversion + SEO + trust (+ recommendations). */
const BatchedPillarsSchema = z.object({
  pillars: z.object({
    conversion: PillarModuleSchema,
    seo: PillarModuleSchema,
    trust: PillarModuleSchema,
  }),
  competitorPillars: z
    .object({
      conversion: PillarModuleSchema.optional(),
      seo: PillarModuleSchema.optional(),
      trust: PillarModuleSchema.optional(),
    })
    .nullable()
    .optional(),
  recommendations: z.array(RecommendationSchema).optional(),
  overallScoreHint: z.number().optional(),
  competitorScoreHint: z.number().nullable().optional(),
  tokensUsed: z.number().optional(),
  estimatedCost: z.number().optional(),
});

export type BatchedPillarAnalysis = {
  modules: Record<"conversion" | "seo" | "trust", PillarScoreModuleResult>;
  competitorModules?: Partial<Record<"conversion" | "seo" | "trust", PillarScoreModuleResult>>;
  recommendationsResult: AnalyzerJsonResult;
  perPillarResults: Record<"conversion" | "seo" | "trust", AnalyzerJsonResult>;
};

function clamp(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function sanitizeAnalyzerResult(
  analyzer: "conversion" | "seo" | "geo" | "trust" | "recommendations",
  parsed: unknown
): AnalyzerJsonResult {
  const result = AnalyzerResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid analyzer JSON for ${analyzer}`);
  }
  const data = result.data;

  if (analyzer === "recommendations") {
    return {
      overallScoreHint:
        data.overallScoreHint != null ? clamp(data.overallScoreHint) : undefined,
      competitorScoreHint:
        data.competitorScoreHint != null ? clamp(data.competitorScoreHint) : undefined,
      recommendations: (data.recommendations ?? []).slice(0, 12).map((r) => ({
        ...r,
        source: r.source ?? "gemini",
        fixType: r.fixType ?? "manual",
      })),
    };
  }

  const pillar = analyzer as CategorySlug;
  const scores = (data.scores ?? [])
    .filter((s) => s.categorySlug === pillar)
    .map((s) => ({
      categorySlug: s.categorySlug,
      score: clamp(s.score),
      max: 100,
      label: s.label || pillar,
      summary: (s.summary || "").slice(0, 800),
    }));

  const competitorScores = (data.competitorScores ?? undefined)
    ?.filter((s) => s.categorySlug === pillar)
    .map((s) => ({
      categorySlug: s.categorySlug,
      score: clamp(s.score),
      max: 100,
      label: s.label || pillar,
      summary: (s.summary || "").slice(0, 800),
    }));

  return {
    scores,
    competitorScores: competitorScores?.length ? competitorScores : undefined,
    geoReadability:
      analyzer === "geo" && data.geoReadability
        ? {
            chatgpt: clamp(data.geoReadability.chatgpt),
            perplexity: clamp(data.geoReadability.perplexity),
            googleAI: clamp(data.geoReadability.googleAI),
          }
        : undefined,
  };
}

export function sanitizeBatchedPillarAnalysis(parsed: unknown): BatchedPillarAnalysis {
  const result = BatchedPillarsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Invalid batched pillar analyzer JSON");
  }
  const data = result.data;

  const modules = {
    conversion: normalizePillarModuleResult(data.pillars.conversion),
    seo: normalizePillarModuleResult(data.pillars.seo),
    trust: normalizePillarModuleResult(data.pillars.trust),
  };

  const competitorModules: BatchedPillarAnalysis["competitorModules"] = {};
  if (data.competitorPillars) {
    for (const key of ["conversion", "seo", "trust"] as const) {
      const raw = data.competitorPillars[key];
      if (raw) competitorModules[key] = normalizePillarModuleResult(raw);
    }
  }

  const perPillarResults = {
    conversion: moduleToAnalyzerResult("conversion", modules.conversion, competitorModules.conversion),
    seo: moduleToAnalyzerResult("seo", modules.seo, competitorModules.seo),
    trust: moduleToAnalyzerResult("trust", modules.trust, competitorModules.trust),
  };

  return {
    modules,
    competitorModules:
      Object.keys(competitorModules).length > 0 ? competitorModules : undefined,
    perPillarResults,
    recommendationsResult: {
      overallScoreHint:
        data.overallScoreHint != null ? clamp(data.overallScoreHint) : undefined,
      competitorScoreHint:
        data.competitorScoreHint != null ? clamp(data.competitorScoreHint) : undefined,
      recommendations: (data.recommendations ?? []).slice(0, 12).map((r) => ({
        ...r,
        source: r.source ?? "gemini",
        fixType: r.fixType ?? "manual",
      })),
      tokensUsed: data.tokensUsed,
      estimatedCost: data.estimatedCost,
    },
  };
}

function moduleToAnalyzerResult(
  slug: "conversion" | "seo" | "trust",
  mod: PillarScoreModuleResult,
  competitor?: PillarScoreModuleResult
): AnalyzerJsonResult {
  return {
    scores: [
      {
        categorySlug: slug,
        score: mod.score,
        max: 100,
        label: PILLAR_LABELS_AR[slug],
        summary: mod.summary,
      },
    ],
    competitorScores: competitor
      ? [
          {
            categorySlug: slug,
            score: competitor.score,
            max: 100,
            label: PILLAR_LABELS_AR[slug],
            summary: competitor.summary,
          },
        ]
      : undefined,
  };
}
