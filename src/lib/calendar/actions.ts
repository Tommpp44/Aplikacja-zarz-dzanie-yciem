'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { addDaysISO, zonedToUtc } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import { toJson } from '@/lib/db/types'
import { getUserContext } from '@/lib/settings/service'
import { eventSchema } from './schemas'

async function toRow(input: z.output<typeof eventSchema>) {
  const { timezone } = await getUserContext()
  const starts = input.all_day
    ? zonedToUtc(input.start_date, '00:00', timezone)
    : zonedToUtc(input.start_date, input.start_time!, timezone)
  // All-day events end exclusively at the next local midnight.
  const ends = input.all_day
    ? zonedToUtc(addDaysISO(input.end_date, 1), '00:00', timezone)
    : zonedToUtc(input.end_date, input.end_time!, timezone)
  return {
    title: input.title,
    all_day: input.all_day,
    starts_at: starts.toISOString(),
    ends_at: (ends < starts ? starts : ends).toISOString(),
    location: input.location || null,
    description: input.description || null,
    repeat_rule: input.repeat_rule ? toJson(input.repeat_rule) : null,
    repeat_until: input.repeat_rule ? input.repeat_until || null : null,
    color: input.color,
    project_id: input.project_id || null,
    task_id: input.task_id || null,
    goal_id: input.goal_id || null,
  }
}

export const createEvent = authedAction(
  eventSchema,
  { name: 'createEvent', failureMessage: "We couldn't save this event. Please try again." },
  async (input, { supabase, user }) => {
    const row = unwrap(
      await supabase
        .from('calendar_events')
        .insert({ ...(await toRow(input)), user_id: user.id })
        .select('id')
        .single(),
      'save this event',
    )
    return { id: row.id }
  },
)

export const updateEvent = authedAction(
  eventSchema.and(z.object({ id: z.uuid() })),
  { name: 'updateEvent' },
  async (input, { supabase, user }) => {
    unwrap(
      await supabase
        .from('calendar_events')
        .update(await toRow(input))
        .eq('user_id', user.id)
        .eq('id', input.id),
      'update this event',
    )
    return { id: input.id }
  },
)

export const deleteEvent = authedAction(
  idSchema,
  { name: 'deleteEvent' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('calendar_events').delete().eq('user_id', user.id).eq('id', id),
      'delete this event',
    )
  },
)
