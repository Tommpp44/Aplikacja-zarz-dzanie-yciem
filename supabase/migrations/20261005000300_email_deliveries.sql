-- One row per e-mail sent (daily agenda / weekly summary), so the hourly cron
-- never sends the same digest twice. Written by the server only.
create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('daily_agenda', 'weekly_summary')),
  period_key text not null check (char_length(period_key) <= 20),
  sent_at timestamptz not null default now(),
  unique (user_id, kind, period_key)
);

alter table public.email_deliveries enable row level security;
revoke all on public.email_deliveries from anon;
create policy "owner_select" on public.email_deliveries for select to authenticated
  using (user_id = (select auth.uid()));
