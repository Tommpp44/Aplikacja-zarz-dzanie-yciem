import type { ISODate } from '@/lib/dates'
import { bestMilestoneToday } from '@/lib/engagement/nudges'
import type { HabitOverviewItem } from '@/lib/habits/service'
import { getT } from '@/lib/i18n/server'
import { Celebrate } from './celebrate'

/** Streak milestones take precedence over the "all done today" celebration. */
export async function HabitCelebrations({
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
  const t = await getT()
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
        message={
          milestone.unit === 'weeks'
            ? t('{n}-week streak on “{name}” — keep it going!', {
                n: milestone.streak,
                name: milestone.name,
              }) + ' 🔥'
            : t('{n}-day streak on “{name}” — keep it going!', {
                n: milestone.streak,
                name: milestone.name,
              }) + ' 🔥'
        }
      />
    )
  return (
    <Celebrate
      when={dueCount > 0 && doneCount >= dueCount}
      onceKey={`habits:${today}`}
      message={t('All habits done today — great work!')}
    />
  )
}
