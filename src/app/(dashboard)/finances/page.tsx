import { Landmark, PiggyBank } from 'lucide-react'
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
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Finances')

export default async function FinancesPage() {
  const t = await getT()
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
        title={t('Add your first account')}
        description={t(
          'Start with your main bank account. Balances are always calculated from your transactions, so they never drift.',
        )}
        action={
          <Button asChild>
            <Link href="/finances/accounts?new=1">{t('Add account')}</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Stat
          label={t('Net worth')}
          value={formatMoney(f.netWorth.net, currency)}
          size="lg"
          hint={`Assets ${formatMoney(f.netWorth.assets, currency)} · Liabilities ${formatMoney(f.netWorth.liabilities, currency)}${f.netWorth.otherCurrencies.length ? ` · + ${f.netWorth.otherCurrencies.map((o) => formatMoney(o.net, o.currency)).join(', ')}` : ''}`}
        />
        <AddTransactionButton {...formProps} />
      </div>

      <section
        aria-label={t('This month')}
        className="bg-card grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-5"
      >
        <Stat label={t('Income')} value={formatMoney(f.month.income, currency)} tone="positive" />
        <Stat
          label={t('Expenses')}
          value={formatMoney(f.month.expenses, currency)}
          hint={
            expenseChange === null
              ? t('this month')
              : t('{change}% vs last month', {
                  change: `${expenseChange > 0 ? '+' : ''}${Math.round(expenseChange)}`,
                })
          }
        />
        <Stat
          label={t('Savings')}
          value={formatMoney(f.month.savings, currency)}
          tone={f.month.savings < 0 ? 'negative' : undefined}
        />
        <Stat label={t('Savings rate')} value={`${Math.round(f.month.savingsRate)}%`} />
        <Stat
          label={t('Budget utilization')}
          value={f.budgetUtilization === null ? '—' : `${Math.round(f.budgetUtilization)}%`}
          tone={
            f.budgetUtilization !== null && f.budgetUtilization > 100
              ? 'negative'
              : f.budgetUtilization !== null && f.budgetUtilization >= 80
                ? 'warning'
                : undefined
          }
          hint={f.budgetUtilization === null ? t('no budgets yet') : t('of monthly budgets')}
        />
      </section>

      {f.dueRecurring.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Due to record')}</CardTitle>
            <Link href="/finances/recurring" className="text-primary text-xs hover:underline">
              {t('Manage')}
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
            <CardTitle>{t('Recent transactions')}</CardTitle>
            <Link href="/finances/transactions" className="text-primary text-xs hover:underline">
              {t('View all')}
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
              <CardTitle>{t('End-of-month forecast')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row
                label={t('Expected income')}
                value={<Money minor={f.forecast.expectedIncome} currency={currency} />}
              />
              <Row
                label={t('Expected expenses')}
                value={<Money minor={f.forecast.expectedExpenses} currency={currency} />}
              />
              <Row
                label={t('Expected savings')}
                value={<Money minor={f.forecast.expectedSavings} currency={currency} tone />}
              />
              <div className="bg-border my-1 h-px" />
              <Row
                label={t('Expected balance (cash & bank)')}
                value={
                  <Money
                    minor={f.forecast.expectedEndBalance}
                    currency={currency}
                    className="font-semibold"
                  />
                }
              />
              <p className="text-muted-foreground text-xs">
                {t(
                  'Based on scheduled recurring items and your average daily spending over the last 90 days.',
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('Budgets')}</CardTitle>
              <Link href="/finances/budgets" className="text-primary text-xs hover:underline">
                {f.budgets.length ? t('Manage') : t('Create')}
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {f.budgets.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t('Set a monthly limit for categories like Food or Entertainment.')}
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
            <CardTitle>{t('Accounts')}</CardTitle>
            <Link href="/finances/accounts" className="text-primary text-xs hover:underline">
              {t('Manage')}
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
                      {t(ACCOUNT_TYPE_LABELS[a.account_type as AccountType])}
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
            <CardTitle>{t('Top categories this month')}</CardTitle>
          </CardHeader>
          <CardContent>
            {f.topCategories.length === 0 ? (
              <EmptyState compact icon={PiggyBank} title={t('No spending yet this month')} />
            ) : (
              <div className="grid items-center gap-4 sm:grid-cols-2">
                <DonutChart
                  ariaLabel={t('Spending by category')}
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
