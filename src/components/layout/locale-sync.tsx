'use client'

import { useEffect } from 'react'
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n/config'

/** Keeps the locale cookie (used before sign-in) in line with the saved preference. */
export function LocaleCookieSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (!document.cookie.split('; ').includes(`${LOCALE_COOKIE}=${locale}`))
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
  }, [locale])
  return null
}
