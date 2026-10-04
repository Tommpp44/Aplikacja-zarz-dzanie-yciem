import { addDaysISO, diffDaysISO, type ISODate } from '@/lib/dates'
import { clamp } from '@/lib/utils'

export type GoalLike = {
  target_type: string
  progress_source: string
  start_value: number
  target_value: number | null
  current_value: number
  start_date: ISODate
  deadline: ISODate | null
  status: string
}

export type GoalContext = {
  /** Linked account balance in major units (progress_source = account). */
  accountBalance?: number | null
  milestones?: { completed_at: string | null }[]
  tasks?: { status: string }[]
}

export type GoalProgress = {
  current: number
  target: number
  start: number
  /** 0–100 */
  percent: number
  done: boolean
}

/** Single source of truth for goal progress, regardless of how it is measured. */
export function computeGoalProgress(goal: GoalLike, ctx: GoalContext = {}): GoalProgress {
  if (goal.status === 'completed') {
    const target = goal.target_value ?? 1
    return {
      current: Math.max(goal.current_value, target),
      target,
      start: goal.start_value,
      percent: 100,
      done: true,
    }
  }
  switch (goal.progress_source) {
    case 'milestones': {
      const total = ctx.milestones?.length ?? 0
      const done = ctx.milestones?.filter((m) => m.completed_at).length ?? 0
      return ratio(done, total)
    }
    case 'tasks': {
      const relevant = (ctx.tasks ?? []).filter((t) => t.status !== 'cancelled')
      const done = relevant.filter((t) => t.status === 'completed').length
      return ratio(done, relevant.length)
    }
    default:
      break
  }
  if (goal.target_type === 'boolean') {
    const done = goal.current_value >= 1
    return { current: done ? 1 : 0, target: 1, start: 0, percent: done ? 100 : 0, done }
  }
  const current =
    goal.progress_source === 'account' ? (ctx.accountBalance ?? 0) : goal.current_value
  const start = goal.target_type === 'percentage' ? 0 : goal.start_value
  const target = goal.target_type === 'percentage' ? 100 : (goal.target_value ?? 0)
  const span = target - start
  const percent =
    span === 0 ? (current >= target ? 100 : 0) : clamp(((current - start) / span) * 100, 0, 100)
  return { current, target, start, percent, done: span > 0 ? current >= target : current <= target }
}

function ratio(done: number, total: number): GoalProgress {
  return {
    current: done,
    target: total,
    start: 0,
    percent: total ? (done / total) * 100 : 0,
    done: total > 0 && done === total,
  }
}

export type PaceStatus = 'done' | 'ahead' | 'on_track' | 'behind' | 'no_deadline' | 'overdue'

export type GoalPace = {
  status: PaceStatus
  /** Progress you should have by today on a linear plan (0–100). */
  expectedPercent: number | null
  /** Projected completion date at the current rate. */
  projectedCompletion: ISODate | null
  daysLeft: number | null
  /** Amount still needed per week/month to finish on time (target units). */
  requiredPerWeek: number | null
  requiredPerMonth: number | null
}

/**
 * Pace: compares actual progress with a linear plan from start_date to deadline
 * and projects completion from the observed rate (progress logs or start→now).
 */
export function computeGoalPace(
  goal: GoalLike,
  progress: GoalProgress,
  today: ISODate,
  logs: { value: number; logged_at: string }[] = [],
): GoalPace {
  const daysLeft = goal.deadline ? diffDaysISO(goal.deadline, today) : null
  const remaining = Math.max(0, progress.target - progress.current)
  const base: GoalPace = {
    status: 'no_deadline',
    expectedPercent: null,
    projectedCompletion: null,
    daysLeft,
    requiredPerWeek: null,
    requiredPerMonth: null,
  }
  if (progress.done) return { ...base, status: 'done' }

  // Observed rate (units/day). Only trusted over at least two weeks of data,
  // otherwise a single update would produce a wildly optimistic projection.
  const MIN_SPAN_DAYS = 14
  const sorted = [...logs].sort((a, b) => a.logged_at.localeCompare(b.logged_at))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  let rate: number | null = null
  if (first && last && goal.progress_source === 'manual') {
    const days = diffDaysISO(last.logged_at.slice(0, 10), first.logged_at.slice(0, 10))
    if (days >= MIN_SPAN_DAYS) rate = (last.value - first.value) / days
  } else {
    const elapsed = diffDaysISO(today, goal.start_date)
    if (elapsed >= MIN_SPAN_DAYS) rate = (progress.current - progress.start) / elapsed
  }
  if (rate !== null && rate > 0 && remaining > 0) {
    base.projectedCompletion = addDaysISO(today, Math.ceil(remaining / rate))
  }

  // The plan starts from where the goal was when it was created (first log),
  // so pre-existing progress does not count as being "ahead".
  const span = progress.target - progress.start
  const baselinePercent =
    first && goal.progress_source === 'manual' && span !== 0
      ? clamp(((first.value - progress.start) / span) * 100, 0, 100)
      : 0

  if (!goal.deadline || daysLeft === null) return base
  if (daysLeft < 0) return { ...base, status: 'overdue' }

  const total = Math.max(1, diffDaysISO(goal.deadline, goal.start_date))
  const timeFraction = clamp(diffDaysISO(today, goal.start_date) / total, 0, 1)
  const expectedPercent = baselinePercent + (100 - baselinePercent) * timeFraction
  const delta = progress.percent - expectedPercent
  const status: PaceStatus = delta >= 5 ? 'ahead' : delta >= -5 ? 'on_track' : 'behind'
  const weeksLeft = Math.max(daysLeft / 7, 1 / 7)
  return {
    ...base,
    status,
    expectedPercent,
    requiredPerWeek: remaining / weeksLeft,
    requiredPerMonth: remaining / Math.max(daysLeft / 30.4375, 1 / 30.4375),
  }
}

export const PACE_LABELS: Record<PaceStatus, string> = {
  done: 'Completed',
  ahead: 'Ahead of plan',
  on_track: 'On track',
  behind: 'Behind plan',
  no_deadline: 'No deadline',
  overdue: 'Past deadline',
}
