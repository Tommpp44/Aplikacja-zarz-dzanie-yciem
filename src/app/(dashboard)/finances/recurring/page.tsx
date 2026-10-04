import { Repeat } from 'lucide-react'
import type { Metadata } from 'next'
import { NewRecurringButton, RecurringItem } from '@/components/finances/recurring-dialogs'
import { EmptyState } from '@/components/ui/empty-state'
import { Stat } from '@/components/ui/stat'
import { getFinanceOverview } from '@/lib/finance/service'
import { formatMoney } from '@/lib/money'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Recurring' }

export default async function RecurringPage() {
  const { supabase, user, today, currency } = await getOnboardedUserContext()
  const f = await getFinanceOverview(supabase, user.id, today, currency)
  const accounts = f.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    currency: a.currency,
    account_type: a.account_type,
  }))
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-3 gap-6">
          <Stat
            label="Recurring income / month"
            value={formatMoney(f.recurringMonthly.income, currency)}
            tone="positive"
          />
          <Stat
            label="Recurring costs / month"
            value={formatMoney(f.recurringMonthly.expenses, currency)}
          />
          <Stat
            label="Fixed costs / year"
            value={formatMoney(f.recurringMonthly.expenses * 12, currency)}
          />
        </div>
        <NewRecurringButton accounts={accounts} categories={f.categories} today={today} />
      </div>
      {f.recurring.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions"
          description="Add rent, salary, internet or subscriptions to forecast your month and never forget a bill."
        />
      ) : (
        <ul className="bg-card divide-y rounded-xl border">
          {f.recurring.map((r) => (
            <RecurringItem
              key={r.id}
              item={r}
              accounts={accounts}
              categories={f.categories}
              today={today}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
