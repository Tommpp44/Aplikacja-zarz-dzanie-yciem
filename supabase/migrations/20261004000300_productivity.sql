-- Goals, projects and tasks: the planning backbone of LifeOS.

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  notes text check (notes is null or char_length(notes) <= 20000),
  category text not null default 'personal'
    check (category in ('finance', 'career', 'learning', 'health', 'fitness', 'relationships', 'travel', 'lifestyle', 'personal')),
  target_type text not null default 'numeric' check (target_type in ('numeric', 'percentage', 'boolean')),
  -- How progress is measured:
  --   manual     -> current_value edited by the user (logged in goal_progress_logs)
  --   account    -> current value = balance of linked_account_id
  --   milestones -> completed milestones / all milestones
  --   tasks      -> completed linked tasks / all linked tasks
  progress_source text not null default 'manual' check (progress_source in ('manual', 'account', 'milestones', 'tasks')),
  start_value numeric(16, 2) not null default 0,
  target_value numeric(16, 2),
  current_value numeric(16, 2) not null default 0,
  unit text check (unit is null or char_length(unit) <= 20),
  start_date date not null default current_date,
  deadline date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  linked_account_id uuid,
  life_area_id uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (linked_account_id, user_id) references public.accounts (id, user_id) on delete set null (linked_account_id),
  foreign key (life_area_id, user_id) references public.life_areas (id, user_id) on delete set null (life_area_id),
  check (target_type = 'boolean' or progress_source in ('milestones', 'tasks') or target_value is not null),
  check (progress_source <> 'account' or linked_account_id is not null or status = 'archived'),
  check (deadline is null or deadline >= start_date)
);
create index goals_user_status_idx on public.goals (user_id, status);
create index goals_title_trgm_idx on public.goals using gin (title extensions.gin_trgm_ops);
select public.attach_updated_at('public.goals');

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  target_value numeric(16, 2),
  due_date date,
  completed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade
);
create index goal_milestones_goal_idx on public.goal_milestones (goal_id, position);
select public.attach_updated_at('public.goal_milestones');

create table public.goal_progress_logs (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  value numeric(16, 2) not null,
  note text check (note is null or char_length(note) <= 500),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade
);
create index goal_progress_logs_goal_idx on public.goal_progress_logs (goal_id, logged_at desc);

-- completed_at follows status (shared by goals and projects)
create or replace function public.goals_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger goals_completed_at
before insert or update on public.goals
for each row execute function public.goals_completed_at();

-- Every change of a goal's current value is recorded, which powers pace,
-- trend and "recent activity" without trusting a single mutable number.
create or replace function public.goals_log_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.current_value is distinct from old.current_value then
    insert into public.goal_progress_logs (goal_id, user_id, value)
    values (new.id, new.user_id, new.current_value);
  end if;
  return null;
end;
$$;

create trigger goals_log_progress
after insert or update of current_value on public.goals
for each row execute function public.goals_log_progress();

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  status text not null default 'active' check (status in ('planning', 'active', 'on_hold', 'completed', 'archived')),
  priority smallint not null default 3 check (priority between 1 and 4),
  deadline date,
  color text not null default 'indigo' check (char_length(color) <= 32),
  goal_id uuid,
  life_area_id uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete set null (goal_id),
  foreign key (life_area_id, user_id) references public.life_areas (id, user_id) on delete set null (life_area_id)
);
create index projects_user_status_idx on public.projects (user_id, status);
create index projects_goal_idx on public.projects (goal_id) where goal_id is not null;
create index projects_name_trgm_idx on public.projects using gin (name extensions.gin_trgm_ops);
select public.attach_updated_at('public.projects');

create trigger projects_completed_at
before insert or update on public.projects
for each row execute function public.goals_completed_at();

-- Prepared for shared projects (households, couples). The owner is always a member.
create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_members_user_idx on public.project_members (user_id);

create or replace function public.add_project_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.user_id, 'owner')
  on conflict do nothing;
  return null;
end;
$$;

create trigger add_project_owner
after insert on public.projects
for each row execute function public.add_project_owner();

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 500),
  description text check (description is null or char_length(description) <= 10000),
  notes text check (notes is null or char_length(notes) <= 20000),
  status text not null default 'todo' check (status in ('inbox', 'todo', 'in_progress', 'completed', 'cancelled')),
  priority smallint not null default 4 check (priority between 1 and 4),
  due_date date,
  due_time time,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 1440),
  -- {"freq": "daily"|"weekly"|"monthly"|"yearly", "interval": 1, "weekdays": [1,3,5]}
  repeat_rule jsonb check (repeat_rule is null or jsonb_typeof(repeat_rule) = 'object'),
  is_someday boolean not null default false,
  reminder_at timestamptz,
  project_id uuid,
  goal_id uuid,
  parent_task_id uuid,
  life_area_id uuid,
  position double precision not null default 0,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete set null (goal_id),
  foreign key (parent_task_id, user_id) references public.tasks (id, user_id) on delete cascade,
  foreign key (life_area_id, user_id) references public.life_areas (id, user_id) on delete set null (life_area_id),
  check (due_time is null or due_date is not null),
  check (parent_task_id is null or parent_task_id <> id)
);
create index tasks_user_open_due_idx on public.tasks (user_id, due_date)
  where deleted_at is null and status not in ('completed', 'cancelled');
create index tasks_user_completed_idx on public.tasks (user_id, completed_at desc) where status = 'completed';
create index tasks_project_idx on public.tasks (project_id) where project_id is not null;
create index tasks_goal_idx on public.tasks (goal_id) where goal_id is not null;
create index tasks_parent_idx on public.tasks (parent_task_id) where parent_task_id is not null;
create index tasks_title_trgm_idx on public.tasks using gin (title extensions.gin_trgm_ops);
select public.attach_updated_at('public.tasks');

create or replace function public.tasks_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status <> 'completed' or new.completed_at is null) then
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_completed_at
before insert or update on public.tasks
for each row execute function public.tasks_completed_at();

create table public.task_tags (
  task_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, tag_id),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade,
  foreign key (tag_id, user_id) references public.tags (id, user_id) on delete cascade
);
create index task_tags_tag_idx on public.task_tags (tag_id);

create table public.task_dependencies (
  task_id uuid not null,
  depends_on_task_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade,
  foreign key (depends_on_task_id, user_id) references public.tasks (id, user_id) on delete cascade,
  check (task_id <> depends_on_task_id)
);
create index task_dependencies_depends_idx on public.task_dependencies (depends_on_task_id);

-- Link-style attachments (storage_path reserved for Supabase Storage uploads).
create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  url text check (url is null or (char_length(url) <= 2048 and url ~* '^https?://')),
  storage_path text check (storage_path is null or char_length(storage_path) <= 1024),
  created_at timestamptz not null default now(),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade,
  check (url is not null or storage_path is not null)
);
create index task_attachments_task_idx on public.task_attachments (task_id);
