'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { setHabitLog } from '@/lib/habits/repository'
import { getUserContext } from '@/lib/settings/service'
import { routineSchema } from './schemas'

async function saveItems(
  db: Parameters<Parameters<typeof authedAction>[2]>[1]['supabase'],
  userId: string,
  routineId: string,
  items: z.output<typeof routineSchema>['items'],
) {
  const existing = unwrap(
    await db.from('routine_items').select('id').eq('user_id', userId).eq('routine_id', routineId),
    'load steps',
  )
  const keep = new Set(items.filter((i) => i.id).map((i) => i.id!))
  const remove = existing.filter((e) => !keep.has(e.id)).map((e) => e.id)
  if (remove.length)
    unwrap(
      await db.from('routine_items').delete().eq('user_id', userId).in('id', remove),
      'update steps',
    )
  for (const [position, item] of items.entries()) {
    const values = {
      title: item.title,
      duration_minutes: item.duration_minutes ?? null,
      habit_id: item.habit_id || null,
      position,
    }
    if (item.id && existing.some((e) => e.id === item.id)) {
      unwrap(
        await db.from('routine_items').update(values).eq('user_id', userId).eq('id', item.id),
        'update steps',
      )
    } else {
      unwrap(
        await db
          .from('routine_items')
          .insert({ ...values, routine_id: routineId, user_id: userId }),
        'update steps',
      )
    }
  }
}

export const createRoutine = authedAction(
  routineSchema,
  { name: 'createRoutine' },
  async ({ items, ...input }, { supabase, user }) => {
    const row = unwrap(
      await supabase
        .from('routines')
        .insert({
          ...input,
          description: input.description || null,
          start_time: input.start_time || null,
          user_id: user.id,
        })
        .select('id')
        .single(),
      'create this routine',
    )
    await saveItems(supabase, user.id, row.id, items)
    return { id: row.id }
  },
)

export const updateRoutine = authedAction(
  routineSchema.extend({ id: z.uuid() }),
  { name: 'updateRoutine' },
  async ({ id, items, ...input }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('routines')
        .update({
          ...input,
          description: input.description || null,
          start_time: input.start_time || null,
        })
        .eq('user_id', user.id)
        .eq('id', id),
      'update this routine',
    )
    await saveItems(supabase, user.id, id, items)
    return { id }
  },
)

export const deleteRoutine = authedAction(
  idSchema,
  { name: 'deleteRoutine' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('routines').delete().eq('user_id', user.id).eq('id', id),
      'delete this routine',
    )
  },
)

/** Checks a step for today. Steps linked to a habit also log that habit. */
export const toggleRoutineItem = authedAction(
  z.object({ routine_id: z.uuid(), item_id: z.uuid(), done: z.boolean() }),
  { name: 'toggleRoutineItem' },
  async ({ routine_id, item_id, done }, { supabase, user }) => {
    const { today } = await getUserContext()
    const [{ data: run }, items] = await Promise.all([
      supabase
        .from('routine_runs')
        .select('completed_item_ids')
        .eq('user_id', user.id)
        .eq('routine_id', routine_id)
        .eq('run_date', today)
        .maybeSingle(),
      supabase
        .from('routine_items')
        .select('id, habit_id')
        .eq('user_id', user.id)
        .eq('routine_id', routine_id)
        .then((r) => unwrap(r, 'load steps')),
    ])
    const item = items.find((i) => i.id === item_id)
    if (!item) return
    const set = new Set(run?.completed_item_ids ?? [])
    if (done) set.add(item_id)
    else set.delete(item_id)
    const completed = [...set].filter((id) => items.some((i) => i.id === id))
    unwrap(
      await supabase.from('routine_runs').upsert(
        {
          routine_id,
          user_id: user.id,
          run_date: today,
          completed_item_ids: completed,
          completed_at: completed.length === items.length ? new Date().toISOString() : null,
        },
        { onConflict: 'routine_id,run_date' },
      ),
      'update the routine',
    )
    if (item.habit_id) {
      const { data: habit } = await supabase
        .from('habits')
        .select('target')
        .eq('user_id', user.id)
        .eq('id', item.habit_id)
        .maybeSingle()
      if (habit)
        await setHabitLog(supabase, user.id, item.habit_id, today, done ? Number(habit.target) : 0)
    }
  },
)
