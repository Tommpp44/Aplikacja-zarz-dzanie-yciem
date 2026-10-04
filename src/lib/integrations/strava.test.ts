import { describe, expect, it, vi } from 'vitest'
import { ensureFreshTokens, stravaToWorkout } from './strava'

describe('Strava', () => {
  it('maps activities to workouts', () => {
    const w = stravaToWorkout({
      id: 123,
      name: 'Evening Run',
      sport_type: 'Run',
      start_date: '2026-10-01T16:00:00Z',
      start_date_local: '2026-10-01T18:00:00Z',
      moving_time: 1830,
      elapsed_time: 1900,
      distance: 5012.4,
      total_elevation_gain: 31,
      average_heartrate: 151.6,
    })
    expect(w).toMatchObject({
      name: 'Evening Run',
      workout_type: 'running',
      performed_on: '2026-10-01',
      duration_minutes: 31,
      distance_m: 5012.4,
      avg_heart_rate: 152,
      source: 'strava',
      external_id: '123',
      ended_at: '2026-10-01T16:31:40.000Z',
    })
    expect(stravaToWorkout({ ...base, sport_type: 'Kitesurf', kilojoules: 600 })).toMatchObject({
      workout_type: 'custom',
      calories: 600,
    })
  })

  it('refreshes tokens only when they are about to expire', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ access_token: 'new', refresh_token: 'r2', expires_at: 2_000_000_000 }),
    )
    const now = Date.parse('2026-10-01T12:00:00Z')
    const fresh = { access_token: 'a', refresh_token: 'r', expires_at: '2026-10-01T13:00:00Z' }
    expect(
      await ensureFreshTokens(fresh, { clientId: 'c', clientSecret: 's' }, fetchMock, now),
    ).toEqual({
      tokens: fresh,
      refreshed: false,
    })
    const stale = { ...fresh, expires_at: '2026-10-01T12:00:30Z' }
    const r = await ensureFreshTokens(stale, { clientId: 'c', clientSecret: 's' }, fetchMock, now)
    expect(r.refreshed).toBe(true)
    expect(r.tokens.access_token).toBe('new')
    expect(fetchMock).toHaveBeenCalledOnce()
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    )
    expect(body).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'r' })
  })
})

const base = {
  id: 1,
  name: 'x',
  start_date: '2026-10-01T16:00:00Z',
  start_date_local: '2026-10-01T18:00:00Z',
  moving_time: 600,
  distance: 0,
}
