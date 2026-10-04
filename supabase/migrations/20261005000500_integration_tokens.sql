-- OAuth tokens for third-party integrations (e.g. Strava). Server-only:
-- RLS is enabled with no policies, so only the service role can read/write.
create table public.integration_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('strava')),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  external_account_id text,
  scope text,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);
alter table public.integration_tokens enable row level security;
revoke all on public.integration_tokens from anon, authenticated;
