import { addDaysISO, diffDaysISO, utcToZoned, zonedToUtc, type ISODate } from '@/lib/dates'
import { occurrencesBetween, parseRepeatRule } from '@/lib/recurrence'

export type EventLike = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  all_day: boolean
  repeat_rule: unknown
  repeat_until: string | null
  color: string
  location?: string | null
}

export type Occurrence<E extends EventLike = EventLike> = {
  key: string
  event: E
  /** Local date/time in the user's timezone */
  startDate: ISODate
  endDate: ISODate
  startTime: string
  endTime: string
  start: Date
  end: Date
  allDay: boolean
}

/**
 * Expands (recurring) events into concrete occurrences overlapping the local
 * date range [from, to]. Recurrence happens on local wall-clock time, so a
 * 09:00 meeting stays at 09:00 across DST changes.
 */
export function expandEvents<E extends EventLike>(
  events: E[],
  from: ISODate,
  to: ISODate,
  timeZone: string,
): Occurrence<E>[] {
  const out: Occurrence<E>[] = []
  for (const event of events) {
    const start = utcToZoned(event.starts_at, timeZone)
    const endInstant = new Date(event.ends_at)
    // All-day events store an exclusive end at local midnight.
    const end = utcToZoned(
      event.all_day ? new Date(endInstant.getTime() - 1) : endInstant,
      timeZone,
    )
    const spanDays = Math.max(0, diffDaysISO(end.date, start.date))
    const durationMs = endInstant.getTime() - new Date(event.starts_at).getTime()
    const rule = parseRepeatRule(event.repeat_rule)
    const dates = rule
      ? occurrencesBetween(rule, start.date, addDaysISO(from, -spanDays), to, event.repeat_until)
      : start.date <= to && end.date >= from
        ? [start.date]
        : []
    for (const date of dates) {
      const occStart = rule ? zonedToUtc(date, start.time, timeZone) : new Date(event.starts_at)
      const occEnd = new Date(occStart.getTime() + durationMs)
      const endDate = addDaysISO(date, spanDays)
      if (endDate < from || date > to) continue
      out.push({
        key: `${event.id}:${date}`,
        event,
        startDate: date,
        endDate,
        startTime: start.time,
        endTime: end.time,
        start: occStart,
        end: occEnd,
        allDay: event.all_day,
      })
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}

/** Occurrences touching a given local date. */
export function occurrencesOn<E extends EventLike>(occurrences: Occurrence<E>[], date: ISODate) {
  return occurrences.filter((o) => o.startDate <= date && o.endDate >= date)
}

/** Minutes from local midnight, for positioning on a day timeline. */
export function minutesOfDay(time: string) {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
