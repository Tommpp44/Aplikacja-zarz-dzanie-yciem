import { z } from 'zod'
import { optionalUuid } from '@/lib/validation'
import { msg } from '@/lib/i18n/translate'

export const WORKOUT_TYPES = [
  'strength',
  'running',
  'cycling',
  'walking',
  'swimming',
  'padel',
  'football',
  'mobility',
  'custom',
] as const
export type WorkoutType = (typeof WORKOUT_TYPES)[number]
export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: msg('Strength'),
  running: msg('Running'),
  cycling: msg('Cycling'),
  walking: msg('Walking'),
  swimming: msg('Swimming'),
  padel: msg('Padel'),
  football: msg('Football'),
  mobility: msg('Mobility'),
  custom: msg('Custom'),
}
export const DISTANCE_TYPES: WorkoutType[] = ['running', 'cycling', 'walking', 'swimming']

const num = (max: number) => z.number().min(0).max(max).nullable().optional()

export const workoutSchema = z.object({
  name: z.string().trim().min(1, msg('Name the workout')).max(120),
  workout_type: z.enum(WORKOUT_TYPES),
  performed_on: z.iso.date(),
  status: z.enum(['planned', 'in_progress', 'completed']).default('completed'),
  duration_minutes: num(1440),
  /** In the user's display unit (km or mi); converted on the server. */
  distance: num(100000),
  calories: num(20000),
  elevation_m: num(10000),
  avg_heart_rate: z.number().int().min(20).max(250).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  goal_id: optionalUuid,
})
export type WorkoutInput = z.input<typeof workoutSchema>

export const startWorkoutSchema = z.object({
  workout_type: z.enum(WORKOUT_TYPES),
  template_id: optionalUuid,
  plan_session_id: optionalUuid,
  name: z.string().trim().max(120).optional(),
})

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, msg('Name the exercise')).max(120),
  category: z.enum(['strength', 'cardio', 'mobility', 'other']),
  muscle_group: z.string().trim().max(60).nullable().optional(),
  equipment: z.string().trim().max(60).nullable().optional(),
})

export const setSchema = z.object({
  workout_exercise_id: z.uuid(),
  /** Display unit (kg or lb). */
  weight: z.number().min(0).max(2000).nullable().optional(),
  reps: z.number().int().min(0).max(1000).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  rest_seconds: z.number().int().min(0).max(3600).nullable().optional(),
  completed: z.boolean().default(true),
})

export const updateSetSchema = setSchema
  .omit({ workout_exercise_id: true })
  .extend({ id: z.uuid() })

export const templateSchema = z.object({
  name: z.string().trim().min(1, msg('Name the template')).max(120),
  workout_type: z.enum(WORKOUT_TYPES),
  description: z.string().trim().max(2000).nullable().optional(),
  exercises: z
    .array(
      z.object({
        exercise_id: z.uuid(),
        target_sets: z.number().int().min(1).max(20).nullable().optional(),
        target_reps: z.number().int().min(1).max(200).nullable().optional(),
        target_weight: z.number().min(0).max(2000).nullable().optional(),
      }),
    )
    .max(40),
})

export const planSchema = z.object({
  name: z.string().trim().min(1, msg('Name the plan')).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  start_date: z.iso.date(),
  weeks: z.number().int().min(1).max(52),
  goal_id: optionalUuid,
  sessions: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        week: z.number().int().min(1).max(52).nullable().optional(),
        title: z.string().trim().min(1).max(120),
        workout_type: z.enum(['rest', ...WORKOUT_TYPES]),
        template_id: optionalUuid,
        target_duration_minutes: z.number().int().min(1).max(1440).nullable().optional(),
        notes: z.string().trim().max(1000).nullable().optional(),
      }),
    )
    .max(400),
})
export type PlanInput = z.input<typeof planSchema>

export const activitySchema = z.object({
  record_date: z.iso.date(),
  steps: z.number().int().min(0).max(200000).nullable().optional(),
  distance: num(1000),
  active_minutes: z.number().int().min(0).max(1440).nullable().optional(),
  calories: z.number().int().min(0).max(20000).nullable().optional(),
})
