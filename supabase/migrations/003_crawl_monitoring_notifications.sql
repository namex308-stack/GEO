-- StorePulse AI — Crawl, Monitoring & Notifications

-- =========================================================================
-- Extend audits for full-site crawl
-- =========================================================================
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS audit_type text NOT NULL DEFAULT 'single'
    CHECK (audit_type IN ('single', 'crawl')),
  ADD COLUMN IF NOT EXISTS site_url text,
  ADD COLUMN IF NOT EXISTS crawl_progress jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS crawl_summary jsonb;

-- =========================================================================
-- crawled_pages
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.crawled_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'analyzing', 'complete', 'failed')),
  sort_order integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crawled_pages_audit ON public.crawled_pages(audit_id);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_user ON public.crawled_pages(user_id);

ALTER TABLE public.crawled_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own crawled_pages" ON public.crawled_pages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own crawled_pages" ON public.crawled_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own crawled_pages" ON public.crawled_pages
  FOR UPDATE USING (auth.uid() = user_id);

-- =========================================================================
-- page_results
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.page_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crawled_page_id uuid NOT NULL REFERENCES public.crawled_pages(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score integer NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  geo_readability jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  has_issues boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_results_audit ON public.page_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_page_results_crawled_page ON public.page_results(crawled_page_id);

ALTER TABLE public.page_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own page_results" ON public.page_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own page_results" ON public.page_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- monitoring_jobs
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.monitoring_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_url text NOT NULL,
  store_url text,
  product_url text,
  label text,
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_audit_id uuid REFERENCES public.audits(id) ON DELETE SET NULL,
  previous_audit_id uuid REFERENCES public.audits(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_jobs_user ON public.monitoring_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_jobs_next_run ON public.monitoring_jobs(next_run_at)
  WHERE enabled = true;

ALTER TABLE public.monitoring_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own monitoring_jobs" ON public.monitoring_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own monitoring_jobs" ON public.monitoring_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own monitoring_jobs" ON public.monitoring_jobs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own monitoring_jobs" ON public.monitoring_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================================
-- notifications
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monitoring_job_id uuid REFERENCES public.monitoring_jobs(id) ON DELETE SET NULL,
  audit_id uuid REFERENCES public.audits(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('report', 'alert', 'issue')),
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status)
  WHERE status = 'pending';

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
