import { formatMoney, isCurrencyCode, majorToMinor } from '@/lib/money'

/** Formats a goal value, using currency formatting when the unit is an ISO currency. */
export function formatGoalValue(value: number, unit: string | null | undefined) {
  if (unit && isCurrencyCode(unit.toUpperCase())) {
    return formatMoney(majorToMinor(value, unit.toUpperCase()), unit.toUpperCase(), {
      compact: Math.abs(value) >= 1_000_000,
    })
  }
  const text = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
  return unit ? `${text} ${unit}` : text
}
