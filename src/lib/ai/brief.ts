import { formatMoney } from '@/lib/money'

/**
 * Structured facts the brief is generated from. Producing sentences from facts
 * (instead of letting a model read raw data) keeps the output verifiable.
 */
export type BriefFacts = {
  currency: string
  tasksToday: number
  importantTasks: number
  overdueTasks: number
  nextEvent: { title: string; time: string } | null
  workoutToday: { title: string; time: string | null } | null
  habitsDue: number
  habitsDone: number
  budgetsOver: string[]
  budgetsWarning: string[]
  /** Spending this week vs average week, per category with a meaningful difference. */
  categoryDeltas: { category: string; delta: number }[]
  goals: { title: string; status: string }[]
  dueRecurring: number
}

export function buildDailyBrief(f: BriefFacts): string[] {
  const out: string[] = []
  if (f.tasksToday === 0 && f.overdueTasks === 0)
    out.push('No tasks due today — a good day to get ahead.')
  else {
    const important = f.importantTasks > 0 ? ` (${f.importantTasks} high priority)` : ''
    out.push(`Today you have ${f.tasksToday} task${f.tasksToday === 1 ? '' : 's'}${important}.`)
    if (f.overdueTasks > 0)
      out.push(
        `${f.overdueTasks} task${f.overdueTasks === 1 ? ' is' : 's are'} overdue — reschedule or finish ${f.overdueTasks === 1 ? 'it' : 'them'} first.`,
      )
  }
  if (f.nextEvent) out.push(`Next on your calendar: ${f.nextEvent.title} at ${f.nextEvent.time}.`)
  if (f.workoutToday)
    out.push(
      f.workoutToday.time
        ? `You have a workout at ${f.workoutToday.time}: ${f.workoutToday.title}.`
        : `Planned workout today: ${f.workoutToday.title}.`,
    )
  if (f.habitsDue > 0) {
    const left = f.habitsDue - f.habitsDone
    out.push(
      left === 0
        ? `All ${f.habitsDue} habits done today. Great consistency!`
        : `${left} of ${f.habitsDue} habits still open today.`,
    )
  }
  for (const c of f.categoryDeltas.filter((d) => d.delta > 0).slice(0, 1)) {
    out.push(
      `You are ${formatMoney(c.delta, f.currency)} over your average weekly ${c.category.toLowerCase()} spending.`,
    )
  }
  if (f.budgetsOver.length) out.push(`Over budget: ${f.budgetsOver.join(', ')}.`)
  else if (f.budgetsWarning.length) out.push(`Close to the limit: ${f.budgetsWarning.join(', ')}.`)
  if (f.dueRecurring > 0)
    out.push(
      `${f.dueRecurring} recurring payment${f.dueRecurring === 1 ? ' is' : 's are'} waiting to be recorded.`,
    )
  const behind = f.goals.filter((g) => g.status === 'behind' || g.status === 'overdue')
  const onTrack = f.goals.filter((g) => g.status === 'on_track' || g.status === 'ahead')
  if (behind.length)
    out.push(
      `${behind[0]!.title} is behind plan${behind.length > 1 ? ` (and ${behind.length - 1} more goal${behind.length > 2 ? 's' : ''})` : ''}.`,
    )
  else if (onTrack.length) out.push(`Your goal “${onTrack[0]!.title}” is on track.`)
  return out
}

export type FinanceSummaryFacts = {
  currency: string
  expenses: number
  previousExpenses: number
  /** Categories with the largest increase vs previous period. */
  topIncreases: { category: string; delta: number }[]
  savingsRate: number
}

export function buildFinanceSummary(f: FinanceSummaryFacts): string | null {
  if (f.previousExpenses <= 0 && f.expenses <= 0) return null
  if (f.previousExpenses <= 0)
    return `You spent ${formatMoney(f.expenses, f.currency)} so far this month.`
  const change = ((f.expenses - f.previousExpenses) / f.previousExpenses) * 100
  const direction = change >= 0 ? 'increased' : 'decreased'
  const reasons = f.topIncreases
    .filter((c) => c.delta > 0)
    .slice(0, 2)
    .map((c) => c.category.toLowerCase())
  const because = change > 0 && reasons.length ? `, mainly because of ${reasons.join(' and ')}` : ''
  return `Your expenses ${direction} ${Math.abs(Math.round(change))}% compared with last month${because}. Savings rate: ${Math.round(f.savingsRate)}%.`
}
