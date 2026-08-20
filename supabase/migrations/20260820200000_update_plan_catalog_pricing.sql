-- Rebuild ConvAudit plan limits and EGP prices for Free / Pro / Business.
-- Prices are also mirrored in src/lib/billing/plans.ts (Kashier + UI source of truth).

alter table public.plan_catalog
  add column if not exists monthly_price_egp integer,
  add column if not exists yearly_price_egp integer;

update public.plan_catalog
set
  display_name = 'مجاني',
  audits_per_month = 3,
  ai_gens_per_month = 0,
  stores_limit = 1,
  monthly_price_egp = 0,
  yearly_price_egp = 0,
  features = '{"competitor": false, "ai_generator": false, "api": false, "competitor_monitoring": false, "weekly_monitoring": false, "automated_alerts": false}'::jsonb
where id = 'free';

update public.plan_catalog
set
  display_name = 'احترافي',
  audits_per_month = 50,
  ai_gens_per_month = 100,
  stores_limit = 5,
  monthly_price_egp = 399,
  yearly_price_egp = 3990,
  features = '{"competitor": true, "ai_generator": true, "api": false, "competitor_monitoring": false, "weekly_monitoring": false, "automated_alerts": false}'::jsonb
where id = 'pro';

update public.plan_catalog
set
  display_name = 'أعمال',
  audits_per_month = 200,
  ai_gens_per_month = 400,
  stores_limit = 15,
  monthly_price_egp = 999,
  yearly_price_egp = 9990,
  features = '{"competitor": true, "ai_generator": true, "api": true, "competitor_monitoring": true, "weekly_monitoring": true, "automated_alerts": true}'::jsonb
where id = 'business';
