import { z } from 'zod'
import { optionalTime, optionalUuid } from '@/lib/validation'
import { msg } from '@/lib/i18n/translate'

export const ROUTINE_TYPES = [
  'morning',
  'evening',
  'work_start',
  'work_end',
  'pre_workout',
  'travel',
  'custom',
] as const
export type RoutineType = (typeof ROUTINE_TYPES)[number]

export const ROUTINE_TYPE_LABELS: Record<RoutineType, string> = {
  morning: msg('Morning'),
  evening: msg('Evening'),
  work_start: msg('Work start'),
  work_end: msg('Work end'),
  pre_workout: msg('Pre-workout'),
  travel: msg('Travel'),
  custom: msg('Custom'),
}

export const routineItemSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, msg('Name the step')).max(200),
  duration_minutes: z.number().int().min(1).max(600).nullable().optional(),
  habit_id: optionalUuid,
})

export const routineSchema = z.object({
  name: z.string().trim().min(1, msg('Name your routine')).max(120),
  routine_type: z.enum(ROUTINE_TYPES),
  description: z.string().trim().max(2000).nullable().optional(),
  start_time: optionalTime,
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, msg('Pick at least one day')).max(7),
  items: z.array(routineItemSchema).max(50),
})
export type RoutineInput = z.input<typeof routineSchema>

export function routineDuration(items: { duration_minutes: number | null }[]) {
  return items.reduce((a, i) => a + (i.duration_minutes ?? 0), 0)
}
