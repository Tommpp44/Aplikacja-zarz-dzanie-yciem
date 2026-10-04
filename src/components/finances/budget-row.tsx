'use client'

import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/money'
import { useT } from '@/lib/i18n/client'

export function BudgetRow({
  name,
  limit,
  spent,
  remaining,
  percent,
  status,
  currency,
}: {
  name: string
  limit: number
  spent: number
  remaining: number
  percent: number
  status: 'ok' | 'warning' | 'over'
  currency: string
}) {
  const t = useT()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{name}</span>
        <span className="tabular text-muted-foreground shrink-0 text-xs">
          {formatMoney(spent, currency)} / {formatMoney(limit, currency)}
        </span>
      </div>
      <Progress
        value={percent}
        tone={status === 'over' ? 'destructive' : status === 'warning' ? 'warning' : 'success'}
        label={t('{name} budget used', { name })}
      />
      <p className={`text-xs ${status === 'over' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {remaining >= 0
          ? t('{amount} left', { amount: formatMoney(remaining, currency) })
          : t('{amount} over budget', { amount: formatMoney(-remaining, currency) })}
      </p>
    </div>
  )
}
