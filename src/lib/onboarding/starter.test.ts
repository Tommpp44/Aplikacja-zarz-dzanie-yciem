import { describe, expect, it } from 'vitest'
import { buildStarterPlan, defaultStarterPacks } from './starter'

describe('starter packs', () => {
  it('pre-selects packs from interests', () => {
    expect(defaultStarterPacks([])).toEqual(['habits', 'routine', 'goal', 'tasks'])
    expect(defaultStarterPacks(['finances'])).toEqual(['goal'])
    expect(defaultStarterPacks(['habits'])).toEqual(['habits', 'routine'])
  })

  it('builds a localized plan and links the reading habit to the reading goal', () => {
    const plan = buildStarterPlan({
      packs: ['habits', 'routine', 'goal', 'tasks'],
      interests: ['habits'],
      today: '2026-10-07', // Wednesday
      currency: 'PLN',
      locale: 'pl',
      weekStartsOn: 1,
    })
    expect(plan.goal).toMatchObject({
      category: 'learning',
      target_value: 12,
      deadline: '2026-12-31',
    })
    expect(plan.habits.find((h) => h.key === 'read')?.linkToGoal).toBe(true)
    expect(plan.routine?.items[0]?.habit).toBe('water')
    expect(plan.tasks[1]).toMatchObject({ due_date: '2026-10-11', repeat_rule: { weekdays: [0] } })
    expect(plan.habits[0]!.name).not.toBe('Drink a glass of water')
  })

  it('creates a finance goal for money-minded users and nothing for empty selections', () => {
    const plan = buildStarterPlan({
      packs: ['goal'],
      interests: ['finances'],
      today: '2026-03-01',
      currency: 'EUR',
      locale: 'en',
      weekStartsOn: 0,
    })
    expect(plan.goal).toMatchObject({ category: 'finance', unit: 'EUR', target_value: 3000 })
    expect(plan.habits).toEqual([])
    expect(plan.routine).toBeNull()
    expect(plan.tasks).toEqual([])
  })
})
