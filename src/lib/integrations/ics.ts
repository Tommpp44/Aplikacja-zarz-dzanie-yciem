import { addDaysISO, isValidTimeZone, type ISODate } from '@/lib/dates'
import type { RepeatRule } from '@/lib/recurrence'

export type IcsEvent = {
  uid: string
  title: string
  description: string | null
  location: string | null
  allDay: boolean
  /** Local wall-clock start/end in `timeZone` (or UTC instants when timeZone is 'UTC'). */
  startDate: ISODate
  startTime: string
  endDate: ISODate
  endTime: string
  timeZone: string | null
  repeatRule: RepeatRule | null
  repeatUntil: ISODate | null
}

// Outlook / Exchange often use Windows zone names.
const WINDOWS_ZONES: Record<string, string> = {
  'Central European Standard Time': 'Europe/Warsaw',
  'Central Europe Standard Time': 'Europe/Budapest',
  'W. Europe Standard Time': 'Europe/Berlin',
  'Romance Standard Time': 'Europe/Paris',
  'GMT Standard Time': 'Europe/London',
  'E. Europe Standard Time': 'Europe/Bucharest',
  'FLE Standard Time': 'Europe/Kiev',
  'Eastern Standard Time': 'America/New_York',
  'Central Standard Time': 'America/Chicago',
  'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles',
  UTC: 'UTC',
}

function unfold(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')
}

function unescapeText(v: string) {
  return v
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

type Prop = { name: string; params: Record<string, string>; value: string }

function parseLine(line: string): Prop | null {
  // NAME;PARAM=VAL;PARAM="V:AL":VALUE — the first ':' outside quotes splits.
  let inQuotes = false
  let idx = -1
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQuotes = !inQuotes
    else if (c === ':' && !inQuotes) {
      idx = i
      break
    }
  }
  if (idx < 0) return null
  const [rawName, ...rawParams] = line.slice(0, idx).split(';')
  const params: Record<string, string> = {}
  for (const p of rawParams) {
    const eq = p.indexOf('=')
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '')
  }
  return { name: rawName!.toUpperCase(), params, value: line.slice(idx + 1) }
}

function resolveZone(tzid: string | undefined): string | null {
  if (!tzid) return null
  const clean = tzid.replace(/^\//, '')
  if (WINDOWS_ZONES[clean]) return WINDOWS_ZONES[clean]!
  return isValidTimeZone(clean) ? clean : null
}

/** "20261005" | "20261005T090000" | "20261005T090000Z" */
function parseDateValue(prop: Prop) {
  const v = prop.value.trim()
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v)
  if (!m) return null
  const date = `${m[1]}-${m[2]}-${m[3]}` as ISODate
  if (!m[4] || prop.params.VALUE === 'DATE')
    return { date, time: '00:00', allDay: true, zone: null }
  const time = `${m[4]}:${m[5]}`
  const zone = m[7] ? 'UTC' : resolveZone(prop.params.TZID)
  return { date, time, allDay: false, zone }
}

const FREQ: Record<string, RepeatRule['freq']> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}
const DAYS: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

