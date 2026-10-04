import 'server-only'
import { unwrap } from '@/lib/db/errors'
import type { DB, InsertRow, UpdateRow } from '@/lib/db/types'

export async function listProjectOptions(db: DB, userId: string) {
  return unwrap(
    await db
      .from('projects')
      .select('id, name, color')
      .eq('user_id', userId)
      .not('status', 'in', '(archived,completed)')
      .order('name'),
    'load projects',
  )
}

export async function listProjects(db: DB, userId: string, includeArchived = false) {
  let q = db
    .from('projects')
    .select(
      '*, goal:goals!projects_goal_id_user_id_fkey(id, title), tasks:tasks!tasks_project_id_user_id_fkey(id, status, deleted_at)',
    )
    .eq('user_id', userId)
    .order('status')
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (!includeArchived) q = q.neq('status', 'archived')
  return unwrap(await q, 'load projects')
}

export async function getProject(db: DB, userId: string, id: string) {
  return unwrap(
    await db
      .from('projects')
      .select('*, goal:goals!projects_goal_id_user_id_fkey(id, title)')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle(),
    'load the project',
  )
}

export async function insertProject(
  db: DB,
  userId: string,
  values: Omit<InsertRow<'projects'>, 'user_id'>,
) {
  return unwrap(
    await db
      .from('projects')
      .insert({ ...values, user_id: userId })
      .select('*')
      .single(),
    'save this project',
  )
}

export async function updateProject(
  db: DB,
  userId: string,
  id: string,
  values: UpdateRow<'projects'>,
) {
  const { user_id: _u, id: _i, ...safe } = values
  return unwrap(
    await db.from('projects').update(safe).eq('user_id', userId).eq('id', id).select('*').single(),
    'update this project',
  )
}

export async function deleteProject(db: DB, userId: string, id: string) {
  unwrap(
    await db.from('projects').delete().eq('user_id', userId).eq('id', id),
    'delete this project',
  )
}
