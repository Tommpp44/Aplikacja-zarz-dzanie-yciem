import 'server-only'
import type { ISODate } from '@/lib/dates'
import { NotFoundError } from '@/lib/db/errors'
import type { DB, UpdateRow } from '@/lib/db/types'
import { toJson } from '@/lib/db/types'
import { nextTaskDueDate, parseRepeatRule } from '@/lib/recurrence'
import { parseQuickAdd } from './quick-add'
import * as repo from './repository'
import type { CreateTaskInput, UpdateTaskInput } from './schemas'

/** TaskService: business rules on top of the repository. */

function toRow(input: Omit<UpdateTaskInput, 'id' | 'tag_names'>): UpdateRow<'tasks'> {
  const row: UpdateRow<'tasks'> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (key === 'repeat_rule') row.repeat_rule = value === null ? null : toJson(value)
    else (row as Record<string, unknown>)[key] = value === '' ? null : value
  }
  return row
}

export async function createTask(db: DB, userId: string, input: CreateTaskInput) {
  const { tag_names, ...fields } = input
  const row = toRow(fields)
  // A dated or scheduled task is never "someday".
  if (row.due_date) row.is_someday = false
  const task = await repo.insertTask(db, userId, { ...row, title: fields.title } as Parameters<
    typeof repo.insertTask
  >[2])
  if (tag_names?.length) await repo.setTaskTags(db, userId, task.id, tag_names)
  return task
}

export async function quickAddTask(
  db: DB,
  userId: string,
  today: ISODate,
  input: {
    text: string
    project_id?: string | null
    goal_id?: string | null
    parent_task_id?: string | null
    defaults?: { due_date?: string | null; is_someday?: boolean }
  },
) {
  const parsed = parseQuickAdd(input.text, today)
  let projectId = input.project_id ?? null
  if (!projectId && parsed.project_name) {
    projectId = (await repo.findProjectByName(db, userId, parsed.project_name))?.id ?? null
  }
  return createTask(db, userId, {
    title: parsed.title,
    due_date: parsed.due_date ?? input.defaults?.due_date ?? null,
    due_time: parsed.due_time,
    priority: parsed.priority ?? 4,
    duration_minutes: parsed.duration_minutes,
    repeat_rule: parsed.repeat_rule,
    is_someday: parsed.is_someday || (input.defaults?.is_someday ?? false),
    project_id: projectId,
    goal_id: input.goal_id ?? null,
    parent_task_id: input.parent_task_id ?? null,
    tag_names: parsed.tags,
  })
}

export async function updateTask(db: DB, userId: string, input: UpdateTaskInput) {
  const { id, tag_names, ...fields } = input
  const row = toRow(fields)
  if (row.due_date) row.is_someday = false
  if (row.due_date === null) row.due_time = null
  const task =
    Object.keys(row).length > 0
      ? await repo.updateTaskRow(db, userId, id, row)
      : await repo.getTaskRow(db, userId, id)
  if (!task) throw new NotFoundError('task')
  if (tag_names) await repo.setTaskTags(db, userId, id, tag_names)
  return task
}

/**
 * Completes a task. Recurring tasks stay a single row: the completed occurrence is
 * recorded as a new completed copy and the original moves to the next due date.
 * This keeps history (completion counts) and a stable id for links.
 */
export async function setTaskCompleted(
  db: DB,
  userId: string,
  id: string,
  completed: boolean,
  today: ISODate,
) {
  const task = await repo.getTaskRow(db, userId, id)
  if (!task || task.deleted_at) throw new NotFoundError('task')
  const rule = parseRepeatRule(task.repeat_rule)

  if (completed && rule && task.status !== 'completed') {
    await repo.insertTask(db, userId, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date ?? today,
      due_time: task.due_time,
      duration_minutes: task.duration_minutes,
      project_id: task.project_id,
      goal_id: task.goal_id,
      life_area_id: task.life_area_id,
      status: 'completed',
    })
    const next = nextTaskDueDate(rule, task.due_date, today)
    const updated = await repo.updateTaskRow(db, userId, id, {
      due_date: next,
      status: task.status === 'in_progress' ? 'todo' : task.status,
    })
    return { task: updated, nextDueDate: next }
  }

  const updated = await repo.updateTaskRow(db, userId, id, {
    status: completed ? 'completed' : task.status === 'completed' ? 'todo' : task.status,
  })
  return { task: updated, nextDueDate: null }
}

export async function softDeleteTask(db: DB, userId: string, id: string) {
  await repo.updateTaskRow(db, userId, id, { deleted_at: new Date().toISOString() })
}

export async function restoreTask(db: DB, userId: string, id: string) {
  await repo.updateTaskRow(db, userId, id, { deleted_at: null })
}