/** Maps the subset of RRULE LifeOS supports; anything more complex returns null. */
export function parseRRule(value: string, startDate: ISODate) {
  const parts = Object.fromEntries(
    value.split(';').map((p) => {
      const [k, v] = p.split('=')
      return [k!.toUpperCase(), v ?? '']
    }),
  )
  const freq = FREQ[parts.FREQ ?? '']
  if (!freq) return null
  if (parts.BYSETPOS || parts.BYWEEKNO || parts.BYYEARDAY || parts.BYHOUR) return null
  const interval = Math.max(1, Math.min(365, Number(parts.INTERVAL ?? 1) || 1))
  const rule: RepeatRule = { freq, interval }
  if (parts.BYDAY) {
    const days = parts.BYDAY.split(',')
    if (freq !== 'weekly' && !(freq === 'daily' && days.length)) return null
    if (days.some((d: string) => !(d in DAYS))) return null // e.g. "2MO" (nth weekday)
    rule.freq = 'weekly'
    rule.weekdays = days.map((d: string) => DAYS[d]!).sort()
  }
  if (parts.BYMONTHDAY) {
    const day = Number(parts.BYMONTHDAY)
    if (freq !== 'monthly' || !(day >= 1 && day <= 31)) return null
    rule.monthDay = day
  }
  let until: ISODate | null = null
  if (parts.UNTIL) {
    const m = /^(\d{4})(\d{2})(\d{2})/.exec(parts.UNTIL)
    if (m) until = `${m[1]}-${m[2]}-${m[3]}`
  } else if (parts.COUNT) {
    const count = Math.max(1, Number(parts.COUNT) || 1)
    const days =
      { daily: 1, weekly: 7, monthly: 31, yearly: 366 }[rule.freq] * interval * (count - 1)
    until = addDaysISO(startDate, days)
  }
  return { rule, until }
}

/** Parses VEVENTs from an iCalendar document. Overridden instances are skipped. */
export function parseIcs(text: string): IcsEvent[] {
  const lines = unfold(text).split('\n')
  const out: IcsEvent[] = []
  let cur: Prop[] | null = null
  let depth = 0
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line === 'BEGIN:VEVENT') {
      cur = []
      depth = 0
      continue
    }
    if (!cur) continue
    if (line.startsWith('BEGIN:')) depth++
    else if (line.startsWith('END:') && line !== 'END:VEVENT') depth--
    else if (line === 'END:VEVENT') {
      const ev = toEvent(cur)
      if (ev) out.push(ev)
      cur = null
    } else if (depth === 0) {
      const p = parseLine(line)
      if (p) cur.push(p)
    }
  }
  return out
}

function toEvent(props: Prop[]): IcsEvent | null {
  const get = (n: string) => props.find((p) => p.name === n)
  if (get('RECURRENCE-ID')) return null
  if ((get('STATUS')?.value ?? '').toUpperCase() === 'CANCELLED') return null
  const uid = get('UID')?.value.trim()
  const dtstart = get('DTSTART')
  if (!uid || !dtstart) return null
  const start = parseDateValue(dtstart)
  if (!start) return null
  const dtend = get('DTEND')
  let end = dtend ? parseDateValue(dtend) : null
  if (!end) {
    const dur = get('DURATION')?.value ?? ''
    const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(dur)
    if (m && !start.allDay) {
      const total = (Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0)
      const [h, mi] = start.time.split(':').map(Number)
      const mins = h! * 60 + mi! + total
      end = {
        date: addDaysISO(start.date, Math.floor(mins / 1440)),
        time: `${String(Math.floor((mins % 1440) / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`,
        allDay: false,
        zone: start.zone,
      }
    } else {
      end = start.allDay
        ? { ...start, date: addDaysISO(start.date, 1) }
        : { ...start, time: start.time }
    }
  }
  // All-day DTEND is exclusive; LifeOS stores the last day inclusively in forms.
  const endDate = start.allDay ? addDaysISO(end.date, -1) : end.date
  const rrule = get('RRULE')
  const parsedRule = rrule ? parseRRule(rrule.value, start.date) : null
  const title = unescapeText(get('SUMMARY')?.value ?? '') || '(no title)'
  return {
    uid: uid.slice(0, 200),
    title: title.slice(0, 200),
    description: get('DESCRIPTION')
      ? unescapeText(get('DESCRIPTION')!.value).slice(0, 5000) || null
      : null,
    location: get('LOCATION') ? unescapeText(get('LOCATION')!.value).slice(0, 300) || null : null,
    allDay: start.allDay,
    startDate: start.date,
    startTime: start.time,
    endDate: endDate < start.date ? start.date : endDate,
    endTime: end.time,
    timeZone: start.zone,
    repeatRule: parsedRule?.rule ?? null,
    repeatUntil: parsedRule?.until ?? null,
  }
}
