import 'server-only'
import {
  diffDaysISO,
  nowTimeHHmm,
  todayISO,
  zonedToUtc,
  addDaysISO,
  startOfMonthISO,
} from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import { budgetSpent, budgetStatus, type Txn } from '@/lib/finance/calculations'
import { listBudgets, listTransactionsInRange } from '@/lib/finance/repository'
import { listHabitLogs, listHabits } from '@/lib/habits/repository'
import { isOpenToday } from '@/lib/habits/stats'
import { normalizeNotificationSettings } from '@/lib/settings/schemas'
import { listPlans, sessionsForDate } from '@/lib/workouts/repository'
import { computeNotifications, type NotificationFacts } from './engine'

/**
 * Gathers facts for one user and stores new notifications (idempotent thanks to
 * dedupe keys). Works with the user's client (RLS) or the service client (cron).
 */
export async function syncNotificationsForUser(db: DB, userId: string) {
  const { data: prefs } = await db
    .from('user_preferences')
    .select('timezone, notification_settings, week_start')
    .eq('user_id', userId)
    .single()
  if (!prefs) return 0
  const tz = prefs.timezone
  const today = todayISO(tz)
  const nowTime = nowTimeHHmm(tz)
  const settings = normalizeNotificationSettings(prefs.notification_settings)
  const weekStartsOn = prefs.week_start === 0 ? 0 : 1
  const dayStart = zonedToUtc(today, '00:00', tz).toISOString()
  const monthStart = startOfMonthISO(today)

  const [
    dueToday,
    overdue,
    habits,
    habitLogs,
    plans,
    workoutsToday,
    budgets,
    monthTxns,
    goals,
    projects,
    milestones,
    recurring,
  ] = await Promise.all([
    db
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('status', ['inbox', 'todo', 'in_progress'])
      .eq('due_date', today),
    db
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('status', ['inbox', 'todo', 'in_progress'])
      .lt('due_date', today),
    listHabits(db, userId),
    listHabitLogs(db, userId, addDaysISO(today, -7), today),
    listPlans(db, userId),
    db.from('workouts').select('plan_session_id').eq('user_id', userId).eq('performed_on', today),
    listBudgets(db, userId),
    listTransactionsInRange(db, userId, monthStart, today),
    db
      .from('goals')
      .select('id, title, deadline, status, completed_at')
      .eq('user_id', userId)
      .in('status', ['active', 'completed']),
    db
      .from('projects')
      .select('id, name, deadline')
      .eq('user_id', userId)
      .in('status', ['planning', 'active', 'on_hold'])
      .not('deadline', 'is', null),
    db
      .from('goal_milestones')
      .select('id, title, goal_id, completed_at, goal:goals(title)')
      .eq('user_id', userId)
      .gte('completed_at', dayStart),
    db
      .from('recurring_transactions')
      .select('id, merchant, description, next_date')
      .eq('user_id', userId)
      .eq('active', true)
      .eq('auto_post', false)
      .lte('next_date', today),
  ])

  const doneSessions = new Set((workoutsToday.data ?? []).map((w) => w.plan_session_id))
  const facts: NotificationFacts = {
    today,
    nowTime,
    tasksDueToday: dueToday.count ?? 0,
    overdueTasks: overdue.count ?? 0,
    habitsOpenWithReminder: habits
      .filter(
        (h) =>
          h.reminder_time &&
          isOpenToday(
            { ...h, target: Number(h.target) },
            habitLogs.filter((l) => l.habit_id === h.id),
            today,
            weekStartsOn,
          ),
      )
      .map((h) => ({ id: h.id, name: h.name, reminder_time: h.reminder_time! })),
    plannedWorkouts: sessionsForDate(plans, today)
      .filter((s) => s.workout_type !== 'rest' && !doneSessions.has(s.id))
      .map((s) => ({ id: s.id, title: s.title })),
    budgets: budgets.map((b) => ({
      id: b.id,
      name: b.name,
      month: monthStart.slice(0, 7),
      status: budgetStatus(
        b.amount_minor,
        budgetSpent(
          b.budget_categories.map((c) => c.category_id),
          monthTxns as Txn[],
          b.currency,
        ),
      ).status,
    })),
    deadlines: [
      ...(goals.data ?? [])
        .filter((g) => g.status === 'active' && g.deadline)
        .map((g) => ({
          kind: 'goal' as const,
          id: g.id,
          title: g.title,
          deadline: g.deadline!,
          daysLeft: diffDaysISO(g.deadline!, today),
        })),
      ...(projects.data ?? []).map((p) => ({
        kind: 'project' as const,
        id: p.id,
        title: p.name,
        deadline: p.deadline!,
        daysLeft: diffDaysISO(p.deadline!, today),
      })),
    ],
    goalsCompletedToday: (goals.data ?? [])
      .filter((g) => g.status === 'completed' && g.completed_at && g.completed_at >= dayStart)
      .map((g) => ({ id: g.id, title: g.title })),
    milestonesToday: (milestones.data ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      goalId: m.goal_id,
      goalTitle: m.goal?.title ?? '',
    })),
    recurringDue: (recurring.data ?? []).map((r) => ({
      id: r.id,
      name: r.merchant || r.description || 'Payment',
      date: r.next_date,
    })),
  }

  const drafts = computeNotifications(facts, settings)
  if (drafts.length === 0) return 0
  const { data } = await db
    .from('notifications')
    .upsert(
      drafts.map((d) => ({ ...d, user_id: userId })),
      { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true },
    )
    .select('id')
  return data?.length ?? 0
}
