-- Notes, journal, shopping, notifications, reviews, integrations.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 200),
  -- Rich text stored as sanitized HTML produced by the editor.
  content text not null default '' check (char_length(content) <= 500000),
  -- Plain-text projection used for search and previews.
  content_text text not null default '' check (char_length(content_text) <= 200000),
  pinned boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notes_title_trgm_idx on public.notes using gin (title extensions.gin_trgm_ops);
create index notes_content_trgm_idx on public.notes using gin (content_text extensions.gin_trgm_ops);
select public.attach_updated_at('public.notes');

-- Polymorphic links: a note can be attached to any LifeOS entity.
create table public.note_links (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('project', 'goal', 'workout', 'task', 'transaction', 'account', 'journal_entry', 'habit', 'event')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (note_id, entity_type, entity_id),
  foreign key (note_id, user_id) references public.notes (id, user_id) on delete cascade
);
create index note_links_entity_idx on public.note_links (user_id, entity_type, entity_id);

create table public.note_tags (
  note_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, tag_id),
  foreign key (note_id, user_id) references public.notes (id, user_id) on delete cascade,
  foreign key (tag_id, user_id) references public.tags (id, user_id) on delete cascade
);
create index note_tags_tag_idx on public.note_tags (tag_id);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  mood smallint check (mood is null or mood between 1 and 5),
  today_text text check (today_text is null or char_length(today_text) <= 10000),
  tomorrow_text text check (tomorrow_text is null or char_length(tomorrow_text) <= 10000),
  went_well text check (went_well is null or char_length(went_well) <= 10000),
  could_be_better text check (could_be_better is null or char_length(could_be_better) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, entry_date)
);
select public.attach_updated_at('public.journal_entries');

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
select public.attach_updated_at('public.shopping_lists');

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  quantity numeric(10, 2) check (quantity is null or quantity > 0),
  unit text check (unit is null or char_length(unit) <= 20),
  category text check (category is null or char_length(category) <= 60),
  purchased boolean not null default false,
  purchased_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (list_id, user_id) references public.shopping_lists (id, user_id) on delete cascade
);
create index shopping_items_list_idx on public.shopping_items (list_id, purchased, position);
select public.attach_updated_at('public.shopping_items');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'task_reminder', 'task_overdue', 'habit_reminder', 'workout_reminder', 'budget_warning',
    'deadline', 'goal_milestone', 'recurring_transaction', 'system'
  )),
  title text not null check (char_length(title) between 1 and 200),
  body text check (body is null or char_length(body) <= 1000),
  href text check (href is null or (char_length(href) <= 500 and href like '/%')),
  -- Prevents the engine from creating the same notification twice.
  dedupe_key text not null check (char_length(dedupe_key) <= 200),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;

create table public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  review_date date not null,
  stats jsonb not null default '{}'::jsonb,
  highlights text check (highlights is null or char_length(highlights) <= 10000),
  notes text check (notes is null or char_length(notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, review_date)
);
select public.attach_updated_at('public.daily_reviews');

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  stats jsonb not null default '{}'::jsonb,
  wins text check (wins is null or char_length(wins) <= 10000),
  challenges text check (challenges is null or char_length(challenges) <= 10000),
  next_priorities text check (next_priorities is null or char_length(next_priorities) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);
select public.attach_updated_at('public.weekly_reviews');

create table public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month_start date not null check (extract(day from month_start) = 1),
  stats jsonb not null default '{}'::jsonb,
  wins text check (wins is null or char_length(wins) <= 10000),
  challenges text check (challenges is null or char_length(challenges) <= 10000),
  next_focus text check (next_focus is null or char_length(next_focus) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_start)
);
select public.attach_updated_at('public.monthly_reviews');

-- Future integrations (calendar, health, banking). Credentials are never stored
-- here in plain text; tokens belong in a server-side vault.
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  provider text not null check (provider in (
    'google_calendar', 'outlook_calendar', 'apple_calendar', 'apple_health', 'health_connect',
    'garmin', 'strava', 'fitbit', 'open_banking'
  )),
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  settings jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
select public.attach_updated_at('public.integrations');
