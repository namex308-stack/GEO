-- Add billing period to subscriptions and ensure one active row per user

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_period text CHECK (billing_period IN ('monthly', 'yearly'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_unique
  ON public.subscriptions (user_id);
