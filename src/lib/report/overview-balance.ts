import type { ScoreBreakdown, ScorePillar } from "@/lib/types";

export type BalanceProfile =
  | "balanced_strong"
  | "balanced_moderate"
  | "balanced_weak"
  | "unbalanced";

export type OverviewBalance = {
  profile: BalanceProfile;
  strongest: ScorePillar | null;
  weakest: ScorePillar | null;
  spread: number;
};

const PILLAR_ORDER: ScorePillar[] = ["conversion", "seo", "geo", "trust"];

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Describe pillar balance from existing audit scores — does not recompute scoring. */
export function describeScoreBalance(
  overallScore: number,
  breakdown: ScoreBreakdown[]
): OverviewBalance {
  const scores = PILLAR_ORDER.map((pillar) => {
    const found = breakdown.find((b) => b.pillar === pillar);
    return { pillar, score: clampScore(found?.score ?? 0) };
  });

  if (scores.length === 0) {
    return { profile: "balanced_weak", strongest: null, weakest: null, spread: 0 };
  }

  let strongest = scores[0]!;
  let weakest = scores[0]!;
  for (const item of scores) {
    if (item.score > strongest.score) strongest = item;
    if (item.score < weakest.score) weakest = item;
  }

  const spread = strongest.score - weakest.score;
  const overall = clampScore(overallScore);

  if (spread > 18) {
    return {
      profile: "unbalanced",
      strongest: strongest.pillar,
      weakest: weakest.pillar,
      spread,
    };
  }

  let profile: BalanceProfile;
  if (overall >= 75) profile = "balanced_strong";
  else if (overall >= 55) profile = "balanced_moderate";
  else profile = "balanced_weak";

  return {
    profile,
    strongest: strongest.pillar,
    weakest: weakest.pillar,
    spread,
  };
}
