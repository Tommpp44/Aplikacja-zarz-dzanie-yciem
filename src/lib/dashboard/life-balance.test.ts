import { describe, expect, it } from 'vitest'
import { lifeBalance } from './life-balance'

const goal = (p: Record<string, unknown>) =>
  ({
    id: 'g',
    category: 'finance',
    status: 'active',
    progress: { percent: 50 },
    pace: { status: 'on_track' },
    ...p,
  }) as never

describe('lifeBalance', () => {
  it('aggregates goals and linked habits per area and skips empty areas', () => {
    const rows = lifeBalance(
      [
        goal({ id: 'a', progress: { percent: 80 } }),
        goal({ id: 'b', progress: { percent: 40 }, pace: { status: 'behind' } }),
        goal({ id: 'c', category: 'fitness', progress: { percent: 10 } }),
      ],
      [{ goal_id: 'c', consistency: 70 }],
    )
    expect(rows).toEqual([
      { area: 'finance', goals: 2, avgProgress: 60, behind: 1, habitConsistency: null },
      { area: 'fitness', goals: 1, avgProgress: 10, behind: 0, habitConsistency: 70 },
    ])
  })
})
