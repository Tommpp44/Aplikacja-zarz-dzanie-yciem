# LifeOS

Your personal operating system: tasks, projects, goals, habits, routines, finances, calendar, workouts, activity, notes, journal, shopping, reviews and analytics — **connected** in one calm app.

LifeOS answers three questions every day:

1. **Now** — what is happening today? (Dashboard, Today)
2. **Next** — what should I do next? (Daily brief, focus, priorities, reminders)
3. **Long term** — are my daily actions moving me towards the life I want? (Goals, reviews, analytics, life balance)

Modules are linked, not isolated: a savings goal follows the balance of its account, a half-marathon goal collects milestones, workouts and a training plan, routines log habits, tasks and notes attach to projects and goals, and the dashboard pulls everything together.

Available in **English and Polish** (switch in Settings → Appearance or on the sign-in page; new accounts follow the browser language).

## Tech stack

Next.js 16 (App Router, Server Components, Server Actions) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui-style components on Radix · Lucide · Supabase (PostgreSQL, Auth, RLS) · React Hook Form + Zod · Recharts · date-fns · Tiptap · Zustand (only for global overlays) · Vitest + Testing Library · Playwright · PWA.

## Installation

Requirements: Node.js ≥ 20.9, npm, Docker (for the local Supabase stack).

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run db:start                # starts local Supabase and applies all migrations
npm run db:seed                 # optional: demo user with realistic data
npm run dev                     # http://localhost:3000
```

Demo account after seeding: `demo@lifeos.app` / `lifeos-demo-2026`. `npm run db:seed -- --lang pl` creates it in Polish (Polish interface, categories and sample data).

## Environment variables

| Variable                        | Required                         | Description                                                                                                   |
| ------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | yes                              | Supabase API URL (`npx supabase status` prints it locally).                                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes                              | Public anon/publishable key. Safe for the browser; all access is protected by RLS.                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | for account deletion, cron, seed | **Server-only** secret. Never expose it to the client.                                                        |
| `NEXT_PUBLIC_SITE_URL`          | yes                              | Public URL of the app, used in auth emails (magic link, confirmation, password reset).                        |
| `NEXT_PUBLIC_OAUTH_PROVIDERS`   | no                               | Comma-separated OAuth providers enabled in Supabase (`google,github,apple,azure`). Empty hides OAuth buttons. |
| `CRON_SECRET`                   | for cron                         | Bearer token required by `/api/cron/daily`.                                                                   |
| `AI_PROVIDER`                   | no                               | `rules` (default, offline). Reserved for future LLM providers.                                                |

`.env*` files are git-ignored; only `.env.example` is committed.

## Database setup

All schema lives in `supabase/migrations` (tables, constraints, indexes, triggers, RLS policies, bootstrap of new users). See [DATABASE.md](DATABASE.md).

```bash
npm run db:start     # start local stack (Docker) + apply migrations
npm run db:reset     # recreate the local database from migrations
npm run db:types     # regenerate src/lib/db/database.types.ts from the local schema
npm run db:seed      # seed the demo user (refuses to run against non-local URLs)
npm run db:stop
```

For a hosted project: `npx supabase link --project-ref <ref>` then `npx supabase db push`.

Auth settings to configure in Supabase: site URL, redirect URL `https://<your-domain>/auth/callback`, email confirmations (recommended on), and any OAuth providers you list in `NEXT_PUBLIC_OAUTH_PROVIDERS`.

## Development commands

```bash
npm run dev          # development server
npm run typecheck    # next typegen + tsc --noEmit
npm run lint         # ESLint
npm run format       # Prettier
npm run build        # production build
npm run check        # typecheck + lint + unit tests + build
```

Keyboard shortcuts: `⌘K` / `Ctrl+K` search & commands, `c` quick capture.

## Tests

```bash
npm test             # unit + component tests (Vitest, jsdom, no database)
npm run test:db      # Row Level Security tests (pgTAP) against the local Supabase stack
npm run test:e2e     # Playwright E2E against a production build + local Supabase
```

