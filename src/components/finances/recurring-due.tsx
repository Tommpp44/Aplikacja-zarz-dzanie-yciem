'use client'

import { Check, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServerAction } from '@/hooks/use-server-action'
import { relativeDayLabel, type ISODate } from '@/lib/dates'
import { postRecurring } from '@/lib/finance/actions'
import { Money } from './money'
import { useT } from '@/lib/i18n/client'

type Due = {
  id: string
  merchant: string | null
  description: string | null
  amount_minor: number
  currency: string
  txn_type: string
  next_date: string
}

/** Recurring transactions that are due: record them (one click) or skip. */
export function RecurringDue({ items, today }: { items: Due[]; today: ISODate }) {
  const t = useT()
  const [pending, run] = useServerAction()
  if (items.length === 0) return null
  return (
    <ul className="flex flex-col divide-y">
      {items.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {r.merchant ||
                r.description ||
                (r.txn_type === 'income' ? t('Income') : t('Payment'))}
            </p>
            <p className="text-muted-foreground text-xs">
              {t('Due {date}', {
                date: relativeDayLabel(r.next_date, today, t.locale).toLowerCase(),
              })}
            </p>
          </div>
          <Money
            minor={r.txn_type === 'income' ? r.amount_minor : -r.amount_minor}
            currency={r.currency}
            signed
            className="text-sm font-medium"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() => postRecurring({ id: r.id, skip: false }), { success: t('Recorded') })
              }
            >
              <Check /> {t('Record')}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={pending}
              aria-label={t('Skip this occurrence')}
              onClick={() =>
                run(() => postRecurring({ id: r.id, skip: true }), { success: t('Skipped') })
              }
            >
              <SkipForward />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
