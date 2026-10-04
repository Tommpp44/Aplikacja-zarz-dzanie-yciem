import { z } from 'zod'
import { blankable, optionalDate, optionalUuid } from '@/lib/validation'
import { ENTITY_COLORS } from '@/lib/colors'
import { repeatRuleSchema } from '@/lib/recurrence'
import { msg } from '@/lib/i18n/translate'

const time = z.string().regex(/^\d{2}:\d{2}$/, msg('Use HH:MM'))

/** Event input in local wall-clock time; the server converts with the user's timezone. */
export const eventSchema = z
  .object({
    title: z.string().trim().min(1, msg('Give the event a title')).max(200),
    all_day: z.boolean().default(false),
    start_date: z.iso.date(),
    start_time: blankable(time),
    end_date: z.iso.date(),
    end_time: blankable(time),
    location: z.string().trim().max(300).nullable().optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    repeat_rule: repeatRuleSchema.nullable().optional(),
    repeat_until: optionalDate,
    color: z.enum(ENTITY_COLORS).default('indigo'),
    project_id: optionalUuid,
    task_id: optionalUuid,
    goal_id: optionalUuid,
  })
  .superRefine((v, ctx) => {
    if (!v.all_day && (!v.start_time || !v.end_time))
      ctx.addIssue({ code: 'custom', path: ['start_time'], message: msg('Set start and end time') })
    const start = `${v.start_date}T${v.all_day ? '00:00' : (v.start_time ?? '00:00')}`
    const end = `${v.end_date}T${v.all_day ? '23:59' : (v.end_time ?? '00:00')}`
    if (end < start)
      ctx.addIssue({ code: 'custom', path: ['end_date'], message: msg('End must be after start') })
  })
export type EventInput = z.input<typeof eventSchema>

export const CALENDAR_VIEWS = ['day', 'week', 'month', 'agenda'] as const
export type CalendarView = (typeof CALENDAR_VIEWS)[number]
