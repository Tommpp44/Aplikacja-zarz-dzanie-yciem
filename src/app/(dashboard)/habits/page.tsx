import { HabitCelebrations } from '@/components/engagement/habit-celebrations'
import { HabitsBoard } from '@/components/habits/habits-board'
import { PageHeader } from '@/components/ui/page-header'
import { Progress } from '@/components/ui/progress'
import { Stat } from '@/components/ui/stat'
import { startOfWeekISO } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { getHabitsOverview } from '@/lib/habits/service'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { percent } from '@/lib/utils'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Habits')

export default async function HabitsPage({ searchParams }: PageProps<'/habits'>) {
  const t = await getT()
  const params = await searchParams
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const [overview, goals] = await Promise.all([
    getHabitsOverview(supabase, user.id, today, prefs.week_start),
    listGoalOptions(supabase, user.id),
  ])
  const { items, dueCount, doneCount } = overview
  const avgConsistency = items.length
    ? items.reduce((a, i) => a + i.stats.consistency, 0) / items.length
    : 0
  const bestStreak = items.reduce((m, i) => Math.max(m, i.stats.bestStreak), 0)

  return (
    <>
      <HabitCelebrations items={items} dueCount={dueCount} doneCount={doneCount} today={today} />
      <PageHeader
        title={t('Habits')}
        description={t('One tap to log. Consistency beats perfection.')}
      />
      {items.length > 0 && (
        <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 sm:grid-cols-4">
          <Stat
            label={t('Today')}
            value={`${doneCount} / ${dueCount}`}
            hint={t('habits completed')}
            size="lg"
          />
          <Stat
            label={t('Completion')}
            value={`${Math.round(percent(doneCount, dueCount))}%`}
            hint={t("of today's habits")}
          />
          <Stat
            label={t('Consistency')}
            value={`${Math.round(avgConsistency)}%`}
            hint={t('average, last 30 days')}
          />
          <Stat label={t('Best streak')} value={bestStreak} hint={t('across all habits')} />
          <Progress
            value={percent(doneCount, dueCount)}
            tone="success"
            className="col-span-2 sm:col-span-4"
            label={t("Today's habits")}
          />
        </div>
      )}
      <HabitsBoard
        items={items}
        today={today}
        weekStart={startOfWeekISO(today, prefs.week_start)}
        goals={goals}
        weekStartsOn={prefs.week_start}
        openNew={params.new === '1'}
      />
    </>
  )
}
