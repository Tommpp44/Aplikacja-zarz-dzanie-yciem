import { CheckSquare, Dumbbell, Flame, Receipt } from 'lucide-react'
import { Stat } from '@/components/ui/stat'
import { minutesToLabel } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import type { PeriodSummary } from '@/lib/reviews/summary'

/** Automatic summary of a day/week/month from tasks, habits, workouts and money. */
export function PeriodSummaryView({
  summary,
  compact = false,
}: {
  summary: PeriodSummary
  compact?: boolean
}) {
  const { tasks, habits, workouts, money } = summary
  return (
    <div className="flex flex-col gap-4">
      <div className={compact ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 gap-4 sm:grid-cols-4'}>
        <Stat
          label="Tasks completed"
          value={tasks.completed}
          hint={tasks.overdue ? `${tasks.overdue} overdue` : undefined}
          size={compact ? 'sm' : 'md'}
        />
        <Stat
          label="Habits"
          value={habits.due ? `${Math.round(habits.rate)}%` : '—'}
          hint={habits.due ? `${habits.done}/${habits.due} done` : 'none scheduled'}
          size={compact ? 'sm' : 'md'}
        />
        <Stat
          label="Workouts"
          value={workouts.count}
          hint={workouts.minutes ? minutesToLabel(workouts.minutes) : undefined}
          size={compact ? 'sm' : 'md'}
        />
        <Stat
          label="Spending"
          value={formatMoney(money.expenses, money.currency)}
          hint={money.income ? `Saved ${formatMoney(money.savings, money.currency)}` : undefined}
          size={compact ? 'sm' : 'md'}
        />
      </div>
      {!compact && (tasks.completedTitles.length > 0 || workouts.names.length > 0) && (
        <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
          {tasks.completedTitles.slice(0, 6).map((t, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckSquare className="text-success size-3.5" aria-hidden /> {t}
            </li>
          ))}
          {workouts.names.slice(0, 3).map((n, i) => (
            <li key={`w${i}`} className="flex items-center gap-2">
              <Dumbbell className="text-primary size-3.5" aria-hidden /> {n}
            </li>
          ))}
        </ul>
      )}
      {compact && (
        <p className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <Flame className="size-3" /> {habits.done} habits
          </span>
          <span className="inline-flex items-center gap-1">
            <Receipt className="size-3" /> {summary.events} events
          </span>
        </p>
      )}
    </div>
  )
}
