import { Suspense } from 'react'
import { BarsChart, DonutChart, TrendChart } from '@/components/charts/lazy'
import { Money } from '@/components/finances/money'
import { RangePicker } from '@/components/shared/range-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorDot } from '@/components/ui/color-dot'
import { Stat } from '@/components/ui/stat'
import { COLOR_HEX, asEntityColor } from '@/lib/colors'
import { formatISODate } from '@/lib/dates'
import { getFinanceAnalytics, resolveFinanceRange } from '@/lib/finance/analytics'
import { formatMoney, minorToMajor } from '@/lib/money'
import { describeRepeatRule, parseRepeatRule } from '@/lib/recurrence'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Financial analytics')

export default async function FinanceAnalyticsPage({
  searchParams,
}: PageProps<'/finances/analytics'>) {
  const t = await getT()
  const sp = await searchParams
  const { supabase, user, today, currency } = await getOnboardedUserContext()
  const { range, from, to } = resolveFinanceRange(
    sp.range as string | undefined,
    today,
    sp.from as string | undefined,
    sp.to as string | undefined,
  )
  const a = await getFinanceAnalytics(supabase, user.id, currency, from, to)
  const money = `money:${currency}` as const
  const totalSpending = a.byCategory.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense>
          <RangePicker
            active={range}
            allowCustom
            from={from}
            to={to}
            options={[
              { value: 'month', label: t('Month') },
              { value: 'quarter', label: t('Quarter') },
              { value: 'year', label: t('Year') },
            ]}
          />
        </Suspense>
        <p className="text-muted-foreground text-xs">
          {formatISODate(from, 'd MMM yyyy')} – {formatISODate(to, 'd MMM yyyy')}
        </p>
      </div>

      <section className="bg-card grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-4">
        <Stat label={t('Income')} value={formatMoney(a.summary.income, currency)} tone="positive" />
        <Stat label={t('Expenses')} value={formatMoney(a.summary.expenses, currency)} />
        <Stat
          label={t('Savings')}
          value={formatMoney(a.summary.savings, currency)}
          tone={a.summary.savings < 0 ? 'negative' : undefined}
        />
        <Stat label={t('Savings rate')} value={`${Math.round(a.summary.savingsRate)}%`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('Income vs expenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarsChart
              ariaLabel={t('Income and expenses per month')}
              format={money}
              data={a.flow.map((m) => ({
                label: formatISODate(`${m.label}-01`, 'MMM'),
                income: m.income,
                expenses: m.expenses,
              }))}
              series={[
                { key: 'income', label: t('Income'), color: 'var(--chart-2)' },
                { key: 'expenses', label: t('Expenses'), color: 'var(--chart-4)' },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('Cash flow & savings rate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarsChart
              ariaLabel={t('Net cash flow per month')}
              format={money}
              data={a.flow.map((m) => ({
                label: formatISODate(`${m.label}-01`, 'MMM'),
                net: m.net,
              }))}
              series={[{ key: 'net', label: t('Net cash flow') }]}
              height={180}
            />
            <ul className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {a.flow.map((m) => (
                <li key={m.label}>
                  {formatISODate(`${m.label}-01`, 'MMM')}:{' '}
                  <span className="tabular text-foreground font-medium">{m.savingsRate}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('Net worth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart
              ariaLabel={t('Net worth trend')}
              format={money}
              data={a.netWorth.map((p) => ({
                label: formatISODate(`${p.label}-01`, 'MMM yy'),
                value: p.value,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('Top categories')}</CardTitle>
          </CardHeader>
          <CardContent>
            {a.byCategory.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('No expenses in this range.')}</p>
            ) : (
              <div className="grid items-center gap-4 sm:grid-cols-2">
                <DonutChart
                  ariaLabel={t('Spending by category')}
                  format={money}
                  data={a.byCategory.slice(0, 8).map((c) => ({
                    label: c.name,
                    value: minorToMajor(c.amount, currency),
                    color: COLOR_HEX[asEntityColor(c.color)],
                  }))}
                />
                <ul className="flex flex-col gap-1.5 text-sm">
                  {a.byCategory.slice(0, 8).map((c) => (
                    <li key={c.id ?? 'none'} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 truncate">
                        <ColorDot color={c.color} /> {c.name}
                      </span>
                      <span className="text-muted-foreground tabular text-xs">
                        {Math.round((c.amount / totalSpending) * 100)}% ·{' '}
                        <Money minor={c.amount} currency={currency} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('Recurring costs')}</CardTitle>
            <span className="text-muted-foreground text-xs">
              {t('{costs} / month · {income} recurring income', {
                costs: formatMoney(a.recurringMonthly.expenses, currency),
                income: formatMoney(a.recurringMonthly.income, currency),
              })}
            </span>
          </CardHeader>
          <CardContent>
            {a.recurring.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('No recurring transactions yet.')}</p>
            ) : (
              <ul className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                {a.recurring.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2 py-1">
                    <span className="truncate">
                      {r.merchant || r.description || 'Recurring'}{' '}
                      <span className="text-muted-foreground text-xs">
                        · {describeRepeatRule(parseRepeatRule(r.repeat_rule))}
                      </span>
                    </span>
                    <Money
                      minor={r.txn_type === 'income' ? r.amount_minor : -r.amount_minor}
                      currency={r.currency}
                      signed
                      className="text-xs"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
