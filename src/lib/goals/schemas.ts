import { z } from 'zod'
import { optionalDate, optionalUuid } from '@/lib/validation'
import { msg } from '@/lib/i18n/translate'

export const GOAL_CATEGORIES = [
  'finance',
  'career',
  'learning',
  'health',
  'fitness',
  'relationships',
  'travel',
  'lifestyle',
  'personal',
] as const
export type GoalCategory = (typeof GOAL_CATEGORIES)[number]
export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  finance: msg('Finance'),
  career: msg('Career'),
  learning: msg('Learning'),
  health: msg('Health'),
  fitness: msg('Fitness'),
  relationships: msg('Relationships'),
  travel: msg('Travel'),
  lifestyle: msg('Lifestyle'),
  personal: msg('Personal'),
}
/** Translation key for a goal category (falls back to the raw value). */
export const goalCategoryLabel = (c: string) => GOAL_CATEGORY_LABELS[c as GoalCategory] ?? c

export const GOAL_STATUSES = ['active', 'paused', 'completed', 'archived'] as const
export const PROGRESS_SOURCES = ['manual', 'account', 'milestones', 'tasks'] as const
export const TARGET_TYPES = ['numeric', 'percentage', 'boolean'] as const

export const PROGRESS_SOURCE_LABELS: Record<(typeof PROGRESS_SOURCES)[number], string> = {
  manual: msg('I update it myself'),
  account: msg('Balance of a financial account'),
  milestones: msg('Completed milestones'),
  tasks: msg('Completed linked tasks'),
}

const nullableNumber = z.number().finite().nullable().optional()

export const goalSchema = z
  .object({
    title: z.string().trim().min(1, msg('Name your goal')).max(200),
    description: z.string().trim().max(5000).nullable().optional(),
    notes: z.string().trim().max(20000).nullable().optional(),
    category: z.enum(GOAL_CATEGORIES),
    target_type: z.enum(TARGET_TYPES),
    progress_source: z.enum(PROGRESS_SOURCES),
    start_value: z.number().finite().default(0),
    target_value: nullableNumber,
    current_value: z.number().finite().default(0),
    unit: z.string().trim().max(20).nullable().optional(),
    start_date: z.iso.date().optional(),
    deadline: optionalDate,
    status: z.enum(GOAL_STATUSES).optional(),
    linked_account_id: optionalUuid,
    life_area_id: optionalUuid,
  })
  .superRefine((v, ctx) => {
    if (
      v.target_type === 'numeric' &&
      ['manual', 'account'].includes(v.progress_source) &&
      v.target_value == null
    ) {
      ctx.addIssue({ code: 'custom', path: ['target_value'], message: msg('Set a target') })
    }
    if (v.progress_source === 'account' && !v.linked_account_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['linked_account_id'],
        message: msg('Choose an account'),
      })
    }
    if (v.deadline && v.start_date && v.deadline < v.start_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['deadline'],
        message: msg('Deadline must be after the start date'),
      })
    }
  })
export type GoalInput = z.input<typeof goalSchema>

export const milestoneSchema = z.object({
  goal_id: z.uuid(),
  title: z.string().trim().min(1, msg('Name the milestone')).max(200),
  due_date: optionalDate,
  target_value: nullableNumber,
})

export const progressUpdateSchema = z.object({
  id: z.uuid(),
  value: z.number().finite(),
  note: z.string().trim().max(500).optional(),
})
