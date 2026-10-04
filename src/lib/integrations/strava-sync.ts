import 'server-only'
import type { DB } from '@/lib/db/types'
import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'
import { hasAdminClient } from '@/lib/supabase/admin'
import { ensureFreshTokens, stravaToWorkout, type StravaActivity } from './strava'

export function stravaConfigured() {
  return Boolean(serverEnv.STRAVA_CLIENT_ID && serverEnv.STRAVA_CLIENT_SECRET && hasAdminClient())
}

function creds() {
  return { clientId: serverEnv.STRAVA_CLIENT_ID!, clientSecret: serverEnv.STRAVA_CLIENT_SECRET! }
}

/**
 * Imports recent Strava activities for a user. `admin` must be the service
 * client (tokens are not readable with the user's client).
 */
export async function syncStrava(admin: DB, userId: string, { days = 30 } = {}) {
  const { data: row } = await admin
    .from('integration_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'strava')
    .maybeSingle()
  if (!row) return 0
  try {
    const { tokens, refreshed } = await ensureFreshTokens(row, creds())
    if (refreshed)
      await admin
        .from('integration_tokens')
        .update({ ...tokens, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('provider', 'strava')
    const after = Math.floor(Date.now() / 1000) - days * 86400
    const activities: StravaActivity[] = []
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100&page=${page}`,
        {
          headers: { authorization: `Bearer ${tokens.access_token}` },
          signal: AbortSignal.timeout(15000),
        },
      )
      if (!res.ok) throw new Error(`Strava API ${res.status}`)
      const batch = (await res.json()) as StravaActivity[]
      activities.push(...batch)
      if (batch.length < 100) break
    }
    if (activities.length) {
      const { error } = await admin.from('workouts').upsert(
        activities.map((a) => ({ ...stravaToWorkout(a), user_id: userId })),
        { onConflict: 'user_id,source,external_id', ignoreDuplicates: true },
      )
      if (error) throw error
    }
    await admin
      .from('integrations')
      .update({ status: 'connected', settings: { last_synced_at: new Date().toISOString() } })
      .eq('user_id', userId)
      .eq('provider', 'strava')
    return activities.length
  } catch (error) {
    logger.warn('strava sync failed', { userId }, error)
    await admin
      .from('integrations')
      .update({ status: 'error' })
      .eq('user_id', userId)
      .eq('provider', 'strava')
    return 0
  }
}

export async function disconnectStrava(admin: DB, userId: string) {
  const { data: row } = await admin
    .from('integration_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'strava')
    .maybeSingle()
  if (row)
    await fetch('https://www.strava.com/oauth/deauthorize', {
      method: 'POST',
      headers: { authorization: `Bearer ${row.access_token}` },
      signal: AbortSignal.timeout(10000),
    }).catch(() => undefined)
  await admin.from('integration_tokens').delete().eq('user_id', userId).eq('provider', 'strava')
  await admin
    .from('integrations')
    .update({ status: 'disconnected', connected_at: null })
    .eq('user_id', userId)
    .eq('provider', 'strava')
}
