import type { Locale } from './config'
import { pl } from './pl/index'

export type Vars = Record<string, string | number>
type Entry = string | readonly [one: string, few: string, many: string]

const DICTIONARIES: Record<Locale, Record<string, Entry>> = { en: {}, pl }

function interpolate(text: string, vars?: Vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

/** Polish plural category: 1 → one, 2–4 (not 12–14) → few, otherwise many. */
export function polishPlural(n: number): 0 | 1 | 2 {
  const abs = Math.abs(n)
  if (abs === 1) return 0
  const d = abs % 10
  const dd = abs % 100
  if (Number.isInteger(abs) && d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return 1
  return 2
}

/** Translates an English source string; falls back to English when missing. */
export function translate(locale: Locale, key: string, vars?: Vars): string {
  const entry = DICTIONARIES[locale][key]
  if (entry === undefined) return interpolate(key, vars)
  if (typeof entry === 'string') return interpolate(entry, vars)
  const n = Number(vars?.n ?? 0)
  return interpolate(entry[polishPlural(n)], vars)
}

/** Plural-aware translation keyed by the English plural form ("{n} tasks"). */
export function translatePlural(
  locale: Locale,
  n: number,
  one: string,
  other: string,
  vars?: Vars,
): string {
  const all = { n, ...vars }
  const entry = DICTIONARIES[locale][other]
  if (locale === 'en' || entry === undefined) return interpolate(n === 1 ? one : other, all)
  if (typeof entry === 'string') return interpolate(entry, all)
  return interpolate(entry[polishPlural(n)], all)
}

export type T = ((key: string, vars?: Vars) => string) & {
  plural: (n: number, one: string, other: string, vars?: Vars) => string
  locale: Locale
}

export function makeT(locale: Locale): T {
  const t = ((key: string, vars?: Vars) => translate(locale, key, vars)) as T
  t.plural = (n, one, other, vars) => translatePlural(locale, n, one, other, vars)
  t.locale = locale
  return t
}

export function hasTranslation(locale: Locale, key: string) {
  return locale === 'en' || key in DICTIONARIES[locale]
}

/** Marks a string for translation where it is defined (label maps); translate at render. */
export const msg = <S extends string>(s: S) => s
