import { describe, expect, it } from 'vitest'
import {
  describeRepeatRule,
  nextOccurrenceAfter,
  nextTaskDueDate,
  occurrencesBetween,
  occurrencesPerMonth,
  type RepeatRule,
} from './recurrence'

const daily: RepeatRule = { freq: 'daily', interval: 1 }

describe('occurrencesBetween', () => {
  it('expands daily rules with intervals', () => {
    expect(
      occurrencesBetween({ freq: 'daily', interval: 2 }, '2026-10-01', '2026-10-04', '2026-10-09'),
    ).toEqual(['2026-10-05', '2026-10-07', '2026-10-09'])
  })

  it('never returns dates before the anchor', () => {
    expect(occurrencesBetween(daily, '2026-10-03', '2026-10-01', '2026-10-04')).toEqual([
      '2026-10-03',
      '2026-10-04',
    ])
  })

  it('expands weekly rules on selected weekdays', () => {
    const rule: RepeatRule = { freq: 'weekly', interval: 1, weekdays: [1, 3, 5] }
    expect(occurrencesBetween(rule, '2026-09-28', '2026-09-28', '2026-10-04')).toEqual([
      '2026-09-28',
      '2026-09-30',
      '2026-10-02',
    ])
  })

  it('respects bi-weekly intervals', () => {
    const rule: RepeatRule = { freq: 'weekly', interval: 2 }
    expect(occurrencesBetween(rule, '2026-10-05', '2026-10-01', '2026-11-05')).toEqual([
      '2026-10-05',
      '2026-10-19',
      '2026-11-02',
    ])
  })

  it('clamps monthly rules to month length without drifting', () => {
    const rule: RepeatRule = { freq: 'monthly', interval: 1 }
    expect(occurrencesBetween(rule, '2026-01-31', '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ])
  })

  it('handles yearly rules on leap days', () => {
    const rule: RepeatRule = { freq: 'yearly', interval: 1 }
    expect(occurrencesBetween(rule, '2024-02-29', '2025-01-01', '2028-12-31')).toEqual([
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ])
  })

  it('stops at until', () => {
    expect(
      occurrencesBetween(daily, '2026-10-01', '2026-10-01', '2026-10-31', '2026-10-03'),
    ).toHaveLength(3)
  })
})

describe('next occurrences', () => {
  it('finds the next occurrence', () => {
    expect(
      nextOccurrenceAfter(
        { freq: 'weekly', interval: 1, weekdays: [1] },
        '2026-09-28',
        '2026-09-28',
      ),
    ).toBe('2026-10-05')
  })

  it('moves late recurring tasks into the future', () => {
    expect(nextTaskDueDate(daily, '2026-09-20', '2026-10-04')).toBe('2026-10-05')
    expect(nextTaskDueDate({ freq: 'weekly', interval: 1 }, '2026-09-21', '2026-10-04')).toBe(
      '2026-10-05',
    )
  })

  it('advances early completions from the due date', () => {
    expect(nextTaskDueDate(daily, '2026-10-10', '2026-10-04')).toBe('2026-10-11')
    expect(nextTaskDueDate({ freq: 'monthly', interval: 1 }, '2026-10-15', '2026-10-04')).toBe(
      '2026-11-15',
    )
  })

  it('works without a due date', () => {
    expect(nextTaskDueDate(daily, null, '2026-10-04')).toBe('2026-10-05')
  })
})

describe('descriptions', () => {
  it('describes rules', () => {
    expect(describeRepeatRule(daily)).toBe('Every day')
    expect(describeRepeatRule({ freq: 'weekly', interval: 1, weekdays: [1, 2, 3, 4, 5] })).toBe(
      'Every weekday',
    )
    expect(describeRepeatRule({ freq: 'weekly', interval: 2, weekdays: [0, 1] })).toBe(
      'Every 2 weeks on Mon, Sun',
    )
    expect(describeRepeatRule(null)).toBe('Does not repeat')
  })

  it('normalises to monthly frequency', () => {
    expect(occurrencesPerMonth({ freq: 'monthly', interval: 1 })).toBe(1)
    expect(occurrencesPerMonth({ freq: 'yearly', interval: 1 })).toBeCloseTo(1 / 12)
  })
})
