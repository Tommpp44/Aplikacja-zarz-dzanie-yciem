import { TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'
import { TrendChart } from '@/components/charts/lazy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { ExerciseLibrary } from '@/components/workouts/exercise-library'
import { ExercisePicker } from '@/components/workouts/exercise-picker'
import { formatISODate } from '@/lib/dates'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatWeight, kgToDisplay, weightUnit, type Units } from '@/lib/units'
import { getStrengthRecords } from '@/lib/workouts/service'
import { e1rmSeries } from '@/lib/workouts/stats'

export const metadata: Metadata = { title: 'Exercise library' }

export default async function ExercisesPage({ searchParams }: PageProps<'/workouts/exercises'>) {
  const params = await searchParams
  const { supabase, user, prefs } = await getOnboardedUserContext()
  const units: Units = prefs.units === 'imperial' ? 'imperial' : 'metric'
  const { exercises, prs, history } = await getStrengthRecords(supabase, user.id)
  const prMap = new Map(prs.map((p) => [p.exerciseId, p]))

  // Exercises with logged weight, most-trained first.
  const sessions = new Map<string, Set<string>>()
  for (const h of history) {
    if (!prMap.has(h.exerciseId)) continue
    const dates = sessions.get(h.exerciseId) ?? new Set<string>()
    dates.add(h.date)
    sessions.set(h.exerciseId, dates)
  }
  const trained = exercises
    .filter((e) => sessions.has(e.id))
    .sort((a, b) => sessions.get(b.id)!.size - sessions.get(a.id)!.size)
  const selectedId =
    typeof params.exercise === 'string' && sessions.has(params.exercise)
      ? params.exercise
      : trained[0]?.id
  const series = selectedId ? e1rmSeries(history, selectedId) : []
  const first = series[0]
  const last = series.at(-1)
  const best = selectedId ? prMap.get(selectedId) : undefined
  const unit = weightUnit(units)

  return (
    <>
      <PageHeader
        title="Exercise library"
        description="Built-in movements plus your own. Personal bests are shown next to each exercise."
      />
      {selectedId && first && last && best && (
        <Card className="mb-6">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary size-4" aria-hidden /> Strength progress
            </CardTitle>
            <ExercisePicker
              value={selectedId}
              options={trained.map((e) => ({ id: e.id, name: e.name }))}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Estimated 1RM" value={formatWeight(last.e1rm, units)} size="lg" />
              <Stat
                label="Change"
                value={`${last.e1rm >= first.e1rm ? '+' : '−'}${formatWeight(Math.abs(last.e1rm - first.e1rm), units)}`}
                hint={`since ${formatISODate(first.date, 'd MMM yyyy')}`}
                tone={last.e1rm > first.e1rm ? 'positive' : undefined}
              />
              <Stat
                label="Heaviest set"
                value={`${formatWeight(best.bestWeight, units)} × ${best.bestWeightReps}`}
              />
              <Stat label="Sessions" value={series.length} />
            </div>
            {series.length > 1 ? (
              <TrendChart
                ariaLabel="Estimated one-rep max over time"
                format={`unit:${unit}`}
                data={series.map((p) => ({
                  label: formatISODate(p.date, 'd MMM'),
                  value: Math.round(kgToDisplay(p.e1rm, units) * 10) / 10,
                }))}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                Log this exercise in another session to see your progress curve.
              </p>
            )}
          </CardContent>
        </Card>
      )}
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
