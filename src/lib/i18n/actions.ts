'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { isLocale, LOCALE_COOKIE, type Locale } from './config'

export async function setLocaleCookieValue(locale: Locale) {
  if (!isLocale(locale)) return
  ;(await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}

/** Language switch before sign-in (only sets a cookie). */
export async function chooseLocale(locale: string) {
  if (!isLocale(locale)) return
  await setLocaleCookieValue(locale)
  revalidatePath('/', 'layout')
}
