import 'server-only'
import { addDaysISO, eachDayISO, zonedToUtc, type ISODate } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'
import { summarize, type Txn } from '@/lib/finance/calculations'
import { listTransactionsInRange } from '@/lib/finance/repository'
import { listHabitLogs, listHabits } from '@/lib/habits/repository'
import { isActiveOn, isDueOn, isLogComplete, isWeeklyHabit, weeklyTarget } from '@/lib/habits/stats'

export type PeriodSummary = {
  from: ISODate
  to: ISODate
  tasks: { completed: number; created: number; overdue: number; completedTitles: string[] }
  habits: { done: number; due: number; rate: number }
  workouts: { count: number; minutes: number; names: string[] }
  money: {
    income: number
    expenses: number
    savings: number
    savingsRate: number
    currency: string
  }
  events: number
  notes: number
  projectsCompleted: number
  goalsCompleted: number
}

/** Pure: habit completion for a period, given habits and logs. */
export function habitCompletion(
  habits: {
    frequency: string
    weekdays: number[]
    times_per_week: number | null
    interval_days: number | null
    start_date: string
    end_date: string | null
    target: number
    id: string
  }[],
  logs: { habit_id: string; log_date: string; value: number }[],
  from: ISODate,
  to: ISODate,
) {
  let due = 0
  let done = 0
  const days = eachDayISO(from, to)
  for (const h of habits) {
    const hl = logs.filter((l) => l.habit_id === h.id)
    if (isWeeklyHabit(h)) {
      // Scale the weekly target to the period length.
      const activeDays = days.filter((d) => isActiveOn(h, d)).length
      const target = Math.round((weeklyTarget(h) * activeDays) / 7)
      const completions = hl.filter(
        (l) => l.log_date >= from && l.log_date <= to && isLogComplete(h, l.value),
      ).length
      due += target
      done += Math.min(target, completions)
      continue
    }
    for (const d of days) {
      if (!isDueOn(h, d)) continue
      due++
      if (isLogComplete(h, hl.find((l) => l.log_date === d)?.value)) done++
    }
  }
  return { done, due, rate: due ? (done / due) * 100 : 0 }
}

export async function getPeriodSummary(
  db: DB,
  userId: string,
  from: ISODate,
  to: ISODate,
  timeZone: string,
  currency: string,
  today: ISODate,
): Promise<PeriodSummary> {
  const fromTs = zonedToUtc(from, '00:00', timeZone).toISOString()
  const toTs = zonedToUtc(addDaysISO(to, 1), '00:00', timeZone).toISOString()
  const [
    completed,
    created,
    overdue,
    habits,
    logs,
    workouts,
    txns,
    events,
    notes,
    projects,
    goals,
  ] = await Promise.all([
    db
      .from('tasks')
      .select('title')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', fromTs)
      .lt('completed_at', toTs)
      .is('deleted_at', null)
      .order('completed_at', { ascending: false })
      .limit(200),
    db
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', fromTs)
      .lt('created_at', toTs),
    db
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['inbox', 'todo', 'in_progress'])
      .lt('due_date', to < today ? to : today)
      .is('deleted_at', null),
    listHabits(db, userId),
    listHabitLogs(db, userId, from, to),
    db
      .from('workouts')
      .select('name, duration_minutes')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('performed_on', from)
      .lte('performed_on', to),
    listTransactionsInRange(db, userId, from, to),
    db
      .from('calendar_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('starts_at', fromTs)
      .lt('starts_at', toTs),
    db
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', fromTs)
      .lt('created_at', toTs),
    db
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', fromTs)
      .lt('completed_at', toTs),
    db
      .from('goals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', fromTs)
      .lt('completed_at', toTs),
  ])
  const completedRows = unwrap(completed, 'load tasks')
  const workoutRows = unwrap(workouts, 'load workouts')
  const money = summarize(txns as Txn[], currency)
  const effectiveTo = to > today ? today : to
  return {
    from,
    to,
    tasks: {
      completed: completedRows.length,
      created: created.count ?? 0,
      overdue: overdue.count ?? 0,
      completedTitles: completedRows.slice(0, 10).map((t) => t.title),
    },
    habits:
      from <= effectiveTo
        ? habitCompletion(
            habits.map((h) => ({ ...h, target: Number(h.target) })),
            logs,
            from,
            effectiveTo,
          )
        : { done: 0, due: 0, rate: 0 },
    workouts: {
      count: workoutRows.length,
      minutes: workoutRows.reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
      names: workoutRows.map((w) => w.name),
    },
    money: {
      income: money.income,
      expenses: money.expenses,
      savings: money.savings,
      savingsRate: money.savingsRate,
      currency,
    },
    events: events.count ?? 0,
    notes: notes.count ?? 0,
    projectsCompleted: projects.count ?? 0,
    goalsCompleted: goals.count ?? 0,
  }
}
