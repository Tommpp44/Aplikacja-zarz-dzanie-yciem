import type { Locale } from '@/lib/i18n/config'
import { makeT } from '@/lib/i18n/translate'
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

export function buildDailyBrief(f: BriefFacts, locale: Locale = 'en'): string[] {
  const t = makeT(locale)
  const out: string[] = []
  if (f.tasksToday === 0 && f.overdueTasks === 0)
    out.push(t('No tasks due today — a good day to get ahead.'))
  else {
    out.push(
      f.importantTasks > 0
        ? t.plural(
            f.tasksToday,
            'Today you have {n} task ({important} high priority).',
            'Today you have {n} tasks ({important} high priority).',
            { important: f.importantTasks },
          )
        : t.plural(f.tasksToday, 'Today you have {n} task.', 'Today you have {n} tasks.'),
    )
    if (f.overdueTasks > 0)
      out.push(
        t.plural(
          f.overdueTasks,
          '{n} task is overdue — reschedule or finish it first.',
          '{n} tasks are overdue — reschedule or finish them first.',
        ),
      )
  }
  if (f.nextEvent)
    out.push(
      t('Next on your calendar: {title} at {time}.', {
        title: f.nextEvent.title,
        time: f.nextEvent.time,
      }),
    )
  if (f.workoutToday)
    out.push(
      f.workoutToday.time
        ? t('You have a workout at {time}: {title}.', {
            time: f.workoutToday.time,
            title: f.workoutToday.title,
          })
        : t('Planned workout today: {title}.', { title: f.workoutToday.title }),
    )
  if (f.habitsDue > 0) {
    const left = f.habitsDue - f.habitsDone
    out.push(
      left === 0
        ? t('All {n} habits done today. Great consistency!', { n: f.habitsDue })
        : t('{left} of {n} habits still open today.', { left, n: f.habitsDue }),
    )
  }
  for (const c of f.categoryDeltas.filter((d) => d.delta > 0).slice(0, 1)) {
    out.push(
      t('You are {amount} over your average weekly {category} spending.', {
        amount: formatMoney(c.delta, f.currency),
        category: c.category.toLowerCase(),
      }),
    )
  }
  if (f.budgetsOver.length)
    out.push(t('Over budget: {names}.', { names: f.budgetsOver.join(', ') }))
  else if (f.budgetsWarning.length)
    out.push(t('Close to the limit: {names}.', { names: f.budgetsWarning.join(', ') }))
  if (f.dueRecurring > 0)
    out.push(
      t.plural(
        f.dueRecurring,
        '{n} recurring payment is waiting to be recorded.',
        '{n} recurring payments are waiting to be recorded.',
      ),
    )
  const behind = f.goals.filter((g) => g.status === 'behind' || g.status === 'overdue')
  const onTrack = f.goals.filter((g) => g.status === 'on_track' || g.status === 'ahead')
  if (behind.length)
    out.push(
      behind.length > 1
        ? t.plural(
            behind.length - 1,
            '{title} is behind plan (and {n} more goal).',
            '{title} is behind plan (and {n} more goals).',
            { title: behind[0]!.title },
          )
        : t('{title} is behind plan.', { title: behind[0]!.title }),
    )
  else if (onTrack.length)
    out.push(t('Your goal “{title}” is on track.', { title: onTrack[0]!.title }))
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

export function buildFinanceSummary(f: FinanceSummaryFacts, locale: Locale = 'en'): string | null {
  const t = makeT(locale)
  if (f.previousExpenses <= 0 && f.expenses <= 0) return null
  if (f.previousExpenses <= 0)
    return t('You spent {amount} so far this month.', {
      amount: formatMoney(f.expenses, f.currency),
    })
  const change = ((f.expenses - f.previousExpenses) / f.previousExpenses) * 100
  const reasons = f.topIncreases
    .filter((c) => c.delta > 0)
    .slice(0, 2)
    .map((c) => c.category.toLowerCase())
  const vars = {
    change: Math.abs(Math.round(change)),
    reasons: reasons.join(` ${t('and')} `),
    rate: Math.round(f.savingsRate),
  }
  if (change > 0 && reasons.length)
    return t(
      'Your expenses increased {change}% compared with last month, mainly because of {reasons}. Savings rate: {rate}%.',
      vars,
    )
  return change >= 0
    ? t('Your expenses increased {change}% compared with last month. Savings rate: {rate}%.', vars)
    : t('Your expenses decreased {change}% compared with last month. Savings rate: {rate}%.', vars)
}
