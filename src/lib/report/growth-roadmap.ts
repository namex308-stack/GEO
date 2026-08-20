import { isGenericSolution, solutionForFinding } from "@/lib/audit/finding-copy";
import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import { recommendationKey } from "@/lib/weekly-report/compare";
import type { AuditData, Recommendation, ScorePillar } from "@/lib/types";

export type RoadmapHorizon = "today" | "week" | "month" | "longterm";

export type RoadmapPriority = "p1" | "p2" | "p3";

export type RoadmapDifficulty = "easy" | "medium" | "hard";

export type GrowthRoadmapTask = {
  id: string;
  horizon: RoadmapHorizon;
  title: string;
  priority: RoadmapPriority;
  businessImpact: Recommendation["impact"];
  estimatedTime: string;
  difficulty: RoadmapDifficulty;
  expectedResult: string;
  roiScore: number;
  pillar: ScorePillar | "growth";
};

/** Actionable task derived from a prioritized recommendation (shared with Growth Tasks Engine). */
export type RecommendationTaskDraft = {
  fingerprint: string;
  externalKey: string;
  horizon: RoadmapHorizon;
  title: string;
  category: ScorePillar;
  priority: RoadmapPriority;
  difficulty: RoadmapDifficulty;
  estimatedTime: string;
  expectedBusinessImpact: string;
  suggestedOrder: number;
  severity: Recommendation["severity"];
  impact: Recommendation["impact"];
  effort: NonNullable<Recommendation["effort"]>;
  problem: string;
  solution: string;
  roiScore: number;
};

export type GrowthRoadmap = Record<RoadmapHorizon, GrowthRoadmapTask[]>;

