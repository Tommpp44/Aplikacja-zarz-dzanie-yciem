import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LinkedNotes } from '@/components/notes/linked-notes'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/ui/stat'
import { SessionLogger } from '@/components/workouts/session-logger'
import { ElapsedTimer, WorkoutActions } from '@/components/workouts/workout-actions'
import { formatISODate, minutesToLabel } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatDistance, formatPace, metersToDisplay, type Units } from '@/lib/units'
import { getWorkout, listExercises, listStrengthHistory } from '@/lib/workouts/repository'
import { WORKOUT_TYPE_LABELS, type WorkoutInput, type WorkoutType } from '@/lib/workouts/schemas'
import { personalRecords } from '@/lib/workouts/stats'

export const metadata: Metadata = { title: 'Workout' }

export default async function WorkoutPage({ params }: PageProps<'/workouts/[id]'>) {
  const { id } = await params
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const units: Units = prefs.units === 'imperial' ? 'imperial' : 'metric'
  const workout = await getWorkout(supabase, user.id, id).catch(() => null)
  if (!workout) notFound()
  const [exercises, history, goals] = await Promise.all([
    listExercises(supabase, user.id),
    listStrengthHistory(
      supabase,
      user.id,
      workout.exercises.map((e) => e.exercise?.id).filter((x): x is string => Boolean(x)),
    ),
    listGoalOptions(supabase, user.id),
  ])
  // Best e1RM per exercise from *other* sessions (to highlight new records here).
  const prs = personalRecords(history.filter((h) => h.workoutId !== id))
  const bests = Object.fromEntries([...prs.entries()].map(([k, v]) => [k, v.bestE1RM]))
  const isStrength = workout.workout_type === 'strength' || workout.exercises.length > 0
  const inProgress = workout.status === 'in_progress'
  const formValues: WorkoutInput & { id: string } = {
    id: workout.id,
    name: workout.name,
    workout_type: workout.workout_type as WorkoutType,
    performed_on: workout.performed_on,
    status: workout.status as WorkoutInput['status'],
    duration_minutes: workout.duration_minutes,
    distance: workout.distance_m
      ? Math.round(metersToDisplay(Number(workout.distance_m), units) * 100) / 100
      : null,
    calories: workout.calories,
    elevation_m: workout.elevation_m === null ? null : Number(workout.elevation_m),
    avg_heart_rate: workout.avg_heart_rate,
    notes: workout.notes,
    goal_id: workout.goal_id,
  }

  return (
    <>
      <Link
        href="/workouts"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Workouts
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{workout.name}</h1>
            <Badge
              variant={
                inProgress ? 'warning' : workout.status === 'planned' ? 'secondary' : 'success'
              }
            >
              {inProgress ? 'In progress' : workout.status === 'planned' ? 'Planned' : 'Completed'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            {WORKOUT_TYPE_LABELS[workout.workout_type as WorkoutType]} ·{' '}
            {formatISODate(workout.performed_on, 'EEEE, d MMM yyyy')}
            {inProgress && workout.started_at && (
              <>
                {' · '}
                <ElapsedTimer startedAt={workout.started_at} />
              </>
            )}
          </p>
        </div>
        <WorkoutActions
          workout={formValues}
          inProgress={inProgress}
          today={today}
          units={units}
          goals={goals}
        />
      </div>

      {(workout.duration_minutes || workout.distance_m || workout.calories) && (
        <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 sm:grid-cols-4">
          <Stat
            label="Duration"
            value={workout.duration_minutes ? minutesToLabel(workout.duration_minutes) : '—'}
          />
          {workout.distance_m ? (
            <Stat label="Distance" value={formatDistance(Number(workout.distance_m), units)} />
          ) : null}
          {workout.distance_m && workout.duration_minutes ? (
            <Stat
              label="Pace"
              value={formatPace(Number(workout.distance_m), workout.duration_minutes, units) ?? '—'}
            />
          ) : null}
          {workout.calories ? <Stat label="Calories" value={`${workout.calories} kcal`} /> : null}
          {workout.avg_heart_rate ? (
            <Stat label="Avg heart rate" value={`${workout.avg_heart_rate} bpm`} />
          ) : null}
          {workout.elevation_m ? (
            <Stat label="Elevation" value={`${Number(workout.elevation_m)} m`} />
          ) : null}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          {isStrength ? (
            <SessionLogger
              workoutId={workout.id}
              blocks={workout.exercises}
              exercises={exercises.map((e) => ({
                id: e.id,
                name: e.name,
                muscle_group: e.muscle_group,
              }))}
              units={units}
              bests={bests}
            />
          ) : (
            <p className="bg-card text-muted-foreground rounded-xl border p-4 text-sm">
              Use Edit to update duration, distance and notes for this session.
            </p>
          )}
          {workout.notes && (
            <p className="bg-card rounded-xl border p-4 text-sm whitespace-pre-wrap">
              {workout.notes}
            </p>
          )}
        </div>
        <aside>
          <LinkedNotes entityType="workout" entityId={workout.id} />
        </aside>
      </div>
    </>
  )
}
