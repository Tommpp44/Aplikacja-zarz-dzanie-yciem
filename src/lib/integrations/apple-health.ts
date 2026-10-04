import type { WorkoutType } from '@/lib/workouts/schemas'

export type ActivityDay = {
  date: string
  steps: number | null
  distance_m: number | null
  active_minutes: number | null
  calories: number | null
}

export type ImportedWorkout = {
  external_id: string
  workout_type: WorkoutType
  name: string
  performed_on: string
  started_at: string | null
  duration_minutes: number | null
  distance_m: number | null
  calories: number | null
  elevation_m?: number | null
}

const METRICS = {
  HKQuantityTypeIdentifierStepCount: 'steps',
  HKQuantityTypeIdentifierDistanceWalkingRunning: 'distance_m',
  HKQuantityTypeIdentifierAppleExerciseTime: 'active_minutes',
  HKQuantityTypeIdentifierActiveEnergyBurned: 'calories',
} as const
type Metric = (typeof METRICS)[keyof typeof METRICS]

const WORKOUT_TYPES: Record<string, WorkoutType> = {
  Running: 'running',
  Cycling: 'cycling',
  Walking: 'walking',
  Hiking: 'walking',
  Swimming: 'swimming',
  TraditionalStrengthTraining: 'strength',
  FunctionalStrengthTraining: 'strength',
  CrossTraining: 'strength',
  HighIntensityIntervalTraining: 'strength',
  Soccer: 'football',
  Yoga: 'mobility',
  Pilates: 'mobility',
  Flexibility: 'mobility',
  MindAndBody: 'mobility',
  PaddleSports: 'padel',
  Racquetball: 'padel',
  Tennis: 'padel',
}

function attrs(tag: string) {
  const out: Record<string, string> = {}
  for (const m of tag.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]!] = m[2]!
  return out
}

function toMeters(value: number, unit: string | undefined) {
  if (unit === 'km') return value * 1000
  if (unit === 'mi') return value * 1609.344
  if (unit === 'm') return value
  return value * 1000
}

function toKcal(value: number, unit: string | undefined) {
  return unit === 'kJ' ? value / 4.184 : value
}

/** "2026-10-01 07:12:00 +0200" -> ISO instant */
export function appleDateToIso(s: string) {
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-])(\d{2})(\d{2})$/.exec(s)
  if (!m) return null
  return new Date(`${m[1]}T${m[2]}${m[3]}${m[4]}:${m[5]}`).toISOString()
}

/**
 * Streaming parser for Apple Health export.xml. Feed text chunks in order;
 * daily totals use the largest source per day (iPhone and Watch both record
 * steps — summing them would double count).
 */
export class AppleHealthParser {
  private buffer = ''
  private days = new Map<string, Map<Metric, Map<string, number>>>()
  private workouts: ImportedWorkout[] = []
  private since: string | null

  constructor(opts: { since?: string | null } = {}) {
    this.since = opts.since ?? null
  }

  feed(chunk: string) {
    this.buffer += chunk
    // Workouts may contain child elements; handle complete ones first.
    for (;;) {
      const start = this.buffer.search(/<(Record|Workout)\s/)
      if (start < 0) {
        this.buffer = this.buffer.slice(-200)
        return
      }
      const isWorkout = this.buffer.startsWith('<Workout', start)
      if (isWorkout) {
        const tagEnd = this.buffer.indexOf('>', start)
        if (tagEnd < 0) break
        const selfClosing = this.buffer[tagEnd - 1] === '/'
        const end = selfClosing ? tagEnd + 1 : this.buffer.indexOf('</Workout>', tagEnd)
        if (end < 0) break
        const block = this.buffer.slice(start, selfClosing ? end : end + 10)
        this.onWorkout(block)
        this.buffer = this.buffer.slice(selfClosing ? end : end + 10)
      } else {
        const end = this.buffer.indexOf('>', start)
        if (end < 0) break
        this.onRecord(this.buffer.slice(start, end + 1))
        this.buffer = this.buffer.slice(end + 1)
      }
    }
    if (this.buffer.length > 5_000_000) this.buffer = this.buffer.slice(-1_000_000)
  }

  private onRecord(tag: string) {
    const a = attrs(tag)
    const metric = METRICS[a.type as keyof typeof METRICS]
    if (!metric || !a.startDate) return
    const date = a.startDate.slice(0, 10)
    if (this.since && date < this.since) return
    let value = Number(a.value)
    if (!Number.isFinite(value)) return
    if (metric === 'distance_m') value = toMeters(value, a.unit)
    if (metric === 'calories') value = toKcal(value, a.unit)
    const day = this.days.get(date) ?? new Map()
    const bySource = day.get(metric) ?? new Map<string, number>()
    const source = a.sourceName ?? 'unknown'
    bySource.set(source, (bySource.get(source) ?? 0) + value)
    day.set(metric, bySource)
    this.days.set(date, day)
  }

  private onWorkout(block: string) {
    const head = attrs(block.slice(0, block.indexOf('>') + 1))
    if (!head.startDate) return
    const date = head.startDate.slice(0, 10)
    if (this.since && date < this.since) return
    const kind = (head.workoutActivityType ?? '').replace('HKWorkoutActivityType', '')
    const type = WORKOUT_TYPES[kind] ?? 'custom'
    let duration = Number(head.duration)
    if (head.durationUnit === 's') duration /= 60
    if (head.durationUnit === 'h' || head.durationUnit === 'hr') duration *= 60
    let distance = head.totalDistance
      ? toMeters(Number(head.totalDistance), head.totalDistanceUnit)
      : null
    let calories = head.totalEnergyBurned
      ? toKcal(Number(head.totalEnergyBurned), head.totalEnergyBurnedUnit)
      : null
    // Newer exports put totals into <WorkoutStatistics …/> children.
    for (const m of block.matchAll(/<WorkoutStatistics\s[^>]*>/g)) {
      const s = attrs(m[0])
      const sum = Number(s.sum)
      if (!Number.isFinite(sum)) continue
      if (/Distance/.test(s.type ?? '') && distance === null) distance = toMeters(sum, s.unit)
      if (s.type === 'HKQuantityTypeIdentifierActiveEnergyBurned' && calories === null)
        calories = toKcal(sum, s.unit)
    }
    const startedAt = appleDateToIso(head.startDate)
    this.workouts.push({
      external_id: `ah:${startedAt ?? head.startDate}`,
      workout_type: type,
      name: kind.replace(/([a-z])([A-Z])/g, '$1 $2') || 'Workout',
      performed_on: date,
      started_at: startedAt,
      duration_minutes:
        Number.isFinite(duration) && duration > 0 ? Math.min(1440, Math.round(duration)) : null,
      distance_m:
        distance !== null && Number.isFinite(distance) ? Math.round(distance * 10) / 10 : null,
      calories:
        calories !== null && Number.isFinite(calories)
          ? Math.min(20000, Math.round(calories))
          : null,
    })
  }

  result() {
    const days: ActivityDay[] = [...this.days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => {
        const best = (m: Metric) => {
          const v = metrics.get(m)
          return v ? Math.max(...v.values()) : null
        }
        const round = (v: number | null, max: number) =>
          v === null ? null : Math.min(max, Math.round(v))
        return {
          date,
          steps: round(best('steps'), 200000),
          distance_m:
            best('distance_m') === null ? null : Math.round(best('distance_m')! * 10) / 10,
          active_minutes: round(best('active_minutes'), 1440),
          calories: round(best('calories'), 20000),
        }
      })
    return { days, workouts: this.workouts }
  }
}
