import 'server-only'
import { getCalendarItems } from '@/lib/calendar/service'
import { addDaysISO, currentHour, safeTimeZone, startOfWeekISO, todayISO } from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import { publicEnv } from '@/lib/env'
import { getHabitsOverview } from '@/lib/habits/service'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { logger } from '@/lib/logger'
import { getPeriodSummary } from '@/lib/reviews/summary'
import { normalizeNotificationSettings } from '@/lib/settings/schemas'
import { listTasks } from '@/lib/tasks/repository'
import { emailConfigured, sendEmail } from './send'
import { dailyAgendaEmail, weeklySummaryEmail } from './templates'

const MORNING_HOUR = 7
const WEEKLY_HOUR = 17

async function loadUser(db: DB, userId: string) {
  const [{ data: prefs }, { data: profile }] = await Promise.all([
    db
      .from('user_preferences')
      .select(
        'timezone, language, notification_settings, week_start, currency, focus_text, focus_date',
      )
      .eq('user_id', userId)
      .single(),
    db.from('profiles').select('email, display_name').eq('id', userId).single(),
  ])
  if (!prefs || !profile?.email) return null
  const timezone = safeTimeZone(prefs.timezone)
  return {
    email: profile.email,
    name: profile.display_name || profile.email.split('@')[0]!,
    timezone,
    today: todayISO(timezone),
    hour: currentHour(timezone),
    locale: (isLocale(prefs.language) ? prefs.language : 'en') as Locale,
    weekStartsOn: (prefs.week_start === 0 ? 0 : 1) as 0 | 1,
    currency: prefs.currency,
    settings: normalizeNotificationSettings(prefs.notification_settings),
    focus: prefs.focus_text,
    focusDate: prefs.focus_date,
  }
}

type User = NonNullable<Awaited<ReturnType<typeof loadUser>>>

async function claim(db: DB, userId: string, kind: 'daily_agenda' | 'weekly_summary', key: string) {
  const { data } = await db
    .from('email_deliveries')
    .upsert(
      { user_id: userId, kind, period_key: key },
      {
        onConflict: 'user_id,kind,period_key',
        ignoreDuplicates: true,
      },
    )
    .select('id')
  return (data?.length ?? 0) > 0
}

export async function buildDailyAgenda(db: DB, userId: string, u: User) {
  const [tasks, calendar, habits] = await Promise.all([
    listTasks(db, userId, u.today, { view: 'today' }),
    getCalendarItems(db, userId, u.today, u.today, u.timezone, { includeTasks: false }),
    getHabitsOverview(db, userId, u.today, u.weekStartsOn, 7),
  ])
  return dailyAgendaEmail(
    {
      name: u.name,
      today: u.today,
      tasks: tasks.slice(0, 10).map((task) => ({
        title: task.title,
        time: task.due_time ? task.due_time.slice(0, 5) : null,
        overdue: task.due_date !== null && task.due_date < u.today,
      })),
      events: calendar.items.slice(0, 10).map((e) => ({ title: e.title, time: e.startTime })),
      habits: habits.items.filter((i) => i.relevantToday && !i.doneToday).map((i) => i.habit.name),
      focus: u.focusDate === u.today ? u.focus : null,
    },
    u.locale,
    publicEnv.NEXT_PUBLIC_SITE_URL,
  )
}

export async function buildWeeklySummary(db: DB, userId: string, u: User) {
  const from = startOfWeekISO(u.today, u.weekStartsOn)
  const to = addDaysISO(from, 6)
  const [summary, review] = await Promise.all([
    getPeriodSummary(db, userId, from, to, u.timezone, u.currency, u.today),
    db
      .from('weekly_reviews')
      .select('next_priorities')
      .eq('user_id', userId)
      .eq('week_start', from)
      .maybeSingle(),
  ])
  const priorities = (review.data?.next_priorities ?? '')
    .split('\n')
    .map((l: string) => l.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
  return weeklySummaryEmail(
    summary,
    { name: u.name, nextPriorities: priorities },
    u.locale,
    publicEnv.NEXT_PUBLIC_SITE_URL,
  )
}

/**
 * Called hourly by the cron: sends the morning agenda (after 7:00 local time)
 * and the weekly summary (last day of the week, after 17:00) at most once.
 */
export async function sendDigestsForUser(db: DB, userId: string) {
  if (!emailConfigured()) return 0
  const u = await loadUser(db, userId)
  if (!u) return 0
  let sent = 0
  try {
    if (u.settings.email_daily_agenda && u.hour >= MORNING_HOUR && u.hour < 12) {
      if (await claim(db, userId, 'daily_agenda', u.today)) {
        await sendEmail(u.email, await buildDailyAgenda(db, userId, u))
        sent++
      }
    }
    const weekStart = startOfWeekISO(u.today, u.weekStartsOn)
    const lastDay = addDaysISO(weekStart, 6) === u.today
    if (u.settings.email_weekly_summary && lastDay && u.hour >= WEEKLY_HOUR) {
      if (await claim(db, userId, 'weekly_summary', weekStart)) {
        await sendEmail(u.email, await buildWeeklySummary(db, userId, u))
        sent++
      }
    }
  } catch (error) {
    logger.error('digest e-mail failed', { userId }, error)
  }
  return sent
}

/** Sends today's agenda right away (used by "Send a test e-mail"). */
export async function sendTestDigest(db: DB, userId: string) {
  const u = await loadUser(db, userId)
  if (!u) return false
  await sendEmail(u.email, await buildDailyAgenda(db, userId, u))
  return true
}
