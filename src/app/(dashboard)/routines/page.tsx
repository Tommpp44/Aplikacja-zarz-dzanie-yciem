import { Repeat } from 'lucide-react'
import type { Metadata } from 'next'
import { NewRoutineButton } from '@/components/routines/new-routine-button'
import { RoutineCard } from '@/components/routines/routine-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { weekdayOf } from '@/lib/dates'
import { listHabits } from '@/lib/habits/repository'
import { listRoutines } from '@/lib/routines/repository'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Routines' }

export default async function RoutinesPage() {
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const [routines, habits] = await Promise.all([
    listRoutines(supabase, user.id, today),
    listHabits(supabase, user.id),
  ])
  const weekday = weekdayOf(today)
  const habitOptions = habits.map((h) => ({ id: h.id, name: h.name }))
  const todays = routines.filter((r) => r.active && r.weekdays.includes(weekday))
  const others = routines.filter((r) => !todays.includes(r))

  return (
    <>
      <PageHeader
        title="Routines"
        description="Repeatable checklists for the moments that shape your day."
        actions={<NewRoutineButton habits={habitOptions} weekStartsOn={prefs.week_start} />}
      />
      {routines.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No routines yet"
          description="Build a morning or evening routine: wake up, drink water, stretch, plan the day."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {todays.length > 0 && (
            <section aria-labelledby="routines-today">
              <h2 id="routines-today" className="text-muted-foreground mb-3 text-sm font-semibold">
                Today
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {todays.map((r) => (
                  <RoutineCard
                    key={r.id}
                    routine={r}
                    scheduledToday
                    habits={habitOptions}
                    weekStartsOn={prefs.week_start}
                  />
                ))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section aria-labelledby="routines-other">
              <h2 id="routines-other" className="text-muted-foreground mb-3 text-sm font-semibold">
                Other days
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {others.map((r) => (
                  <RoutineCard
                    key={r.id}
                    routine={r}
                    scheduledToday={false}
                    habits={habitOptions}
                    weekStartsOn={prefs.week_start}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