const IMPACT_WEIGHT: Record<Recommendation["impact"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const EFFORT_COST: Record<NonNullable<Recommendation["effort"]>, number> = {
  quick: 1,
  medium: 2,
  involved: 3,
};

const SEVERITY_BONUS: Record<Recommendation["severity"], number> = {
  critical: 1.5,
  warning: 1.2,
  opportunity: 1,
};

const TIME_BY_EFFORT: Record<NonNullable<Recommendation["effort"]>, string> = {
  quick: "١٥–٤٥ دقيقة",
  medium: "٢–٤ ساعات",
  involved: "١–٣ أيام",
};

const DIFFICULTY_BY_EFFORT: Record<
  NonNullable<Recommendation["effort"]>,
  RoadmapDifficulty
> = {
  quick: "easy",
  medium: "medium",
  involved: "hard",
};

function resolveEffort(rec: Recommendation): NonNullable<Recommendation["effort"]> {
  if (rec.effort) return rec.effort;
  if (rec.severity === "critical" || rec.impact === "high") return "quick";
  if (rec.severity === "opportunity") return "involved";
  return "medium";
}

function roiScore(rec: Recommendation): number {
  const effort = resolveEffort(rec);
  return (IMPACT_WEIGHT[rec.impact] * SEVERITY_BONUS[rec.severity]) / EFFORT_COST[effort];
}

function expectedResultFor(rec: Recommendation): string {
  const projected = rec.projectedImpact?.trim();
  if (projected) return projected;
  const lift = rec.estimatedLift?.trim();
  if (lift) return lift;

  switch (rec.impact) {
    case "high":
      return "تحسن ملحوظ في التحويل أو الثقة خلال دورة شراء واحدة.";
    case "medium":
      return "تحسن متوسط في وضوح الصفحة ومعدّل إكمال الشراء.";
    case "low":
      return "تحسن تدريجي في جودة الصفحة والظهور.";
    default: {
      const _exhaustive: never = rec.impact;
      return _exhaustive;
    }
  }
}

/** Action title — execution-focused, not a copy of the recommendation problem card. */
function taskTitle(rec: Recommendation): string {
  const raw = isGenericSolution(rec.solution)
    ? solutionForFinding(rec.problem, rec.pillar)
    : rec.solution?.trim();
  if (raw) {
    const firstLine = raw.split(/\n+/)[0]?.trim() || raw;
    return firstLine.length > 140 ? `${firstLine.slice(0, 137)}…` : firstLine;
  }
  return solutionForFinding(rec.problem, rec.pillar).split(/\n+/)[0] ?? "نفّذ تحسين صفحة المنتج";
}

function assignHorizon(
  rec: Recommendation,
  effort: NonNullable<Recommendation["effort"]>,
  roi: number
): RoadmapHorizon {
  if (effort === "quick" && (rec.severity === "critical" || rec.impact === "high" || roi >= 3)) {
    return "today";
  }
  if (effort === "quick" || (effort === "medium" && (rec.impact === "high" || rec.severity === "critical"))) {
    return "week";
  }
  if (effort === "medium" || rec.impact === "medium") {
    return "month";
  }
  return "longterm";
}

function priorityFromRoiRank(rank: number): RoadmapPriority {
  if (rank <= 3) return "p1";
  if (rank <= 7) return "p2";
  return "p3";
}

/**
 * Transform every recommendation into an actionable task using the shared
 * prioritization engine — does not re-implement ranking rules.
 */
export function buildTasksFromRecommendations(
  recommendations: Recommendation[]
): RecommendationTaskDraft[] {
  const prioritized = prioritizeRecommendations(recommendations);
  const byRoi = [...prioritized].sort((a, b) => {
    const d = roiScore(b) - roiScore(a);
    if (d !== 0) return d;
    return (a.priorityRank ?? 99) - (b.priorityRank ?? 99);
  });

  const horizonCaps: Record<RoadmapHorizon, number> = {
    today: 3,
    week: 4,
    month: 4,
    longterm: Number.POSITIVE_INFINITY,
  };
  const horizonCounts: Record<RoadmapHorizon, number> = {
    today: 0,
    week: 0,
    month: 0,
    longterm: 0,
  };
  const order: RoadmapHorizon[] = ["today", "week", "month", "longterm"];

  return byRoi.map((rec, index) => {
    const effort = resolveEffort(rec);
    const roi = roiScore(rec);
    let horizon = assignHorizon(rec, effort, roi);

    const start = order.indexOf(horizon);
    for (let i = start; i < order.length; i++) {
      const h = order[i]!;
      if (horizonCounts[h] < horizonCaps[h]) {
        horizon = h;
        break;
      }
    }
    horizonCounts[horizon] += 1;

    const fingerprint =
      recommendationKey(rec) || rec.id || `rec-${index + 1}`;

    return {
      fingerprint,
      externalKey: rec.id || fingerprint,
      horizon,
      title: taskTitle(rec),
      category: rec.pillar,
      priority: priorityFromRoiRank(index + 1),
      difficulty: DIFFICULTY_BY_EFFORT[effort],
      estimatedTime: TIME_BY_EFFORT[effort],
      expectedBusinessImpact: expectedResultFor(rec),
      suggestedOrder: index + 1,
      severity: rec.severity,
      impact: rec.impact,
      effort,
      problem: rec.problem,
      solution: rec.solution,
      roiScore: roi,
    };
  });
}

function pillarScore(audit: AuditData, pillar: ScorePillar): number {
  return audit.breakdown.find((b) => b.pillar === pillar)?.score ?? 0;
}

/**
 * Strategic growth tasks that are NOT copies of recommendation cards —
 * only used to fill long-term when pillars are weak and uncovered.
 */
function strategicGrowthTasks(
  audit: AuditData,
  coveredPillars: Set<ScorePillar>
): GrowthRoadmapTask[] {
  const tasks: GrowthRoadmapTask[] = [];
  const geo = audit.geoAnalysis?.score ?? pillarScore(audit, "geo");

  if (pillarScore(audit, "trust") < 60 && !coveredPillars.has("trust")) {
    tasks.push({
      id: "growth-trust-system",
      horizon: "longterm",
      title: "ابنِ نظام ثقة دائم: سياسات واضحة، إثبات اجتماعي، وطرق دفع ظاهرة في كل صفحات المنتج.",
      priority: "p2",
      businessImpact: "high",
      estimatedTime: "١–٢ أسبوع",
      difficulty: "hard",
      expectedResult: "رفع ثقة المشتري وتقليل التردد قبل الدفع.",
      roiScore: 1.4,
      pillar: "trust",
    });
  }

  if (geo < 55 && !coveredPillars.has("geo")) {
    tasks.push({
      id: "growth-geo-content",
      horizon: "longterm",
      title: "طوّر محتوى قابلاً للاقتباس (FAQ، مقارنات، إجابات مباشرة) لرفع توصية المساعدات الذكية.",
      priority: "p2",
      businessImpact: "high",
      estimatedTime: "١–٣ أسابيع",
      difficulty: "hard",
      expectedResult: "زيادة فرصة ظهور المتجر في إجابات ChatGPT وPerplexity.",
      roiScore: 1.35,
      pillar: "geo",
    });
  }

  if (pillarScore(audit, "seo") < 60 && !coveredPillars.has("seo")) {
    tasks.push({
      id: "growth-seo-program",
      horizon: "month",
      title: "نفّذ برنامج SEO للمنتجات: عناوين، meta، وschema متسقة عبر أهم الصفحات.",
      priority: "p3",
      businessImpact: "medium",
      estimatedTime: "٣–٧ أيام",
      difficulty: "medium",
      expectedResult: "تحسن الاكتشاف العضوي ونقرات نتائج البحث.",
      roiScore: 1.1,
      pillar: "seo",
    });
  }

  if (audit.overallScore < 70) {
    tasks.push({
      id: "growth-remeasure",
      horizon: "longterm",
      title: "أعد تحليل المتجر بعد تطبيق الإصلاحات وقِس التحسن مقابل هذه الخارطة.",
      priority: "p3",
      businessImpact: "medium",
      estimatedTime: "٣٠–٦٠ دقيقة",
      difficulty: "easy",
      expectedResult: "قياس ROI الفعلي وتحديد الدورة التالية من النمو.",
      roiScore: 1.0,
      pillar: "growth",
    });
  }

  return tasks;
}

/**
 * Build an ROI-sorted execution roadmap.
 * Tasks are action-oriented and intentionally do not restate recommendation problem cards.
 */
export function buildGrowthRoadmap(audit: AuditData): GrowthRoadmap {
  const empty: GrowthRoadmap = {
    today: [],
    week: [],
    month: [],
    longterm: [],
  };

  const drafts = buildTasksFromRecommendations(audit.recommendations);
  const coveredPillars = new Set<ScorePillar>();

  for (const draft of drafts) {
    coveredPillars.add(draft.category);
    empty[draft.horizon].push({
      id: `rec-${draft.externalKey}`,
      horizon: draft.horizon,
      title: draft.title,
      priority: draft.priority,
      businessImpact: draft.impact,
      estimatedTime: draft.estimatedTime,
      difficulty: draft.difficulty,
      expectedResult: draft.expectedBusinessImpact,
      roiScore: draft.roiScore,
      pillar: draft.category,
    });
  }

  const strategicCaps: Record<RoadmapHorizon, number> = {
    today: 5,
    week: 6,
    month: 6,
    longterm: 6,
  };

  for (const task of strategicGrowthTasks(audit, coveredPillars)) {
    if (empty[task.horizon].length < strategicCaps[task.horizon]) {
      empty[task.horizon].push(task);
    }
  }

  for (const horizon of Object.keys(empty) as RoadmapHorizon[]) {
    empty[horizon].sort((a, b) => b.roiScore - a.roiScore);
  }

  return empty;
}

export const ROADMAP_HORIZON_ORDER: RoadmapHorizon[] = [
  "today",
  "week",
  "month",
  "longterm",
];
