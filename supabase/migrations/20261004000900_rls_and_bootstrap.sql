-- Row Level Security for every user-owned table, plus new-user bootstrap.

-- ---------------------------------------------------------------------------
-- Generic "owner only" policies for tables with a user_id column.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  owned_tables text[] := array[
    'user_preferences', 'life_areas', 'tags',
    'accounts', 'transaction_categories', 'recurring_transactions', 'transactions', 'budgets', 'budget_categories',
    'goals', 'goal_milestones', 'goal_progress_logs',
    'projects', 'tasks', 'task_tags', 'task_dependencies', 'task_attachments',
    'habits', 'habit_logs', 'routines', 'routine_items', 'routine_runs',
    'calendar_events', 'workout_templates', 'training_plans', 'training_plan_sessions', 'workouts',
    'workout_sets', 'activity_records',
    'notes', 'note_links', 'note_tags', 'journal_entries', 'shopping_lists', 'shopping_items',
    'notifications', 'daily_reviews', 'weekly_reviews', 'monthly_reviews', 'integrations'
  ];
begin
  foreach t in array owned_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format(
      'create policy "owner_select" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "owner_insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "owner_update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "owner_delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create index if not exists %I on public.%I (user_id)', t || '_user_id_idx', t);
  end loop;
end;
$$;

-- Profiles: id is the user id.
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
create policy "profile_select" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profile_update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Audit log: read-only for the owner; rows are written by a security definer trigger.
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon;
revoke insert, update, delete on public.audit_log from authenticated;
create policy "audit_select" on public.audit_log for select to authenticated using (user_id = (select auth.uid()));

-- Project members: users see their memberships; rows are managed by triggers for now.
alter table public.project_members enable row level security;
revoke all on public.project_members from anon;
revoke insert, update, delete on public.project_members from authenticated;
create policy "member_select" on public.project_members for select to authenticated using (user_id = (select auth.uid()));

-- Exercises: built-in rows (user_id null) are readable by everyone signed in.
alter table public.exercises enable row level security;
revoke all on public.exercises from anon;
create policy "exercise_select" on public.exercises for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "exercise_insert" on public.exercises for insert to authenticated with check (user_id = (select auth.uid()));
create policy "exercise_update" on public.exercises for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "exercise_delete" on public.exercises for delete to authenticated using (user_id = (select auth.uid()));

-- Tables referencing exercises must not point at another user's private exercise.
create or replace function public.can_use_exercise(p_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.exercises e
    where e.id = p_exercise_id and (e.user_id is null or e.user_id = auth.uid())
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array['workout_exercises', 'workout_template_exercises'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format(
      'create policy "owner_select" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "owner_insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()) and public.can_use_exercise(exercise_id))', t);
    execute format(
      'create policy "owner_update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.can_use_exercise(exercise_id))', t);
    execute format(
      'create policy "owner_delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create index if not exists %I on public.%I (user_id)', t || '_user_id_idx', t);
  end loop;
end;
$$;

revoke all on public.account_balances from anon;

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile, preferences, default life areas and categories.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text := new.raw_user_meta_data ->> 'timezone';
  v_name text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
begin
  if v_tz is null or not public.is_valid_timezone(v_tz) then
    v_tz := 'UTC';
  end if;

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, left(coalesce(v_name, split_part(coalesce(new.email, ''), '@', 1)), 80));

  insert into public.user_preferences (user_id, timezone)
  values (new.id, v_tz);

  insert into public.life_areas (user_id, name, color, icon, position) values
    (new.id, 'Finance', 'emerald', 'wallet', 0),
    (new.id, 'Career', 'blue', 'briefcase', 1),
    (new.id, 'Health', 'rose', 'heart-pulse', 2),
    (new.id, 'Fitness', 'orange', 'dumbbell', 3),
    (new.id, 'Learning', 'violet', 'graduation-cap', 4),
    (new.id, 'Relationships', 'pink', 'users', 5),
    (new.id, 'Home', 'amber', 'home', 6),
    (new.id, 'Travel', 'cyan', 'plane', 7),
    (new.id, 'Personal', 'slate', 'user', 8);

  insert into public.transaction_categories (user_id, name, kind, color, icon, position) values
    (new.id, 'Housing', 'expense', 'blue', 'home', 0),
    (new.id, 'Food', 'expense', 'emerald', 'utensils', 1),
    (new.id, 'Transport', 'expense', 'amber', 'car', 2),
    (new.id, 'Health', 'expense', 'rose', 'heart-pulse', 3),
    (new.id, 'Entertainment', 'expense', 'violet', 'clapperboard', 4),
    (new.id, 'Shopping', 'expense', 'pink', 'shopping-bag', 5),
    (new.id, 'Travel', 'expense', 'cyan', 'plane', 6),
    (new.id, 'Education', 'expense', 'indigo', 'graduation-cap', 7),
    (new.id, 'Subscriptions', 'expense', 'orange', 'repeat', 8),
    (new.id, 'Utilities', 'expense', 'teal', 'plug', 9),
    (new.id, 'Other', 'expense', 'slate', 'circle', 10),
    (new.id, 'Salary', 'income', 'emerald', 'briefcase', 0),
    (new.id, 'Freelance', 'income', 'blue', 'laptop', 1),
    (new.id, 'Investments', 'income', 'violet', 'trending-up', 2),
    (new.id, 'Gifts', 'income', 'pink', 'gift', 3),
    (new.id, 'Other income', 'income', 'slate', 'circle', 4);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep profile email in sync with auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function public.handle_user_email_change();

-- Internal helpers must not be callable through the Data API.
revoke execute on function public.attach_updated_at(regclass) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.write_audit_log() from public, anon, authenticated;
revoke execute on function public.add_project_owner() from public, anon, authenticated;
