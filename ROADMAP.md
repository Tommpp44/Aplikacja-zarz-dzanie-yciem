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

## Next — Version 3

- LLM provider behind `AIProvider` (planning assistant, AI weekly review), always with confirmation
- Offline mutation queue + background sync
- Google / Outlook / Apple calendar sync (`calendar_events.external_*`)
- Health integrations (Apple Health, Health Connect, Garmin, Strava, Fitbit → `activity_records`, `workouts`)
- Bank integrations / Open Banking
- Shared households (shared projects, shopping lists, finances via membership tables)
- Push notifications and email summaries
- Exchange rates for multi-currency net worth
- Workout splits UI, exercise progression charts, meal planning ↔ shopping
- Subscriptions (Free / Pro) using `profiles.plan`
- Native mobile apps
