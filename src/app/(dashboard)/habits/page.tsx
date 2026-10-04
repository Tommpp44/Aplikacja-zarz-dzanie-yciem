import type { Metadata } from 'next'
import { HabitsBoard } from '@/components/habits/habits-board'
import { PageHeader } from '@/components/ui/page-header'
import { Progress } from '@/components/ui/progress'
import { Stat } from '@/components/ui/stat'
import { startOfWeekISO } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { getHabitsOverview } from '@/lib/habits/service'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { percent } from '@/lib/utils'

export const metadata: Metadata = { title: 'Habits' }

export default async function HabitsPage({ searchParams }: PageProps<'/habits'>) {
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
      <PageHeader title="Habits" description="One tap to log. Consistency beats perfection." />
      {items.length > 0 && (
        <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 sm:grid-cols-4">
          <Stat
            label="Today"
            value={`${doneCount} / ${dueCount}`}
            hint="habits completed"
            size="lg"
          />
          <Stat
            label="Completion"
            value={`${Math.round(percent(doneCount, dueCount))}%`}
            hint="of today's habits"
          />
          <Stat
            label="Consistency"
            value={`${Math.round(avgConsistency)}%`}
            hint="average, last 30 days"
          />
          <Stat label="Best streak" value={bestStreak} hint="across all habits" />
          <Progress
            value={percent(doneCount, dueCount)}
            tone="success"
            className="col-span-2 sm:col-span-4"
            label="Today's habits"
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
