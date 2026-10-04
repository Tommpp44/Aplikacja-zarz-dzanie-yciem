import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

/** Consistent money display (tabular digits, optional colour by sign). */
export function Money({
  minor,
  currency,
  signed = false,
  tone = false,
  compact = false,
  className,
}: {
  minor: number
  currency: string
  signed?: boolean
  tone?: boolean
  compact?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'tabular whitespace-nowrap',
        tone && minor > 0 && 'text-success',
        tone && minor < 0 && 'text-destructive',
        className,
      )}
    >
      {formatMoney(minor, currency, { signed, compact })}
    </span>
  )
}
