import { cache } from 'react'
import { DEFAULT_LOCALE, type Locale } from './config'

/**
 * Locale for code that cannot receive it as an argument (date helpers called
 * from server components). On the server it is request-scoped via React
 * cache(); in the browser it is set once by the I18nProvider.
 * Client components should pass the locale explicitly instead (SSR safety).
 */
const requestState = cache(() => ({ locale: null as Locale | null }))
let browserLocale: Locale = DEFAULT_LOCALE

export function setRequestLocale(locale: Locale) {
  if (typeof window === 'undefined') requestState().locale = locale
  else browserLocale = locale
}

export function peekRequestLocale(): Locale | null {
  return typeof window === 'undefined' ? requestState().locale : browserLocale
}

export function currentLocale(): Locale {
  return peekRequestLocale() ?? DEFAULT_LOCALE
}
