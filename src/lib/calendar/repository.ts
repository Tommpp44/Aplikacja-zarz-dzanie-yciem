import 'server-only'
import { addDaysISO, zonedToUtc, type ISODate } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'

export const EVENT_SELECT =
  'id, title, starts_at, ends_at, all_day, repeat_rule, repeat_until, color, location, description, project_id, task_id, goal_id'

/** Events that may overlap [from, to] in the user's timezone (recurring ones are expanded later). */
export async function listEventsForRange(
  db: DB,
  userId: string,
  from: ISODate,
  to: ISODate,
  timeZone: string,
) {
  const fromInstant = zonedToUtc(addDaysISO(from, -1), '00:00', timeZone).toISOString()
  const toInstant = zonedToUtc(addDaysISO(to, 1), '23:59', timeZone).toISOString()
  const [single, recurring] = await Promise.all([
    db
      .from('calendar_events')
      .select(EVENT_SELECT)
      .eq('user_id', userId)
      .is('repeat_rule', null)
      .lte('starts_at', toInstant)
      .gte('ends_at', fromInstant),
    db
      .from('calendar_events')
      .select(EVENT_SELECT)
      .eq('user_id', userId)
      .not('repeat_rule', 'is', null)
      .lte('starts_at', toInstant)
      .or(`repeat_until.is.null,repeat_until.gte.${from}`),
  ])
  return [...unwrap(single, 'load events'), ...unwrap(recurring, 'load events')]
}

export type EventRow = Awaited<ReturnType<typeof listEventsForRange>>[number]

/** Dated tasks shown on the calendar (integration with Tasks). */
export async function listTasksForRange(db: DB, userId: string, from: ISODate, to: ISODate) {
  return unwrap(
    await db
      .from('tasks')
      .select('id, title, due_date, due_time, duration_minutes, status, priority')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .is('parent_task_id', null)
      .gte('due_date', from)
      .lte('due_date', to)
      .neq('status', 'cancelled')
      .order('due_time', { nullsFirst: true }),
    'load tasks',
  )
}
