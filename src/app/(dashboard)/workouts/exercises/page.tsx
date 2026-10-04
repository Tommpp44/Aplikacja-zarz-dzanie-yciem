import type { Metadata } from 'next'
import { ExerciseLibrary } from '@/components/workouts/exercise-library'
import { PageHeader } from '@/components/ui/page-header'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatWeight, type Units } from '@/lib/units'
import { getStrengthRecords } from '@/lib/workouts/service'

export const metadata: Metadata = { title: 'Exercise library' }

export default async function ExercisesPage() {
  const { supabase, user, prefs } = await getOnboardedUserContext()
  const units: Units = prefs.units === 'imperial' ? 'imperial' : 'metric'
  const { exercises, prs } = await getStrengthRecords(supabase, user.id)
  const prMap = new Map(prs.map((p) => [p.exerciseId, p]))
  return (
    <>
      <PageHeader
        title="Exercise library"
        description="Built-in movements plus your own. Personal bests are shown next to each exercise."
      />
      <ExerciseLibrary
        exercises={exercises.map((e) => {
          const pr = prMap.get(e.id)
          return {
            ...e,
            pr: pr ? `PR ${formatWeight(pr.bestWeight, units)} × ${pr.bestWeightReps}` : null,
          }
        })}
      />
    </>
  )
}
