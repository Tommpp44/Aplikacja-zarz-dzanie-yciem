import 'server-only'
import { unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'

export async function listGoalOptions(db: DB, userId: string) {
  return unwrap(
    await db
      .from('goals')
      .select('id, title')
      .eq('user_id', userId)
      .in('status', ['active', 'paused'])
      .order('title'),
    'load goals',
  )
}
