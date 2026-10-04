import 'server-only'
import { cookies, headers } from 'next/headers'
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage, type Locale } from './config'
import { peekRequestLocale, setRequestLocale } from './locale-state'
import { makeT } from './translate'

/**
 * The request's locale: the signed-in user's preference when it has been
 * loaded (getUserContext sets it), otherwise the cookie, otherwise the
 * browser's Accept-Language.
 */
export async function getLocale(): Promise<Locale> {
  const known = peekRequestLocale()
  if (known) return known
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookie)
    ? cookie
    : localeFromAcceptLanguage((await headers()).get('accept-language'))
  setRequestLocale(locale)
  return locale
}

export async function getT() {
  return makeT(await getLocale())
}

/** `export const generateMetadata = pageTitle('Tasks')` — translated <title>. */
export function pageTitle(key: string) {
  return async () => ({ title: (await getT())(key) })
}
