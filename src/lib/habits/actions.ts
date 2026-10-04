'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { DataError, unwrap } from '@/lib/db/errors'
import { getUserContext } from '@/lib/settings/service'
import { setHabitLog } from './repository'
import { habitSchema, logHabitSchema } from './schemas'

function normalize(v: z.output<typeof habitSchema>) {
  return {
    ...v,
    description: v.description || null,
    unit: v.habit_type === 'boolean' ? null : v.habit_type === 'duration' ? 'min' : v.unit || null,
    target: v.habit_type === 'boolean' ? 1 : v.target,
    weekdays: v.frequency === 'weekdays' ? v.weekdays : [],
    times_per_week: v.frequency === 'times_per_week' ? (v.times_per_week ?? 1) : null,
    interval_days: v.frequency === 'interval' ? (v.interval_days ?? 1) : null,
    reminder_time: v.reminder_time || null,
    goal_id: v.goal_id || null,
    end_date: v.end_date || null,
  }
}

export const createHabit = authedAction(
  habitSchema,
  { name: 'createHabit' },
  async (input, { supabase, user }) => {
    const { today } = await getUserContext()
    const { count } = await supabase
      .from('habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const row = unwrap(
      await supabase
        .from('habits')
        .insert({
          ...normalize(input),
          start_date: input.start_date ?? today,
          user_id: user.id,
          position: count ?? 0,
        })
        .select('id')
        .single(),
      'create this habit',
    )
    return { id: row.id }
  },
)

export const updateHabit = authedAction(
  habitSchema.and(z.object({ id: z.uuid() })),
  { name: 'updateHabit' },
  async (input, { supabase, user }) => {
    const { id, ...rest } = input
    const values = normalize(rest as z.output<typeof habitSchema>)
    const { start_date, ...withoutStart } = values
    unwrap(
      await supabase
        .from('habits')
        .update(start_date ? values : withoutStart)
        .eq('user_id', user.id)
        .eq('id', id),
      'update this habit',
    )
    return { id }
  },
)

export const setHabitActive = authedAction(
  z.object({ id: z.uuid(), active: z.boolean() }),
  { name: 'setHabitActive' },
  async ({ id, active }, { supabase, user }) => {
    unwrap(
      await supabase.from('habits').update({ active }).eq('user_id', user.id).eq('id', id),
      'update this habit',
    )
  },
)

export const deleteHabit = authedAction(
  idSchema,
  { name: 'deleteHabit' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('habits').delete().eq('user_id', user.id).eq('id', id),
      'delete this habit',
    )
  },
)

export const logHabit = authedAction(
  logHabitSchema,
  { name: 'logHabit', failureMessage: "We couldn't update this habit. Please try again." },
  async ({ habit_id, date, value, note }, { supabase, user }) => {
    const { today } = await getUserContext()
    if (date > today) throw new DataError("You can't log a habit for a future date.")
    await setHabitLog(supabase, user.id, habit_id, date, value, note)
  },
)

export const reorderHabits = authedAction(
  z.object({ ids: z.array(z.uuid()).max(200) }),
  { name: 'reorderHabits' },
  async ({ ids }, { supabase, user }) => {
    await Promise.all(
      ids.map((id, position) =>
        supabase.from('habits').update({ position }).eq('user_id', user.id).eq('id', id),
      ),
    )
  },
)
