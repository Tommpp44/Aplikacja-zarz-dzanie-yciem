import { addDaysISO, addMonthsISO, diffDaysISO, startOfWeekISO, type ISODate } from '@/lib/dates'

export const ANALYTICS_RANGES = ['7D', '30D', '90D', '6M', '1Y', 'ALL'] as const
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]

export function rangeStart(range: AnalyticsRange, today: ISODate, accountStart: ISODate): ISODate {
  switch (range) {
    case '7D':
      return addDaysISO(today, -6)
    case '30D':
      return addDaysISO(today, -29)
    case '90D':
      return addDaysISO(today, -89)
    case '6M':
      return addMonthsISO(today, -6)
    case '1Y':
      return addMonthsISO(today, -12)
    case 'ALL':
      return accountStart
  }
}

/** Bucket size for charts: days for short ranges, weeks for medium, months for long. */
export function bucketFor(from: ISODate, to: ISODate): 'day' | 'week' | 'month' {
  const days = diffDaysISO(to, from)
  if (days <= 31) return 'day'
  if (days <= 190) return 'week'
  return 'month'
}

export function bucketKey(date: ISODate, bucket: 'day' | 'week' | 'month', weekStartsOn: 0 | 1) {
  if (bucket === 'day') return date
  if (bucket === 'week') return startOfWeekISO(date, weekStartsOn)
  return `${date.slice(0, 7)}-01`
}

/** Ordered list of bucket keys covering [from, to]. */
export function bucketsBetween(
  from: ISODate,
  to: ISODate,
  bucket: 'day' | 'week' | 'month',
  weekStartsOn: 0 | 1,
) {
  const out: ISODate[] = []
  let cur = bucketKey(from, bucket, weekStartsOn)
  while (cur <= to) {
    out.push(cur)
    cur =
      bucket === 'day'
        ? addDaysISO(cur, 1)
        : bucket === 'week'
          ? addDaysISO(cur, 7)
          : addMonthsISO(cur, 1)
  }
  return out
}

/** Counts/sums values per bucket. */
export function seriesBy<T>(
  items: T[],
  date: (t: T) => ISODate,
  value: (t: T) => number,
  buckets: ISODate[],
  bucket: 'day' | 'week' | 'month',
  weekStartsOn: 0 | 1,
) {
  const map = new Map(buckets.map((b) => [b, 0]))
  for (const item of items) {
    const key = bucketKey(date(item), bucket, weekStartsOn)
    if (map.has(key)) map.set(key, map.get(key)! + value(item))
  }
  return buckets.map((b) => ({ key: b, value: map.get(b) ?? 0 }))
}

/**
 * Task completion rate: completed tasks / tasks that were due in the range
 * (completed or not). Tasks without a due date only count once completed.
 */
export function taskCompletionRate(
  tasks: { status: string; due_date: string | null; completed_at: string | null }[],
  from: ISODate,
  to: ISODate,
) {
  const dueInRange = tasks.filter(
    (t) => t.due_date && t.due_date >= from && t.due_date <= to && t.status !== 'cancelled',
  )
  const done = dueInRange.filter((t) => t.status === 'completed').length
  return dueInRange.length ? (done / dueInRange.length) * 100 : null
}
