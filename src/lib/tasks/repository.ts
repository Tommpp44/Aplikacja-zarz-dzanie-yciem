import 'server-only'
import { addDaysISO, type ISODate } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import type { DB, InsertRow, Row, UpdateRow } from '@/lib/db/types'
import { OPEN_STATUSES, type TaskView } from './schemas'

/**
 * TaskRepository: all task persistence goes through here. Queries run with the
 * user's session (RLS) and additionally filter by user_id for index usage.
 */
export const TASK_LIST_SELECT = `
  *,
  project:projects!tasks_project_id_user_id_fkey(id, name, color),
  goal:goals!tasks_goal_id_user_id_fkey(id, title),
  task_tags(tag:tags(id, name, color))
` as const

export type TaskRow = Row<'tasks'>
export type TaskListItem = TaskRow & {
  project: { id: string; name: string; color: string } | null
  goal: { id: string; title: string } | null
  subtasks: { id: string; status: string }[]
  task_tags: { tag: { id: string; name: string; color: string } | null }[]
}

export type TaskFilters = {
  view?: TaskView
  projectId?: string
  goalId?: string
  priority?: number
  tagId?: string
  search?: string
  limit?: number
  offset?: number
}

export async function listTasks(db: DB, userId: string, today: ISODate, filters: TaskFilters = {}) {
  let q = db.from('tasks').select(TASK_LIST_SELECT).eq('user_id', userId).is('deleted_at', null)

  const view = filters.view
  if (!filters.projectId && !filters.goalId) q = q.is('parent_task_id', null)

  switch (view) {
    case 'inbox':
      q = q
        .in('status', OPEN_STATUSES)
        .is('due_date', null)
        .is('project_id', null)
        .eq('is_someday', false)
      break
    case 'today':
      q = q.in('status', OPEN_STATUSES).lte('due_date', today).eq('is_someday', false)
      break
    case 'upcoming':
      q = q.in('status', OPEN_STATUSES).gt('due_date', today).lte('due_date', addDaysISO(today, 14))
      break
    case 'scheduled':
      q = q.in('status', OPEN_STATUSES).not('due_date', 'is', null)
      break
    case 'someday':
      q = q.in('status', OPEN_STATUSES).eq('is_someday', true)
      break
    case 'completed':
      q = q.eq('status', 'completed')
      break
    default:
      break
  }

  if (filters.projectId) q = q.eq('project_id', filters.projectId)
  if (filters.goalId) q = q.eq('goal_id', filters.goalId)
  if (filters.priority) q = q.eq('priority', filters.priority)
  if (filters.search) q = q.ilike('title', `%${escapeLike(filters.search)}%`)

  if (view === 'completed') {
    q = q.order('completed_at', { ascending: false })
  } else {
    q = q
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('due_time', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: true })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
  }
  const limit = filters.limit ?? 200
  const offset = filters.offset ?? 0
  q = q.range(offset, offset + limit - 1)

  let rows = await withSubtasks(
    db,
    userId,
    unwrap(await q, 'load tasks') as unknown as Omit<TaskListItem, 'subtasks'>[],
  )
  if (filters.tagId)
    rows = rows.filter((t) => t.task_tags.some((tt) => tt.tag?.id === filters.tagId))
  return rows
}

/** Attaches subtask status summaries (fetched in one query, not N+1). */
async function withSubtasks<T extends { id: string }>(db: DB, userId: string, rows: T[]) {
  if (rows.length === 0) return [] as (T & { subtasks: { id: string; status: string }[] })[]
  const subs = unwrap(
    await db
      .from('tasks')
      .select('id, status, parent_task_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in(
        'parent_task_id',
        rows.map((r) => r.id),
      ),
    'load subtasks',
  )
  return rows.map((r) => ({ ...r, subtasks: subs.filter((s) => s.parent_task_id === r.id) }))
}

export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export async function countOpenByView(db: DB, userId: string, today: ISODate) {
  const base = () =>
    db
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .is('parent_task_id', null)
      .in('status', OPEN_STATUSES)
  const [inbox, todayCount, overdue] = await Promise.all([
    base().is('due_date', null).is('project_id', null).eq('is_someday', false),
    base().lte('due_date', today).eq('is_someday', false),
    base().lt('due_date', today).eq('is_someday', false),
  ])
  return { inbox: inbox.count ?? 0, today: todayCount.count ?? 0, overdue: overdue.count ?? 0 }
}

export async function getTask(db: DB, userId: string, id: string) {
  const res = await db
    .from('tasks')
    .select(
      `${TASK_LIST_SELECT},
       attachments:task_attachments(id, name, url, created_at),
       dependencies:task_dependencies!task_dependencies_task_id_user_id_fkey(depends_on_task_id)`,
    )
    .eq('user_id', userId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  return unwrap(res, 'load the task') as unknown as
    | (Omit<TaskListItem, 'subtasks'> & {
        attachments: { id: string; name: string; url: string | null; created_at: string }[]
        dependencies: { depends_on_task_id: string }[]
      })
    | null
}

export async function listSubtasks(db: DB, userId: string, parentId: string) {
  const res = await db
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('parent_task_id', parentId)
    .is('deleted_at', null)
    .order('position')
    .order('created_at')
  return unwrap(res, 'load subtasks')
}

export async function listTasksByIds(db: DB, userId: string, ids: string[]) {
  if (ids.length === 0) return []
  const res = await db.from('tasks').select('id, title, status').eq('user_id', userId).in('id', ids)
  return unwrap(res, 'load tasks')
}

export async function insertTask(
  db: DB,
  userId: string,
  values: Omit<InsertRow<'tasks'>, 'user_id'>,
) {
  const res = await db
    .from('tasks')
    .insert({ ...values, user_id: userId })
    .select('*')
    .single()
  return unwrap(res, 'save this task')
}

export async function updateTaskRow(
  db: DB,
  userId: string,
  id: string,
  values: UpdateRow<'tasks'>,
) {
  const { user_id: _ignored, id: _id, ...safe } = values
  const res = await db
    .from('tasks')
    .update(safe)
    .eq('user_id', userId)
    .eq('id', id)
    .select('*')
    .single()
  return unwrap(res, 'update this task')
}

export async function getTaskRow(db: DB, userId: string, id: string) {
  const res = await db.from('tasks').select('*').eq('user_id', userId).eq('id', id).maybeSingle()
  return unwrap(res, 'load the task')
}

/** Ensures tags exist and links them to the task (replacing previous tags). */
export async function setTaskTags(db: DB, userId: string, taskId: string, names: string[]) {
  const unique = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))]
  unwrap(
    await db.from('task_tags').delete().eq('user_id', userId).eq('task_id', taskId),
    'update tags',
  )
  if (unique.length === 0) return
  const upserted = unwrap(
    await db
      .from('tags')
      .upsert(
        unique.map((name) => ({ name, user_id: userId })),
        { onConflict: 'user_id,name', ignoreDuplicates: false },
      )
      .select('id, name'),
    'save tags',
  )
  unwrap(
    await db
      .from('task_tags')
      .insert(upserted.map((t) => ({ task_id: taskId, tag_id: t.id, user_id: userId }))),
    'link tags',
  )
}

export async function listTags(db: DB, userId: string) {
  return unwrap(
    await db.from('tags').select('id, name, color').eq('user_id', userId).order('name'),
    'load tags',
  )
}

export async function findProjectByName(db: DB, userId: string, name: string) {
  const res = await db
    .from('projects')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', escapeLike(name))
    .neq('status', 'archived')
    .limit(1)
  return unwrap(res, 'find project')[0] ?? null
}
