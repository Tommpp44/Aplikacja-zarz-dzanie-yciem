import {
  addDaysISO,
  addMonthsISO,
  endOfMonthISO,
  startOfMonthISO,
  startOfWeekISO,
  type ISODate,
} from '@/lib/dates'

export const REVIEW_TYPES = ['daily', 'weekly', 'monthly'] as const
export type ReviewType = (typeof REVIEW_TYPES)[number]

/** Canonical period for a review type containing `date`. */
export function reviewPeriod(type: ReviewType, date: ISODate, weekStartsOn: 0 | 1) {
  if (type === 'daily')
    return {
      from: date,
      to: date,
      key: date,
      prev: addDaysISO(date, -1),
      next: addDaysISO(date, 1),
    }
  if (type === 'weekly') {
    const from = startOfWeekISO(date, weekStartsOn)
    return {
      from,
      to: addDaysISO(from, 6),
      key: from,
      prev: addDaysISO(from, -7),
      next: addDaysISO(from, 7),
    }
  }
  const from = startOfMonthISO(date)
  return {
    from,
    to: endOfMonthISO(date),
    key: from,
    prev: addMonthsISO(from, -1),
    next: addMonthsISO(from, 1),
  }
}
