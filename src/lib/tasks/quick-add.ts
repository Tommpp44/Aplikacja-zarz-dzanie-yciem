import { addDaysISO, diffDaysISO, isISODate, weekdayOf, type ISODate } from '@/lib/dates'
import type { RepeatRule } from '@/lib/recurrence'

/**
 * Deterministic natural-language parser for Quick Add.
 *
 *   "Buy groceries tomorrow at 18:00 p2 #Home @errands"
 *   -> title "Buy groceries", due tomorrow 18:00, priority 2, project "Home", tag "errands"
 *
 * It is intentionally rule-based (fast, offline, predictable). The AIProvider
 * layer can replace or augment it later without changing call sites.
 */
export type QuickAddResult = {
  title: string
  due_date: ISODate | null
  due_time: string | null
  priority: number | null
  project_name: string | null
  tags: string[]
  repeat_rule: RepeatRule | null
  is_someday: boolean
  duration_minutes: number | null
}

const WEEKDAYS: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
}
const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Next occurrence of a weekday after today; "next <weekday>" skips one more week. */
function nextWeekday(today: ISODate, weekday: number, forceNextWeek = false) {
  let diff = (weekday - weekdayOf(today) + 7) % 7 || 7
  if (forceNextWeek && diff < 7) diff += 7
  return addDaysISO(today, diff)
}

/** Builds a date for day/month, rolling into next year if it already passed. */
function dayMonth(today: ISODate, day: number, month: number, year?: number) {
  const y = year ?? Number(today.slice(0, 4))
  const iso = `${y}-${pad(month)}-${pad(day)}`
  if (!isISODate(iso)) return null
  if (year === undefined && diffDaysISO(iso, today) < 0) {
    const next = `${y + 1}-${pad(month)}-${pad(day)}`
    return isISODate(next) ? next : null
  }
  return iso
}

function to24h(hours: number, minutes: number, meridiem?: string) {
  let h = hours
  if (meridiem) {
    const m = meridiem.toLowerCase()
    if (m === 'pm' && h < 12) h += 12
    if (m === 'am' && h === 12) h = 0
  }
  if (h > 23 || minutes > 59) return null
  return `${pad(h)}:${pad(minutes)}`
}

