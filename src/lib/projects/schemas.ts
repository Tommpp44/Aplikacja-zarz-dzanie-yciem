import { z } from 'zod'
import { optionalDate, optionalUuid } from '@/lib/validation'
import { ENTITY_COLORS } from '@/lib/colors'
import { msg } from '@/lib/i18n/translate'

export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'archived'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: msg('Planning'),
  active: msg('Active'),
  on_hold: msg('On hold'),
  completed: msg('Completed'),
  archived: msg('Archived'),
}

export const projectSchema = z.object({
  name: z.string().trim().min(1, msg('Name your project')).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  status: z.enum(PROJECT_STATUSES).default('active'),
  priority: z.number().int().min(1).max(4).default(3),
  deadline: optionalDate,
  color: z.enum(ENTITY_COLORS).default('indigo'),
  goal_id: optionalUuid,
  life_area_id: optionalUuid,
})
export type ProjectInput = z.input<typeof projectSchema>

/** Progress = completed / non-cancelled tasks (subtasks included). */
export function projectProgress(tasks: { status: string; deleted_at?: string | null }[]) {
  const relevant = tasks.filter((t) => !t.deleted_at && t.status !== 'cancelled')
  const done = relevant.filter((t) => t.status === 'completed').length
  return {
    done,
    total: relevant.length,
    percent: relevant.length ? (done / relevant.length) * 100 : 0,
  }
}
