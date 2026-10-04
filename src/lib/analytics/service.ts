import 'server-only'
import { addDaysISO, zonedToUtc, utcToZoned } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import { netWorthSeries, summarize, type Txn } from '@/lib/finance/calculations'
import { listAccounts } from '@/lib/finance/accounts-repository'
import { listTransactionsInRange } from '@/lib/finance/repository'
import { listGoalsWithProgress } from '@/lib/goals/service'
import { listHabitLogs, listHabits } from '@/lib/habits/repository'
import { computeHabitStats } from '@/lib/habits/stats'
import { minorToMajor } from '@/lib/money'
import { habitCompletion } from '@/lib/reviews/summary'
import type { UserContext } from '@/lib/settings/service'
import { listStrengthHistory, listWorkouts } from '@/lib/workouts/repository'
import { personalRecords, totalVolume } from '@/lib/workouts/stats'
import {
  bucketFor,
  bucketsBetween,
  seriesBy,
  taskCompletionRate,
  type AnalyticsRange,
  rangeStart,
} from './engine'

/** Cross-module analytics for a range. All numbers are derived from stored data. */
export async function getAnalytics(ctx: UserContext, range: AnalyticsRange) {
  const { supabase, user, today, timezone, currency, prefs, profile } = ctx
  const accountStart = utcToZoned(profile.created_at, timezone).date
  const from = rangeStart(range, today, accountStart)
  const to = today
  const ws = prefs.week_start
  const bucket = bucketFor(from, to)
  const buckets = bucketsBetween(from, to, bucket, ws)
  const fromTs = zonedToUtc(from, '00:00', timezone).toISOString()

  const [
    tasksRes,
    projectsRes,
    overdueRes,
    habits,
    logs,
    workouts,
    history,
    txns,
    accounts,
    goals,
    eventsRes,
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('status, due_date, completed_at, duration_minutes')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .or(`completed_at.gte.${fromTs},due_date.gte.${from}`)
      .limit(10000),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', fromTs),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .in('status', ['inbox', 'todo', 'in_progress'])
      .lt('due_date', today),
    listHabits(supabase, user.id),
    listHabitLogs(supabase, user.id, addDaysISO(from, -60), to),
    listWorkouts(supabase, user.id, from, to, 5000),
    listStrengthHistory(supabase, user.id),
    listTransactionsInRange(supabase, user.id, null, to),
    listAccounts(supabase, user.id, true),
    listGoalsWithProgress(supabase, user.id, today, ['active', 'completed']),
    supabase
      .from('calendar_events')
      .select('starts_at, ends_at, all_day')
      .eq('user_id', user.id)
      .is('repeat_rule', null)
      .gte('starts_at', fromTs),
  ])
  const tasks = unwrap(tasksRes, 'load tasks')
  const completed = tasks.filter(
    (t) => t.status === 'completed' && t.completed_at && t.completed_at >= fromTs,
  )
  const completedLocal = completed.map((t) => ({
    ...t,
    date: utcToZoned(t.completed_at!, timezone).date,
  }))

  // Habits
  const habitRows = habits.map((h) => ({ ...h, target: Number(h.target) }))
  const habitTotals = habitCompletion(habitRows, logs, from, to)
  const perHabit = habitRows
    .map((h) => ({
      id: h.id,
      name: h.name,
      stats: computeHabitStats(
        h,
        logs.filter((l) => l.habit_id === h.id),
        today,
        { from, weekStartsOn: ws },
      ),
    }))
    .sort((a, b) => b.stats.completionRate - a.stats.completionRate)

  // Fitness
  const completedWorkouts = workouts.filter((w) => w.status === 'completed')
  const inRangeHistory = history.filter((h) => h.date >= from && h.date <= to)
  const priorPRs = personalRecords(history.filter((h) => h.date < from))
  const rangePRs = personalRecords(inRangeHistory)
  const newPRs = [...rangePRs.values()].filter(
    (p) => p.bestE1RM > (priorPRs.get(p.exerciseId)?.bestE1RM ?? 0),
  ).length

  // Finance
  const rangeTxns = (txns as Txn[]).filter((t) => t.occurred_on >= from)
  const money = summarize(rangeTxns, currency)
  const nw = netWorthSeries(
    accounts,
    txns as Txn[],
    buckets.map((b, i) => (i === buckets.length - 1 ? to : addDaysISO(buckets[i + 1]!, -1))),
    currency,
  )

  // Time
  const events = unwrap(eventsRes, 'load events').filter((e) => !e.all_day)
  const eventMinutes = events.reduce(
    (s, e) =>
      s + Math.max(0, (new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) / 60000),
    0,
  )
  const trainingMinutes = completedWorkouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0)
  const focusMinutes = completed.reduce((s, t) => s + (t.duration_minutes ?? 0), 0)

  const activeGoals = goals.filter((g) => g.status === 'active')
  return {
    range,
    from,
    to,
    bucket,
    productivity: {
      completed: completed.length,
      completionRate: taskCompletionRate(tasks, from, to),
      overdue: overdueRes.count ?? 0,
      focusMinutes,
      projectsCompleted: projectsRes.count ?? 0,
      series: seriesBy(
        completedLocal,
        (t) => t.date,
        () => 1,
        buckets,
        bucket,
        ws,
      ),
    },
    habits: {
      rate: habitTotals.rate,
      done: habitTotals.done,
      due: habitTotals.due,
      consistency: perHabit.length
        ? perHabit.reduce((s, h) => s + h.stats.consistency, 0) / perHabit.length
        : 0,
      best: perHabit.slice(0, 3),
      weakest: [...perHabit].reverse().slice(0, 3),
      series: seriesBy(
        logs.filter((l) => l.log_date >= from),
        (l) => l.log_date,
        () => 1,
        buckets,
        bucket,
        ws,
      ),
    },
    fitness: {
      workouts: completedWorkouts.length,
      minutes: trainingMinutes,
      distance: completedWorkouts.reduce((s, w) => s + Number(w.distance_m ?? 0), 0),
      volume: inRangeHistory.reduce((s, h) => s + totalVolume(h.sets), 0),
      newPRs,
      series: seriesBy(
        completedWorkouts,
        (w) => w.performed_on,
        () => 1,
        buckets,
        bucket,
        ws,
      ),
    },
    finance: {
      ...money,
      netWorth: nw.at(-1)?.net ?? 0,
      netWorthSeries: nw.map((p, i) => ({
        key: buckets[i]!,
        value: minorToMajor(p.net, currency),
      })),
      expenseSeries: seriesBy(
        rangeTxns.filter((t) => t.txn_type === 'expense' && t.currency === currency),
        (t) => t.occurred_on,
        (t) => minorToMajor(t.amount_minor, currency),
        buckets,
        bucket,
        ws,
      ),
    },
    goals: {
      active: activeGoals.length,
      avgProgress: activeGoals.length
        ? activeGoals.reduce((s, g) => s + g.progress.percent, 0) / activeGoals.length
        : 0,
      onTrack: activeGoals.filter((g) => ['on_track', 'ahead'].includes(g.pace.status)).length,
      behind: activeGoals.filter((g) => ['behind', 'overdue'].includes(g.pace.status)).length,
      completed: goals.filter(
        (g) => g.status === 'completed' && g.completed_at && g.completed_at >= fromTs,
      ).length,
      list: activeGoals,
    },
    time: { trainingMinutes, focusMinutes, eventMinutes: Math.round(eventMinutes) },
  }
}
