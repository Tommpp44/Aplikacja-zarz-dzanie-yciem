import { Landmark, PiggyBank } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DonutChart } from '@/components/charts/lazy'
import { BudgetRow } from '@/components/finances/budget-row'
import { Money } from '@/components/finances/money'
import { RecurringDue } from '@/components/finances/recurring-due'
import { AddTransactionButton } from '@/components/finances/transaction-dialog'
import { TransactionList } from '@/components/finances/transaction-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorDot } from '@/components/ui/color-dot'
import { EmptyState } from '@/components/ui/empty-state'
import { Stat } from '@/components/ui/stat'
import { COLOR_HEX, asEntityColor } from '@/lib/colors'
import { percentChange } from '@/lib/finance/calculations'
import { ACCOUNT_TYPE_LABELS, type AccountType } from '@/lib/finance/schemas'
import { getFinanceOverview } from '@/lib/finance/service'
import { formatMoney, minorToMajor } from '@/lib/money'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Finances' }

export default async function FinancesPage() {
  const { supabase, user, today, currency, prefs } = await getOnboardedUserContext()
  const f = await getFinanceOverview(supabase, user.id, today, currency)
  const accountOptions = f.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    currency: a.currency,
    account_type: a.account_type,
  }))
  const formProps = {
    accounts: accountOptions,
    categories: f.categories,
    today,
    lastUsed: prefs.last_used,
  }
  const expenseChange = percentChange(f.month.expenses, f.prevMonth.expenses)

  if (f.accounts.length === 0) {
    return (
      <EmptyState
        icon={Landmark}
        title="Add your first account"
        description="Start with your main bank account. Balances are always calculated from your transactions, so they never drift."
        action={
          <Button asChild>
            <Link href="/finances/accounts?new=1">Add account</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Stat
          label="Net worth"
          value={formatMoney(f.netWorth.net, currency)}
          size="lg"
          hint={`Assets ${formatMoney(f.netWorth.assets, currency)} · Liabilities ${formatMoney(f.netWorth.liabilities, currency)}${f.netWorth.otherCurrencies.length ? ` · + ${f.netWorth.otherCurrencies.map((o) => formatMoney(o.net, o.currency)).join(', ')}` : ''}`}
        />
        <AddTransactionButton {...formProps} />
      </div>

      <section
        aria-label="This month"
        className="bg-card grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-5"
      >
        <Stat label="Income" value={formatMoney(f.month.income, currency)} tone="positive" />
        <Stat
          label="Expenses"
          value={formatMoney(f.month.expenses, currency)}
          hint={
            expenseChange === null
              ? 'this month'
              : `${expenseChange > 0 ? '+' : ''}${Math.round(expenseChange)}% vs last month`
          }
        />
        <Stat
          label="Savings"
          value={formatMoney(f.month.savings, currency)}
          tone={f.month.savings < 0 ? 'negative' : undefined}
        />
        <Stat label="Savings rate" value={`${Math.round(f.month.savingsRate)}%`} />
        <Stat
          label="Budget utilization"
          value={f.budgetUtilization === null ? '—' : `${Math.round(f.budgetUtilization)}%`}
          tone={
            f.budgetUtilization !== null && f.budgetUtilization > 100
              ? 'negative'
              : f.budgetUtilization !== null && f.budgetUtilization >= 80
                ? 'warning'
                : undefined
          }
          hint={f.budgetUtilization === null ? 'no budgets yet' : 'of monthly budgets'}
        />
      </section>

      {f.dueRecurring.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Due to record</CardTitle>
            <Link href="/finances/recurring" className="text-primary text-xs hover:underline">
              Manage
            </Link>
          </CardHeader>
          <CardContent>
            <RecurringDue items={f.dueRecurring} today={today} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <Link href="/finances/transactions" className="text-primary text-xs hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <TransactionList
              transactions={f.recentTransactions}
              accounts={accountOptions}
              categories={f.categories}
              today={today}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>End-of-month forecast</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row
                label="Expected income"
                value={<Money minor={f.forecast.expectedIncome} currency={currency} />}
              />
              <Row
                label="Expected expenses"
                value={<Money minor={f.forecast.expectedExpenses} currency={currency} />}
              />
              <Row
                label="Expected savings"
                value={<Money minor={f.forecast.expectedSavings} currency={currency} tone />}
              />
              <div className="bg-border my-1 h-px" />
              <Row
                label="Expected balance (cash & bank)"
                value={
                  <Money
                    minor={f.forecast.expectedEndBalance}
                    currency={currency}
                    className="font-semibold"
                  />
                }
              />
              <p className="text-muted-foreground text-xs">
                Based on scheduled recurring items and your average daily spending over the last 90
                days.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Budgets</CardTitle>
              <Link href="/finances/budgets" className="text-primary text-xs hover:underline">
                {f.budgets.length ? 'Manage' : 'Create'}
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {f.budgets.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Set a monthly limit for categories like Food or Entertainment.
                </p>
              ) : (
                f.budgets
                  .slice(0, 5)
                  .map((b) => <BudgetRow key={b.id} {...b} currency={b.currency} />)
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <Link href="/finances/accounts" className="text-primary text-xs hover:underline">
              Manage
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {f.accounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <ColorDot color={a.color} />
                    <span className="truncate font-medium">{a.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {ACCOUNT_TYPE_LABELS[a.account_type as AccountType]}
                    </span>
                  </span>
                  <Money
                    minor={a.balance_minor}
                    currency={a.currency}
                    className={a.balance_minor < 0 ? 'text-destructive' : ''}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top categories this month</CardTitle>
          </CardHeader>
          <CardContent>
            {f.topCategories.length === 0 ? (
              <EmptyState compact icon={PiggyBank} title="No spending yet this month" />
            ) : (
              <div className="grid items-center gap-4 sm:grid-cols-2">
                <DonutChart
                  ariaLabel="Spending by category"
                  format={`money:${currency}`}
                  data={f.topCategories.slice(0, 6).map((c) => ({
                    label: c.name,
                    value: minorToMajor(c.amount, currency),
                    color: COLOR_HEX[asEntityColor(c.color)],
                  }))}
                />
                <ul className="flex flex-col gap-1.5 text-sm">
                  {f.topCategories.slice(0, 6).map((c) => (
                    <li key={c.id ?? 'none'} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 truncate">
                        <ColorDot color={c.color} /> {c.name}
                      </span>
                      <Money minor={c.amount} currency={currency} className="text-xs" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      {value}
    </div>
  )
}
