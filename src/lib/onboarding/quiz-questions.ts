import type { LucideIcon } from "lucide-react";
import {
  ShoppingBag,
  Boxes,
  Code2,
  Sparkles,
  Rocket,
  TrendingUp,
  Building2,
  Crown,
  TrendingDown,
  ShoppingCart,
  Search,
  HelpCircle,
  Zap,
  Bot,
  ShieldCheck,
  Swords,
  Banknote,
  Instagram,
  Megaphone,
  Share2,
  Store,
  Users,
} from "lucide-react";
import type { OnboardingAnswers } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";
import { ONBOARDING_ANSWER_KEYS } from "@/lib/onboarding/validate";

export { ONBOARDING_ANSWER_KEYS, isOnboardingComplete } from "@/lib/onboarding/validate";

export interface QuizOption {
  value: string;
  labelKey: TranslationKey;
  descKey?: TranslationKey;
  icon: LucideIcon;
}

export interface QuizQuestion {
  key: keyof OnboardingAnswers;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  options: QuizOption[];
}

/** Six behavioral questions shown immediately after login. */
export const SITE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    key: "platform",
    titleKey: "onboarding.quiz.platform.title",
    subtitleKey: "onboarding.quiz.platform.subtitle",
    options: [
      { value: "shopify", labelKey: "onboarding.platform.shopify", descKey: "onboarding.platform.shopifyDesc", icon: ShoppingBag },
      { value: "woocommerce", labelKey: "onboarding.platform.woo", descKey: "onboarding.platform.wooDesc", icon: Boxes },
      { value: "salla_zid", labelKey: "onboarding.quiz.platform.sallaZid", descKey: "onboarding.quiz.platform.sallaZidDesc", icon: Store },
      { value: "custom", labelKey: "onboarding.platform.custom", descKey: "onboarding.platform.customDesc", icon: Code2 },
      { value: "other", labelKey: "onboarding.platform.other", descKey: "onboarding.platform.otherDesc", icon: Sparkles },
    ],
  },
  {
    key: "storeStage",
    titleKey: "onboarding.quiz.stage.title",
    subtitleKey: "onboarding.quiz.stage.subtitle",
    options: [
      { value: "launching", labelKey: "onboarding.quiz.stage.launching", descKey: "onboarding.quiz.stage.launchingDesc", icon: Rocket },
      { value: "growing", labelKey: "onboarding.quiz.stage.growing", descKey: "onboarding.quiz.stage.growingDesc", icon: TrendingUp },
      { value: "scaling", labelKey: "onboarding.quiz.stage.scaling", descKey: "onboarding.quiz.stage.scalingDesc", icon: Building2 },
      { value: "established", labelKey: "onboarding.quiz.stage.established", descKey: "onboarding.quiz.stage.establishedDesc", icon: Crown },
    ],
  },
  {
    key: "challenge",
    titleKey: "onboarding.goals.title",
    subtitleKey: "onboarding.goals.subtitle",
    options: [
      { value: "traffic_low_sales", labelKey: "onboarding.goals.traffic", descKey: "onboarding.goals.trafficDesc", icon: TrendingDown },
      { value: "abandoned_carts", labelKey: "onboarding.goals.carts", descKey: "onboarding.goals.cartsDesc", icon: ShoppingCart },
      { value: "poor_ranking", labelKey: "onboarding.goals.ranking", descKey: "onboarding.goals.rankingDesc", icon: Search },
      { value: "ai_invisibility", labelKey: "onboarding.quiz.challenge.ai", descKey: "onboarding.quiz.challenge.aiDesc", icon: Bot },
      { value: "dont_know", labelKey: "onboarding.goals.dontKnow", descKey: "onboarding.goals.dontKnowDesc", icon: HelpCircle },
    ],
  },
  {
    key: "primaryGoal",
    titleKey: "onboarding.quiz.goal.title",
    subtitleKey: "onboarding.quiz.goal.subtitle",
    options: [
      { value: "boost_conversions", labelKey: "onboarding.quiz.goal.conversions", descKey: "onboarding.quiz.goal.conversionsDesc", icon: Zap },
      { value: "improve_seo", labelKey: "onboarding.quiz.goal.seo", descKey: "onboarding.quiz.goal.seoDesc", icon: Search },
      { value: "ai_visibility", labelKey: "onboarding.quiz.goal.geo", descKey: "onboarding.quiz.goal.geoDesc", icon: Bot },
      { value: "build_trust", labelKey: "onboarding.quiz.goal.trust", descKey: "onboarding.quiz.goal.trustDesc", icon: ShieldCheck },
      { value: "beat_competitors", labelKey: "onboarding.quiz.goal.competitors", descKey: "onboarding.quiz.goal.competitorsDesc", icon: Swords },
    ],
  },
  {
    key: "priceRange",
    titleKey: "onboarding.quiz.price.title",
    subtitleKey: "onboarding.quiz.price.subtitle",
    options: [
      { value: "under_100", labelKey: "onboarding.quiz.price.under100", descKey: "onboarding.quiz.price.under100Desc", icon: Banknote },
      { value: "100_500", labelKey: "onboarding.quiz.price.mid", descKey: "onboarding.quiz.price.midDesc", icon: Banknote },
      { value: "500_2000", labelKey: "onboarding.quiz.price.high", descKey: "onboarding.quiz.price.highDesc", icon: Banknote },
      { value: "over_2000", labelKey: "onboarding.quiz.price.premium", descKey: "onboarding.quiz.price.premiumDesc", icon: Crown },
    ],
  },
  {
    key: "trafficSource",
    titleKey: "onboarding.quiz.traffic.title",
    subtitleKey: "onboarding.quiz.traffic.subtitle",
    options: [
      { value: "organic_search", labelKey: "onboarding.quiz.traffic.organic", descKey: "onboarding.quiz.traffic.organicDesc", icon: Search },
      { value: "paid_ads", labelKey: "onboarding.quiz.traffic.paid", descKey: "onboarding.quiz.traffic.paidDesc", icon: Megaphone },
      { value: "social_media", labelKey: "onboarding.quiz.traffic.social", descKey: "onboarding.quiz.traffic.socialDesc", icon: Instagram },
      { value: "marketplace", labelKey: "onboarding.quiz.traffic.marketplace", descKey: "onboarding.quiz.traffic.marketplaceDesc", icon: Store },
      { value: "word_of_mouth", labelKey: "onboarding.quiz.traffic.referral", descKey: "onboarding.quiz.traffic.referralDesc", icon: Users },
      { value: "mixed", labelKey: "onboarding.quiz.traffic.mixed", descKey: "onboarding.quiz.traffic.mixedDesc", icon: Share2 },
    ],
  },
];
