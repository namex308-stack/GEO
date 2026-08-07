import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import type { AuditData, Recommendation } from "@/lib/types";

export type QuickWinDifficulty = "easy" | "medium";

export type QuickWinTask = {
  id: string;
  fingerprint: string;
  title: string;
  estimatedTime: string;
  difficulty: QuickWinDifficulty;
  businessImpact: Recommendation["impact"];
  steps: string[];
  /** True when this finding disappeared after a later re-analysis. */
  completed: boolean;
};

function normalizeFingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function isUnderOneHour(rec: Recommendation): boolean {
  // Only explicit quick effort (or critical/high-impact with unset effort) qualifies as < 1 hour.
  if (rec.effort === "quick") return true;
  if (rec.effort === "medium" || rec.effort === "involved") return false;
  return rec.severity === "critical" || rec.impact === "high";
}

function estimatedTimeFor(rec: Recommendation): string {
  if (rec.severity === "critical" && rec.impact === "high") return "١٥–٣٠ دقيقة";
  if (rec.effort === "quick" || !rec.effort) return "٢٠–٤٥ دقيقة";
  return "أقل من ساعة";
}

function difficultyFor(rec: Recommendation): QuickWinDifficulty {
  if (rec.severity === "critical" || rec.impact === "high") return "easy";
  return "medium";
}

function taskTitle(rec: Recommendation): string {
  const solution = rec.solution?.trim();
  if (solution) {
    const first = solution.split(/\n+/)[0]?.trim() || solution;
    return first.length > 120 ? `${first.slice(0, 117)}…` : first;
  }
  const problem = rec.problem?.trim();
  if (problem) return problem.length > 120 ? `${problem.slice(0, 117)}…` : problem;
  return "تحسين سريع لصفحة المنتج";
}

/** Split solution text into concrete implementation steps (Arabic-friendly). */
export function implementationSteps(rec: Recommendation): string[] {
  const raw = (rec.solution || rec.problem || "").trim();
  if (!raw) {
    return [
      "افتح صفحة المنتج في لوحة المتجر.",
      "طبّق التعديل المطلوب على العنصر الناقص.",
      "احفظ التغييرات وتحقق من الصفحة مباشرة.",
    ];
  }

  const byLine = raw
    .split(/\n+|•|●|\u2022|\d+[.)]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);

  if (byLine.length >= 2) {
    return byLine.slice(0, 5);
  }

  const bySentence = raw
    .split(/[.。!?؟]+\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);

  if (bySentence.length >= 2) {
    return bySentence.slice(0, 4);
  }

  return [
    raw.length > 160 ? `${raw.slice(0, 157)}…` : raw,
    "احفظ التعديل وانشر الصفحة إن لزم.",
    "أعد التحليل لاحقاً للتأكد من اختفاء المشكلة.",
  ];
}

export function buildOpenQuickWins(audit: AuditData): QuickWinTask[] {
  const prioritized = prioritizeRecommendations(audit.recommendations);
  return prioritized
    .filter(isUnderOneHour)
    .slice(0, 8)
    .map((rec, index) => {
      const fingerprint = normalizeFingerprint(rec.problem || rec.id || rec.solution || String(index));
      return {
        id: rec.id || `qw-${index}`,
        fingerprint,
        title: taskTitle(rec),
        estimatedTime: estimatedTimeFor(rec),
        difficulty: difficultyFor(rec),
        businessImpact: rec.impact,
        steps: implementationSteps(rec),
        completed: false,
      };
    });
}

type StoredQuickWins = {
  open: Array<Omit<QuickWinTask, "completed">>;
  completed: Array<Omit<QuickWinTask, "completed"> & { completedAt: string }>;
};

function storageKey(productUrl: string): string {
  const key = normalizeFingerprint(productUrl) || "unknown";
  return `storepulse:quick-wins:${key}`;
}

function readStore(productUrl: string): StoredQuickWins {
  if (typeof window === "undefined") return { open: [], completed: [] };
  try {
    const raw = window.localStorage.getItem(storageKey(productUrl));
    if (!raw) return { open: [], completed: [] };
    const parsed = JSON.parse(raw) as StoredQuickWins;
    return {
      open: Array.isArray(parsed.open) ? parsed.open : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch {
    return { open: [], completed: [] };
  }
}

function writeStore(productUrl: string, data: StoredQuickWins): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(productUrl), JSON.stringify(data));
  } catch {
    // Ignore quota / private mode.
  }
}

/**
 * Merge current quick wins with prior snapshots.
 * Findings that vanished since the last report view are marked completed (re-analysis signal).
 */
export function resolveQuickWinsWithCompletion(
  audit: AuditData
): { open: QuickWinTask[]; completed: QuickWinTask[] } {
  const currentOpen = buildOpenQuickWins(audit);
  const productUrl = audit.productUrl || audit.storeUrl || audit.id || "demo";
  const stored = readStore(productUrl);
  const currentFingerprints = new Set(currentOpen.map((t) => t.fingerprint));

  const newlyCompleted: StoredQuickWins["completed"] = [];
  for (const prev of stored.open) {
    if (!prev.fingerprint || currentFingerprints.has(prev.fingerprint)) continue;
    const already = stored.completed.some((c) => c.fingerprint === prev.fingerprint);
    if (already) continue;
    newlyCompleted.push({
      ...prev,
      completedAt: new Date().toISOString(),
    });
  }

  const completedStore = [...newlyCompleted, ...stored.completed]
    .filter((c) => !currentFingerprints.has(c.fingerprint))
    .slice(0, 12);

  writeStore(productUrl, {
    open: currentOpen.map(({ completed: _c, ...rest }) => rest),
    completed: completedStore,
  });

  return {
    open: currentOpen,
    completed: completedStore.map((c) => ({
      ...c,
      completed: true,
    })),
  };
}
