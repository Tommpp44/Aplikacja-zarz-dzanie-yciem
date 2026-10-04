'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { toJson } from '@/lib/db/types'
import {
  appearanceSchema,
  dashboardWidgetSchema,
  focusSchema,
  notificationSettingsSchema,
  onboardingSchema,
  preferencesSchema,
  profileSchema,
} from './schemas'
import { ACCENT_COOKIE } from './schemas'
import { LOCALES } from '@/lib/i18n/config'
import { setLocaleCookieValue } from '@/lib/i18n/actions'

export const updateProfile = authedAction(
  profileSchema,
  { name: 'updateProfile' },
  async (input, { supabase, user }) => {
    unwrap(await supabase.from('profiles').update(input).eq('id', user.id), 'save your profile')
  },
)

export const updatePreferences = authedAction(
  preferencesSchema,
  { name: 'updatePreferences' },
  async (input, { supabase, user }) => {
    unwrap(
      await supabase.from('user_preferences').update(input).eq('user_id', user.id),
      'save your preferences',
    )
  },
)

export const updateAppearance = authedAction(
  appearanceSchema,
  { name: 'updateAppearance' },
  async (input, { supabase, user }) => {
    unwrap(
      await supabase.from('user_preferences').update(input).eq('user_id', user.id),
      'save appearance',
    )
    const store = await cookies()
    store.set(ACCENT_COOKIE, input.accent, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  },
)

export const updateNotificationSettings = authedAction(
  notificationSettingsSchema,
  { name: 'updateNotificationSettings', revalidate: [] },
  async (input, { supabase, user }) => {
    unwrap(
      await supabase
        .from('user_preferences')
        .update({ notification_settings: toJson(input) })
        .eq('user_id', user.id),
      'save notification settings',
    )
  },
)

export const updateDashboardLayout = authedAction(
  z.object({ layout: z.array(dashboardWidgetSchema).max(30) }),
  { name: 'updateDashboardLayout' },
  async ({ layout }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('user_preferences')
        .update({ dashboard_layout: toJson(layout) })
        .eq('user_id', user.id),
      'save dashboard layout',
    )
  },
)

export const setFocus = authedAction(
  focusSchema.extend({ date: z.iso.date() }),
  { name: 'setFocus' },
  async ({ text, date }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('user_preferences')
        .update({ focus_text: text || null, focus_date: text ? date : null })
        .eq('user_id', user.id),
      'save your focus',
    )
  },
)

export const completeOnboarding = authedAction(
  onboardingSchema,
  { name: 'completeOnboarding' },
  async (input, { supabase, user }) => {
    const { data: current } = await supabase
      .from('user_preferences')
      .select('notification_settings')
      .eq('user_id', user.id)
      .single()
    const notifications = notificationSettingsSchema.parse({
      ...((current?.notification_settings as object | null) ?? {}),
      ...input.notifications,
    })
    unwrap(
      await supabase
        .from('user_preferences')
        .update({
          interests: input.interests,
          currency: input.currency,
          timezone: input.timezone,
          week_start: input.week_start,
          units: input.units,
          notification_settings: toJson(notifications),
        })
        .eq('user_id', user.id),
      'save your setup',
    )
    unwrap(
      await supabase
        .from('profiles')
        .update({ onboarded_at: new Date().toISOString() })
        .eq('id', user.id),
      'finish onboarding',
    )
  },
)

/** Remembers recent choices for smart defaults (last account, category …). */
export const rememberLastUsed = authedAction(
  z.object({
    account_id: z.uuid().optional(),
    expense_category_id: z.uuid().optional(),
    income_category_id: z.uuid().optional(),
    workout_type: z.string().max(20).optional(),
    finance_range: z.enum(['month', 'quarter', 'year']).optional(),
    checklist_dismissed: z.boolean().optional(),
  }),
  { name: 'rememberLastUsed', revalidate: [] },
  async (input, { supabase, user }) => {
    const { data } = await supabase
      .from('user_preferences')
      .select('last_used')
      .eq('user_id', user.id)
      .single()
    const merged = { ...((data?.last_used as Record<string, unknown> | null) ?? {}), ...input }
    unwrap(
      await supabase
        .from('user_preferences')
        .update({ last_used: toJson(merged) })
        .eq('user_id', user.id),
      'save preferences',
    )
  },
)

export const updateLanguage = authedAction(
  z.object({ language: z.enum(LOCALES) }),
  { name: 'updateLanguage' },
  async ({ language }, { supabase, user }) => {
    unwrap(
      await supabase.from('user_preferences').update({ language }).eq('user_id', user.id),
      'save language',
    )
    await setLocaleCookieValue(language)
  },
)
