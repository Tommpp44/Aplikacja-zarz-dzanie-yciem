import { z } from 'zod'
import { ENTITY_COLORS } from '@/lib/colors'

export const HABIT_TYPES = ['boolean', 'numeric', 'duration', 'count'] as const
export const HABIT_FREQUENCIES = [
  'daily',
  'weekdays',
  'weekly',
  'times_per_week',
  'interval',
] as const

export const HABIT_TYPE_LABELS: Record<(typeof HABIT_TYPES)[number], string> = {
  boolean: 'Yes / no',
  numeric: 'Amount (e.g. 2 L water)',
  duration: 'Duration (minutes)',
  count: 'Count (e.g. 50 push-ups)',
}

export const FREQUENCY_LABELS: Record<(typeof HABIT_FREQUENCIES)[number], string> = {
  daily: 'Every day',
  weekdays: 'Selected weekdays',
  weekly: 'Once a week',
  times_per_week: 'X times per week',
  interval: 'Every N days',
}

export const habitSchema = z
  .object({
    name: z.string().trim().min(1, 'Name your habit').max(120),
    description: z.string().trim().max(2000).nullable().optional(),
    habit_type: z.enum(HABIT_TYPES),
    target: z.number().positive('Target must be greater than 0').max(100000),
    unit: z.string().trim().max(20).nullable().optional(),
    frequency: z.enum(HABIT_FREQUENCIES),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    times_per_week: z.number().int().min(1).max(7).nullable().optional(),
    interval_days: z.number().int().min(1).max(365).nullable().optional(),
    color: z.enum(ENTITY_COLORS).default('indigo'),
    start_date: z.iso.date().optional(),
    end_date: z.iso.date().nullable().optional(),
    reminder_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable()
      .optional(),
    goal_id: z.uuid().nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.frequency === 'weekdays' && v.weekdays.length === 0)
      ctx.addIssue({ code: 'custom', path: ['weekdays'], message: 'Pick at least one day' })
    if (v.frequency === 'times_per_week' && !v.times_per_week)
      ctx.addIssue({ code: 'custom', path: ['times_per_week'], message: 'How many times?' })
    if (v.frequency === 'interval' && !v.interval_days)
      ctx.addIssue({ code: 'custom', path: ['interval_days'], message: 'Every how many days?' })
    if (v.end_date && v.start_date && v.end_date < v.start_date)
      ctx.addIssue({ code: 'custom', path: ['end_date'], message: 'End must be after start' })
  })
export type HabitInput = z.input<typeof habitSchema>

export const logHabitSchema = z.object({
  habit_id: z.uuid(),
  date: z.iso.date(),
  /** Absolute value for the day; 0 removes the log. */
  value: z.number().min(0).max(100000),
  note: z.string().trim().max(500).optional(),
})
