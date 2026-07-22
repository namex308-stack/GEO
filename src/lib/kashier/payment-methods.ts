import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Smartphone,
  Building2,
  CalendarClock,
  Wallet,
  QrCode,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import {
  getKashierAllowedMethod as getAllowed,
  isKashierPaymentMethodId as isMethodId,
  type KashierAllowedMethod,
  type KashierPaymentMethodId,
} from "@/lib/kashier/methods";

export type { KashierAllowedMethod, KashierPaymentMethodId };

export interface KashierPaymentMethod {
  id: KashierPaymentMethodId;
  /** Value passed to Kashier allowedMethods / defaultMethod. */
  kashierMethod: KashierAllowedMethod;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: LucideIcon;
  surfaceClass: string;
  iconClass: string;
}

export const KASHIER_PAYMENT_METHODS: KashierPaymentMethod[] = [
  {
    id: "credit_card",
    kashierMethod: "card",
    labelKey: "checkout.method.card",
    descKey: "checkout.method.cardDesc",
    icon: CreditCard,
    surfaceClass:
      "bg-slate-900 hover:bg-slate-800 text-white border-slate-700 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.55)]",
    iconClass: "bg-white/15 text-white",
  },
  {
    id: "instapay",
    kashierMethod: "instapay",
    labelKey: "checkout.method.instapay",
    descKey: "checkout.method.instapayDesc",
    icon: Smartphone,
    surfaceClass:
      "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-[0_8px_24px_-8px_rgba(5,150,105,0.55)]",
    iconClass: "bg-white/20 text-white",
  },
  {
    id: "basata",
    kashierMethod: "basata",
    labelKey: "checkout.method.basata",
    descKey: "checkout.method.basataDesc",
    icon: Building2,
    surfaceClass:
      "bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-[0_8px_24px_-8px_rgba(2,132,199,0.55)]",
    iconClass: "bg-white/20 text-white",
  },
  {
    id: "bank_installments",
    kashierMethod: "bank_installments",
    labelKey: "checkout.method.installments",
    descKey: "checkout.method.installmentsDesc",
    icon: CalendarClock,
    surfaceClass:
      "bg-violet-600 hover:bg-violet-500 text-white border-violet-500 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.55)]",
    iconClass: "bg-white/20 text-white",
  },
  {
    id: "wallet",
    kashierMethod: "wallet",
    labelKey: "checkout.method.wallet",
    descKey: "checkout.method.walletDesc",
    icon: Wallet,
    surfaceClass:
      "bg-primary hover:opacity-95 text-primary-foreground border-primary shadow-glow",
    iconClass: "bg-white/20 text-white",
  },
  {
    id: "qr_code",
    kashierMethod: "qr_code",
    labelKey: "checkout.method.qr",
    descKey: "checkout.method.qrDesc",
    icon: QrCode,
    surfaceClass:
      "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-[0_8px_24px_-8px_rgba(79,70,229,0.55)]",
    iconClass: "bg-white/20 text-white",
  },
];

export function isKashierPaymentMethodId(value: string): value is KashierPaymentMethodId {
  return isMethodId(value);
}

export function getKashierAllowedMethod(id: KashierPaymentMethodId): KashierAllowedMethod {
  return getAllowed(id);
}
