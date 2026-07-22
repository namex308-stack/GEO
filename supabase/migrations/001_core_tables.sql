-- StorePulse AI — Core Tables Migration
-- Run this against your Supabase project via SQL Editor or `supabase db push`

-- =========================================================================
-- 1. profiles (extends auth.users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  kashier_customer_id text,
  onboarding jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 2. audits
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_url text NOT NULL,
  store_url text,
  competitor_url text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'scraping', 'scoring', 'interpreting', 'complete', 'failed')),
  overall_score integer,
  competitor_score integer,
  breakdown jsonb DEFAULT '[]'::jsonb,
  competitor_breakdown jsonb,
  geo_readability jsonb,
  engine_results jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  product_name text,
  store_name text,
  parent_audit_id uuid REFERENCES public.audits(id),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_audits_user_id ON public.audits(user_id);
CREATE INDEX idx_audits_created_at ON public.audits(created_at DESC);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audits" ON public.audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own audits" ON public.audits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own audits" ON public.audits FOR UPDATE USING (auth.uid() = user_id);

-- =========================================================================
-- 3. generated_content
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_content_audit ON public.generated_content(audit_id);

ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own content" ON public.generated_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own content" ON public.generated_content FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 4. subscriptions
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  kashier_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- =========================================================================
-- 5. usage_counters
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.usage_counters (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month text NOT NULL,  -- YYYY-MM format
  audits_used integer NOT NULL DEFAULT 0,
  generations_used integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own usage" ON public.usage_counters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own usage" ON public.usage_counters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own usage" ON public.usage_counters FOR UPDATE USING (auth.uid() = user_id);
