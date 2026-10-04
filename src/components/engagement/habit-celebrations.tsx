import type { ISODate } from '@/lib/dates'
import { bestMilestoneToday } from '@/lib/engagement/nudges'
import type { HabitOverviewItem } from '@/lib/habits/service'
import { Celebrate } from './celebrate'

/** Streak milestones take precedence over the "all done today" celebration. */
export function HabitCelebrations({
  items,
  dueCount,
  doneCount,
  today,
}: {
  items: HabitOverviewItem[]
  dueCount: number
  doneCount: number
  today: ISODate
}) {
  const milestone = bestMilestoneToday(
    items.map((i) => ({
      id: i.habit.id,
      name: i.habit.name,
      doneToday: i.doneToday,
      streak: i.stats.currentStreak,
      unit: i.stats.streakUnit,
    })),
  )
  if (milestone)
    return (
      <Celebrate
        when
        onceKey={`streak:${milestone.id}:${milestone.streak}`}
        message={`${milestone.streak}-${milestone.unit === 'weeks' ? 'week' : 'day'} streak on “${milestone.name}” — keep it going! 🔥`}
      />
    )
  return (
    <Celebrate
      when={dueCount > 0 && doneCount >= dueCount}
      onceKey={`habits:${today}`}
      message="All habits done today — great work!"
    />
  )
}
