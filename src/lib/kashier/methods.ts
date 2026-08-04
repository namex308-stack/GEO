/** Kashier hosted checkout / payment session method identifiers. */
export type KashierAllowedMethod =
  | "card"
  | "wallet"
  | "bank_installments"
  | "instapay"
  | "basata"
  | "qr_code";

/** Internal checkout UI identifiers. */
export type KashierPaymentMethodId =
  | "credit_card"
  | "instapay"
  | "basata"
  | "bank_installments"
  | "wallet"
  | "qr_code";

const METHOD_MAP: Record<KashierPaymentMethodId, KashierAllowedMethod> = {
  credit_card: "card",
  instapay: "instapay",
  basata: "basata",
  bank_installments: "bank_installments",
  wallet: "wallet",
  qr_code: "qr_code",
};

export function isKashierPaymentMethodId(value: string): value is KashierPaymentMethodId {
  return Object.prototype.hasOwnProperty.call(METHOD_MAP, value);
}

export function getKashierAllowedMethod(id: KashierPaymentMethodId): KashierAllowedMethod {
  return METHOD_MAP[id];
}
