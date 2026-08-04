-- Align local schema with production denormalized columns used by audits / AI generation.
-- All statements are idempotent (IF NOT EXISTS) for safe re-apply.

-- Audits: crawl + GEO denorm
alter table public.audits
  add column if not exists geo_score numeric,
  add column if not exists crawl_provider text,
  add column if not exists crawl_duration_ms integer,
  add column if not exists analysis_version text;

comment on column public.audits.geo_score is
  'Denormalized GEO / AI visibility score (0–100) from the latest analysis.';
comment on column public.audits.crawl_provider is
  'Crawl source: firecrawl | fallback | none.';
comment on column public.audits.crawl_duration_ms is
  'Primary page scrape duration in milliseconds.';
comment on column public.audits.analysis_version is
  'Analyzer pipeline version stamp (e.g. audit-engine-v1).';

-- GEO component scores
alter table public.geo_signals
  add column if not exists citation_score numeric,
  add column if not exists faq_score numeric,
  add column if not exists schema_score numeric,
  add column if not exists entity_score numeric,
  add column if not exists ai_readability_score numeric,
  add column if not exists freshness_score numeric;

comment on column public.geo_signals.citation_score is
  'Overall citation / GEO score 0–100.';
comment on column public.geo_signals.faq_score is
  'FAQ readiness component 0–100.';
comment on column public.geo_signals.schema_score is
  'Structured data (Product/Org/Breadcrumb) component 0–100.';
comment on column public.geo_signals.entity_score is
  'Entity richness component 0–100.';
comment on column public.geo_signals.ai_readability_score is
  'AI readability component 0–100.';
comment on column public.geo_signals.freshness_score is
  'Content structure / freshness proxy 0–100.';

-- Reports: denormalized pillar scores for fast list/dashboard queries
alter table public.reports
  add column if not exists overall_score numeric,
  add column if not exists geo_score numeric,
  add column if not exists seo_score numeric,
  add column if not exists conversion_score numeric,
  add column if not exists trust_score numeric;

-- AI generations metadata
alter table public.ai_generations
  add column if not exists generation_type text,
  add column if not exists status text default 'completed',
  add column if not exists tokens_used integer,
  add column if not exists duration_ms integer;

comment on column public.ai_generations.generation_type is
  'Kind of generation: product_content | title | description | faq | ad_copy.';
comment on column public.ai_generations.status is
  'completed | failed | running.';

-- Stores: onboarding / crawl enrichment
alter table public.stores
  add column if not exists country text,
  add column if not exists language text,
  add column if not exists currency text,
  add column if not exists detected_theme text,
  add column if not exists verified_at timestamptz,
  add column if not exists last_crawled_at timestamptz;
