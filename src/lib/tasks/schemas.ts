import { z } from 'zod'
import { blankable, optionalDate, optionalTime, optionalUuid } from '@/lib/validation'
import { repeatRuleSchema } from '@/lib/recurrence'

export const TASK_STATUSES = ['inbox', 'todo', 'in_progress', 'completed', 'cancelled'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
export const OPEN_STATUSES: TaskStatus[] = ['inbox', 'todo', 'in_progress']

export const TASK_VIEWS = [
  'inbox',
  'today',
  'upcoming',
  'scheduled',
  'someday',
  'completed',
] as const
export type TaskView = (typeof TASK_VIEWS)[number]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: 'Inbox',
  todo: 'Todo',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const PRIORITY_LABELS: Record<number, string> = { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' }

export const taskFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Give the task a title').max(500),
  description: z.string().trim().max(10000).nullable().optional(),
  notes: z.string().trim().max(20000).nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.number().int().min(1).max(4).optional(),
  due_date: optionalDate,
  due_time: optionalTime,
  duration_minutes: z.number().int().min(1).max(1440).nullable().optional(),
  repeat_rule: repeatRuleSchema.nullable().optional(),
  is_someday: z.boolean().optional(),
  reminder_at: blankable(z.iso.datetime({ offset: true })),
  project_id: optionalUuid,
  goal_id: optionalUuid,
  parent_task_id: optionalUuid,
  life_area_id: optionalUuid,
  tag_names: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
})

export const createTaskSchema = taskFieldsSchema.refine((v) => !v.due_time || v.due_date, {
  message: 'Pick a date for the time',
  path: ['due_time'],
})
export type CreateTaskInput = z.input<typeof createTaskSchema>

export const updateTaskSchema = taskFieldsSchema.partial().extend({ id: z.uuid() })
export type UpdateTaskInput = z.input<typeof updateTaskSchema>

export const quickAddSchema = z.object({
  text: z.string().trim().min(1, 'Type a task').max(500),
  project_id: optionalUuid,
  goal_id: optionalUuid,
  parent_task_id: optionalUuid,
  defaults: z.object({ due_date: optionalDate, is_someday: z.boolean().optional() }).optional(),
})

export const attachmentSchema = z.object({
  task_id: z.uuid(),
  name: z.string().trim().min(1).max(200),
  url: z.url({ protocol: /^https?$/, message: 'Use an http(s) link' }).max(2048),
})

export const dependencySchema = z.object({ task_id: z.uuid(), depends_on_task_id: z.uuid() })
