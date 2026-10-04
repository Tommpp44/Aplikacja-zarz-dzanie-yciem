import 'server-only'
import { addDaysISO, addMonthsISO, endOfMonthISO, startOfMonthISO, type ISODate } from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import { listAccounts } from './accounts-repository'
import {
  budgetSpent,
  budgetStatus,
  forecastMonth,
  LIQUID_TYPES,
  monthlyRecurringTotals,
  netWorth,
  recurringOccurrences,
  spendingByCategory,
  summarize,
} from './calculations'
import { listBudgets, listCategories, listRecurring, listTransactionsInRange } from './repository'
import { currentLocale } from '@/lib/i18n/locale-state'
import { translate } from '@/lib/i18n/translate'

/** Everything the finance overview and dashboard need, computed from real data. */
export async function getFinanceOverview(db: DB, userId: string, today: ISODate, currency: string) {
  const monthStart = startOfMonthISO(today)
  const monthEnd = endOfMonthISO(today)
  const prevMonthStart = addMonthsISO(monthStart, -1)
  const historyFrom = addDaysISO(today, -90)
  const from = historyFrom < prevMonthStart ? historyFrom : prevMonthStart

  const [accounts, txns, budgets, recurring, categories] = await Promise.all([
    listAccounts(db, userId),
    listTransactionsInRange(db, userId, from, monthEnd),
    listBudgets(db, userId),
    listRecurring(db, userId),
    listCategories(db, userId, true),
  ])

  const monthTxns = txns.filter((t) => t.occurred_on >= monthStart && t.occurred_on <= today)
  const prevMonthTxns = txns.filter(
    (t) => t.occurred_on >= prevMonthStart && t.occurred_on < monthStart,
  )
  const month = summarize(monthTxns, currency)
  const prevMonth = summarize(prevMonthTxns, currency)
  const nw = netWorth(accounts, currency)

  const budgetRows = budgets.map((b) => {
    const categoryIds = b.budget_categories.map((c) => c.category_id)
    const spent = budgetSpent(
      categoryIds,
      monthTxns.filter((t) => t.currency === b.currency),
      b.currency,
    )
    return { ...b, categoryIds, ...budgetStatus(b.amount_minor, spent) }
  })
  const totalBudget = budgetRows
    .filter((b) => b.currency === currency)
    .reduce((s, b) => s + b.limit, 0)
  const totalBudgetSpent = budgetRows
    .filter((b) => b.currency === currency)
    .reduce((s, b) => s + b.spent, 0)

  const accountCurrency = new Map(accounts.map((a) => [a.id, a.currency]))
  const recurringWithCurrency = recurring.map((r) => ({
    ...r,
    currency: accountCurrency.get(r.account_id) ?? currency,
  }))
  const liquidBalance = accounts
    .filter((a) => LIQUID_TYPES.has(a.account_type) && a.currency === currency)
    .reduce((s, a) => s + a.balance_minor, 0)
  const forecast = forecastMonth({
    today,
    monthEnd,
    monthToDate: monthTxns,
    recurring: recurringWithCurrency,
    history: txns.filter((t) => t.occurred_on >= historyFrom && t.occurred_on <= today),
    liquidBalance,
    baseCurrency: currency,
  })
  const dueRecurring = recurringWithCurrency.filter((r) => r.active && r.next_date <= today)
  const upcomingRecurring = recurringOccurrences(
    recurringWithCurrency,
    addDaysISO(today, 1),
    addDaysISO(today, 14),
  )

  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const topCategories = [...spendingByCategory(monthTxns, currency).entries()]
    .map(([id, amount]) => ({
      id,
      amount,
      name: id
        ? (categoryMap.get(id)?.name ?? translate(currentLocale(), 'Other'))
        : translate(currentLocale(), 'Uncategorized'),
      color: id ? (categoryMap.get(id)?.color ?? 'slate') : 'slate',
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    accounts,
    netWorth: nw,
    month,
    prevMonth,
    budgets: budgetRows,
    budgetUtilization: totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : null,
    forecast,
    recurring: recurringWithCurrency,
    recurringMonthly: monthlyRecurringTotals(recurringWithCurrency, currency),
    dueRecurring,
    upcomingRecurring,
    recentTransactions: txns
      .filter((t) => t.occurred_on <= today)
      .sort(
        (a, b) =>
          b.occurred_on.localeCompare(a.occurred_on) || b.created_at.localeCompare(a.created_at),
      )
      .slice(0, 8),
    topCategories,
    categories,
    liquidBalance,
  }
}

export type FinanceOverview = Awaited<ReturnType<typeof getFinanceOverview>>
