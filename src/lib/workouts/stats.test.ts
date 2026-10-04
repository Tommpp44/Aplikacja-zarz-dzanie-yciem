import { describe, expect, it } from 'vitest'
import { formatDistance, formatPace, formatWeight } from '@/lib/units'
import {
  estimatedOneRepMax,
  isNewRecord,
  personalRecords,
  totalVolume,
  weeklyFrequency,
} from './stats'

describe('strength stats', () => {
  it('computes volume, ignoring incomplete sets', () => {
    expect(
      totalVolume([
        { weight_kg: 60, reps: 10 },
        { weight_kg: 60, reps: 9 },
        { weight_kg: 55, reps: 10, completed: false },
      ]),
    ).toBe(1140)
  })

  it('estimates 1RM (Epley)', () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100)
    expect(estimatedOneRepMax(60, 10)).toBeCloseTo(80)
    expect(estimatedOneRepMax(0, 5)).toBe(0)
  })

  it('finds personal records per exercise', () => {
    const prs = personalRecords([
      { exerciseId: 'bench', date: '2026-09-01', sets: [{ weight_kg: 60, reps: 10 }] },
      {
        exerciseId: 'bench',
        date: '2026-09-08',
        sets: [
          { weight_kg: 70, reps: 3 },
          { weight_kg: 62.5, reps: 10 },
        ],
      },
    ])
    const bench = prs.get('bench')!
    expect(bench.bestWeight).toBe(70)
    expect(bench.bestE1RM).toBeCloseTo(83.33, 1)
    expect(bench.date).toBe('2026-09-08')
    expect(isNewRecord({ weight_kg: 65, reps: 10 }, bench.bestE1RM)).toBe(true)
    expect(isNewRecord({ weight_kg: 50, reps: 5 }, bench.bestE1RM)).toBe(false)
  })
})

describe('frequency', () => {
  it('counts completed workouts per week', () => {
    const w = weeklyFrequency(
      [
        { performed_on: '2026-09-29', duration_minutes: 60, distance_m: null },
        { performed_on: '2026-10-01', duration_minutes: 45, distance_m: 10000 },
        { performed_on: '2026-10-02', duration_minutes: 30, distance_m: null, status: 'planned' },
        { performed_on: '2026-09-22', duration_minutes: 50, distance_m: null },
      ],
      '2026-10-04',
      2,
      1,
    )
    expect(w).toEqual([
      { weekStart: '2026-09-21', count: 1, minutes: 50, distance: 0 },
      { weekStart: '2026-09-28', count: 2, minutes: 105, distance: 10000 },
    ])
  })
})

describe('units', () => {
  it('formats metric and imperial', () => {
    expect(formatWeight(100, 'metric')).toBe('100 kg')
    expect(formatWeight(100, 'imperial')).toBe('220,5 lb')
    expect(formatDistance(21097.5, 'metric')).toBe('21,1 km')
    expect(formatPace(10000, 50, 'metric')).toBe('5:00 /km')
  })
})
