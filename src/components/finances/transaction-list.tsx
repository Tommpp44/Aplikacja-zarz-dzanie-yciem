'use client'

import { ArrowLeftRight, Receipt, Repeat, Scale } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { colorClass } from '@/lib/colors'
import { relativeDayLabel, type ISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { Money } from './money'
import { TransactionDialog } from './transaction-dialog'
import type { AccountOption, CategoryOption, TransactionLike } from './types'
import { useT } from '@/lib/i18n/client'

function signedAmount(t: TransactionLike, perspectiveAccount?: string) {
  if (t.txn_type === 'income') return t.amount_minor
  if (t.txn_type === 'expense') return -t.amount_minor
  if (t.txn_type === 'adjustment') return t.amount_minor
  if (perspectiveAccount && t.transfer_account_id === perspectiveAccount)
    return t.transfer_amount_minor ?? t.amount_minor
  return -t.amount_minor
}

/** Transactions grouped by day; a list on every screen size (no wide tables). */
export function TransactionList({
  transactions,
  accounts,
  categories,
  today,
  perspectiveAccount,
  emptyAction,
}: {
  transactions: TransactionLike[]
  accounts: AccountOption[]
  categories: CategoryOption[]
  today: ISODate
  perspectiveAccount?: string
  emptyAction?: React.ReactNode
}) {
  const t = useT()
  const [editing, setEditing] = useState<TransactionLike | null>(null)
  const accountMap = new Map(accounts.map((a) => [a.id, a]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={t('No transactions')}
        description={t('Record income and expenses to see where your money goes.')}
        action={emptyAction}
      />
    )
  }

  const groups: { date: string; items: TransactionLike[] }[] = []
  for (const t of transactions) {
    const last = groups[groups.length - 1]
    if (last && last.date === t.occurred_on) last.items.push(t)
    else groups.push({ date: t.occurred_on, items: [t] })
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <section key={g.date} aria-label={g.date}>
            <h3 className="text-muted-foreground mb-1 px-2 text-xs font-semibold">
              {relativeDayLabel(g.date, today, t.locale)}
            </h3>
            <ul className="bg-card divide-y rounded-xl border">
              {g.items.map((txn) => {
                const category = txn.category_id ? categoryMap.get(txn.category_id) : null
                const account = accountMap.get(txn.account_id)
                const to = txn.transfer_account_id ? accountMap.get(txn.transfer_account_id) : null
                const title =
                  txn.txn_type === 'transfer'
                    ? `${account?.name ?? t('Account')} → ${to?.name ?? t('Account')}`
                    : txn.txn_type === 'adjustment'
                      ? t('Balance correction')
                      : txn.merchant ||
                        category?.name ||
                        (txn.txn_type === 'income' ? t('Income') : t('Expense'))
                const subtitle = [
                  txn.txn_type === 'transfer' || txn.txn_type === 'adjustment'
                    ? null
                    : category?.name,
                  txn.description,
                  txn.txn_type !== 'transfer' ? account?.name : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
                const amount = signedAmount(txn, perspectiveAccount)
                return (
                  <li key={txn.id}>
                    <button
                      type="button"
                      onClick={() => setEditing(txn)}
                      className="hover:bg-accent/60 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full',
                          txn.txn_type === 'transfer' || txn.txn_type === 'adjustment'
                            ? 'bg-muted text-muted-foreground'
                            : cn(
                                colorClass(category?.color, 'soft'),
                                colorClass(category?.color, 'text'),
                              ),
                        )}
                        aria-hidden
                      >
                        {txn.txn_type === 'transfer' ? (
                          <ArrowLeftRight className="size-4" />
                        ) : txn.txn_type === 'adjustment' ? (
                          <Scale className="size-4" />
                        ) : (
                          <span className="text-xs font-semibold">
                            {(title[0] ?? '?').toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                          {title}
                          {txn.source === 'recurring' && (
                            <Repeat
                              className="text-muted-foreground size-3"
                              aria-label={t('Recurring')}
                            />
                          )}
                        </span>
                        {subtitle && (
                          <span className="text-muted-foreground block truncate text-xs">
                            {subtitle}
                          </span>
                        )}
                      </span>
                      <Money
                        minor={amount}
                        currency={
                          perspectiveAccount && txn.transfer_account_id === perspectiveAccount
                            ? (to?.currency ?? txn.currency)
                            : txn.currency
                        }
                        signed
                        className={cn(
                          'text-sm font-medium',
                          txn.txn_type === 'income' && 'text-success',
                          txn.txn_type === 'transfer' && 'text-muted-foreground',
                        )}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
      <TransactionDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        accounts={accounts}
        categories={categories}
        today={today}
        transaction={editing ?? undefined}
        key={editing?.id ?? 'none'}
      />
    </>
  )
}
