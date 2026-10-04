import 'server-only'
import { getAIProvider } from '@/lib/ai/provider'
import { addDaysISO, addMonthsISO, startOfMonthISO, startOfWeekISO } from '@/lib/dates'
import { spendingByCategory, summarize, type Txn } from '@/lib/finance/calculations'
import { listTransactionsInRange } from '@/lib/finance/repository'
import { getFinanceOverview } from '@/lib/finance/service'
import { listGoalsWithProgress } from '@/lib/goals/service'
import { listNotes } from '@/lib/notes/repository'
import type { UserContext } from '@/lib/settings/service'
import { getTodayData } from '@/lib/today/service'
import { lifeBalance } from './life-balance'

/** Weekly spending per category vs the average of the previous 8 weeks. */
export function categoryWeeklyDeltas(
  txns: Txn[],
  weekStart: string,
  currency: string,
  names: Map<string, string>,
) {
  const current = spendingByCategory(
    txns.filter((t) => t.occurred_on >= weekStart),
    currency,
  )
  const previous = spendingByCategory(
    txns.filter((t) => t.occurred_on < weekStart && t.occurred_on >= addDaysISO(weekStart, -56)),
    currency,
  )
  const out: { category: string; delta: number }[] = []
  for (const [id, amount] of current) {
    if (!id) continue
    const avg = (previous.get(id) ?? 0) / 8
    if (avg <= 0) continue
    const delta = Math.round(amount - avg)
    if (Math.abs(delta) >= Math.max(5000, avg * 0.2))
      out.push({ category: names.get(id) ?? 'Other', delta })
  }
  return out.sort((a, b) => b.delta - a.delta)
}

export async function getDashboardData(ctx: UserContext) {
  const { supabase, user, today, currency, prefs } = ctx
  const weekStart = startOfWeekISO(today, prefs.week_start)
  const [day, finance, goals, notes, recentTxns] = await Promise.all([
    getTodayData(ctx),
    getFinanceOverview(supabase, user.id, today, currency),
    listGoalsWithProgress(supabase, user.id, today, ['active']),
    listNotes(supabase, user.id, { limit: 4 }),
    listTransactionsInRange(supabase, user.id, addDaysISO(weekStart, -56), today),
  ])
  const categoryNames = new Map(finance.categories.map((c) => [c.id, c.name]))
  const nextEvent = day.timeline.timed.find(
    (e) => e.kind === 'event' && (e.endTime ?? e.time)! >= day.now,
  )
  const plannedWorkout = day.training.todaysSessions.find(
    (s) => s.workout_type !== 'rest' && !s.done,
  )

  const brief = await getAIProvider().dailyBrief({
    currency,
    tasksToday: day.tasks.filter((t) => !['completed', 'cancelled'].includes(t.status)).length,
    importantTasks: day.tasks.filter((t) => t.priority <= 2 && t.status !== 'completed').length,
    overdueTasks: day.overdue.length,
    nextEvent: nextEvent ? { title: nextEvent.title, time: nextEvent.time! } : null,
    workoutToday: plannedWorkout ? { title: plannedWorkout.title, time: null } : null,
    habitsDue: day.habits.dueCount,
    habitsDone: day.habits.doneCount,
    budgetsOver: finance.budgets.filter((b) => b.status === 'over').map((b) => b.name),
    budgetsWarning: finance.budgets.filter((b) => b.status === 'warning').map((b) => b.name),
    categoryDeltas: categoryWeeklyDeltas(recentTxns, weekStart, currency, categoryNames),
    goals: goals.map((g) => ({ title: g.title, status: g.pace.status })),
    dueRecurring: finance.dueRecurring.length,
  })

  // Finance widget period (configurable): month, quarter or year to date.
  const financeRange = prefs.last_used.finance_range ?? 'month'
  const periodStart =
    financeRange === 'year'
      ? `${today.slice(0, 4)}-01-01`
      : financeRange === 'quarter'
        ? addMonthsISO(startOfMonthISO(today), -2)
        : startOfMonthISO(today)
  const periodSummary =
    financeRange === 'month'
      ? finance.month
      : summarize(
          (await listTransactionsInRange(supabase, user.id, periodStart, today)) as Txn[],
          currency,
        )

  return {
    day,
    finance,
    financePeriod: { range: financeRange, from: periodStart, summary: periodSummary },
    goals,
    notes,
    brief,
    lifeBalance: lifeBalance(
      goals,
      day.habits.items.map((i) => ({ goal_id: i.habit.goal_id, consistency: i.stats.consistency })),
    ),
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
