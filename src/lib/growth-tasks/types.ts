import type { Recommendation, ScorePillar } from "@/lib/types";
import type {
  RoadmapDifficulty,
  RoadmapHorizon,
  RoadmapPriority,
} from "@/lib/report/growth-roadmap";

export type GrowthTaskStatus = "open" | "done" | "auto_resolved";

export type GrowthTaskCompletionSource = "user" | "reanalysis";

export type GrowthTaskRecord = {
  id: string;
  workspaceId: string;
  storeId: string | null;
  fingerprint: string;
  externalKey: string | null;
  title: string;
  category: ScorePillar;
  priority: RoadmapPriority;
  difficulty: RoadmapDifficulty;
  estimatedTime: string;
  expectedBusinessImpact: string;
  horizon: RoadmapHorizon;
  suggestedOrder: number;
  status: GrowthTaskStatus;
  completedAt: string | null;
  completionSource: GrowthTaskCompletionSource | null;
  sourceAuditId: string | null;
  resolvedAuditId: string | null;
  recommendationProblem: string | null;
  recommendationSolution: string | null;
  severity: Recommendation["severity"] | null;
  impact: Recommendation["impact"] | null;
  effort: NonNullable<Recommendation["effort"]> | null;
  createdAt: string;
  updatedAt: string;
};

export type GrowthTaskUpsert = {
  fingerprint: string;
  externalKey: string;
  title: string;
  category: ScorePillar;
  priority: RoadmapPriority;
  difficulty: RoadmapDifficulty;
  estimatedTime: string;
  expectedBusinessImpact: string;
  horizon: RoadmapHorizon;
  suggestedOrder: number;
  status: GrowthTaskStatus;
  completedAt: string | null;
  completionSource: GrowthTaskCompletionSource | null;
  sourceAuditId: string;
  resolvedAuditId: string | null;
  recommendationProblem: string;
  recommendationSolution: string;
  severity: Recommendation["severity"];
  impact: Recommendation["impact"];
  effort: NonNullable<Recommendation["effort"]>;
};

export type GrowthTaskHorizonGroup = {
  horizon: RoadmapHorizon;
  tasks: GrowthTaskRecord[];
};

export type GrowthTasksOverview = {
  groups: GrowthTaskHorizonGroup[];
  openCount: number;
  doneCount: number;
  autoResolvedCount: number;
  totalCount: number;
};
