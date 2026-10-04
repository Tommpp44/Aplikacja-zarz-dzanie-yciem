import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PACE_LABELS, type GoalPace } from '@/lib/goals/calculations'

export function PaceBadge({ pace }: { pace: GoalPace }) {
  const variant =
    pace.status === 'done' || pace.status === 'ahead'
      ? 'success'
      : pace.status === 'on_track'
        ? 'default'
        : pace.status === 'behind' || pace.status === 'overdue'
          ? 'warning'
          : 'secondary'
  return <Badge variant={variant}>{PACE_LABELS[pace.status]}</Badge>
}

export function GoalProgressBar({
  percent,
  pace,
  label,
}: {
  percent: number
  pace: GoalPace
  label: string
}) {
  const tone =
    pace.status === 'done'
      ? 'success'
      : pace.status === 'behind' || pace.status === 'overdue'
        ? 'warning'
        : 'primary'
  return (
    <div className="relative">
      <Progress value={percent} tone={tone} label={label} className="h-2" />
      {pace.expectedPercent !== null && pace.status !== 'done' && (
        <span
          aria-hidden
          title="Where you should be on a linear plan"
          className="bg-foreground/40 absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded"
          style={{ left: `${pace.expectedPercent}%` }}
        />
      )}
    </div>
  )
}
