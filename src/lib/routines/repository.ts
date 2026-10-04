import 'server-only'
import type { ISODate } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'

export async function listRoutines(db: DB, userId: string, date: ISODate) {
  const [routines, runs] = await Promise.all([
    db
      .from('routines')
      .select('*, items:routine_items(id, title, duration_minutes, position, habit_id)')
      .eq('user_id', userId)
      .order('start_time', { ascending: true, nullsFirst: false })
      .order('position'),
    db
      .from('routine_runs')
      .select('routine_id, completed_item_ids, completed_at')
      .eq('user_id', userId)
      .eq('run_date', date),
  ])
  const runMap = new Map(unwrap(runs, 'load routine progress').map((r) => [r.routine_id, r]))
  return unwrap(routines, 'load routines').map((r) => ({
    ...r,
    items: [...r.items].sort((a, b) => a.position - b.position),
    run: runMap.get(r.id) ?? null,
  }))
}

export type RoutineWithRun = Awaited<ReturnType<typeof listRoutines>>[number]
