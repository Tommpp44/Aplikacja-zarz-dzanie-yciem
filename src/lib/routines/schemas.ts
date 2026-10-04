import { z } from 'zod'
import { optionalTime, optionalUuid } from '@/lib/validation'

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
  morning: 'Morning',
  evening: 'Evening',
  work_start: 'Work start',
  work_end: 'Work end',
  pre_workout: 'Pre-workout',
  travel: 'Travel',
  custom: 'Custom',
}

export const routineItemSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, 'Name the step').max(200),
  duration_minutes: z.number().int().min(1).max(600).nullable().optional(),
  habit_id: optionalUuid,
})

export const routineSchema = z.object({
  name: z.string().trim().min(1, 'Name your routine').max(120),
  routine_type: z.enum(ROUTINE_TYPES),
  description: z.string().trim().max(2000).nullable().optional(),
  start_time: optionalTime,
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Pick at least one day').max(7),
  items: z.array(routineItemSchema).max(50),
})
export type RoutineInput = z.input<typeof routineSchema>

export function routineDuration(items: { duration_minutes: number | null }[]) {
  return items.reduce((a, i) => a + (i.duration_minutes ?? 0), 0)
}
