import { addDaysISO, startOfWeekISO, type ISODate } from '@/lib/dates'

export type SetLike = { weight_kg: number | null; reps: number | null; completed?: boolean }

/** Epley estimated one-rep max. */
export function estimatedOneRepMax(weightKg: number, reps: number) {
  if (weightKg <= 0 || reps <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

export function setVolume(set: SetLike) {
  if (set.completed === false) return 0
  return (set.weight_kg ?? 0) * (set.reps ?? 0)
}

export function totalVolume(sets: SetLike[]) {
  return sets.reduce((s, x) => s + setVolume(x), 0)
}

export type PersonalRecord = {
  exerciseId: string
  bestWeight: number
  bestWeightReps: number
  bestE1RM: number
  bestSetVolume: number
  date: ISODate
}

/** Best lifts per exercise across history. */
export function personalRecords(entries: { exerciseId: string; date: ISODate; sets: SetLike[] }[]) {
  const out = new Map<string, PersonalRecord>()
  for (const e of entries) {
    for (const s of e.sets) {
      if (s.completed === false || !s.weight_kg || !s.reps) continue
      const e1rm = estimatedOneRepMax(s.weight_kg, s.reps)
      const prev = out.get(e.exerciseId)
      if (!prev) {
        out.set(e.exerciseId, {
          exerciseId: e.exerciseId,
          bestWeight: s.weight_kg,
          bestWeightReps: s.reps,
          bestE1RM: e1rm,
          bestSetVolume: setVolume(s),
          date: e.date,
        })
        continue
      }
      if (
        s.weight_kg > prev.bestWeight ||
        (s.weight_kg === prev.bestWeight && s.reps > prev.bestWeightReps)
      ) {
        prev.bestWeight = s.weight_kg
        prev.bestWeightReps = s.reps
      }
      if (e1rm > prev.bestE1RM) {
        prev.bestE1RM = e1rm
        prev.date = e.date
      }
      prev.bestSetVolume = Math.max(prev.bestSetVolume, setVolume(s))
    }
  }
  return out
}

/** Sets in the current session that beat the previous best e1RM for that exercise. */
export function isNewRecord(set: SetLike, previousBestE1RM: number | undefined) {
  if (!set.weight_kg || !set.reps) return false
  return (
    estimatedOneRepMax(set.weight_kg, set.reps) > (previousBestE1RM ?? 0) &&
    (previousBestE1RM ?? 0) > 0
  )
}

export type WorkoutSummaryLike = {
  performed_on: ISODate
  duration_minutes: number | null
  distance_m: number | null
  status?: string
}

/** Completed workouts per week for the last `weeks` weeks (oldest first). */
export function weeklyFrequency(
  workouts: WorkoutSummaryLike[],
  today: ISODate,
  weeks: number,
  weekStartsOn: 0 | 1,
) {
  const current = startOfWeekISO(today, weekStartsOn)
  const out: { weekStart: ISODate; count: number; minutes: number; distance: number }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = addDaysISO(current, -7 * i)
    const weekEnd = addDaysISO(weekStart, 6)
    const inWeek = workouts.filter(
      (w) =>
        (w.status ?? 'completed') === 'completed' &&
        w.performed_on >= weekStart &&
        w.performed_on <= weekEnd,
    )
    out.push({
      weekStart,
      count: inWeek.length,
      minutes: inWeek.reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
      distance: inWeek.reduce((s, w) => s + Number(w.distance_m ?? 0), 0),
    })
  }
  return out
}
