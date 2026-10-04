# Architecture

## Overview

```
Browser ──► Next.js (App Router)
             ├─ proxy.ts            session refresh + optimistic auth redirect
             ├─ Server Components   read data through repositories/services
             ├─ Server Actions      mutations: authedAction → Zod → service → repository
             └─ Route handlers      /api/export, /api/finances/transactions/export, /api/cron/daily, /auth/*
                         │
                         ▼
             Supabase (PostgreSQL + Auth). Every query runs as the signed-in user → RLS.
```

## Project structure

```
src/
  app/
    (auth)/            login, signup, forgot-password
    (dashboard)/       authenticated app: dashboard, today, tasks, calendar, projects, goals,
                       habits, routines, finances/*, workouts/*, activity, notes, journal,
                       analytics, shopping, reviews, settings/*
    auth/              callback (PKCE), confirm (token hash), reset-password
    api/               export, transactions CSV export, cron
    onboarding/, offline/, manifest.ts
  components/
    ui/                design-system primitives (button, dialog, sheet, field, stat, …)
    layout/            sidebar, mobile nav, topbar, notifications, theme sync
    <module>/          feature components (tasks, finances, habits, goals, workouts, …)
    charts/            Recharts wrappers (lazy loaded, theme-aware, serialisable formats)
  lib/
    <module>/          schemas.ts (Zod) · repository.ts (queries) · service.ts (business rules)
                       · actions.ts ('use server') · pure calculation modules + tests
    ai/                AIProvider abstraction, rule-based provider, NL parsers, daily brief
    analytics/         analytics engine (ranges, buckets, rates) + service
    notifications/     notification engine (pure) + sync service
    dashboard/, today/, reviews/   cross-module aggregation
    supabase/          server/browser/admin clients and proxy session handling
    auth/              session helpers, access levels, auth actions
    money.ts, dates.ts, recurrence.ts, units.ts, validation.ts, logger.ts, action.ts
  hooks/               use-server-action, use-ui-store (Zustand: capture & command palette only)
supabase/migrations    schema, RLS, triggers
supabase/tests         pgTAP RLS tests
e2e/                   Playwright tests
scripts/seed.mts       development seed
```

## Layers

- **Repository** (`lib/<module>/repository.ts`): the only place that builds Supabase queries. Always filters by `user_id` (index use) on top of RLS.
- **Service** (`service.ts`, pure modules like `calculations.ts`, `stats.ts`): business rules — recurring tasks, goal progress & pace, habit streaks, finance engine, forecast. Pure functions take plain data and are unit tested.
- **Actions** (`actions.ts`): thin wrappers built with `authedAction(schema, options, handler)`, which authenticates, validates input with Zod on the server, translates database errors into human messages, logs safely, and revalidates the UI. User ids always come from the session, never from the client.
- **UI**: Server Components by default; Client Components only for interaction (forms, optimistic toggles, dialogs, charts).

Swapping the backend means re-implementing repositories; services and UI stay.

## Cross-module integration

| Link                                                    | How                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| Goal ↔ account                                          | `goals.progress_source = 'account'` → progress = live account balance |
| Goal ↔ tasks / milestones                               | progress from completed linked tasks or milestones                    |
| Goal ↔ projects, habits, workouts, training plans       | `goal_id` foreign keys; shown on the goal page                        |
| Routine step ↔ habit                                    | checking the step logs the habit                                      |
| Tasks ↔ calendar / today                                | dated tasks appear in calendar views and the Today timeline           |
| Training plan ↔ today / dashboard / notifications       | planned session for the day with one-tap start                        |
| Notes ↔ anything                                        | `note_links` (project, goal, task, workout, habit, transaction, …)    |
| Everything ↔ dashboard, reviews, analytics, daily brief | aggregation services read from all modules                            |

## Security

- Supabase Auth (email+password, magic link, OAuth-ready). Sessions in HTTP-only cookies via `@supabase/ssr`; `proxy.ts` refreshes them.
- **RLS on every table**; composite foreign keys `(id, user_id)` make cross-user references impossible even when ids are guessed. Users cannot change their own `role`/`plan`. Audit log rows are written by a security-definer trigger only.
- Server-side validation of every input (Zod) and server-side money parsing (amounts are text → minor units on the server; currency comes from the account in a trigger).
- Access levels `anonymous | authenticated | admin` (`lib/auth/access.ts`); `is_admin()` exists in SQL for future admin features.
- Service-role key only in server modules marked `server-only` (account deletion, cron, seed).
- Logging via `lib/logger.ts` whitelists safe keys and never prints tokens, passwords or financial payloads.
- Open-redirect protection for `next` parameters; CSV export neutralises spreadsheet formulas.

## AI

`lib/ai/provider.ts` defines `AIProvider` (daily brief, finance summary, transaction and task parsing). The default `RuleBasedProvider` is deterministic and offline. Briefs are built from structured facts, so every sentence is verifiable. AI may analyse, summarise, classify and draft — it never writes data, moves money or deletes anything; drafts (e.g. a parsed expense) are always confirmed by the user.

## Time and money

- Each user has a timezone (detected at signup/onboarding, editable). "Today" is always computed in that timezone. Calendar dates are `date` columns; instants are `timestamptz`; recurring events expand on local wall-clock time (DST-safe).
- Money is `bigint` minor units + ISO 4217 currency; formatting happens only at the edge.

## Offline / PWA

`public/sw.js`: content-hashed static assets cache-first; page navigations network-first with the last visited pages cached for offline reading and an `/offline` fallback. API calls and mutations are never cached. Cached pages are cleared on sign-out. The architecture leaves room for an outbox-based offline mutation queue (actions are idempotent where it matters: habit logs upsert per day, notifications dedupe).

## Future-ready

Multi-user (`project_members`), integrations table (calendar, health, banking providers), `source`/`external_id` on workouts, activity and events for sync, `plan` on profiles for Free/Pro, AI provider abstraction.
