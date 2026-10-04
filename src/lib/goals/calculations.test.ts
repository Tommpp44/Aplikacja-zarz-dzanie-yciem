import { describe, expect, it } from 'vitest'
import { computeGoalPace, computeGoalProgress, type GoalLike } from './calculations'

const base: GoalLike = {
  target_type: 'numeric',
  progress_source: 'manual',
  start_value: 0,
  target_value: 30000,
  current_value: 18500,
  start_date: '2026-01-01',
  deadline: '2026-12-31',
  status: 'active',
}

describe('computeGoalProgress', () => {
  it('computes numeric progress', () => {
    const p = computeGoalProgress(base)
    expect(p.percent).toBeCloseTo(61.67, 1)
    expect(p.done).toBe(false)
  })

  it('respects a non-zero starting value', () => {
    expect(computeGoalProgress({ ...base, start_value: 10000, current_value: 20000 }).percent).toBe(
      50,
    )
  })

  it('supports decreasing targets (e.g. weight 90 -> 80)', () => {
    const p = computeGoalProgress({ ...base, start_value: 90, target_value: 80, current_value: 85 })
    expect(p.percent).toBe(50)
    expect(
      computeGoalProgress({ ...base, start_value: 90, target_value: 80, current_value: 79 }).done,
    ).toBe(true)
  })

  it('uses the linked account balance', () => {
    expect(
      computeGoalProgress({ ...base, progress_source: 'account' }, { accountBalance: 15000 })
        .percent,
    ).toBe(50)
  })

  it('uses milestones and tasks', () => {
    const milestones = [
      { completed_at: 'x' },
      { completed_at: null },
      { completed_at: 'y' },
      { completed_at: null },
    ]
    expect(
      computeGoalProgress({ ...base, progress_source: 'milestones' }, { milestones }).percent,
    ).toBe(50)
    const tasks = [{ status: 'completed' }, { status: 'todo' }, { status: 'cancelled' }]
    expect(computeGoalProgress({ ...base, progress_source: 'tasks' }, { tasks }).percent).toBe(50)
    expect(computeGoalProgress({ ...base, progress_source: 'tasks' }, { tasks: [] }).percent).toBe(
      0,
    )
  })

  it('handles boolean and percentage goals', () => {
    expect(computeGoalProgress({ ...base, target_type: 'boolean', current_value: 1 }).done).toBe(
      true,
    )
    expect(
      computeGoalProgress({ ...base, target_type: 'percentage', current_value: 40 }).percent,
    ).toBe(40)
  })

  it('clamps over-achievement', () => {
    expect(computeGoalProgress({ ...base, current_value: 40000 }).percent).toBe(100)
  })
})

describe('computeGoalPace', () => {
  it('reports behind / ahead relative to a linear plan', () => {
    const goal = { ...base, current_value: 10000 }
    const pace = computeGoalPace(goal, computeGoalProgress(goal), '2026-07-02')
    expect(pace.status).toBe('behind')
    expect(pace.expectedPercent).toBeCloseTo(50, 0)
    expect(pace.requiredPerMonth).toBeGreaterThan(3000)

    const ahead = { ...base, current_value: 20000 }
    expect(computeGoalPace(ahead, computeGoalProgress(ahead), '2026-07-02').status).toBe('ahead')
  })

  it('projects completion from logged progress', () => {
    const goal = { ...base, current_value: 2000, start_date: '2026-01-01' }
    const logs = [
      { value: 1000, logged_at: '2026-01-01T10:00:00Z' },
      { value: 2400, logged_at: '2026-01-15T10:00:00Z' },
    ]
    const g2 = { ...goal, current_value: 2400 }
    const pace = computeGoalPace(g2, computeGoalProgress(g2), '2026-01-15', logs)
    // 100/day, 27 600 remaining -> 276 days
    expect(pace.projectedCompletion).toBe('2026-10-18')
  })

  it('does not project from less than two weeks of data', () => {
    const logs = [
      { value: 18500, logged_at: '2026-10-04T10:00:00Z' },
      { value: 19200, logged_at: '2026-10-04T12:00:00Z' },
    ]
    const goal = { ...base, current_value: 19200, start_date: '2026-10-04' }
    expect(
      computeGoalPace(goal, computeGoalProgress(goal), '2026-10-04', logs).projectedCompletion,
    ).toBeNull()
  })

  it('starts the plan from the initial value', () => {
    const logs = [{ value: 18500, logged_at: '2026-10-04T10:00:00Z' }]
    const goal = { ...base, current_value: 18500, start_date: '2026-10-04' }
    const pace = computeGoalPace(goal, computeGoalProgress(goal), '2026-10-04', logs)
    expect(pace.status).toBe('on_track')
  })

  it('handles overdue and no-deadline goals', () => {
    expect(computeGoalPace(base, computeGoalProgress(base), '2027-01-05').status).toBe('overdue')
    const noDeadline = { ...base, deadline: null }
    expect(computeGoalPace(noDeadline, computeGoalProgress(noDeadline), '2026-05-01').status).toBe(
      'no_deadline',
    )
  })
})
