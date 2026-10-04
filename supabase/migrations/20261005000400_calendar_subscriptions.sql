-- iCal (.ics) calendar subscriptions: Google, Outlook, iCloud or any public feed.
-- Imported events live in calendar_events with external_provider = 'ics' and
-- external_id = '<subscription id>:<UID>' (or 'file:<UID>' for one-off imports).
create table public.calendar_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  url text not null check (char_length(url) between 10 and 2000 and url ~ '^https://'),
  color text not null default 'blue' check (char_length(color) <= 32),
  last_synced_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 300),
  event_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, url)
);
create index calendar_subscriptions_user_idx on public.calendar_subscriptions (user_id);
select public.attach_updated_at('public.calendar_subscriptions');

alter table public.calendar_subscriptions enable row level security;
revoke all on public.calendar_subscriptions from anon;
create policy "owner_select" on public.calendar_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "owner_insert" on public.calendar_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "owner_update" on public.calendar_subscriptions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owner_delete" on public.calendar_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));
