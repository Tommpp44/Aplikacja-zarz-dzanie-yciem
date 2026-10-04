import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import { stravaConfigured } from '@/lib/integrations/strava-sync'

/** Starts the Strava OAuth flow (state is bound to this browser via a cookie). */
export async function GET() {
  const session = await getSession()
  const site = publicEnv.NEXT_PUBLIC_SITE_URL
  if (!session) return NextResponse.redirect(`${site}/login?next=/settings/integrations`)
  if (!stravaConfigured())
    return NextResponse.redirect(`${site}/settings/integrations?strava=unavailable`)
  const state = randomBytes(24).toString('base64url')
  const url = new URL('https://www.strava.com/oauth/authorize')
  url.searchParams.set('client_id', serverEnv.STRAVA_CLIENT_ID!)
  url.searchParams.set('redirect_uri', `${site}/api/integrations/strava/callback`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('approval_prompt', 'auto')
  url.searchParams.set('scope', 'read,activity:read_all')
  url.searchParams.set('state', state)
  const res = NextResponse.redirect(url)
  res.cookies.set('lifeos-strava-state', state, {
    httpOnly: true,
    secure: site.startsWith('https://'),
    sameSite: 'lax',
    maxAge: 600,
    path: '/api/integrations/strava',
  })
  return res
}
