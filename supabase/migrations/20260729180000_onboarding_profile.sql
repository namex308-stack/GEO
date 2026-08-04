-- Expand profiles for enterprise onboarding (step-persisted business profile).
-- Supabase is the source of truth; onboarding_step enables resume.

alter table public.profiles
  add column if not exists business_name text,
  add column if not exists store_url text,
  add column if not exists country text,
  add column if not exists primary_language text,
  add column if not exists platform text,
  add column if not exists store_size text,
  add column if not exists business_category text,
  add column if not exists primary_goal text,
  add column if not exists monthly_traffic text,
  add column if not exists monthly_orders text,
  add column if not exists main_challenge text,
  add column if not exists competitor_url text,
  add column if not exists onboarding_step integer not null default 1,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_onboarding_step_check;

alter table public.profiles
  add constraint profiles_onboarding_step_check
  check (onboarding_step >= 1 and onboarding_step <= 9);

comment on column public.profiles.onboarding_step is
  'Next step to complete (1-8 questions, 9 = ready for done/complete).';

comment on column public.profiles.onboarding_completed_at is
  'Set when the user finishes onboarding; gates app access until non-null.';

-- Allow users to insert their own profile row if the signup trigger missed it.
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
