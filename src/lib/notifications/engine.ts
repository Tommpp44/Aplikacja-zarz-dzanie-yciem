import type { NotificationSettings } from '@/lib/settings/schemas'
import type { Locale } from '@/lib/i18n/config'
import { makeT } from '@/lib/i18n/translate'

export type NotificationKind =
  | 'task_reminder'
  | 'task_overdue'
  | 'habit_reminder'
  | 'workout_reminder'
  | 'budget_warning'
  | 'deadline'
  | 'goal_milestone'
  | 'recurring_transaction'

export type NotificationDraft = {
  kind: NotificationKind
  title: string
  body?: string
  href: string
  dedupe_key: string
}

export type NotificationFacts = {
  today: string
  nowTime: string
  tasksDueToday: number
  overdueTasks: number
  /** Habits with a reminder time that has passed and are still open. */
  habitsOpenWithReminder: { id: string; name: string; reminder_time: string }[]
  plannedWorkouts: { id: string; title: string }[]
  budgets: { id: string; name: string; status: 'ok' | 'warning' | 'over'; month: string }[]
  deadlines: {
    kind: 'goal' | 'project'
    id: string
    title: string
    deadline: string
    daysLeft: number
  }[]
  goalsCompletedToday: { id: string; title: string }[]
  milestonesToday: { id: string; title: string; goalId: string; goalTitle: string }[]
  recurringDue: { id: string; name: string; date: string }[]
  /** Open tasks whose reminder time has passed (task.reminder_at). */
  taskReminders?: { id: string; title: string; reminder_at: string }[]
}

/**
 * Decides which notifications are worth sending. One notification per topic
 * per day (dedupe keys), only for enabled categories, aggregated where possible:
 * fewer, more valuable notifications.
 */
export function computeNotifications(
  f: NotificationFacts,
  settings: NotificationSettings,
  locale: Locale = 'en',
): NotificationDraft[] {
  const t = makeT(locale)
  const out: NotificationDraft[] = []
  const d = f.today
  if (settings.task_reminders) {
    if (f.overdueTasks > 0) {
      out.push({
        kind: 'task_overdue',
        title: t.plural(f.overdueTasks, '{n} overdue task', '{n} overdue tasks'),
        body: t('Finish, reschedule or drop them to keep your list honest.'),
        href: '/tasks?view=today',
        dedupe_key: `task_overdue:${d}`,
      })
    }
    for (const r of f.taskReminders ?? []) {
      out.push({
        kind: 'task_reminder',
        title: t('Reminder: {title}', { title: r.title }),
        href: '/tasks?view=today',
        dedupe_key: `task_reminder:${r.id}:${r.reminder_at}`,
      })
    }
    if (f.tasksDueToday > 0) {
      out.push({
        kind: 'task_reminder',
        title: t.plural(f.tasksDueToday, '{n} task due today', '{n} tasks due today'),
        href: '/today',
        dedupe_key: `task_due:${d}`,
      })
    }
  }
  if (settings.habit_reminders) {
    for (const h of f.habitsOpenWithReminder) {
      if (h.reminder_time.slice(0, 5) <= f.nowTime) {
        out.push({
          kind: 'habit_reminder',
          title: t('Time for: {name}', { name: h.name }),
          href: '/habits',
          dedupe_key: `habit:${h.id}:${d}`,
        })
      }
    }
  }
  if (settings.workout_reminders && f.plannedWorkouts.length > 0) {
    const first = f.plannedWorkouts[0]!
    out.push({
      kind: 'workout_reminder',
      title: t('Planned workout: {title}', { title: first.title }),
      body:
        f.plannedWorkouts.length > 1
          ? t('+{n} more session(s) today', { n: f.plannedWorkouts.length - 1 })
          : undefined,
      href: '/workouts',
      dedupe_key: `workout:${d}`,
    })
  }
  if (settings.budget_warnings) {
    for (const b of f.budgets) {
      if (b.status === 'ok') continue
      out.push({
        kind: 'budget_warning',
        title:
          b.status === 'over'
            ? t('{name} budget exceeded', { name: b.name })
            : t('{name} budget at 80%', { name: b.name }),
        href: '/finances/budgets',
        // Once per budget, status and month — not every day.
        dedupe_key: `budget:${b.id}:${b.status}:${b.month}`,
      })
    }
  }
  if (settings.deadlines) {
    for (const dl of f.deadlines) {
      if (dl.daysLeft < 0 || dl.daysLeft > 3) continue
      out.push({
        kind: 'deadline',
        title:
          dl.daysLeft === 0
            ? t('{title} is due today', { title: dl.title })
            : dl.daysLeft === 1
              ? t('{title} is due tomorrow', { title: dl.title })
              : t('{title} is due in {n} days', { title: dl.title, n: dl.daysLeft }),
        href: dl.kind === 'goal' ? `/goals/${dl.id}` : `/projects/${dl.id}`,
        dedupe_key: `deadline:${dl.kind}:${dl.id}:${dl.deadline}`,
      })
    }
  }
  if (settings.goal_milestones) {
    for (const g of f.goalsCompletedToday)
      out.push({
        kind: 'goal_milestone',
        title: `${t('Goal achieved: {title}', { title: g.title })} 🎉`,
        href: `/goals/${g.id}`,
        dedupe_key: `goal_done:${g.id}`,
      })
    for (const m of f.milestonesToday)
      out.push({
        kind: 'goal_milestone',
        title: t('Milestone reached: {title}', { title: m.title }),
        body: m.goalTitle,
        href: `/goals/${m.goalId}`,
        dedupe_key: `milestone:${m.id}`,
      })
  }
  if (settings.recurring_transactions && f.recurringDue.length > 0) {
    out.push({
      kind: 'recurring_transaction',
      title:
        f.recurringDue.length === 1
          ? t('{name} is due', { name: f.recurringDue[0]!.name })
          : t('{n} recurring transactions are due', { n: f.recurringDue.length }),
      body: t('Record them with one click.'),
      href: '/finances',
      dedupe_key: `recurring:${d}`,
    })
  }
  return out
}
