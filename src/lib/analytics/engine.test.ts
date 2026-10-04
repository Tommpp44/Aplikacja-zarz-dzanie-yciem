import { describe, expect, it } from 'vitest'
import { bucketFor, bucketsBetween, rangeStart, seriesBy, taskCompletionRate } from './engine'

describe('analytics engine', () => {
  it('resolves ranges', () => {
    expect(rangeStart('7D', '2026-10-04', '2025-01-01')).toBe('2026-09-28')
    expect(rangeStart('6M', '2026-10-04', '2025-01-01')).toBe('2026-04-04')
    expect(rangeStart('ALL', '2026-10-04', '2025-01-01')).toBe('2025-01-01')
  })

  it('picks bucket sizes and builds series', () => {
    expect(bucketFor('2026-09-05', '2026-10-04')).toBe('day')
    expect(bucketFor('2026-07-06', '2026-10-04')).toBe('week')
    expect(bucketFor('2025-10-04', '2026-10-04')).toBe('month')
    const buckets = bucketsBetween('2026-09-14', '2026-10-04', 'week', 1)
    expect(buckets).toEqual(['2026-09-14', '2026-09-21', '2026-09-28'])
    const s = seriesBy(
      [{ d: '2026-09-15' }, { d: '2026-09-30' }, { d: '2026-10-01' }],
      (x) => x.d,
      () => 1,
      buckets,
      'week',
      1,
    )
    expect(s.map((x) => x.value)).toEqual([1, 0, 2])
  })

  it('computes task completion rate over due tasks', () => {
    const tasks = [
      { status: 'completed', due_date: '2026-10-01', completed_at: 'x' },
      { status: 'todo', due_date: '2026-10-02', completed_at: null },
      { status: 'cancelled', due_date: '2026-10-02', completed_at: null },
      { status: 'completed', due_date: null, completed_at: 'x' },
    ]
    expect(taskCompletionRate(tasks, '2026-09-28', '2026-10-04')).toBe(50)
    expect(taskCompletionRate([], '2026-09-28', '2026-10-04')).toBeNull()
  })
})
