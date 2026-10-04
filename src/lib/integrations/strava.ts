import type { WorkoutType } from '@/lib/workouts/schemas'

export type StravaActivity = {
  id: number
  name: string
  sport_type?: string
  type?: string
  start_date: string
  start_date_local: string
  moving_time: number
  elapsed_time?: number
  distance: number
  total_elevation_gain?: number
  average_heartrate?: number
  kilojoules?: number
  calories?: number
}

const TYPES: Record<string, WorkoutType> = {
  Run: 'running',
  TrailRun: 'running',
  VirtualRun: 'running',
  Ride: 'cycling',
  VirtualRide: 'cycling',
  MountainBikeRide: 'cycling',
  GravelRide: 'cycling',
  EBikeRide: 'cycling',
  Walk: 'walking',
  Hike: 'walking',
  Swim: 'swimming',
  WeightTraining: 'strength',
  Crossfit: 'strength',
  Workout: 'strength',
  Soccer: 'football',
  Yoga: 'mobility',
  Pilates: 'mobility',
  Padel: 'padel',
  Tennis: 'padel',
}

/** Maps a Strava activity to a LifeOS workout row (without user_id). */
export function stravaToWorkout(a: StravaActivity) {
  const kind = a.sport_type ?? a.type ?? ''
  // For rides Strava reports work in kJ; with ~25% efficiency that is ≈ the kcal burned.
  const calories = a.calories ?? a.kilojoules ?? null
  return {
    name: (a.name || kind || 'Strava').slice(0, 120),
    workout_type: TYPES[kind] ?? ('custom' as WorkoutType),
    status: 'completed' as const,
    performed_on: a.start_date_local.slice(0, 10),
    started_at: new Date(a.start_date).toISOString(),
    ended_at: new Date(
      new Date(a.start_date).getTime() + (a.elapsed_time ?? a.moving_time) * 1000,
    ).toISOString(),
    duration_minutes: Math.min(1440, Math.round(a.moving_time / 60)),
    distance_m: a.distance ? Math.round(a.distance * 10) / 10 : null,
    elevation_m: a.total_elevation_gain ?? null,
    avg_heart_rate: a.average_heartrate
      ? Math.max(20, Math.min(250, Math.round(a.average_heartrate)))
      : null,
    calories: calories ? Math.min(20000, Math.round(calories)) : null,
    source: 'strava' as const,
    external_id: String(a.id),
  }
}

export type StravaTokens = { access_token: string; refresh_token: string; expires_at: string }

/** Returns fresh tokens, refreshing when they expire within a minute. */
export async function ensureFreshTokens(
  tokens: StravaTokens,
  creds: { clientId: string; clientSecret: string },
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<{ tokens: StravaTokens; refreshed: boolean }> {
  if (new Date(tokens.expires_at).getTime() - now > 60_000) return { tokens, refreshed: false }
  const res = await fetchImpl('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  })
  if (!res.ok) throw new Error(`Strava token refresh failed (${res.status})`)
  const body = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_at: number
  }
  return {
    tokens: {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: new Date(body.expires_at * 1000).toISOString(),
    },
    refreshed: true,
  }
}
