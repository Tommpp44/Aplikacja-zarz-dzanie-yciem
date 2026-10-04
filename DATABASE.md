# Database

PostgreSQL (Supabase). Migrations: `supabase/migrations/*.sql`. Generated types: `src/lib/db/database.types.ts` (`npm run db:types`).

## Conventions

- Every user-owned table: `id uuid`, `user_id uuid default auth.uid()` (FK → `auth.users` **on delete cascade**), `created_at`, `updated_at` (trigger).
- Parent tables expose `unique (id, user_id)`; children use **composite foreign keys** `(parent_id, user_id)`, so a row can only reference rows of the same user. Optional links use `on delete set null (column)`.
- Enumerations are `text` + `check` constraints. Lengths and ranges are constrained in SQL and in Zod.
- RLS enabled everywhere with owner-only policies (`20261004000900_rls_and_bootstrap.sql`). Built-in exercises (`user_id is null`) are readable by everyone.
- Soft delete where undo matters: `tasks.deleted_at`, `transactions.deleted_at`. Archiving for accounts, categories, notes, habits, goals.
- Indexes on `user_id`, date columns used for ranges, partial indexes for open tasks / active rows, trigram indexes for search.

## Money

`amount_minor bigint` + `currency char(3)` (ISO 4217). No floating point. Amounts are parsed on the server from user text (`parseAmountToMinor`).

**Balance source of truth:** `account_balances` view = `opening_balance_minor` + signed sum of non-deleted transactions. Balances are never stored, so they cannot drift. Differences from reality are recorded explicitly as `adjustment` transactions ("Correct balance"), which keeps history explainable.

Transaction types: `income`, `expense`, `transfer` (from `account_id` to `transfer_account_id`, with `transfer_amount_minor` for cross-currency), `adjustment` (signed). A trigger sets `currency` from the account and checks category kind vs type.

Net worth = assets − liabilities (credit cards and loans hold negative balances). Accounts in other currencies are reported separately (no invented exchange rates).

## Time

- Local calendar days are `date` (task due date, habit logs, transactions, journal, reviews).
- Instants are `timestamptz` (events, reminders, completion times).
- `user_preferences.timezone` (validated against `pg_timezone_names`) defines "today".
- Repeat rules are JSON `{ freq, interval, weekdays?, monthDay? }` shared by tasks, events and recurring transactions.

## Tables

| Area         | Tables                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity     | `profiles` (role, plan, onboarding), `user_preferences` (currency, timezone, week start, units, theme, accent, dashboard layout, notifications, smart defaults, focus)          |
| Organisation | `life_areas`, `tags`, `audit_log`                                                                                                                                               |
| Planning     | `goals`, `goal_milestones`, `goal_progress_logs`, `projects`, `project_members`, `tasks`, `task_tags`, `task_dependencies`, `task_attachments`                                  |
| Routine      | `habits`, `habit_logs` (unique per habit/day), `routines`, `routine_items`, `routine_runs`                                                                                      |
| Finance      | `accounts`, `account_balances` (view), `transaction_categories`, `transactions`, `budgets`, `budget_categories`, `recurring_transactions`                                       |
| Calendar     | `calendar_events` (+ `external_provider/external_id` for sync)                                                                                                                  |
| Fitness      | `exercises`, `workout_templates`, `workout_template_exercises`, `training_plans`, `training_plan_sessions`, `workouts`, `workout_exercises`, `workout_sets`, `activity_records` |
| Knowledge    | `notes`, `note_links` (polymorphic), `note_tags`, `journal_entries`                                                                                                             |
| Other        | `shopping_lists`, `shopping_items`, `notifications` (unique dedupe key), `daily_reviews`, `weekly_reviews`, `monthly_reviews`, `integrations`                                   |

## Triggers

- `handle_new_user`: profile, preferences (timezone from signup), default life areas and categories.
- `set_updated_at` on all mutable tables.
- `transactions_enforce_integrity`: currency from account, transfer amounts, category kind.
- `goals_log_progress`: every change of `current_value` is logged (pace, trends, history).
- `tasks_completed_at`, `goals_completed_at`: `completed_at` follows status.
- `add_project_owner`: owner membership for future sharing.
- `write_audit_log`: who/what/when/source for accounts, transactions, budgets, recurring transactions (no payload).
- `protect_profile_privileges`: users can't change role/plan.

## GDPR

`/api/export` exports every table above for the user (JSON). Account deletion removes the auth user; every table cascades.
