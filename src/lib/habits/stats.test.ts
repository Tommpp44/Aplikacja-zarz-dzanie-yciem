import { describe, expect, it } from 'vitest'
import { computeHabitStats, isDueOn, isOpenToday, weekProgress, type HabitLike } from './stats'

const daily: HabitLike = {
  frequency: 'daily',
  weekdays: [],
  times_per_week: null,
  interval_days: null,
  start_date: '2026-09-01',
  end_date: null,
  target: 1,
}
const log = (log_date: string, value = 1) => ({ log_date, value })

describe('isDueOn', () => {
  it('handles weekdays and intervals', () => {
    const mwf = { ...daily, frequency: 'weekdays', weekdays: [1, 3, 5] }
    expect(isDueOn(mwf, '2026-10-05')).toBe(true) // Monday
    expect(isDueOn(mwf, '2026-10-06')).toBe(false)
    const every3 = { ...daily, frequency: 'interval', interval_days: 3 }
    expect(isDueOn(every3, '2026-09-04')).toBe(true)
    expect(isDueOn(every3, '2026-09-05')).toBe(false)
    expect(isDueOn(daily, '2026-08-31')).toBe(false) // before start
  })
})

describe('computeHabitStats (daily)', () => {
  const habit = { ...daily, start_date: '2026-09-25' }
  // 25..30 done, 1 Oct missed, 2..3 done, today (4th) not yet
  const logs = [
    '2026-09-25',
    '2026-09-26',
    '2026-09-27',
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-02',
    '2026-10-03',
  ].map((d) => log(d))

  it('computes streaks without breaking on an unfinished today', () => {
    const s = computeHabitStats(habit, logs, '2026-10-04')
    expect(s.currentStreak).toBe(2)
    expect(s.bestStreak).toBe(6)
    expect(s.missedDays).toBe(1)
    expect(s.completionRate).toBeCloseTo((8 / 9) * 100)
  })

  it('counts today once completed', () => {
    const s = computeHabitStats(habit, [...logs, log('2026-10-04')], '2026-10-04')
    expect(s.currentStreak).toBe(3)
  })

  it('treats values below target as not completed (numeric habits)', () => {
    const water = { ...habit, target: 2 }
    const s = computeHabitStats(
      water,
      [log('2026-10-03', 1.5), log('2026-10-02', 2.5)],
      '2026-10-04',
    )
    expect(s.currentStreak).toBe(0)
    expect(s.totalCompletions).toBe(1)
  })
})

describe('weekly habits', () => {
  const gym: HabitLike = {
    ...daily,
    frequency: 'times_per_week',
    times_per_week: 3,
    start_date: '2026-09-14',
  }
  const logs = [
    // week of 14 Sep: 3 -> success
    '2026-09-14',
    '2026-09-16',
    '2026-09-18',
    // week of 21 Sep: 2 -> fail
    '2026-09-22',
    '2026-09-24',
    // week of 28 Sep: 3 -> success
    '2026-09-28',
    '2026-09-30',
    '2026-10-02',
    // current week (5 Oct): 1 so far
    '2026-10-05',
  ].map((d) => log(d))

  it('measures streaks in weeks and ignores the unfinished current week', () => {
    const s = computeHabitStats(gym, logs, '2026-10-06')
    expect(s.streakUnit).toBe('weeks')
    expect(s.currentStreak).toBe(1)
    expect(s.bestStreak).toBe(1)
    expect(s.completionRate).toBeCloseTo((2 / 3) * 100)
  })

  it('reports week progress and open state', () => {
    expect(weekProgress(gym, logs, '2026-10-06', 1)).toEqual({ count: 1, target: 3 })
    expect(isOpenToday(gym, logs, '2026-10-06', 1)).toBe(true)
    expect(isOpenToday(gym, logs, '2026-10-05', 1)).toBe(false)
  })
})

describe('trends', () => {
  it('returns 8 weekly points and monthly rates', () => {
    const s = computeHabitStats(
      { ...daily, start_date: '2026-09-01' },
      [log('2026-09-01'), log('2026-10-01')],
      '2026-10-04',
    )
    expect(s.weeklyTrend).toHaveLength(8)
    expect(s.monthly.map((m) => m.month)).toEqual(['2026-09-01', '2026-10-01'])
    expect(s.monthly[0]!.rate).toBeCloseTo((1 / 30) * 100)
  })
})
