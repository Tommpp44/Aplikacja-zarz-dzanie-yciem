'use client'

import { createContext, useContext, useMemo } from 'react'
import { DEFAULT_LOCALE, type Locale } from './config'
import { setRequestLocale } from './locale-state'
import { makeT } from './translate'

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  // Browser-side default for helpers that read the locale implicitly.
  if (typeof window !== 'undefined') setRequestLocale(locale)
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useT() {
  const locale = useLocale()
  return useMemo(() => makeT(locale), [locale])
}