export function parseQuickAdd(input: string, today: ISODate): QuickAddResult {
  let text = ` ${input.replace(/\s+/g, ' ').trim()} `
  const result: QuickAddResult = {
    title: '',
    due_date: null,
    due_time: null,
    priority: null,
    project_name: null,
    tags: [],
    repeat_rule: null,
    is_someday: false,
    duration_minutes: null,
  }

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => boolean | void) => {
    const m = text.match(re)
    if (m && fn(m) !== false) text = text.replace(m[0], ' ')
  }

  // Priority: p1..p4 or !1..!4
  take(/\s(?:p|!)([1-4])(?=\s)/i, (m) => {
    result.priority = Number(m[1])
  })

  // Project: #Name (single word, may contain - or _)
  take(/\s#([\p{L}\p{N}_-]+)(?=\s)/u, (m) => {
    result.project_name = m[1]!.replace(/[_-]/g, ' ')
  })

  // Tags: @tag (multiple). Avoid matching e-mail addresses.
  for (;;) {
    const m = text.match(/\s@([\p{L}\p{N}_-]+)(?=\s)/u)
    if (!m) break
    result.tags.push(m[1]!.toLowerCase())
    text = text.replace(m[0], ' ')
  }

  // Duration: "for 30 min", "for 1h", "for 1.5h"
  take(/\sfor (\d+(?:[.,]\d+)?) ?(m|min|mins|minutes|h|hr|hrs|hours?)(?=\s)/i, (m) => {
    const value = Number(m[1]!.replace(',', '.'))
    const minutes = /^h/i.test(m[2]!) ? Math.round(value * 60) : Math.round(value)
    if (minutes < 1 || minutes > 1440) return false
    result.duration_minutes = minutes
  })

  // Repeat: every day / every weekday / every week / every month / every mon
  take(
    /\s(?:every|each) (\d+ )?(day|days|weekday|weekdays|week|weeks|month|months|year|years|[a-z]+)(?=\s)/i,
    (m) => {
      const interval = m[1] ? Number(m[1]) : 1
      const unit = m[2]!.toLowerCase()
      if (/^days?$/.test(unit)) result.repeat_rule = { freq: 'daily', interval }
      else if (/^weekdays?$/.test(unit))
        result.repeat_rule = { freq: 'weekly', interval: 1, weekdays: [1, 2, 3, 4, 5] }
      else if (/^weeks?$/.test(unit)) result.repeat_rule = { freq: 'weekly', interval }
      else if (/^months?$/.test(unit)) result.repeat_rule = { freq: 'monthly', interval }
      else if (/^years?$/.test(unit)) result.repeat_rule = { freq: 'yearly', interval }
      else if (unit in WEEKDAYS) {
        const wd = WEEKDAYS[unit]!
        result.repeat_rule = { freq: 'weekly', interval, weekdays: [wd] }
        result.due_date ??= weekdayOf(today) === wd ? today : nextWeekday(today, wd)
      } else return false
      result.due_date ??= today
    },
  )

  // Time: "at 18:00", "at 6pm", "18:00", "6:30pm"
  take(/\s(?:at )?(\d{1,2})(?::(\d{2}))? ?(am|pm)(?=\s)/i, (m) => {
    const t = to24h(Number(m[1]), Number(m[2] ?? 0), m[3])
    if (!t) return false
    result.due_time = t
  })
  if (!result.due_time) {
    take(/\s(?:at )?(\d{1,2}):(\d{2})(?=\s)/i, (m) => {
      const t = to24h(Number(m[1]), Number(m[2]))
      if (!t) return false
      result.due_time = t
    })
  }

  // Dates
  take(/\s(today|tod|tonight)(?=\s)/i, () => {
    result.due_date = today
  })
  take(/\s(tomorrow|tmr|tmrw)(?=\s)/i, () => {
    result.due_date = addDaysISO(today, 1)
  })
  take(/\s(someday|later)(?=\s)/i, () => {
    result.is_someday = true
  })
  take(/\snext week(?=\s)/i, () => {
    result.due_date = nextWeekday(today, 1, weekdayOf(today) === 1)
  })
  take(/\sin (\d{1,3}) (day|days|week|weeks)(?=\s)/i, (m) => {
    const n = Number(m[1])
    result.due_date = addDaysISO(today, /^week/i.test(m[2]!) ? n * 7 : n)
  })
  take(
    /\s(?:on )?(next )?(mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday)(?=\s)/i,
    (m) => {
      result.due_date = nextWeekday(today, WEEKDAYS[m[2]!.toLowerCase()]!, Boolean(m[1]))
    },
  )
  take(/\s(\d{4}-\d{2}-\d{2})(?=\s)/, (m) => {
    if (!isISODate(m[1]!)) return false
    result.due_date = m[1]!
  })
  take(/\s(?:on )?(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?(?=\s)/, (m) => {
    const d = dayMonth(today, Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : undefined)
    if (!d) return false
    result.due_date = d
  })
  take(
    /\s(?:on )?(\d{1,2}) (jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)(?=\s)/i,
    (m) => {
      const d = dayMonth(today, Number(m[1]), MONTHS[m[2]!.toLowerCase()]!)
      if (!d) return false
      result.due_date = d
    },
  )
  take(
    /\s(?:on )?(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december) (\d{1,2})(?=\s)/i,
    (m) => {
      const d = dayMonth(today, Number(m[2]), MONTHS[m[1]!.toLowerCase()]!)
      if (!d) return false
      result.due_date = d
    },
  )

  // A time without a date means today (or tomorrow if repeat is not set and... keep simple: today).
  if (result.due_time && !result.due_date) result.due_date = today

  result.title = text.replace(/\s+/g, ' ').trim()
  if (!result.title) result.title = input.trim()
  return result
}
