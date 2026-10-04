import { Gauge } from 'lucide-react'
import type { Metadata } from 'next'
import { BudgetCard, NewBudgetButton } from '@/components/finances/budget-dialogs'
import { EmptyState } from '@/components/ui/empty-state'
import { Stat } from '@/components/ui/stat'
import { formatISODate } from '@/lib/dates'
import { getFinanceOverview } from '@/lib/finance/service'
import { formatMoney } from '@/lib/money'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Budgets' }

export default async function BudgetsPage() {
  const { supabase, user, today, currency } = await getOnboardedUserContext()
  const f = await getFinanceOverview(supabase, user.id, today, currency)
  const total = f.budgets.filter((b) => b.currency === currency).reduce((s, b) => s + b.limit, 0)
  const spent = f.budgets.filter((b) => b.currency === currency).reduce((s, b) => s + b.spent, 0)
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-3 gap-6">
          <Stat
            label={`Budgeted · ${formatISODate(today, 'MMMM')}`}
            value={formatMoney(total, currency)}
          />
          <Stat label="Spent" value={formatMoney(spent, currency)} />
          <Stat
            label="Remaining"
            value={formatMoney(total - spent, currency)}
            tone={total - spent < 0 ? 'negative' : 'positive'}
          />
        </div>
        <NewBudgetButton categories={f.categories} />
      </div>
      {f.budgets.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No budgets yet"
          description="Set monthly limits — e.g. Food 800 PLN — and see what's left at a glance. You'll get a warning at 80%."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {f.budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={{
                id: b.id,
                name: b.name,
                amount_minor: b.amount_minor,
                currency: b.currency,
                categoryIds: b.categoryIds,
              }}
              categories={f.categories}
              status={{
                limit: b.limit,
                spent: b.spent,
                remaining: b.remaining,
                percent: b.percent,
                status: b.status,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
