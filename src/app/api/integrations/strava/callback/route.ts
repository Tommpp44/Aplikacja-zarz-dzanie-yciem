import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import { stravaConfigured, syncStrava } from '@/lib/integrations/strava-sync'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

function sameState(a: string | undefined, b: string | null) {
  if (!a || !b || a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function GET(request: NextRequest) {
  const site = publicEnv.NEXT_PUBLIC_SITE_URL
  const back = (status: string) => {
    const res = NextResponse.redirect(`${site}/settings/integrations?strava=${status}`)
    res.cookies.delete({ name: 'lifeos-strava-state', path: '/api/integrations/strava' })
    return res
  }
  const session = await getSession()
  if (!session || !stravaConfigured()) return back('error')
  const params = request.nextUrl.searchParams
  if (!sameState(request.cookies.get('lifeos-strava-state')?.value, params.get('state')))
    return back('error')
  if (params.get('error') || !params.get('code')) return back('cancelled')

  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: serverEnv.STRAVA_CLIENT_ID,
        client_secret: serverEnv.STRAVA_CLIENT_SECRET,
        code: params.get('code'),
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`token exchange ${res.status}`)
    const body = (await res.json()) as {
      access_token: string
      refresh_token: string
      expires_at: number
      athlete?: { id: number; firstname?: string }
    }
    const admin = createAdminClient()
    const userId = session.user.id
    await admin.from('integration_tokens').upsert({
      user_id: userId,
      provider: 'strava',
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: new Date(body.expires_at * 1000).toISOString(),
      external_account_id: body.athlete ? String(body.athlete.id) : null,
      scope: params.get('scope'),
      updated_at: new Date().toISOString(),
    })
    await admin.from('integrations').upsert(
      {
        user_id: userId,
        provider: 'strava',
        status: 'connected',
        connected_at: new Date().toISOString(),
        settings: { athlete: body.athlete?.firstname ?? null },
      },
      { onConflict: 'user_id,provider' },
    )
    await syncStrava(admin, userId, { days: 90 })
    return back('connected')
  } catch (error) {
    logger.error('strava connect failed', { userId: session.user.id }, error)
    return back('error')
  }
}
