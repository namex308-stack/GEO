-- Store URL probe metadata: domain, homepage title, platform detection confidence.
alter table public.profiles
  add column if not exists store_domain text,
  add column if not exists homepage_title text,
  add column if not exists platform_confidence numeric(4, 3),
  add column if not exists store_verified_at timestamptz;

comment on column public.profiles.store_domain is
  'Normalized hostname extracted from store_url during onboarding probe.';

comment on column public.profiles.homepage_title is
  'Homepage <title> captured when the store URL was verified.';

comment on column public.profiles.platform_confidence is
  'Detection confidence 0–1 for the auto-detected ecommerce platform.';

comment on column public.profiles.store_verified_at is
  'When the store URL was last successfully reached and probed.';
