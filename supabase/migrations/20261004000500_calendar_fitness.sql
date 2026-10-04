-- Calendar, workouts, training plans and activity.

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  location text check (location is null or char_length(location) <= 300),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  -- Same shape as tasks.repeat_rule; occurrences are expanded in the app.
  repeat_rule jsonb check (repeat_rule is null or jsonb_typeof(repeat_rule) = 'object'),
  repeat_until date,
  color text not null default 'indigo' check (char_length(color) <= 32),
  project_id uuid,
  task_id uuid,
  goal_id uuid,
  life_area_id uuid,
  -- Prepared for Google / Outlook / Apple calendar sync.
  external_provider text check (external_provider is null or external_provider in ('google', 'outlook', 'apple', 'ics')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, external_provider, external_id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete set null (task_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete set null (goal_id),
  foreign key (life_area_id, user_id) references public.life_areas (id, user_id) on delete set null (life_area_id),
  check (ends_at >= starts_at)
);
create index calendar_events_user_range_idx on public.calendar_events (user_id, starts_at, ends_at);
create index calendar_events_recurring_idx on public.calendar_events (user_id) where repeat_rule is not null;
create index calendar_events_title_trgm_idx on public.calendar_events using gin (title extensions.gin_trgm_ops);
select public.attach_updated_at('public.calendar_events');

-- ---------------------------------------------------------------------------
-- Exercise library: user_id null = built-in exercise readable by everyone.
-- ---------------------------------------------------------------------------

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null default 'strength' check (category in ('strength', 'cardio', 'mobility', 'other')),
  muscle_group text check (muscle_group is null or char_length(muscle_group) <= 60),
  equipment text check (equipment is null or char_length(equipment) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index exercises_owner_name_uidx on public.exercises (user_id, lower(name)) nulls not distinct;
select public.attach_updated_at('public.exercises');

insert into public.exercises (user_id, name, category, muscle_group, equipment) values
  (null, 'Bench Press', 'strength', 'Chest', 'Barbell'),
  (null, 'Incline Dumbbell Press', 'strength', 'Chest', 'Dumbbells'),
  (null, 'Push-up', 'strength', 'Chest', 'Bodyweight'),
  (null, 'Back Squat', 'strength', 'Legs', 'Barbell'),
  (null, 'Front Squat', 'strength', 'Legs', 'Barbell'),
  (null, 'Romanian Deadlift', 'strength', 'Hamstrings', 'Barbell'),
  (null, 'Deadlift', 'strength', 'Back', 'Barbell'),
  (null, 'Walking Lunge', 'strength', 'Legs', 'Dumbbells'),
  (null, 'Leg Press', 'strength', 'Legs', 'Machine'),
  (null, 'Overhead Press', 'strength', 'Shoulders', 'Barbell'),
  (null, 'Lateral Raise', 'strength', 'Shoulders', 'Dumbbells'),
  (null, 'Pull-up', 'strength', 'Back', 'Bodyweight'),
  (null, 'Barbell Row', 'strength', 'Back', 'Barbell'),
  (null, 'Lat Pulldown', 'strength', 'Back', 'Cable'),
  (null, 'Biceps Curl', 'strength', 'Arms', 'Dumbbells'),
  (null, 'Triceps Pushdown', 'strength', 'Arms', 'Cable'),
  (null, 'Dips', 'strength', 'Arms', 'Bodyweight'),
  (null, 'Hip Thrust', 'strength', 'Glutes', 'Barbell'),
  (null, 'Plank', 'strength', 'Core', 'Bodyweight'),
  (null, 'Hanging Leg Raise', 'strength', 'Core', 'Bodyweight'),
  (null, 'Kettlebell Swing', 'strength', 'Full body', 'Kettlebell'),
  (null, 'Rowing Machine', 'cardio', 'Full body', 'Machine'),
  (null, 'Treadmill Run', 'cardio', 'Legs', 'Machine'),
  (null, 'Jump Rope', 'cardio', 'Full body', 'Rope'),
  (null, 'Hip Mobility Flow', 'mobility', 'Hips', 'Bodyweight'),
  (null, 'Thoracic Rotation', 'mobility', 'Back', 'Bodyweight'),
  (null, 'Hamstring Stretch', 'mobility', 'Hamstrings', 'Bodyweight');

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  workout_type text not null default 'strength'
    check (workout_type in ('strength', 'running', 'cycling', 'walking', 'swimming', 'padel', 'football', 'mobility', 'custom')),
  description text check (description is null or char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
select public.attach_updated_at('public.workout_templates');

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  position integer not null default 0,
  target_sets smallint check (target_sets is null or target_sets between 1 and 20),
  target_reps smallint check (target_reps is null or target_reps between 1 and 200),
  target_weight_kg numeric(6, 2) check (target_weight_kg is null or target_weight_kg >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds between 0 and 3600),
  created_at timestamptz not null default now(),
  foreign key (template_id, user_id) references public.workout_templates (id, user_id) on delete cascade
);
create index workout_template_exercises_template_idx on public.workout_template_exercises (template_id, position);

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  start_date date not null default current_date,
  weeks smallint not null default 4 check (weeks between 1 and 52),
  goal_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete set null (goal_id)
);
select public.attach_updated_at('public.training_plans');

create table public.training_plan_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- null week = repeats every week of the plan
  week smallint check (week is null or week between 1 and 52),
  weekday smallint not null check (weekday between 0 and 6),
  title text not null check (char_length(title) between 1 and 120),
  workout_type text not null default 'custom'
    check (workout_type in ('rest', 'strength', 'running', 'cycling', 'walking', 'swimming', 'padel', 'football', 'mobility', 'custom')),
  template_id uuid,
  target_duration_minutes integer check (target_duration_minutes is null or target_duration_minutes between 1 and 1440),
  target_distance_m numeric(10, 1) check (target_distance_m is null or target_distance_m >= 0),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (plan_id, user_id) references public.training_plans (id, user_id) on delete cascade,
  foreign key (template_id, user_id) references public.workout_templates (id, user_id) on delete set null (template_id)
);
create index training_plan_sessions_plan_idx on public.training_plan_sessions (plan_id, week, weekday);
select public.attach_updated_at('public.training_plan_sessions');

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  workout_type text not null default 'strength'
    check (workout_type in ('strength', 'running', 'cycling', 'walking', 'swimming', 'padel', 'football', 'mobility', 'custom')),
  status text not null default 'completed' check (status in ('planned', 'in_progress', 'completed')),
  performed_on date not null default current_date,
  started_at timestamptz,
  ended_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 0 and 1440),
  distance_m numeric(10, 1) check (distance_m is null or distance_m >= 0),
  calories integer check (calories is null or calories between 0 and 20000),
  elevation_m numeric(8, 1),
  avg_heart_rate smallint check (avg_heart_rate is null or avg_heart_rate between 20 and 250),
  -- [{"distance_m": 1000, "duration_s": 312}]
  splits jsonb check (splits is null or jsonb_typeof(splits) = 'array'),
  notes text check (notes is null or char_length(notes) <= 5000),
  template_id uuid,
  plan_session_id uuid,
  goal_id uuid,
  life_area_id uuid,
  -- Prepared for Apple Health / Health Connect / Garmin / Strava / Fitbit imports.
  source text not null default 'manual'
    check (source in ('manual', 'apple_health', 'health_connect', 'garmin', 'strava', 'fitbit', 'import')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, source, external_id),
  foreign key (template_id, user_id) references public.workout_templates (id, user_id) on delete set null (template_id),
  foreign key (plan_session_id, user_id) references public.training_plan_sessions (id, user_id) on delete set null (plan_session_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete set null (goal_id),
  foreign key (life_area_id, user_id) references public.life_areas (id, user_id) on delete set null (life_area_id),
  check (ended_at is null or started_at is null or ended_at >= started_at)
);
create index workouts_user_date_idx on public.workouts (user_id, performed_on desc);
create index workouts_goal_idx on public.workouts (goal_id) where goal_id is not null;
create index workouts_name_trgm_idx on public.workouts using gin (name extensions.gin_trgm_ops);
select public.attach_updated_at('public.workouts');

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  position integer not null default 0,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (workout_id, user_id) references public.workouts (id, user_id) on delete cascade
);
create index workout_exercises_workout_idx on public.workout_exercises (workout_id, position);
create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id);
select public.attach_updated_at('public.workout_exercises');

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  set_number smallint not null check (set_number between 1 and 100),
  weight_kg numeric(6, 2) check (weight_kg is null or weight_kg >= 0),
  reps smallint check (reps is null or reps between 0 and 1000),
  rpe numeric(3, 1) check (rpe is null or rpe between 1 and 10),
  rest_seconds integer check (rest_seconds is null or rest_seconds between 0 and 3600),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workout_exercise_id, user_id) references public.workout_exercises (id, user_id) on delete cascade
);
create index workout_sets_exercise_idx on public.workout_sets (workout_exercise_id, set_number);
select public.attach_updated_at('public.workout_sets');

create table public.activity_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  record_date date not null,
  steps integer check (steps is null or steps between 0 and 200000),
  distance_m numeric(10, 1) check (distance_m is null or distance_m >= 0),
  active_minutes integer check (active_minutes is null or active_minutes between 0 and 1440),
  calories integer check (calories is null or calories between 0 and 20000),
  source text not null default 'manual'
    check (source in ('manual', 'apple_health', 'health_connect', 'garmin', 'strava', 'fitbit', 'import')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, record_date, source)
);
create index activity_records_user_date_idx on public.activity_records (user_id, record_date desc);
select public.attach_updated_at('public.activity_records');
