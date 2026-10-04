import 'server-only'
import { addMonthsISO, endOfMonthISO, isISODate, startOfMonthISO, type ISODate } from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import { minorToMajor } from '@/lib/money'
import { listAccounts } from './accounts-repository'
import {
  cashFlowByMonth,
  monthlyRecurringTotals,
  netWorthSeries,
  spendingByCategory,
  summarize,
} from './calculations'
import { listCategories, listRecurring, listTransactionsInRange } from './repository'

export const FINANCE_RANGES = ['month', 'quarter', 'year', 'custom'] as const
export type FinanceRangeKey = (typeof FINANCE_RANGES)[number]

export function resolveFinanceRange(
  key: string | undefined,
  today: ISODate,
  from?: string,
  to?: string,
) {
  const range: FinanceRangeKey = FINANCE_RANGES.includes(key as FinanceRangeKey)
    ? (key as FinanceRangeKey)
    : 'month'
  if (range === 'custom' && from && to && isISODate(from) && isISODate(to) && from <= to)
    return { range, from, to }
  const monthStart = startOfMonthISO(today)
  if (range === 'quarter')
    return { range, from: addMonthsISO(monthStart, -2), to: endOfMonthISO(today) }
  if (range === 'year')
    return { range, from: addMonthsISO(monthStart, -11), to: endOfMonthISO(today) }
  return {
    range: range === 'custom' ? ('month' as const) : range,
    from: monthStart,
    to: endOfMonthISO(today),
  }
}

function monthsBetween(from: ISODate, to: ISODate) {
  const out: string[] = []
  for (let m = startOfMonthISO(from); m <= to; m = addMonthsISO(m, 1)) out.push(m.slice(0, 7))
  return out
}

/** Financial analytics for a date range (computed by the analytics engine, not the UI). */
export async function getFinanceAnalytics(
  db: DB,
  userId: string,
  currency: string,
  from: ISODate,
  to: ISODate,
) {
  const [accounts, allTxns, categories, recurring] = await Promise.all([
    listAccounts(db, userId, true),
    listTransactionsInRange(db, userId, null, to),
    listCategories(db, userId, true),
    listRecurring(db, userId),
  ])
  const inRange = allTxns.filter((t) => t.occurred_on >= from)
  const months = monthsBetween(from, to)
  const summary = summarize(inRange, currency)
  const flow = cashFlowByMonth(inRange, months, currency).map((m) => ({
    label: m.month,
    income: minorToMajor(m.income, currency),
    expenses: minorToMajor(m.expenses, currency),
    net: minorToMajor(m.net, currency),
    savingsRate: m.income > 0 ? Math.round((m.net / m.income) * 100) : 0,
  }))
  const monthEnds = months.map((m) => endOfMonthISO(`${m}-01`)).map((d) => (d > to ? to : d))
  const nw = netWorthSeries(accounts, allTxns, monthEnds, currency).map((p) => ({
    label: p.date.slice(0, 7),
    value: minorToMajor(p.net, currency),
  }))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const byCategory = [...spendingByCategory(inRange, currency).entries()]
    .map(([id, amount]) => ({
      id,
      amount,
      name: id ? (categoryMap.get(id)?.name ?? 'Other') : 'Uncategorized',
      color: id ? (categoryMap.get(id)?.color ?? 'slate') : 'slate',
    }))
    .sort((a, b) => b.amount - a.amount)
  const accountCurrency = new Map(accounts.map((a) => [a.id, a.currency]))
  const recurringItems = recurring.map((r) => ({
    ...r,
    currency: accountCurrency.get(r.account_id) ?? currency,
  }))
  return {
    summary,
    flow,
    netWorth: nw,
    byCategory,
    recurring: recurringItems.filter((r) => r.active),
    recurringMonthly: monthlyRecurringTotals(recurringItems, currency),
    categories,
  }
}
