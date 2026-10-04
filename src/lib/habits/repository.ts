import 'server-only'
import { unwrap } from '@/lib/db/errors'
import type { DB, Row } from '@/lib/db/types'

export type HabitRow = Row<'habits'>

export async function listHabits(db: DB, userId: string, { includeArchived = false } = {}) {
  let q = db.from('habits').select('*').eq('user_id', userId)
  if (!includeArchived) q = q.eq('active', true)
  return unwrap(await q.order('position').order('created_at'), 'load habits')
}

export async function getHabit(db: DB, userId: string, id: string) {
  return unwrap(
    await db.from('habits').select('*').eq('user_id', userId).eq('id', id).maybeSingle(),
    'load the habit',
  )
}

export async function listHabitLogs(
  db: DB,
  userId: string,
  from: string,
  to: string,
  habitIds?: string[],
) {
  let q = db
    .from('habit_logs')
    .select('habit_id, log_date, value')
    .eq('user_id', userId)
    .gte('log_date', from)
    .lte('log_date', to)
  if (habitIds) q = q.in('habit_id', habitIds)
  return unwrap(await q.order('log_date'), 'load habit history').map((l) => ({
    ...l,
    value: Number(l.value),
  }))
}

/** Sets the day's value (upsert) or removes the log when value is 0. */
export async function setHabitLog(
  db: DB,
  userId: string,
  habitId: string,
  date: string,
  value: number,
  note?: string,
) {
  if (value <= 0) {
    unwrap(
      await db
        .from('habit_logs')
        .delete()
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('log_date', date),
      'update the habit',
    )
    return
  }
  unwrap(
    await db
      .from('habit_logs')
      .upsert(
        {
          habit_id: habitId,
          user_id: userId,
          log_date: date,
          value,
          ...(note !== undefined ? { note } : {}),
        },
        { onConflict: 'habit_id,log_date' },
      ),
    'update the habit',
  )
}
