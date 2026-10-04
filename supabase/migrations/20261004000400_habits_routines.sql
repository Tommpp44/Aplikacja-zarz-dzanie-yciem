-- Habits and routines.

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  habit_type text not null default 'boolean' check (habit_type in ('boolean', 'numeric', 'duration', 'count')),
  -- Daily target. For boolean habits always 1. Duration is in minutes.
  target numeric(12, 2) not null default 1 check (target > 0),
  unit text check (unit is null or char_length(unit) <= 20),
  frequency text not null default 'daily'
    check (frequency in ('daily', 'weekly', 'weekdays', 'times_per_week', 'interval')),
  weekdays smallint[] not null default '{}' check (weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  times_per_week smallint check (times_per_week is null or times_per_week between 1 and 7),
  interval_days smallint check (interval_days is null or interval_days between 1 and 365),
  color text not null default 'indigo' check (char_length(color) <= 32),
  icon text check (icon is null or char_length(icon) <= 40),
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  reminder_time time,
  goal_id uuid,
  life_area_id uuid,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete set null (goal_id),
  foreign key (life_area_id, user_id) references public.life_areas (id, user_id) on delete set null (life_area_id),
  check (end_date is null or end_date >= start_date),
  check (frequency <> 'weekdays' or cardinality(weekdays) > 0),
  check (frequency <> 'times_per_week' or times_per_week is not null),
  check (frequency <> 'interval' or interval_days is not null)
);
create index habits_user_active_idx on public.habits (user_id, position) where active;
create index habits_goal_idx on public.habits (goal_id) where goal_id is not null;
create index habits_name_trgm_idx on public.habits using gin (name extensions.gin_trgm_ops);
select public.attach_updated_at('public.habits');

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Local calendar date in the user's timezone.
  log_date date not null,
  value numeric(12, 2) not null default 1 check (value >= 0),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, log_date),
  foreign key (habit_id, user_id) references public.habits (id, user_id) on delete cascade
);
create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date desc);
select public.attach_updated_at('public.habit_logs');

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  routine_type text not null default 'custom'
    check (routine_type in ('morning', 'evening', 'work_start', 'work_end', 'pre_workout', 'travel', 'custom')),
  description text check (description is null or char_length(description) <= 2000),
  start_time time,
  weekdays smallint[] not null default '{0,1,2,3,4,5,6}' check (weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  active boolean not null default true,
  life_area_id uuid,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (life_area_id, user_id) references public.life_areas (id, user_id) on delete set null (life_area_id)
);
create index routines_user_idx on public.routines (user_id, position);
select public.attach_updated_at('public.routines');

create table public.routine_items (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 600),
  position integer not null default 0,
  -- Checking the item also logs this habit for the day.
  habit_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade,
  foreign key (habit_id, user_id) references public.habits (id, user_id) on delete set null (habit_id)
);
create index routine_items_routine_idx on public.routine_items (routine_id, position);
select public.attach_updated_at('public.routine_items');

create table public.routine_runs (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  run_date date not null,
  completed_item_ids uuid[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_id, run_date),
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade
);
create index routine_runs_user_date_idx on public.routine_runs (user_id, run_date desc);
select public.attach_updated_at('public.routine_runs');
