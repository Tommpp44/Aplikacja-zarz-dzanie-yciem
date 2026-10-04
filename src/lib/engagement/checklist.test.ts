import { describe, expect, it } from 'vitest'
import { buildChecklist, checklistProgress } from './checklist'

describe('getting started checklist', () => {
  it('marks steps done from real counts', () => {
    const items = buildChecklist({
      tasks: 3,
      habits: 0,
      goals: 1,
      accounts: 0,
      events: 0,
      workouts: 0,
      notes: 0,
      journal: 1,
    })
    expect(items.filter((i) => i.done).map((i) => i.id)).toEqual(['task', 'goal', 'reflect'])
    expect(checklistProgress(items)).toEqual({ done: 3, total: 7, complete: false })
  })
})
