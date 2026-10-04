-- Web Push subscriptions (one per browser/device). Owner-only access.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 10 and 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 10 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
create policy "owner_select" on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "owner_insert" on public.push_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "owner_delete" on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));
