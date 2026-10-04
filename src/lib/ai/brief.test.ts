import { describe, expect, it } from 'vitest'
import { buildDailyBrief, buildFinanceSummary, type BriefFacts } from './brief'

const facts: BriefFacts = {
  currency: 'PLN',
  tasksToday: 5,
  importantTasks: 2,
  overdueTasks: 0,
  nextEvent: null,
  workoutToday: { title: 'Gym', time: '18:00' },
  habitsDue: 8,
  habitsDone: 6,
  budgetsOver: [],
  budgetsWarning: [],
  categoryDeltas: [{ category: 'Food', delta: 22_000 }],
  goals: [{ title: 'Emergency fund', status: 'on_track' }],
  dueRecurring: 0,
}

describe('buildDailyBrief', () => {
  it('produces the spec example', () => {
    const brief = buildDailyBrief(facts).map((s) => s.replace(/ /g, ' '))
    expect(brief).toEqual([
      'Today you have 5 tasks (2 high priority).',
      'You have a workout at 18:00: Gym.',
      '2 of 8 habits still open today.',
      'You are 220,00 zł over your average weekly food spending.',
      'Your goal “Emergency fund” is on track.',
    ])
  })

  it('handles an empty day', () => {
    expect(
      buildDailyBrief({
        ...facts,
        tasksToday: 0,
        workoutToday: null,
        habitsDue: 0,
        categoryDeltas: [],
        goals: [],
      }),
    ).toEqual(['No tasks due today — a good day to get ahead.'])
  })
})

describe('buildFinanceSummary', () => {
  it('explains spending changes', () => {
    expect(
      buildFinanceSummary({
        currency: 'PLN',
        expenses: 112_000,
        previousExpenses: 100_000,
        topIncreases: [
          { category: 'Travel', delta: 8000 },
          { category: 'Dining', delta: 4000 },
        ],
        savingsRate: 31,
      }),
    ).toBe(
      'Your expenses increased 12% compared with last month, mainly because of travel and dining. Savings rate: 31%.',
    )
  })
})
