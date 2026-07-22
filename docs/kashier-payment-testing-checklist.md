# Kashier payment testing checklist

Use this after deploying the P0 fixes. Replace `APP_URL` with your public HTTPS origin.

## Prerequisites

- [ ] `NEXT_PUBLIC_APP_URL` is public HTTPS (not localhost) in the target environment
- [ ] `KASHIER_MODE` is explicitly `test` or `live` and matches dashboard keys
- [ ] `KASHIER_MERCHANT_ID`, `KASHIER_API_KEY`, `KASHIER_SECRET_KEY` set (`$` escaped as `\$`)
- [ ] Optional but preferred: `KASHIER_WEBHOOK_SECRET` set to the dashboard webhook secret
- [ ] Kashier dashboard webhook URL = `{APP_URL}/api/webhook/kashier` (also works: `/api/webhooks/kashier`)
- [ ] Production server IP whitelisted if using Payment Sessions API
- [ ] `NEXT_PUBLIC_DEV_UNLOCK_ALL=false` when validating real upgrades
- [ ] Unit tests pass: `npm test -- src/lib/kashier.test.ts`

## 1. Checkout URL is generated

1. Sign in as a free-plan user.
2. Open `/checkout?plan=pro&period=monthly` and choose a payment method.
3. Confirm `POST /api/checkout` returns `200` with `{ url, orderId, amount, currency: "EGP" }`.
4. Confirm server logs include `[api/checkout] checkout URL ready` and either
   `[kashier] using Payment Sessions checkout` or `[kashier] using hosted checkout (HPP)`.
5. Confirm `url` host is `payments.kashier.io` (Sessions) or `checkout.kashier.io` (HPP).

**Pass criteria:** Browser navigates to Kashier; `orderId` looks like `sp-pro-monthly-<uuid>-<ts>`.

## 2. Payment succeeds

1. Complete a successful test payment in Kashier (test card / test wallet).
2. Confirm Kashier shows payment success.

**Pass criteria:** Kashier marks the transaction successful for the `orderId` from step 1.

## 3. Webhook is received

1. Watch server logs for `[webhook/kashier] POST received`.
2. Confirm Kashier dashboard delivery/retry history shows HTTP 200 to your webhook URL.
3. If only HPP redirect is used, confirm `[webhook/kashier] GET redirect callback` appears.

**Pass criteria:** At least one POST webhook (preferred) or GET redirect callback is logged with the same `orderId`.

## 4. HMAC verification passes

1. On POST webhook, confirm log: `[webhook/kashier] HMAC verification passed`.
2. Temporarily break the secret and resend — expect `401` and `invalid signature`.
3. Restore the secret.

**Pass criteria:** Valid payload → 200; tampered/wrong secret → 401.

## 5. Subscription is written to Supabase

Run in SQL (replace order id):

```sql
SELECT user_id, plan_id, status, billing_period, kashier_subscription_id,
       current_period_start, current_period_end
FROM public.subscriptions
WHERE kashier_subscription_id = '<orderId>';
```

**Pass criteria:** One row, `status = 'active'`, `plan_id` matches paid plan, `kashier_subscription_id` = order id.

## 6. User plan upgrades correctly

```sql
SELECT id, plan FROM public.profiles WHERE id = '<userId>';
```

1. Refresh `/dashboard` or `/settings/billing`.
2. Confirm UI shows Pro/Business and paid entitlements (not Free).
3. Confirm logs: `[billing] activateSubscription success` and
   `[webhook/kashier] activateSubscription result` with `activated: true`.

**Pass criteria:** `profiles.plan` matches paid plan; billing UI reflects upgrade.

## 7. Failed payments do not upgrade users

1. Note current `profiles.plan` for a free test user.
2. Start checkout, then cancel or fail payment on Kashier.
3. Confirm redirect to `/checkout?error=payment_failed` (or failure path).
4. Confirm logs show non-success handling and **no** `activateSubscription success`
   for a new order id (failed statuses must not activate).
5. Re-check Supabase: no new active subscription for a failed `orderId`; plan unchanged.

**Pass criteria:** Failed/cancelled payment leaves plan unchanged and does not write an active subscription for that order.

## Regression notes

- Replaying the same successful webhook must log `already processed` and still return 200.
- Successful payment with missing `orderId` on POST must return `422` (not silent 200).
- Activation DB failure must return `502` so Kashier retries.
