export type FlowStep =
  | "quiz"
  | "connect"
  | "audit"
  | "scanning"
  | "report"
  | "customerEye"
  | "priorityFixes"
  | "recommendations"
  | "generate"
  | "export"
  | "done";

export const FLOW_STEPS: FlowStep[] = [
  "quiz",
  "connect",
  "audit",
  "scanning",
  "report",
  "customerEye",
  "priorityFixes",
  "recommendations",
  "generate",
  "export",
  "done",
];

export const LS_LAST_AUDIT_ID = "convaudit:lastAuditId";
export const LS_CONNECTED_WEBSITE = "convaudit:connectedWebsite";
export const SS_MONITOR_PROMPT = "convaudit:monitorPromptShown";

const ONBOARDING_FLOW_KEYS = [
  "flowStep",
  "connectedWebsite",
  "lastAuditId",
  "flowComplete",
] as const;

export type OnboardingFlowFields = {
  flowStep?: FlowStep;
  connectedWebsite?: string;
  lastAuditId?: string;
  flowComplete?: string;
};

export function isFlowStep(value: unknown): value is FlowStep {
  return typeof value === "string" && (FLOW_STEPS as string[]).includes(value);
}

export function getFlowStep(
  data: Record<string, string> | null | undefined
): FlowStep {
  const raw = data?.flowStep;
  if (isFlowStep(raw)) return raw;
  return "quiz";
}

export function isGuidedFlowComplete(
  data: Record<string, string> | null | undefined
): boolean {
  if (data?.flowComplete === "true") return true;
  // Legacy users who finished the quiz before flow tracking
  if (data && !data.flowStep) {
    const quizKeys = [
      "platform",
      "storeStage",
      "challenge",
      "primaryGoal",
      "priceRange",
      "trafficSource",
    ];
    const quizDone = quizKeys.every(
      (k) => typeof data[k] === "string" && data[k].length > 0
    );
    if (quizDone) return true;
  }
  return false;
}

/** Onboarding route for a pre-audit flow step. */
export function onboardingPathForStep(step: FlowStep): string {
  if (step === "connect") return "/onboarding/connect";
  if (step === "audit") return "/onboarding/audit";
  if (step === "quiz") return "/onboarding/quiz";
  return "/onboarding/quiz";
}

/**
 * Resolve where an incomplete guided flow should resume.
 * Post-audit steps map to audit routes when lastAuditId exists.
 */
export function resumePathForFlow(
  data: Record<string, string> | null | undefined
): string {
  if (isGuidedFlowComplete(data)) return "/dashboard";

  const step = getFlowStep(data);
  const auditId = data?.lastAuditId;

  if (step === "quiz" || step === "connect" || step === "audit") {
    return onboardingPathForStep(step);
  }

  if (!auditId) {
    if (data?.connectedWebsite) return "/onboarding/audit";
    return "/onboarding/connect";
  }

  switch (step) {
    case "scanning":
      return `/audit/${auditId}/scanning`;
    case "generate":
    case "export":
      return `/audit/${auditId}/generate`;
    case "report":
    case "customerEye":
    case "priorityFixes":
    case "recommendations":
    default:
      return `/audit/${auditId}/report`;
  }
}

export function syncFlowToLocalStorage(fields: OnboardingFlowFields) {
  if (typeof window === "undefined") return;
  try {
    if (fields.lastAuditId) {
      localStorage.setItem(LS_LAST_AUDIT_ID, fields.lastAuditId);
    }
    if (fields.connectedWebsite) {
      localStorage.setItem(LS_CONNECTED_WEBSITE, fields.connectedWebsite);
    }
  } catch {
    /* ignore quota */
  }
}

export function readLastAuditIdFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LS_LAST_AUDIT_ID);
  } catch {
    return null;
  }
}

export function readConnectedWebsiteFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LS_CONNECTED_WEBSITE);
  } catch {
    return null;
  }
}

/** Merge flow fields into existing onboarding JSONB without dropping quiz keys. */
export function mergeOnboardingFlow(
  existing: Record<string, string> | null | undefined,
  patch: OnboardingFlowFields & Record<string, string>
): Record<string, string> {
  const next = { ...(existing ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined && value !== null && value !== "") {
      next[key] = value;
    }
  }
  return next;
}

export function extractFlowFields(
  data: Record<string, string> | null | undefined
): OnboardingFlowFields {
  if (!data) return {};
  const out: OnboardingFlowFields = {};
  for (const key of ONBOARDING_FLOW_KEYS) {
    const v = data[key];
    if (typeof v === "string" && v.length > 0) {
      if (key === "flowStep" && isFlowStep(v)) out.flowStep = v;
      else if (key === "connectedWebsite") out.connectedWebsite = v;
      else if (key === "lastAuditId") out.lastAuditId = v;
      else if (key === "flowComplete") out.flowComplete = v;
    }
  }
  return out;
}

/** Persist flow fields via PATCH /api/onboarding */
export async function patchFlowState(
  patch: OnboardingFlowFields
): Promise<boolean> {
  syncFlowToLocalStorage(patch);
  try {
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch {
    return false;
  }
}
