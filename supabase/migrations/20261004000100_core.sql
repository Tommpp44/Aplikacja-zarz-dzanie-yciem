-- LifeOS core schema: helpers, profiles, preferences, life areas, tags, audit log.
-- Conventions
--   * every user-owned table has id, user_id, created_at, updated_at
--   * user_id defaults to auth.uid() and is enforced by RLS (see 20261004000900_rls.sql)
--   * parent tables expose unique (id, user_id) so children can use composite
--     foreign keys; this guarantees a row can never reference another user's data
--   * enumerations are text + check constraints (easy to evolve without enum migrations)
--   * money is stored as bigint minor units (see DATABASE.md)

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Attaches the updated_at trigger to a table.
create or replace function public.attach_updated_at(p_table regclass)
returns void
language plpgsql
set search_path = ''
as $$
begin
  execute format(
    'create trigger set_updated_at before update on %s for each row execute function public.set_updated_at()',
    p_table
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (identity) and preferences (personalisation)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public.attach_updated_at('public.profiles');

-- Users may edit their profile but never their own role or plan.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.role is distinct from old.role or new.plan is distinct from old.plan or new.id is distinct from old.id) then
    raise exception 'Not allowed to change role, plan or id' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

create table public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  currency char(3) not null default 'PLN' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'UTC' check (char_length(timezone) <= 64),
  week_start smallint not null default 1 check (week_start in (0, 1)),
  date_format text not null default 'dd.MM.yyyy'
    check (date_format in ('dd.MM.yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'd MMM yyyy')),
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  accent text not null default 'indigo'
    check (accent in ('indigo', 'blue', 'violet', 'emerald', 'orange', 'rose', 'slate')),
  dashboard_layout jsonb not null default '[]'::jsonb check (jsonb_typeof(dashboard_layout) = 'array'),
  notification_settings jsonb not null default '{}'::jsonb check (jsonb_typeof(notification_settings) = 'object'),
  interests text[] not null default '{}',
  focus_text text check (focus_text is null or char_length(focus_text) <= 200),
  focus_date date,
  last_used jsonb not null default '{}'::jsonb check (jsonb_typeof(last_used) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public.attach_updated_at('public.user_preferences');

create or replace function public.is_valid_timezone(p_tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz);
$$;

alter table public.user_preferences
  add constraint user_preferences_timezone_valid check (public.is_valid_timezone(timezone));

-- ---------------------------------------------------------------------------
-- Life areas
-- ---------------------------------------------------------------------------

create table public.life_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  color text not null default 'slate' check (char_length(color) <= 32),
  icon text check (icon is null or char_length(icon) <= 40),
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);
select public.attach_updated_at('public.life_areas');

-- ---------------------------------------------------------------------------
-- Tags (shared by tasks and notes)
-- ---------------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null default 'slate' check (char_length(color) <= 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);
select public.attach_updated_at('public.tags');

-- ---------------------------------------------------------------------------
-- Audit log (financial and system operations). Stores who/what/when, never
-- the financial payload itself.
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_type text not null,
  entity_id uuid,
  source text,
  created_at timestamptz not null default now()
);
create index audit_log_user_created_idx on public.audit_log (user_id, created_at desc);

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_source text;
begin
  if tg_op = 'DELETE' then
    v_row := old;
  else
    v_row := new;
  end if;

  -- Skip rows removed by an account deletion cascade (the user is already gone).
  if not exists (select 1 from auth.users where id = (to_jsonb(v_row) ->> 'user_id')::uuid) then
    return null;
  end if;

  v_source := to_jsonb(v_row) ->> 'source';

  insert into public.audit_log (user_id, actor_id, action, entity_type, entity_id, source)
  values (
    (to_jsonb(v_row) ->> 'user_id')::uuid,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    (to_jsonb(v_row) ->> 'id')::uuid,
    coalesce(v_source, case when auth.uid() is null then 'system' else 'app' end)
  );
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin helper (access control: anonymous / authenticated / admin)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;
