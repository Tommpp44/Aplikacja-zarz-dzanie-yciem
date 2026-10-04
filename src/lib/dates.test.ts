import { describe, expect, it } from 'vitest'
import {
  addDaysISO,
  diffDaysISO,
  eachDayISO,
  isISODate,
  relativeDayLabel,
  startOfWeekISO,
  todayISO,
  utcToZoned,
  weekdayOf,
  zonedToUtc,
} from './dates'

describe('dates', () => {
  it('validates ISO dates', () => {
    expect(isISODate('2026-02-28')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('26-1-1')).toBe(false)
  })

  it('resolves today in the user timezone, not the server timezone', () => {
    const instant = new Date('2026-10-04T23:30:00Z')
    expect(todayISO('Europe/Warsaw', instant)).toBe('2026-10-05')
    expect(todayISO('America/New_York', instant)).toBe('2026-10-04')
    expect(todayISO('Invalid/Zone', instant)).toBe('2026-10-04')
  })

  it('does date arithmetic across DST and month boundaries', () => {
    expect(addDaysISO('2026-10-24', 2)).toBe('2026-10-26')
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01')
    expect(diffDaysISO('2026-03-30', '2026-03-28')).toBe(2)
    expect(eachDayISO('2026-02-27', '2026-03-01')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ])
  })

  it('computes weekdays and week starts', () => {
    expect(weekdayOf('2026-10-04')).toBe(0) // Sunday
    expect(startOfWeekISO('2026-10-04', 1)).toBe('2026-09-28')
    expect(startOfWeekISO('2026-10-04', 0)).toBe('2026-10-04')
  })

  it('converts between zoned wall time and UTC', () => {
    const utc = zonedToUtc('2026-07-01', '09:30', 'Europe/Warsaw')
    expect(utc.toISOString()).toBe('2026-07-01T07:30:00.000Z')
    const winter = zonedToUtc('2026-12-01', '09:30', 'Europe/Warsaw')
    expect(winter.toISOString()).toBe('2026-12-01T08:30:00.000Z')
    expect(utcToZoned('2026-12-01T08:30:00Z', 'Europe/Warsaw')).toMatchObject({
      date: '2026-12-01',
      time: '09:30',
    })
  })

  it('labels relative days', () => {
    expect(relativeDayLabel('2026-10-04', '2026-10-04')).toBe('Today')
    expect(relativeDayLabel('2026-10-05', '2026-10-04')).toBe('Tomorrow')
    expect(relativeDayLabel('2026-10-03', '2026-10-04')).toBe('Yesterday')
  })
})
