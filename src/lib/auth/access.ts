/**
 * Access levels. The MVP only uses `authenticated`, but every guard goes through
 * these helpers so `admin` (and later shared/household roles) can be added
 * without touching call sites.
 */
export type AccessLevel = 'anonymous' | 'authenticated' | 'admin'

export const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth',
  '/offline',
  '/api/cron',
] as const

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function hasAccess(level: AccessLevel, required: AccessLevel) {
  const rank: Record<AccessLevel, number> = { anonymous: 0, authenticated: 1, admin: 2 }
  return rank[level] >= rank[required]
}

/** Only allow same-origin relative redirects (prevents open redirects). */
export function safeRedirectPath(next: string | null | undefined, fallback = '/dashboard') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\'))
    return fallback
  return next
}
