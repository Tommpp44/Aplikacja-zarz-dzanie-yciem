import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { unwrap } from '@/lib/db/errors'
import { safeTimeZone, todayISO, type DateFormat } from '@/lib/dates'
import type { Row } from '@/lib/db/types'
import {
  normalizeDashboardLayout,
  normalizeNotificationSettings,
  lastUsedSchema,
  type Accent,
  type DashboardWidget,
  type LastUsed,
  type NotificationSettings,
} from './schemas'

export type Preferences = Omit<
  Row<'user_preferences'>,
  | 'dashboard_layout'
  | 'notification_settings'
  | 'last_used'
  | 'week_start'
  | 'accent'
  | 'date_format'
> & {
  week_start: 0 | 1
  accent: Accent
  date_format: DateFormat
  dashboard_layout: DashboardWidget[]
  notification_settings: NotificationSettings
  last_used: LastUsed
}

export type UserContext = Awaited<ReturnType<typeof loadUserContext>>

async function loadUserContext() {
  const { supabase, user } = await requireUser()
  const [profileRes, prefsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
  ])
  const profile = unwrap(profileRes, 'load your profile')
  const raw = unwrap(prefsRes, 'load your preferences')
  const timezone = safeTimeZone(raw.timezone)
  const prefs: Preferences = {
    ...raw,
    timezone,
    week_start: raw.week_start === 0 ? 0 : 1,
    accent: raw.accent as Accent,
    date_format: raw.date_format as DateFormat,
    dashboard_layout: normalizeDashboardLayout(raw.dashboard_layout),
    notification_settings: normalizeNotificationSettings(raw.notification_settings),
    last_used: lastUsedSchema.parse(raw.last_used),
  }
  return {
    supabase,
    user,
    profile,
    prefs,
    timezone,
    currency: prefs.currency,
    today: todayISO(timezone),
  }
}

/** Signed-in user with profile, preferences and "today" in their timezone (per request). */
export const getUserContext = cache(loadUserContext)

/** Same as getUserContext but sends users who haven't finished onboarding there first. */
export async function getOnboardedUserContext() {
  const ctx = await getUserContext()
  if (!ctx.profile.onboarded_at) redirect('/onboarding')
  return ctx
}
