-- Drop unused subscription cancel_at (no cancel flow reads/writes it).
alter table public.subscriptions
  drop column if exists cancel_at;
