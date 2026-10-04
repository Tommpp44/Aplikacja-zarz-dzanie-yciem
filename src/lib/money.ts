/**
 * Money helpers. Amounts are always integers in minor units (e.g. grosze, cents)
 * with an ISO 4217 currency code. Floating point is only used at the very edge
 * (formatting) and never for storage or arithmetic.
 */

export type CurrencyCode = string

/** Currencies offered in the UI (any valid ISO 4217 code is accepted in the DB). */
export const COMMON_CURRENCIES = [
  'PLN',
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'CZK',
  'SEK',
  'NOK',
  'DKK',
  'JPY',
  'CAD',
  'AUD',
] as const

const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'HUF', 'CLP', 'ISK', 'VND'])

export function currencyDecimals(currency: CurrencyCode) {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2
}

export function isCurrencyCode(value: string) {
  return /^[A-Z]{3}$/.test(value)
}

/**
 * Parses a user-entered amount ("1 234,56", "1,234.56", "54", "12.5") into
 * minor units without floating point errors. Returns null for invalid input.
 */
export function parseAmountToMinor(input: string | number, currency: CurrencyCode = 'PLN') {
  const decimals = currencyDecimals(currency)
  let text = typeof input === 'number' ? input.toFixed(decimals) : input
  text = text.trim().replace(/[\s ']/g, '')
  if (!text) return null

  let negative = false
  if (text.startsWith('-')) {
    negative = true
    text = text.slice(1)
  } else if (text.startsWith('+')) {
    text = text.slice(1)
  }

  const separators = text.match(/[.,]/g) ?? []
  let intPart = text
  let fracPart = ''
  if (separators.length > 0) {
    const kinds = new Set(separators)
    const lastIndex = Math.max(text.lastIndexOf(','), text.lastIndexOf('.'))
    const tail = text.slice(lastIndex + 1)
    // A single kind of separator used several times, or once followed by exactly
    // three digits ("1.000", "12,500"), is a thousands separator.
    const firstGroup = text.split(/[.,]/)[0] ?? ''
    const isThousands =
      kinds.size === 1 &&
      /^[1-9]\d{0,2}$/.test(firstGroup) &&
      (separators.length > 1 || (tail.length === 3 && tail.length > decimals))
    if (isThousands) {
      intPart = text.replace(/[.,]/g, '')
    } else {
      intPart = text.slice(0, lastIndex).replace(/[.,]/g, '')
      fracPart = tail
    }
  }

  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(fracPart) || (intPart + fracPart).length === 0)
    return null

  let roundUp = false
  if (fracPart.length > decimals) {
    roundUp = Number(fracPart[decimals]) >= 5
    fracPart = fracPart.slice(0, decimals)
  }
  const scale = BigInt(10 ** decimals)
  let minor = BigInt(intPart || '0') * scale + BigInt(fracPart.padEnd(decimals, '0') || '0')
  if (roundUp) minor += 1n
  return toSafeNumber(negative ? -minor : minor)
}

function toSafeNumber(value: bigint) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER))
    return null
  return Number(value)
}

/** Converts minor units to a major-unit number for charts and display only. */
export function minorToMajor(minor: number, currency: CurrencyCode = 'PLN') {
  return minor / 10 ** currencyDecimals(currency)
}

export function majorToMinor(major: number, currency: CurrencyCode = 'PLN') {
  return Math.round(major * 10 ** currencyDecimals(currency))
}

/** Value suitable for an <input> (e.g. 1234.5 -> "1234.50"). */
export function minorToInput(minor: number, currency: CurrencyCode = 'PLN') {
  const decimals = currencyDecimals(currency)
  const negative = minor < 0
  const abs = Math.abs(minor)
  const int = Math.floor(abs / 10 ** decimals)
  const frac = abs % 10 ** decimals
  const text = decimals === 0 ? String(int) : `${int}.${String(frac).padStart(decimals, '0')}`
  return negative ? `-${text}` : text
}

const formatterCache = new Map<string, Intl.NumberFormat>()

export function formatMoney(
  minor: number,
  currency: CurrencyCode = 'PLN',
  options: { compact?: boolean; signed?: boolean; locale?: string } = {},
) {
  const { compact = false, signed = false, locale = 'pl-PL' } = options
  const key = `${locale}|${currency}|${compact}|${signed}`
  let fmt = formatterCache.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : currencyDecimals(currency),
      minimumFractionDigits: compact ? 0 : currencyDecimals(currency),
      signDisplay: signed ? 'exceptZero' : 'auto',
    })
    formatterCache.set(key, fmt)
  }
  return fmt.format(minorToMajor(minor, currency))
}

/** Sum of minor-unit amounts (integers, so no rounding drift). */
export function sumMinor(values: readonly number[]) {
  let total = 0
  for (const v of values) total += v
  return total
}
