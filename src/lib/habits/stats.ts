import {
  addDaysISO,
  diffDaysISO,
  eachDayISO,
  maxISO,
  minISO,
  startOfMonthISO,
  startOfWeekISO,
  weekdayOf,
  type ISODate,
} from '@/lib/dates'

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'times_per_week' | 'interval'

export type HabitLike = {
  frequency: string
  weekdays: number[]
  times_per_week: number | null
  interval_days: number | null
  start_date: ISODate
  end_date: ISODate | null
  target: number
}

export type HabitLog = { log_date: ISODate; value: number }

/** Weekly habits are measured per week; the others per due day. */
export function isWeeklyHabit(habit: Pick<HabitLike, 'frequency'>) {
  return habit.frequency === 'weekly' || habit.frequency === 'times_per_week'
}

export function weeklyTarget(habit: HabitLike) {
  return habit.frequency === 'weekly' ? 1 : Math.max(1, habit.times_per_week ?? 1)
}

export function isActiveOn(habit: HabitLike, date: ISODate) {
  return date >= habit.start_date && (!habit.end_date || date <= habit.end_date)
}

/** Whether a day-based habit is scheduled on a date. Weekly habits can be done any day. */
export function isDueOn(habit: HabitLike, date: ISODate) {
  if (!isActiveOn(habit, date)) return false
  switch (habit.frequency) {
    case 'weekdays':
      return habit.weekdays.includes(weekdayOf(date))
    case 'interval':
      return diffDaysISO(date, habit.start_date) % Math.max(1, habit.interval_days ?? 1) === 0
    default:
      return true
  }
}

export function isLogComplete(habit: Pick<HabitLike, 'target'>, value: number | null | undefined) {
  return (value ?? 0) >= habit.target
}

export type HabitStats = {
  currentStreak: number
  bestStreak: number
  /** 'days' or 'weeks' depending on frequency */
  streakUnit: 'days' | 'weeks'
  completionRate: number
  /** Completion rate over the last 30 days (or 4 weeks). */
  consistency: number
  missedDays: number
  totalCompletions: number
  /** Last 8 weeks completion rate, oldest first. */
  weeklyTrend: { weekStart: ISODate; rate: number }[]
  /** Monthly success rates within the range, oldest first. */
  monthly: { month: ISODate; rate: number }[]
}

type Period = { key: ISODate; due: number; done: number }

function completedDates(habit: HabitLike, logs: HabitLog[]) {
  return new Set(logs.filter((l) => isLogComplete(habit, l.value)).map((l) => l.log_date))
}

/** Due/done counts per period (days for day-based habits, weeks for weekly ones). */
function periods(
  habit: HabitLike,
  logs: HabitLog[],
  from: ISODate,
  to: ISODate,
  today: ISODate,
  weekStartsOn: 0 | 1,
): Period[] {
  const done = completedDates(habit, logs)
  const start = maxISO(from, habit.start_date)
  const end = minISO(to, habit.end_date ?? to)
  if (end < start) return []

  if (isWeeklyHabit(habit)) {
    const target = weeklyTarget(habit)
    const out: Period[] = []
    for (let week = startOfWeekISO(start, weekStartsOn); week <= end; week = addDaysISO(week, 7)) {
      const weekEnd = addDaysISO(week, 6)
      let count = 0
      for (const d of eachDayISO(maxISO(week, start), minISO(weekEnd, end)))
        if (done.has(d)) count++
      const finished = weekEnd < today
      // The current week only counts once its target is already met.
      if (!finished && count < target) continue
      out.push({ key: week, due: 1, done: count >= target ? 1 : 0 })
    }
    return out
  }

  const out: Period[] = []
  for (const d of eachDayISO(start, end)) {
    if (!isDueOn(habit, d)) continue
    const isDone = done.has(d)
    // Today only counts once it is done (the day is not over yet).
    if (d === today && !isDone) continue
    if (d > today) continue
    out.push({ key: d, due: 1, done: isDone ? 1 : 0 })
  }
  return out
}

function rate(list: Period[]) {
  const due = list.reduce((a, p) => a + p.due, 0)
  return due ? (list.reduce((a, p) => a + p.done, 0) / due) * 100 : 0
}

function streaks(list: Period[]) {
  let best = 0
  let run = 0
  for (const p of list) {
    run = p.done ? run + 1 : 0
    best = Math.max(best, run)
  }
  // current streak: trailing run of completed periods
  let current = 0
  for (let i = list.length - 1; i >= 0; i--) {
    if (!list[i]!.done) break
    current++
  }
  return { best, current }
}

export function computeHabitStats(
  habit: HabitLike,
  logs: HabitLog[],
  today: ISODate,
  options: { from?: ISODate; weekStartsOn?: 0 | 1 } = {},
): HabitStats {
  const weekStartsOn = options.weekStartsOn ?? 1
  const from = options.from ?? habit.start_date
  const all = periods(habit, logs, habit.start_date, today, today, weekStartsOn)
  const inRange = all.filter(
    (p) => p.key >= (isWeeklyHabit(habit) ? startOfWeekISO(from, weekStartsOn) : from),
  )
  const { best, current } = streaks(all)
  const weekly = isWeeklyHabit(habit)

  const last30 = weekly
    ? all.filter((p) => p.key >= startOfWeekISO(addDaysISO(today, -27), weekStartsOn))
    : all.filter((p) => p.key >= addDaysISO(today, -29))

  const trend: HabitStats['weeklyTrend'] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeekISO(addDaysISO(today, -7 * i), weekStartsOn)
    const weekEnd = addDaysISO(weekStart, 6)
    const inWeek = weekly
      ? all.filter((p) => p.key === weekStart)
      : all.filter((p) => p.key >= weekStart && p.key <= weekEnd)
    trend.push({ weekStart, rate: rate(inWeek) })
  }

  const months = new Map<ISODate, Period[]>()
  for (const p of inRange) {
    const m = startOfMonthISO(p.key)
    months.set(m, [...(months.get(m) ?? []), p])
  }

  return {
    currentStreak: current,
    bestStreak: best,
    streakUnit: weekly ? 'weeks' : 'days',
    completionRate: rate(inRange),
    consistency: rate(last30),
    missedDays: weekly ? 0 : inRange.filter((p) => !p.done).length,
    totalCompletions: completedDates(
      habit,
      logs.filter((l) => l.log_date >= from),
    ).size,
    weeklyTrend: trend,
    monthly: [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, list]) => ({ month, rate: rate(list) })),
  }
}

/** Progress towards this week's target for weekly habits. */
export function weekProgress(
  habit: HabitLike,
  logs: HabitLog[],
  today: ISODate,
  weekStartsOn: 0 | 1,
) {
  const weekStart = startOfWeekISO(today, weekStartsOn)
  const done = completedDates(habit, logs)
  let count = 0
  for (const d of eachDayISO(weekStart, addDaysISO(weekStart, 6))) if (done.has(d)) count++
  return { count, target: weeklyTarget(habit) }
}

/** Habits that still need attention today (due today and not completed). */
export function isOpenToday(
  habit: HabitLike,
  logs: HabitLog[],
  today: ISODate,
  weekStartsOn: 0 | 1,
) {
  if (!isActiveOn(habit, today)) return false
  if (isWeeklyHabit(habit)) {
    const { count, target } = weekProgress(habit, logs, today, weekStartsOn)
    const todayLog = logs.find((l) => l.log_date === today)
    return count < target && !isLogComplete(habit, todayLog?.value)
  }
  if (!isDueOn(habit, today)) return false
  return !isLogComplete(habit, logs.find((l) => l.log_date === today)?.value)
}
