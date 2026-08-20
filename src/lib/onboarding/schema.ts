/**
 * Zod schemas — one field validated per onboarding step (client + server).
 */

import { z } from "zod";
import {
  CATEGORY_OPTIONS,
  CHALLENGE_OPTIONS,
  COUNTRY_OPTIONS,
  GOAL_OPTIONS,
  LANGUAGE_OPTIONS,
  ONBOARDING_STEP_COUNT,
  ORDERS_OPTIONS,
  PLATFORM_OPTIONS,
  STORE_SIZE_OPTIONS,
  TRAFFIC_OPTIONS,
  type OnboardingStepSlug,
} from "@/lib/onboarding/constants";

const values = <T extends readonly { value: string }[]>(opts: T) =>
  opts.map((o) => o.value) as [string, ...string[]];

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !v || /^https?:\/\//i.test(v) || /^[\w.-]+\.[\w.-]+/.test(v), {
    message: "أدخل رابطاً صالحاً",
  });

export const OnboardingAnswersSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  storeUrl: z.string().trim().min(3).max(500),
  country: z.enum(values(COUNTRY_OPTIONS)),
  primaryLanguage: z.enum(values(LANGUAGE_OPTIONS)),
  platform: z.enum(values(PLATFORM_OPTIONS)),
  storeSize: z.enum(values(STORE_SIZE_OPTIONS)),
  businessCategory: z.enum(values(CATEGORY_OPTIONS)),
  primaryGoal: z.enum(values(GOAL_OPTIONS)),
  monthlyTraffic: z.enum(values(TRAFFIC_OPTIONS)),
  monthlyOrders: z.enum(values(ORDERS_OPTIONS)),
  mainChallenge: z.enum(values(CHALLENGE_OPTIONS)),
  competitorUrl: z.string().trim().max(500).optional().default(""),
});

export type OnboardingAnswersValidated = z.infer<typeof OnboardingAnswersSchema>;

export const OnboardingProfilePartialSchema = z.object({
  businessName: z.string().trim().max(120).optional(),
  storeUrl: z.string().trim().max(500).optional(),
  country: z.string().trim().max(40).optional(),
  primaryLanguage: z.string().trim().max(40).optional(),
  platform: z.string().trim().max(40).optional(),
  storeSize: z.string().trim().max(40).optional(),
  businessCategory: z.string().trim().max(40).optional(),
  primaryGoal: z.string().trim().max(60).optional(),
  monthlyTraffic: z.string().trim().max(40).optional(),
  monthlyOrders: z.string().trim().max(40).optional(),
  mainChallenge: z.string().trim().max(60).optional(),
  competitorUrl: z.string().trim().max(500).optional(),
  storeDomain: z.string().trim().max(255).optional(),
  homepageTitle: z.string().trim().max(300).optional(),
  platformConfidence: z.number().min(0).max(1).nullable().optional(),
  storeVerifiedAt: z.string().datetime().nullable().optional(),
});

export type OnboardingProfilePartial = z.infer<typeof OnboardingProfilePartialSchema>;

export const STEP_SCHEMAS: Record<
  OnboardingStepSlug,
  z.ZodType<{ [key: string]: unknown }>
> = {
  "business-name": z.object({
    businessName: z.string().trim().min(2, "اسم النشاط مطلوب").max(120),
  }),
  "store-url": z.object({
    storeUrl: z
      .string()
      .trim()
      .min(3, "رابط المتجر مطلوب")
      .max(500)
      .refine((v) => /^https?:\/\//i.test(v) || /^[\w.-]+\.[\w.-]+/.test(v), {
        message: "أدخل رابط متجر صالحاً",
      }),
  }),
  country: z.object({
    country: z.string().refine((v) => values(COUNTRY_OPTIONS).includes(v), {
      message: "اختر الدولة",
    }),
  }),
  platform: z.object({
    platform: z.string().refine((v) => values(PLATFORM_OPTIONS).includes(v), {
      message: "اختر المنصة",
    }),
  }),
  competitor: z.object({
    competitorUrl: optionalUrl.optional().default(""),
  }),
};

export const SaveOnboardingBodySchema = z.object({
  step: z.number().int().min(1).max(ONBOARDING_STEP_COUNT),
  answers: OnboardingProfilePartialSchema,
  /** Skip only optional steps (competitor). */
  skip: z.boolean().optional(),
  /**
   * Accepted for API compatibility with the wizard. Never grants completion;
   * the server completes only when required fields are valid on the last step.
   */
  markComplete: z.boolean().optional(),
});

export function normalizeStoreUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
