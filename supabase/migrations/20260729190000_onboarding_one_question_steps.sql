-- Widen onboarding_step for one-question-per-step flow (12 questions + done).
alter table public.profiles
  drop constraint if exists profiles_onboarding_step_check;

alter table public.profiles
  add constraint profiles_onboarding_step_check
  check (onboarding_step >= 1 and onboarding_step <= 13);

comment on column public.profiles.onboarding_step is
  'Next step to complete (1-12 questions, 13 = ready for done/complete).';
