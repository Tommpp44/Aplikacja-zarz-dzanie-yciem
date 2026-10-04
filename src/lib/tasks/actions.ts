'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { getUserContext } from '@/lib/settings/service'
import * as repo from './repository'
import {
  attachmentSchema,
  createTaskSchema,
  dependencySchema,
  quickAddSchema,
  updateTaskSchema,
} from './schemas'
import * as service from './service'

export const createTask = authedAction(
  createTaskSchema,
  { name: 'createTask', failureMessage: "We couldn't save this task. Please try again." },
  async (input, { supabase, user }) => {
    const task = await service.createTask(supabase, user.id, input)
    return { id: task.id }
  },
)

export const quickAddTask = authedAction(
  quickAddSchema,
  { name: 'quickAddTask' },
  async (input, { supabase, user }) => {
    const { today } = await getUserContext()
    const task = await service.quickAddTask(supabase, user.id, today, input)
    return { id: task.id, title: task.title, due_date: task.due_date }
  },
)

export const updateTask = authedAction(
  updateTaskSchema,
  { name: 'updateTask' },
  async (input, { supabase, user }) => {
    const task = await service.updateTask(supabase, user.id, input)
    return { id: task.id }
  },
)

export const toggleTaskCompleted = authedAction(
  z.object({ id: z.uuid(), completed: z.boolean() }),
  { name: 'toggleTaskCompleted' },
  async ({ id, completed }, { supabase, user }) => {
    const { today } = await getUserContext()
    const { nextDueDate } = await service.setTaskCompleted(supabase, user.id, id, completed, today)
    return { nextDueDate }
  },
)

export const deleteTask = authedAction(
  idSchema,
  { name: 'deleteTask' },
  async ({ id }, { supabase, user }) => {
    await service.softDeleteTask(supabase, user.id, id)
  },
)

export const restoreTask = authedAction(
  idSchema,
  { name: 'restoreTask' },
  async ({ id }, { supabase, user }) => {
    await service.restoreTask(supabase, user.id, id)
  },
)

export const getTaskDetails = authedAction(
  idSchema,
  { name: 'getTaskDetails', revalidate: [] },
  async ({ id }, { supabase, user }) => {
    const task = await repo.getTask(supabase, user.id, id)
    if (!task) return null
    const [subtasks, dependencyTasks] = await Promise.all([
      repo.listSubtasks(supabase, user.id, id),
      repo.listTasksByIds(
        supabase,
        user.id,
        task.dependencies.map((d) => d.depends_on_task_id),
      ),
    ])
    return { task, subtasks, dependencyTasks }
  },
)

export const addAttachment = authedAction(
  attachmentSchema,
  { name: 'addAttachment' },
  async (input, { supabase, user }) => {
    unwrap(
      await supabase.from('task_attachments').insert({ ...input, user_id: user.id }),
      'add the attachment',
    )
  },
)

export const removeAttachment = authedAction(
  idSchema,
  { name: 'removeAttachment' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('task_attachments').delete().eq('user_id', user.id).eq('id', id),
      'remove the attachment',
    )
  },
)

export const addDependency = authedAction(
  dependencySchema,
  { name: 'addDependency' },
  async (input, { supabase, user }) => {
    if (input.task_id === input.depends_on_task_id) return
    unwrap(
      await supabase.from('task_dependencies').upsert({ ...input, user_id: user.id }),
      'add the dependency',
    )
  },
)

export const removeDependency = authedAction(
  dependencySchema,
  { name: 'removeDependency' },
  async (input, { supabase, user }) => {
    unwrap(
      await supabase
        .from('task_dependencies')
        .delete()
        .eq('user_id', user.id)
        .eq('task_id', input.task_id)
        .eq('depends_on_task_id', input.depends_on_task_id),
      'remove the dependency',
    )
  },
)

export const searchTasksForLinking = authedAction(
  z.object({ query: z.string().trim().max(100), excludeId: z.uuid().optional() }),
  { name: 'searchTasksForLinking', revalidate: [] },
  async ({ query, excludeId }, { supabase, user }) => {
    let q = supabase
      .from('tasks')
      .select('id, title, status')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .in('status', ['inbox', 'todo', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(8)
    if (query) q = q.ilike('title', `%${repo.escapeLike(query)}%`)
    if (excludeId) q = q.neq('id', excludeId)
    return unwrap(await q, 'search tasks')
  },
)
