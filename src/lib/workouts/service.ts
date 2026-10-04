import 'server-only'
import { addDaysISO, startOfWeekISO, type ISODate } from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import {
  listActivity,
  listExercises,
  listPlans,
  listStrengthHistory,
  listTemplates,
  listWorkouts,
  plannedSessionsPerWeek,
  sessionsForDate,
} from './repository'
import { personalRecords, totalVolume, weeklyFrequency } from './stats'

/** Training snapshot used by Workouts, Today and the Dashboard. */
export async function getTrainingOverview(
  db: DB,
  userId: string,
  today: ISODate,
  weekStartsOn: 0 | 1,
) {
  const weekStart = startOfWeekISO(today, weekStartsOn)
  const [workouts, plans, activity] = await Promise.all([
    listWorkouts(db, userId, addDaysISO(today, -7 * 12), today),
    listPlans(db, userId),
    listActivity(db, userId, addDaysISO(today, -29), today),
  ])
  const completed = workouts.filter((w) => w.status === 'completed')
  const thisWeek = completed.filter((w) => w.performed_on >= weekStart)
  const todaysSessions = sessionsForDate(plans, today)
  const doneSessionIds = new Set(
    workouts.filter((w) => w.performed_on === today).map((w) => w.plan_session_id),
  )
  return {
    workouts,
    thisWeek: {
      count: thisWeek.length,
      target: plannedSessionsPerWeek(plans, today),
      minutes: thisWeek.reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
      distance: thisWeek.reduce((s, w) => s + Number(w.distance_m ?? 0), 0),
    },
    weekly: weeklyFrequency(workouts, today, 8, weekStartsOn),
    plans,
    todaysSessions: todaysSessions.map((s) => ({ ...s, done: doneSessionIds.has(s.id) })),
    inProgress: workouts.find((w) => w.status === 'in_progress') ?? null,
    activityToday: activity.find((a) => a.record_date === today) ?? null,
    activity,
  }
}

export async function getStrengthRecords(db: DB, userId: string) {
  const [history, exercises] = await Promise.all([
    listStrengthHistory(db, userId),
    listExercises(db, userId),
  ])
  const names = new Map(exercises.map((e) => [e.id, e.name]))
  const prs = [...personalRecords(history).values()]
    .map((p) => ({ ...p, name: names.get(p.exerciseId) ?? 'Exercise' }))
    .sort((a, b) => b.date.localeCompare(a.date))
  const volumeByWorkout = new Map<string, number>()
  for (const h of history)
    volumeByWorkout.set(h.workoutId, (volumeByWorkout.get(h.workoutId) ?? 0) + totalVolume(h.sets))
  return { prs, volumeByWorkout, exercises }
}

export { listTemplates }
