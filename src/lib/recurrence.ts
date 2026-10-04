import { z } from 'zod'
import {
  addDaysISO,
  diffDaysISO,
  fromISODate,
  startOfWeekISO,
  toISODate,
  weekdayOf,
  WEEKDAY_SHORT,
  type ISODate,
} from './dates'

/**
 * Repeat rules shared by tasks, calendar events, recurring transactions and
 * training. Stored as JSON in the database.
 */
export const repeatRuleSchema = z.object({
  freq: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365).default(1),
  /** Weekly only: 0 = Sunday … 6 = Saturday. Empty = same weekday as the anchor. */
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  /** Monthly only: preferred day of month (clamped to month length). */
  monthDay: z.number().int().min(1).max(31).optional(),
})

export type RepeatRule = z.infer<typeof repeatRuleSchema>

export function parseRepeatRule(value: unknown): RepeatRule | null {
  if (value == null) return null
  const parsed = repeatRuleSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Date of the n-th month after the anchor, keeping the preferred day (clamped). */
function monthlyDate(anchor: ISODate, monthsAhead: number, monthDay: number): ISODate {
  const a = fromISODate(anchor)
  const totalMonths = a.getMonth() + monthsAhead
  const year = a.getFullYear() + Math.floor(totalMonths / 12)
  const month = ((totalMonths % 12) + 12) % 12
  const day = Math.min(monthDay, daysInMonth(year, month))
  return toISODate(new Date(year, month, day))
}

function sortedWeekdays(rule: RepeatRule, anchor: ISODate) {
  const days = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [weekdayOf(anchor)]
  return [...new Set(days)].sort((a, b) => a - b)
}

/**
 * All occurrences of a rule anchored at `anchor` that fall within [from, to]
 * (inclusive). `until` optionally ends the series. The anchor itself is the first
 * occurrence (for weekly rules with explicit weekdays, the anchor week's matching
 * days on/after the anchor are included).
 */
export function occurrencesBetween(
  rule: RepeatRule,
  anchor: ISODate,
  from: ISODate,
  to: ISODate,
  until?: ISODate | null,
  limit = 1000,
): ISODate[] {
  const end = until && until < to ? until : to
  if (end < anchor || end < from) return []
  const out: ISODate[] = []
  const interval = Math.max(1, rule.interval ?? 1)

  switch (rule.freq) {
    case 'daily': {
      const offset = Math.max(0, diffDaysISO(from, anchor))
      let k = Math.ceil(offset / interval)
      for (;;) {
        const d = addDaysISO(anchor, k * interval)
        if (d > end || out.length >= limit) break
        if (d >= from) out.push(d)
        k++
      }
      break
    }
    case 'weekly': {
      const days = sortedWeekdays(rule, anchor)
      const anchorWeek = startOfWeekISO(anchor, 0)
      const startWeekOffset = Math.max(
        0,
        Math.floor(diffDaysISO(startOfWeekISO(from, 0), anchorWeek) / 7),
      )
      let week = startWeekOffset - (startWeekOffset % interval)
      for (;;) {
        const weekStart = addDaysISO(anchorWeek, week * 7)
        if (weekStart > end || out.length >= limit) break
        for (const wd of days) {
          const d = addDaysISO(weekStart, wd)
          if (d < anchor || d < from || d > end) continue
          out.push(d)
        }
        week += interval
      }
      break
    }
    case 'monthly': {
      const monthDay = rule.monthDay ?? fromISODate(anchor).getDate()
      const a = fromISODate(anchor)
      const f = fromISODate(from)
      const monthsToFrom = (f.getFullYear() - a.getFullYear()) * 12 + (f.getMonth() - a.getMonth())
      let k = Math.max(0, Math.floor(monthsToFrom / interval) - 1) * interval
      for (;;) {
        const d = monthlyDate(anchor, k, monthDay)
        if (d > end || out.length >= limit) break
        if (d >= from && d >= anchor) out.push(d)
        k += interval
      }
      break
    }
    case 'yearly': {
      const a = fromISODate(anchor)
      const f = fromISODate(from)
      let k = Math.max(0, Math.floor((f.getFullYear() - a.getFullYear()) / interval) - 1) * interval
      for (;;) {
        const d = monthlyDate(anchor, k * 12, a.getDate())
        if (d > end || out.length >= limit) break
        if (d >= from) out.push(d)
        k += interval
      }
      break
    }
  }
  return out
}

/** First occurrence strictly after `after` for a series anchored at `anchor`. */
export function nextOccurrenceAfter(
  rule: RepeatRule,
  anchor: ISODate,
  after: ISODate,
): ISODate | null {
  // Search a window wide enough for any supported interval.
  const horizonDays =
    rule.freq === 'daily'
      ? rule.interval + 1
      : rule.freq === 'weekly'
        ? rule.interval * 7 + 7
        : rule.freq === 'monthly'
          ? rule.interval * 31 + 31
          : rule.interval * 366 + 366
  const found = occurrencesBetween(
    rule,
    anchor,
    addDaysISO(after, 1),
    addDaysISO(after, horizonDays),
    null,
    1,
  )
  return found[0] ?? null
}

/**
 * Next due date for a recurring task after it is completed. The series is
 * anchored at the current due date; if the task was completed late the next date
 * is moved to the first occurrence after today (no backlog of past occurrences).
 */
export function nextTaskDueDate(
  rule: RepeatRule,
  dueDate: ISODate | null,
  today: ISODate,
): ISODate {
  const anchor = dueDate ?? today
  const after = dueDate && dueDate > today ? dueDate : today
  return nextOccurrenceAfter(rule, anchor, after) ?? addDaysISO(after, 1)
}

const FREQ_UNIT: Record<RepeatRule['freq'], [string, string]> = {
  daily: ['day', 'days'],
  weekly: ['week', 'weeks'],
  monthly: ['month', 'months'],
  yearly: ['year', 'years'],
}

export function describeRepeatRule(rule: RepeatRule | null | undefined) {
  if (!rule) return 'Does not repeat'
  const [one, many] = FREQ_UNIT[rule.freq]
  let text = rule.interval > 1 ? `Every ${rule.interval} ${many}` : `Every ${one}`
  if (rule.freq === 'daily' && rule.interval === 1) text = 'Every day'
  if (rule.freq === 'weekly' && rule.weekdays && rule.weekdays.length > 0) {
    const sorted = [...rule.weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    if (sorted.length === 5 && [1, 2, 3, 4, 5].every((d) => sorted.includes(d))) {
      return rule.interval === 1 ? 'Every weekday' : `${text} on weekdays`
    }
    text += ` on ${sorted.map((d) => WEEKDAY_SHORT[d]).join(', ')}`
  }
  if (rule.freq === 'monthly' && rule.monthDay) text += ` on day ${rule.monthDay}`
  return text
}

/** Approximate number of occurrences per month (for normalising recurring costs). */
export function occurrencesPerMonth(rule: RepeatRule) {
  const interval = Math.max(1, rule.interval)
  switch (rule.freq) {
    case 'daily':
      return 30.4375 / interval
    case 'weekly':
      return ((rule.weekdays?.length || 1) * 4.348125) / interval
    case 'monthly':
      return 1 / interval
    case 'yearly':
      return 1 / (12 * interval)
  }
}
