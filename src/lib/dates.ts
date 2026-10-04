import { TZDate } from '@date-fns/tz'
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

/**
 * Date conventions
 * ----------------
 * - Calendar dates (task due dates, habit logs, transactions) are ISO strings
 *   "yyyy-MM-dd" that represent a local day in the user's timezone. They carry no
 *   time and are compared as plain dates.
 * - Instants (calendar events, reminders) are stored as timestamptz and converted
 *   with the user's timezone at the edges.
 * - "Today" is always resolved with the user's timezone, never the server's.
 */

export type ISODate = string

export const ISO_DATE = 'yyyy-MM-dd'
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export function isISODate(value: string): value is ISODate {
  if (!ISO_RE.test(value)) return false
  return isValid(parse(value, ISO_DATE, new Date()))
}

/** Parses "yyyy-MM-dd" into a local Date at midnight (timezone independent arithmetic). */
export function fromISODate(iso: ISODate) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function toISODate(date: Date): ISODate {
  return format(date, ISO_DATE)
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function safeTimeZone(tz: string | null | undefined) {
  return tz && isValidTimeZone(tz) ? tz : 'UTC'
}

/** Current local date in the given timezone. */
export function todayISO(timeZone: string, now: Date = new Date()): ISODate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Current local time "HH:mm" in the given timezone. */
export function nowTimeHHmm(timeZone: string, now: Date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTimeZone(timeZone),
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)
}

export function currentHour(timeZone: string, now: Date = new Date()) {
  return Number(nowTimeHHmm(timeZone, now).slice(0, 2))
}

export function addDaysISO(iso: ISODate, days: number): ISODate {
  return toISODate(addDays(fromISODate(iso), days))
}

export function addMonthsISO(iso: ISODate, months: number): ISODate {
  return toISODate(addMonths(fromISODate(iso), months))
}

export function diffDaysISO(later: ISODate, earlier: ISODate) {
  return differenceInCalendarDays(fromISODate(later), fromISODate(earlier))
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(iso: ISODate) {
  return fromISODate(iso).getDay()
}

export function startOfWeekISO(iso: ISODate, weekStartsOn: 0 | 1 = 1): ISODate {
  return toISODate(startOfWeek(fromISODate(iso), { weekStartsOn }))
}

export function startOfMonthISO(iso: ISODate): ISODate {
  return toISODate(startOfMonth(fromISODate(iso)))
}

export function endOfMonthISO(iso: ISODate): ISODate {
  return toISODate(endOfMonth(fromISODate(iso)))
}

/** Inclusive list of dates between two ISO dates. */
export function eachDayISO(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  const total = diffDaysISO(to, from)
  for (let i = 0; i <= total; i++) out.push(addDaysISO(from, i))
  return out
}

export function minISO(a: ISODate, b: ISODate) {
  return a <= b ? a : b
}

export function maxISO(a: ISODate, b: ISODate) {
  return a >= b ? a : b
}

/** Converts a local date + "HH:mm" in a timezone into a UTC instant. */
export function zonedToUtc(date: ISODate, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const zoned = new TZDate(y!, m! - 1, d!, hh ?? 0, mm ?? 0, safeTimeZone(timeZone))
  return new Date(zoned.getTime())
}

/** Splits a UTC instant into local date and time strings for a timezone. */
export function utcToZoned(instant: Date | string, timeZone: string) {
  const zoned = new TZDate(new Date(instant).getTime(), safeTimeZone(timeZone))
  return { date: format(zoned, ISO_DATE), time: format(zoned, 'HH:mm'), zoned }
}

export const DATE_FORMATS = ['dd.MM.yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'd MMM yyyy'] as const
export type DateFormat = (typeof DATE_FORMATS)[number]

export function formatISODate(iso: ISODate, pattern: string = 'd MMM yyyy') {
  return format(fromISODate(iso), pattern)
}

/** Human friendly relative label: Today, Tomorrow, Yesterday, Mon 12 Oct. */
export function relativeDayLabel(iso: ISODate, today: ISODate) {
  const diff = diffDaysISO(iso, today)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const date = fromISODate(iso)
  if (diff > 1 && diff < 7) return format(date, 'EEEE')
  if (date.getFullYear() === fromISODate(today).getFullYear()) return format(date, 'EEE d MMM')
  return format(date, 'd MMM yyyy')
}

export function greetingFor(hour: number) {
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** "HH:mm:ss" (Postgres time) -> "HH:mm" */
export function shortTime(time: string | null | undefined) {
  return time ? time.slice(0, 5) : null
}

export function minutesToLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Weekday indexes ordered according to the user's first day of week. */
export function orderedWeekdays(weekStartsOn: 0 | 1) {
  return weekStartsOn === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
}
