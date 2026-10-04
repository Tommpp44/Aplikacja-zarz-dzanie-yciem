import { z } from 'zod'
import { DATE_FORMATS, isValidTimeZone } from '@/lib/dates'

export const DASHBOARD_WIDGETS = [
  { id: 'brief', label: 'Daily brief', priority: 'P0' },
  { id: 'today', label: "Today's plan", priority: 'P0' },
  { id: 'habits', label: 'Habits', priority: 'P0' },
  { id: 'reminders', label: 'Reminders', priority: 'P0' },
  { id: 'goals', label: 'Goals', priority: 'P1' },
  { id: 'finance', label: 'Finances', priority: 'P1' },
  { id: 'training', label: 'Training', priority: 'P1' },
  { id: 'life_balance', label: 'Life balance', priority: 'P2' },
  { id: 'notes', label: 'Recent notes', priority: 'P2' },
] as const

export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number]['id']
const WIDGET_IDS = DASHBOARD_WIDGETS.map((w) => w.id) as [DashboardWidgetId, ...DashboardWidgetId[]]

/** Widgets hidden by default (P2) — the dashboard should not show everything at once. */
const DEFAULT_HIDDEN: DashboardWidgetId[] = ['life_balance', 'notes']

export const dashboardWidgetSchema = z.object({
  id: z.enum(WIDGET_IDS),
  visible: z.boolean(),
})
export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>

export const financeRangeSchema = z.enum(['month', 'quarter', 'year'])
export type FinanceRange = z.infer<typeof financeRangeSchema>

/** Ensures every known widget appears exactly once, keeping the user's order. */
export function normalizeDashboardLayout(raw: unknown): DashboardWidget[] {
  const parsed = z.array(z.unknown()).safeParse(raw)
  const seen = new Set<DashboardWidgetId>()
  const out: DashboardWidget[] = []
  if (parsed.success) {
    for (const item of parsed.data) {
      const w = dashboardWidgetSchema.safeParse(item)
      if (w.success && !seen.has(w.data.id)) {
        seen.add(w.data.id)
        out.push(w.data)
      }
    }
  }
  for (const id of WIDGET_IDS) {
    if (!seen.has(id)) out.push({ id, visible: !DEFAULT_HIDDEN.includes(id) })
  }
  return out
}

export const notificationSettingsSchema = z.object({
  task_reminders: z.boolean().default(true),
  habit_reminders: z.boolean().default(false),
  workout_reminders: z.boolean().default(true),
  budget_warnings: z.boolean().default(true),
  deadlines: z.boolean().default(true),
  goal_milestones: z.boolean().default(true),
  recurring_transactions: z.boolean().default(true),
})
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

export const NOTIFICATION_LABELS: Record<
  keyof NotificationSettings,
  { label: string; description: string }
> = {
  task_reminders: { label: 'Task reminders', description: 'Tasks due today and overdue tasks.' },
  habit_reminders: {
    label: 'Habit reminders',
    description: 'Habits with a reminder time that are still open.',
  },
  workout_reminders: {
    label: 'Workout reminders',
    description: 'Planned workouts from your training plan.',
  },
  budget_warnings: {
    label: 'Budget warnings',
    description: 'When a budget passes 80% or is exceeded.',
  },
  deadlines: { label: 'Upcoming deadlines', description: 'Goals and projects due within 3 days.' },
  goal_milestones: { label: 'Goal milestones', description: 'When you reach a goal or milestone.' },
  recurring_transactions: {
    label: 'Recurring transactions',
    description: 'Bills and income due to be recorded.',
  },
}

export function normalizeNotificationSettings(raw: unknown): NotificationSettings {
  const parsed = notificationSettingsSchema.safeParse(raw ?? {})
  return parsed.success ? parsed.data : notificationSettingsSchema.parse({})
}

export const lastUsedSchema = z
  .object({
    account_id: z.uuid().optional(),
    expense_category_id: z.uuid().optional(),
    income_category_id: z.uuid().optional(),
    workout_type: z.string().max(20).optional(),
    finance_range: financeRangeSchema.optional(),
    checklist_dismissed: z.boolean().optional(),
  })
  .catch({})
export type LastUsed = z.infer<typeof lastUsedSchema>

export const THEMES = ['light', 'dark', 'system'] as const
export const ACCENTS = ['indigo', 'blue', 'violet', 'emerald', 'orange', 'rose', 'slate'] as const
export type Accent = (typeof ACCENTS)[number]

export const INTERESTS = [
  'finances',
  'productivity',
  'habits',
  'fitness',
  'goals',
  'planning',
  'everything',
] as const

export const timezoneSchema = z.string().refine(isValidTimeZone, 'Choose a valid timezone')
export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Use a 3-letter ISO currency code')

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'Enter your name').max(80),
})

export const preferencesSchema = z.object({
  currency: currencySchema,
  timezone: timezoneSchema,
  week_start: z.union([z.literal(0), z.literal(1)]),
  date_format: z.enum(DATE_FORMATS),
  units: z.enum(['metric', 'imperial']),
})

export const appearanceSchema = z.object({
  theme: z.enum(THEMES),
  accent: z.enum(ACCENTS),
})

export const onboardingSchema = z.object({
  interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length),
  currency: currencySchema,
  timezone: timezoneSchema,
  week_start: z.union([z.literal(0), z.literal(1)]),
  units: z.enum(['metric', 'imperial']),
  notifications: notificationSettingsSchema.partial(),
})

export const focusSchema = z.object({
  text: z.string().trim().max(200),
})

export const ACCENT_COOKIE = 'lifeos-accent'
