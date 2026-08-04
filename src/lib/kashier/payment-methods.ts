import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  QrCode,
  Smartphone,
  Store,
  Wallet,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import type { KashierPaymentMethodId } from "@/lib/kashier/methods";

export type { KashierPaymentMethodId };

export interface KashierPaymentMethodOption {
  id: KashierPaymentMethodId;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: LucideIcon;
  surfaceClass: string;
  iconClass: string;
}

/** UI catalog for the checkout payment method picker. */
export const KASHIER_PAYMENT_METHODS: readonly KashierPaymentMethodOption[] = [
  {
    id: "credit_card",
    labelKey: "checkout.method.card",
    descKey: "checkout.method.cardDesc",
    icon: CreditCard,
    surfaceClass: "border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/15 text-foreground",
    iconClass: "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  },
  {
    id: "wallet",
    labelKey: "checkout.method.wallet",
    descKey: "checkout.method.walletDesc",
    icon: Wallet,
    surfaceClass: "border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/15 text-foreground",
    iconClass: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  },
  {
    id: "instapay",
    labelKey: "checkout.method.instapay",
    descKey: "checkout.method.instapayDesc",
    icon: Smartphone,
    surfaceClass: "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 text-foreground",
    iconClass: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "bank_installments",
    labelKey: "checkout.method.bank",
    descKey: "checkout.method.bankDesc",
    icon: Building2,
    surfaceClass: "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 text-foreground",
    iconClass: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  },
  {
    id: "basata",
    labelKey: "checkout.method.basata",
    descKey: "checkout.method.basataDesc",
    icon: Store,
    surfaceClass: "border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 text-foreground",
    iconClass: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  },
  {
    id: "qr_code",
    labelKey: "checkout.method.qr",
    descKey: "checkout.method.qrDesc",
    icon: QrCode,
    surfaceClass: "border-slate-500/40 bg-slate-500/10 hover:bg-slate-500/15 text-foreground",
    iconClass: "bg-slate-500/20 text-slate-700 dark:text-slate-300",
  },
] as const;
