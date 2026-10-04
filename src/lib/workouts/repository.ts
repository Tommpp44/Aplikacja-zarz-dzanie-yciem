import 'server-only'
import { addDaysISO, diffDaysISO, weekdayOf, type ISODate } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'

export async function listWorkouts(
  db: DB,
  userId: string,
  from: ISODate | null,
  to: ISODate,
  limit = 500,
) {
  let q = db
    .from('workouts')
    .select(
      'id, name, workout_type, status, performed_on, duration_minutes, distance_m, calories, goal_id, plan_session_id, source',
    )
    .eq('user_id', userId)
    .lte('performed_on', to)
  if (from) q = q.gte('performed_on', from)
  return unwrap(
    await q
      .order('performed_on', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit),
    'load workouts',
  )
}

export async function getWorkout(db: DB, userId: string, id: string) {
  const workout = unwrap(
    await db.from('workouts').select('*').eq('user_id', userId).eq('id', id).maybeSingle(),
    'load the workout',
  )
  if (!workout) return null
  const exercises = unwrap(
    await db
      .from('workout_exercises')
      .select(
        'id, position, notes, exercise:exercises(id, name, category, muscle_group), sets:workout_sets(id, set_number, weight_kg, reps, rpe, rest_seconds, completed)',
      )
      .eq('user_id', userId)
      .eq('workout_id', id)
      .order('position'),
    'load exercises',
  )
  return {
    ...workout,
    exercises: exercises.map((e) => ({
      ...e,
      sets: [...e.sets]
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({
          ...s,
          weight_kg: s.weight_kg === null ? null : Number(s.weight_kg),
          rpe: s.rpe === null ? null : Number(s.rpe),
        })),
    })),
  }
}

export async function listExercises(db: DB, userId: string) {
  return unwrap(
    await db
      .from('exercises')
      .select('id, name, category, muscle_group, equipment, user_id')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('name'),
    'load exercises',
  )
}

/** Set history for strength exercises (for PRs and progression). */
export async function listStrengthHistory(db: DB, userId: string, exerciseIds?: string[]) {
  let q = db
    .from('workout_exercises')
    .select(
      'exercise_id, workout:workouts!inner(id, performed_on, status), sets:workout_sets(weight_kg, reps, completed)',
    )
    .eq('user_id', userId)
  if (exerciseIds?.length) q = q.in('exercise_id', exerciseIds)
  const rows = unwrap(await q.limit(5000), 'load history')
  return rows
    .filter((r) => r.workout && r.workout.status === 'completed')
    .map((r) => ({
      exerciseId: r.exercise_id,
      workoutId: r.workout!.id,
      date: r.workout!.performed_on,
      sets: r.sets.map((s) => ({
        weight_kg: s.weight_kg === null ? null : Number(s.weight_kg),
        reps: s.reps,
        completed: s.completed,
      })),
    }))
}

export async function listTemplates(db: DB, userId: string) {
  return unwrap(
    await db
      .from('workout_templates')
      .select(
        '*, exercises:workout_template_exercises(id, position, target_sets, target_reps, target_weight_kg, exercise:exercises(id, name))',
      )
      .eq('user_id', userId)
      .order('name'),
    'load templates',
  )
}

export async function listPlans(db: DB, userId: string) {
  return unwrap(
    await db
      .from('training_plans')
      .select('*, sessions:training_plan_sessions(*)')
      .eq('user_id', userId)
      .order('active', { ascending: false })
      .order('start_date', { ascending: false }),
    'load plans',
  )
}

export type PlanRow = Awaited<ReturnType<typeof listPlans>>[number]

/** Planned sessions from active plans for a date (week numbering starts at the plan start week). */
export function sessionsForDate(plans: PlanRow[], date: ISODate) {
  const out: (PlanRow['sessions'][number] & { planName: string; planId: string; week: number })[] =
    []
  for (const plan of plans) {
    if (!plan.active || date < plan.start_date) continue
    const week = Math.floor(diffDaysISO(date, plan.start_date) / 7) + 1
    if (week > plan.weeks) continue
    for (const s of plan.sessions) {
      if (s.weekday !== weekdayOf(date)) continue
      if (s.week !== null && s.week !== week) continue
      out.push({ ...s, planName: plan.name, planId: plan.id, week })
    }
  }
  return out
}

export function plannedSessionsPerWeek(plans: PlanRow[], today: ISODate) {
  const active = plans.filter(
    (p) => p.active && p.start_date <= today && addDaysISO(p.start_date, p.weeks * 7) > today,
  )
  if (active.length === 0) return null
  let count = 0
  for (let i = 0; i < 7; i++)
    count += sessionsForDate(active, addDaysISO(today, i - weekdayOf(today))).filter(
      (s) => s.workout_type !== 'rest',
    ).length
  return count
}

export async function listActivity(db: DB, userId: string, from: ISODate, to: ISODate) {
  return unwrap(
    await db
      .from('activity_records')
      .select('*')
      .eq('user_id', userId)
      .gte('record_date', from)
      .lte('record_date', to)
      .order('record_date'),
    'load activity',
  )
}
