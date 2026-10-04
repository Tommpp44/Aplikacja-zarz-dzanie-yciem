import Link from 'next/link'
import { goalCategoryLabel } from '@/lib/goals/schemas'
import { formatISODate } from '@/lib/dates'
import { formatGoalValue } from '@/lib/goals/format'
import type { GoalWithProgress } from '@/lib/goals/service'
import { GoalProgressBar, PaceBadge } from './goal-progress-bar'
import { getT } from '@/lib/i18n/server'

export async function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const t = await getT()
  const { progress, pace } = goal
  const isCount = goal.progress_source === 'milestones' || goal.progress_source === 'tasks'
  const unit = isCount
    ? goal.progress_source === 'tasks'
      ? t('tasks')
      : t('milestones')
    : goal.unit
  return (
    <Link
      href={`/goals/${goal.id}`}
      className="bg-card hover:border-primary/40 flex h-full flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{goal.title}</p>
          <p className="text-muted-foreground text-xs">{t(goalCategoryLabel(goal.category))}</p>
        </div>
        <PaceBadge pace={pace} />
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="tabular text-lg font-semibold tracking-tight">
            {Math.round(progress.percent)}%
          </span>
          {goal.target_type !== 'boolean' && (
            <span className="tabular text-muted-foreground truncate text-xs">
              {isCount
                ? `${progress.current} / ${progress.target} ${unit}`
                : `${formatGoalValue(progress.current, unit)} / ${formatGoalValue(progress.target, unit)}`}
            </span>
          )}
        </div>
        <GoalProgressBar
          percent={progress.percent}
          pace={pace}
          label={t('{name} progress', { name: goal.title })}
        />
        {goal.deadline && (
          <p className="text-muted-foreground text-xs">
            {t('Deadline {date}', { date: formatISODate(goal.deadline, 'd MMM yyyy') })}
            {pace.daysLeft !== null &&
              pace.daysLeft >= 0 &&
              ` · ${t.plural(pace.daysLeft, '{n} day left', '{n} days left')}`}
          </p>
        )}
      </div>
    </Link>
  )
}
