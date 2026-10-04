import 'server-only'
import { shortTime, utcToZoned, type ISODate } from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import { parseRepeatRule } from '@/lib/recurrence'
import { expandEvents } from './expand'
import { listEventsForRange, listTasksForRange, type EventRow } from './repository'
import type { EventInput } from './schemas'

export type CalendarItem = {
  key: string
  kind: 'event' | 'task'
  id: string
  title: string
  color: string
  startDate: ISODate
  endDate: ISODate
  startTime: string | null
  endTime: string | null
  allDay: boolean
  location?: string | null
  done?: boolean
}

/** Converts a stored event into local-time form values (for editing). */
export function eventToForm(e: EventRow, timeZone: string): EventInput {
  const start = utcToZoned(e.starts_at, timeZone)
  const endInstant = new Date(e.ends_at)
  const end = utcToZoned(e.all_day ? new Date(endInstant.getTime() - 1) : endInstant, timeZone)
  return {
    title: e.title,
    all_day: e.all_day,
    start_date: start.date,
    start_time: e.all_day ? undefined : start.time,
    end_date: end.date,
    end_time: e.all_day ? undefined : end.time,
    location: e.location,
    description: e.description,
    repeat_rule: parseRepeatRule(e.repeat_rule),
    repeat_until: e.repeat_until,
    color: e.color as EventInput['color'],
    project_id: e.project_id,
    task_id: e.task_id,
    goal_id: e.goal_id,
  }
}

/** Events (expanded) and dated tasks for a local date range — one timeline for the whole app. */
export async function getCalendarItems(
  db: DB,
  userId: string,
  from: ISODate,
  to: ISODate,
  timeZone: string,
  { includeTasks = true } = {},
) {
  const [events, tasks] = await Promise.all([
    listEventsForRange(db, userId, from, to, timeZone),
    includeTasks ? listTasksForRange(db, userId, from, to) : Promise.resolve([]),
  ])
  const items: CalendarItem[] = expandEvents(events, from, to, timeZone).map((o) => ({
    key: o.key,
    kind: 'event',
    id: o.event.id,
    title: o.event.title,
    color: o.event.color,
    startDate: o.startDate,
    endDate: o.endDate,
    startTime: o.allDay ? null : o.startTime,
    endTime: o.allDay ? null : o.endTime,
    allDay: o.allDay,
    location: o.event.location,
  }))
  for (const t of tasks) {
    const start = shortTime(t.due_time)
    let end: string | null = null
    if (start && t.duration_minutes) {
      const mins = Math.min(
        24 * 60 - 1,
        Number(start.slice(0, 2)) * 60 + Number(start.slice(3)) + t.duration_minutes,
      )
      end = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    }
    items.push({
      key: `task:${t.id}`,
      kind: 'task',
      id: t.id,
      title: t.title,
      color: t.priority === 1 ? 'rose' : t.priority === 2 ? 'amber' : 'slate',
      startDate: t.due_date!,
      endDate: t.due_date!,
      startTime: start,
      endTime: end,
      allDay: !start,
      done: t.status === 'completed',
    })
  }
  items.sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) ||
      (a.startTime ?? '').localeCompare(b.startTime ?? ''),
  )
  const forms = Object.fromEntries(events.map((e) => [e.id, eventToForm(e, timeZone)]))
  return { items, events: forms }
}