- **Unit tests** cover money parsing, dates/timezones, recurrence, finance engine (balances, transfers, currencies, budgets, net worth, forecast), goal progress & pace, habit streaks & statistics, quick-add and natural-language parsers, notifications, analytics, CSV import/export.
- **Component tests** cover Quick Add, the transaction form and task items.
- **RLS tests** (`supabase/tests/rls.test.sql`) prove users can't read, modify or reference other users' data.
- **E2E** runs `npm run build` output on port 3100 (`npm run build && npm run test:e2e`). Every run signs up brand-new users, so it never touches existing data. Use only the local stack (or a dedicated test project) — never production.
- **Translations** — `src/lib/i18n/coverage.test.ts` checks every UI string has a Polish translation; `e2e/i18n.spec.ts` switches languages end to end.
- **Accessibility** — `e2e/a11y.spec.ts` runs axe-core (WCAG 2.1 A/AA) over every main page in light and dark mode as part of the E2E suite.

## Push notifications (optional)

Reminders can reach phones and desktops even when LifeOS is closed (Web Push, no third-party account needed):

1. `npx web-push generate-vapid-keys`
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (e.g. `mailto:you@example.com`).
3. Each user enables it per device in **Settings → Notifications**. New notifications (generated in-app or by the hourly cron) are pushed to all of the user's devices; expired subscriptions are removed automatically.

On iPhone, push works after LifeOS is added to the Home Screen (iOS 16.4+).

## E-mail (optional)

With `SMTP_URL` (any SMTP provider) and `EMAIL_FROM` set, users can opt in under **Settings → Notifications** to:

- a **morning e-mail** (after 7:00 in their timezone): today's focus, events, tasks and open habits;
- a **weekly summary** (last day of their week, after 17:00): completed tasks, habits, workouts, spending and next week's priorities.

The hourly cron sends each digest at most once per day/week (`email_deliveries`). "Send a test e-mail" in settings sends today's agenda immediately. Locally, Supabase's Mailpit catches everything (UI at http://127.0.0.1:54324).

## Integrations

Settings → Integrations:

- **Calendars (Google, Outlook, iCloud)** — paste the calendar's iCal link (Google: "Secret address in iCal format"; Outlook: published ICS link; iCloud: public calendar link) or import an `.ics` file. Events are read-only copies, refreshed hourly by the cron and removed when they disappear from the feed. Feeds are fetched server-side with SSRF protection (https only, public addresses only, size/time limits).
- **Apple Health** — import `export.zip` / `export.xml` (iPhone: Health → profile → Export All Health Data). Parsed in the browser; only daily totals (steps, distance, exercise minutes, calories) and workouts from the last year are sent. When several sources record the same day, the largest value wins.
- **GPX** — runs and rides from Strava, Garmin Connect, Komoot or any GPS watch; distance, duration and elevation are calculated.
- **Strava** (optional) — set `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` (and `SUPABASE_SERVICE_ROLE_KEY`); users connect with OAuth and new activities are imported hourly. Tokens live in `integration_tokens`, which only the server can read.
- **Bank** — CSV import of transactions (Finances → Transactions).

All imports are idempotent: records carry their source and external id, so re-importing never creates duplicates.

## Deployment

1. Create a Supabase project, run `npx supabase db push`, configure Auth URLs.
2. Deploy to Vercel (or any Node host): set the environment variables above.
3. `vercel.json` schedules `/api/cron/daily` hourly (auto-post recurring transactions, generate notifications). Set `CRON_SECRET`; Vercel sends it as a Bearer token.
4. Verify: `npm run build` must pass locally; after deploy sign up, complete onboarding and check the dashboard.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — structure, data flow, security, AI, offline.
- [DATABASE.md](DATABASE.md) — schema, conventions, money and time handling.
- [ROADMAP.md](ROADMAP.md) — what is done and what comes next.
- [docs/MASTER_INSTRUCTION.md](docs/MASTER_INSTRUCTION.md) — product specification.
