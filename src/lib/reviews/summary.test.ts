import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { habitCompletion } = await import('./summary')

describe('habitCompletion', () => {
  const base = {
    weekdays: [],
    times_per_week: null,
    interval_days: null,
    start_date: '2026-01-01',
    end_date: null,
    target: 1,
  }
  it('combines daily and weekly habits', () => {
    const habits = [
      { ...base, id: 'read', frequency: 'daily' },
      { ...base, id: 'gym', frequency: 'times_per_week', times_per_week: 3 },
    ]
    const logs = [
      { habit_id: 'read', log_date: '2026-09-28', value: 1 },
      { habit_id: 'read', log_date: '2026-09-29', value: 1 },
      { habit_id: 'gym', log_date: '2026-09-28', value: 1 },
      { habit_id: 'gym', log_date: '2026-09-30', value: 1 },
    ]
    const r = habitCompletion(habits, logs, '2026-09-28', '2026-10-04')
    expect(r).toEqual({ due: 10, done: 4, rate: 40 })
  })
})
