# Roadmap

## Done — MVP

- Auth (email + password, magic link, OAuth-ready), onboarding, profile, preferences, theme & accent
- Dashboard (configurable widgets, daily brief, focus, quick actions), Today (timeline / list / focus)
- Tasks (inbox, today, upcoming, scheduled, someday, completed; priorities, recurring, subtasks, dependencies, attachments, tags, reminders, quick add parser), projects
- Goals (numeric / percentage / boolean; manual, account, milestones, tasks; pace and projected completion)
- Habits (boolean / numeric / duration / count; daily, weekdays, weekly, x per week, interval; streaks, consistency, trends, heatmap)
- Finances (accounts, categories, transactions, transfers, corrections, budgets, recurring, forecast, net worth, analytics, CSV import/export)
- Calendar (day / week / month / agenda, recurring events, tasks on the calendar)
- Workouts (live sessions, sets, templates, plans, PRs, volume, frequency), activity
- Global search & command palette, quick capture

## Done — Version 2 scope

- Routines, training plans, journal (with automatic day summary), notes (rich text, links), shopping lists
- Advanced analytics (finance, productivity, habits, fitness, goals, time; 7D–ALL)
- Daily / weekly / monthly reviews
- Notifications (preferences, deduplication, hourly cron), JSON & CSV export, CSV import
- PWA with offline reading of recent pages

## Done — Engagement & integrations

- Public landing page, onboarding starter kits, checklist, celebrations, streak milestones, keyboard shortcuts
- English and Polish interface (and Polish demo data: `npm run db:seed -- --lang pl`)
- Web Push notifications and e-mail digests (morning agenda, weekly summary)
- Calendar subscriptions (Google / Outlook / iCloud via iCal) and `.ics` import
- Apple Health import, GPX import, Strava sync (OAuth)
- WCAG 2.1 AA audit in E2E (light and dark)

## Next — Version 3

- LLM provider behind `AIProvider` (planning assistant, AI weekly review), always with confirmation
- Offline mutation queue + background sync
- Two-way calendar sync (writing events back to Google / Outlook)
- More health integrations (Health Connect, Garmin, Fitbit)
- Bank integrations / Open Banking
- Shared households (shared projects, shopping lists, finances via membership tables)
- Exchange rates for multi-currency net worth
- Workout splits UI, exercise progression charts, meal planning ↔ shopping
- Subscriptions (Free / Pro) using `profiles.plan`
- Native mobile apps
