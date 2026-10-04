import 'server-only'
import { unwrap } from '@/lib/db/errors'
import type { DB, InsertRow, Row, UpdateRow } from '@/lib/db/types'

export type GoalRow = Row<'goals'>

export async function listGoals(
  db: DB,
  userId: string,
  statuses: string[] = ['active', 'paused', 'completed'],
) {
  return unwrap(
    await db
      .from('goals')
      .select(
        '*, milestones:goal_milestones(id, title, completed_at, due_date, position, target_value)',
      )
      .eq('user_id', userId)
      .in('status', statuses)
      .order('status')
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('created_at'),
    'load goals',
  )
}

export async function getGoal(db: DB, userId: string, id: string) {
  return unwrap(
    await db
      .from('goals')
      .select('*, milestones:goal_milestones(*)')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle(),
    'load the goal',
  )
}

export async function listGoalTasks(db: DB, userId: string, goalIds: string[]) {
  if (goalIds.length === 0) return []
  return unwrap(
    await db
      .from('tasks')
      .select('id, goal_id, status')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('goal_id', goalIds),
    'load linked tasks',
  )
}

export async function listProgressLogs(db: DB, userId: string, goalId: string, limit = 50) {
  return unwrap(
    await db
      .from('goal_progress_logs')
      .select('id, value, note, logged_at')
      .eq('user_id', userId)
      .eq('goal_id', goalId)
      .order('logged_at', { ascending: false })
      .limit(limit),
    'load progress history',
  )
}

export async function insertGoal(
  db: DB,
  userId: string,
  values: Omit<InsertRow<'goals'>, 'user_id'>,
) {
  return unwrap(
    await db
      .from('goals')
      .insert({ ...values, user_id: userId })
      .select('*')
      .single(),
    'save this goal',
  )
}

export async function updateGoal(db: DB, userId: string, id: string, values: UpdateRow<'goals'>) {
  const { user_id: _u, id: _i, ...safe } = values
  return unwrap(
    await db.from('goals').update(safe).eq('user_id', userId).eq('id', id).select('*').single(),
    'update this goal',
  )
}
