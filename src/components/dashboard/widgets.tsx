import {
  AlertTriangle,
  CalendarClock,
  CheckSquare,
  Flame,
  Footprints,
  NotebookPen,
  Receipt,
  Sparkles,
  Target,
} from 'lucide-react'
import Link from 'next/link'
import { HabitCheck } from '@/components/habits/habit-check'
import { GoalProgressBar } from '@/components/goals/goal-progress-bar'
import { Money } from '@/components/finances/money'
import { RecurringDue } from '@/components/finances/recurring-due'
import { Timeline } from '@/components/today/timeline'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { Stat } from '@/components/ui/stat'
import type { DashboardData } from '@/lib/dashboard/service'
import { formatISODate, minutesToLabel, relativeDayLabel } from '@/lib/dates'
import { formatGoalValue } from '@/lib/goals/format'
import { formatMoney } from '@/lib/money'
import { formatDistance, type Units } from '@/lib/units'
import { percent, truncate } from '@/lib/utils'
import { Widget } from './widget'

type P = { data: DashboardData; today: string; currency: string; units: Units }

export function BriefWidget({ data }: P) {
  return (
    <Widget title="Daily brief">
      <ul className="flex flex-col gap-2 text-sm">
        {data.brief.map((line, i) => (
          <li key={i} className="flex gap-2">
            <Sparkles className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Widget>
  )
}

export function TodayWidget({ data }: P) {
  const open = data.day.tasks.filter((t) => !['completed', 'cancelled'].includes(t.status))
  return (
    <Widget title="Today" href="/today" linkLabel="Open Today">
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <CheckSquare className="text-muted-foreground size-4" />{' '}
          <strong className="tabular">{open.length}</strong> tasks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="text-muted-foreground size-4" />{' '}
          <strong className="tabular">{data.day.events.length}</strong> events
        </span>
        {data.day.overdue.length > 0 && (
          <span className="text-destructive inline-flex items-center gap-1.5">
            <AlertTriangle className="size-4" /> {data.day.overdue.length} overdue
          </span>
        )}
      </div>
      <Timeline
        timed={data.day.timeline.timed}
        anytime={data.day.timeline.anytime.slice(0, 6)}
        now={data.day.now}
      />
    </Widget>
  )
}

export function HabitsWidget({ data, today }: P) {
  const items = data.day.habits.items.filter((i) => i.relevantToday)
  const { doneCount, dueCount } = data.day.habits
  return (
    <Widget title="Habits" href="/habits">
      {items.length === 0 ? (
        <EmptyState
          compact
          icon={Flame}
          title="No habits yet"
          description="Track one small habit to start."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm">
              <strong className="tabular text-lg">
                {doneCount} / {dueCount}
              </strong>{' '}
              habits completed
            </span>
            <span className="tabular text-sm font-semibold">
              {Math.round(percent(doneCount, dueCount))}%
            </span>
          </div>
          <Progress
            value={percent(doneCount, dueCount)}
            tone="success"
            label="Habits completed today"
          />
          <ul className="flex flex-col gap-2">
            {items.slice(0, 6).map((i) => (
              <li key={i.habit.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">{i.habit.name}</span>
                <HabitCheck habit={i.habit} date={today} value={i.todayValue} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Widget>
  )
}

export function RemindersWidget({ data, today }: P) {
  const deadlines = data.goals.filter(
    (g) => g.pace.daysLeft !== null && g.pace.daysLeft >= 0 && g.pace.daysLeft <= 7,
  )
  const budgets = data.finance.budgets.filter((b) => b.status !== 'ok')
  const empty =
    data.day.overdue.length === 0 &&
    data.finance.dueRecurring.length === 0 &&
    deadlines.length === 0 &&
    budgets.length === 0
  return (
    <Widget title="Reminders">
      {empty ? (
        <p className="text-muted-foreground text-sm">Nothing needs your attention. 🎉</p>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          {data.day.overdue.length > 0 && (
            <Link
              href="/tasks?view=today"
              className="text-destructive flex items-center gap-2 hover:underline"
            >
              <AlertTriangle className="size-4" /> {data.day.overdue.length} overdue task
              {data.day.overdue.length === 1 ? '' : 's'}
            </Link>
          )}
          {deadlines.map((g) => (
            <Link
              key={g.id}
              href={`/goals/${g.id}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Target className="text-muted-foreground size-4" /> {g.title} — due{' '}
              {relativeDayLabel(g.deadline!, today).toLowerCase()}
            </Link>
          ))}
          {budgets.map((b) => (
            <Link
              key={b.id}
              href="/finances/budgets"
              className={`flex items-center gap-2 hover:underline ${b.status === 'over' ? 'text-destructive' : 'text-warning'}`}
            >
              <Receipt className="size-4" /> {b.name}: {Math.round(b.percent)}% of budget used
            </Link>
          ))}
          {data.finance.dueRecurring.length > 0 && (
            <RecurringDue items={data.finance.dueRecurring} today={today} />
          )}
        </div>
      )}
    </Widget>
  )
}

export function GoalsWidget({ data }: P) {
  return (
    <Widget title="Goals" href="/goals">
      {data.goals.length === 0 ? (
        <EmptyState
          compact
          icon={Target}
          title="No goals yet"
          description="Create your first goal and start tracking progress."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {data.goals.slice(0, 4).map((g) => (
            <li key={g.id}>
              <Link href={`/goals/${g.id}`} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{g.title}</span>
                  <span className="tabular shrink-0 font-semibold">
                    {Math.round(g.progress.percent)}%
                  </span>
                </span>
                <GoalProgressBar
                  percent={g.progress.percent}
                  pace={g.pace}
                  label={`${g.title} progress`}
                />
                {g.target_type === 'numeric' &&
                  g.progress_source !== 'tasks' &&
                  g.progress_source !== 'milestones' && (
                    <span className="tabular text-muted-foreground text-xs">
                      {formatGoalValue(g.progress.current, g.unit)} /{' '}
                      {formatGoalValue(g.progress.target, g.unit)}
                    </span>
                  )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}

export function FinanceWidget({ data, currency }: P) {
  const f = data.finance
  const p = data.financePeriod.summary
  if (f.accounts.length === 0) {
    return (
      <Widget title="Finances" href="/finances/accounts?new=1" linkLabel="Add account">
        <EmptyState
          compact
          icon={Receipt}
          title="No accounts yet"
          description="Add your main account to see your money at a glance."
        />
      </Widget>
    )
  }
  return (
    <Widget title="Finances" href="/finances">
      <div className="flex flex-col gap-4">
        <Stat label="Net worth" value={formatMoney(f.netWorth.net, currency)} size="lg" />
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Income"
            value={<Money minor={p.income} currency={currency} compact />}
            size="sm"
            tone="positive"
          />
          <Stat
            label="Expenses"
            value={<Money minor={p.expenses} currency={currency} compact />}
            size="sm"
          />
          <Stat
            label="Savings"
            value={<Money minor={p.savings} currency={currency} compact />}
            size="sm"
            tone={p.savings < 0 ? 'negative' : undefined}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {data.financePeriod.range === 'month' ? 'This month' : data.financePeriod.range === 'quarter' ? 'Last 3 months' : 'Year to date'} · savings rate {Math.round(p.savingsRate)}% · forecast end balance{' '}
          {formatMoney(f.forecast.expectedEndBalance, currency, { compact: true })}
        </p>
      </div>
    </Widget>
  )
}

export function TrainingWidget({ data, units }: P) {
  const t = data.day.training
  return (
    <Widget title="Training" href="/workouts">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="This week"
            value={
              t.thisWeek.target ? `${t.thisWeek.count} / ${t.thisWeek.target}` : t.thisWeek.count
            }
            hint="workouts"
          />
          <Stat
            label="Training time"
            value={minutesToLabel(t.thisWeek.minutes)}
            hint={t.thisWeek.distance ? formatDistance(t.thisWeek.distance, units) : undefined}
          />
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm">
          <Footprints className="text-muted-foreground size-4" />
          <strong className="tabular">
            {(t.activityToday?.steps ?? 0).toLocaleString('pl-PL')}
          </strong>{' '}
          steps today
        </p>
        {t.todaysSessions
          .filter((s) => s.workout_type !== 'rest')
          .map((s) => (
            <p key={s.id} className="text-sm">
              Planned: <strong>{s.title}</strong> {s.done && '✓'}
            </p>
          ))}
      </div>
    </Widget>
  )
}

export function LifeBalanceWidget({ data }: P) {
  return (
    <Widget title="Life balance" href="/analytics">
      {data.lifeBalance.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Add goals in different areas of life to see how balanced your progress is.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data.lifeBalance.map((r) => (
            <li key={r.area} className="grid grid-cols-[100px_1fr_40px] items-center gap-3 text-sm">
              <span className="capitalize">{r.area}</span>
              <Progress
                value={r.avgProgress ?? 0}
                label={`${r.area} goal progress`}
                tone={r.behind ? 'warning' : 'primary'}
              />
              <span className="tabular text-muted-foreground text-right text-xs">
                {Math.round(r.avgProgress ?? 0)}%
              </span>
            </li>
          ))}
          <li className="text-muted-foreground text-xs">
            Average progress of active goals per area.
          </li>
        </ul>
      )}
    </Widget>
  )
}

export function NotesWidget({ data }: P) {
  return (
    <Widget title="Recent notes" href="/notes">
      {data.notes.length === 0 ? (
        <EmptyState compact icon={NotebookPen} title="No notes yet" />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.notes.map((n) => (
            <li key={n.id}>
              <Link href={`/notes/${n.id}`} className="hover:bg-accent block rounded-md p-1">
                <span className="block truncate text-sm font-medium">{n.title || 'Untitled'}</span>
                <span className="text-muted-foreground block truncate text-xs">
                  {formatISODate(n.updated_at.slice(0, 10), 'd MMM')} ·{' '}
                  {truncate(n.content_text, 60)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}
