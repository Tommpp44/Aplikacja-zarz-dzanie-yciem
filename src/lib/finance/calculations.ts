import { addDaysISO, diffDaysISO, eachDayISO, type ISODate } from '@/lib/dates'
import { occurrencesBetween, occurrencesPerMonth, parseRepeatRule } from '@/lib/recurrence'

/**
 * Finance engine. Pure functions over minor-unit integers — no floating point,
 * no I/O — so every number shown in the app can be tested in isolation.
 */

export type TxnType = 'income' | 'expense' | 'transfer' | 'adjustment'

export type Txn = {
  account_id: string
  transfer_account_id: string | null
  txn_type: TxnType | string
  amount_minor: number
  transfer_amount_minor: number | null
  occurred_on: ISODate
  category_id?: string | null
  currency: string
  recurring_id?: string | null
}

export const LIABILITY_TYPES = new Set(['credit_card', 'loan'])
export const LIQUID_TYPES = new Set(['checking', 'savings', 'cash'])

export function isLiability(accountType: string) {
  return LIABILITY_TYPES.has(accountType)
}

/** Signed effect of a transaction on one account's balance. */
export function accountDelta(txn: Txn, accountId: string): number {
  if (txn.account_id === accountId) {
    switch (txn.txn_type) {
      case 'income':
        return txn.amount_minor
      case 'expense':
        return -txn.amount_minor
      case 'adjustment':
        return txn.amount_minor
      case 'transfer':
        return -txn.amount_minor
    }
  }
  if (txn.txn_type === 'transfer' && txn.transfer_account_id === accountId) {
    return txn.transfer_amount_minor ?? txn.amount_minor
  }
  return 0
}

/** Balance = opening balance + all (non-deleted) transactions up to `asOf`. */
export function balanceOf(openingMinor: number, txns: Txn[], accountId: string, asOf?: ISODate) {
  let balance = openingMinor
  for (const t of txns) {
    if (asOf && t.occurred_on > asOf) continue
    balance += accountDelta(t, accountId)
  }
  return balance
}

export type PeriodSummary = {
  income: number
  expenses: number
  savings: number
  /** Percentage of income saved (0 when there is no income). */
  savingsRate: number
  /** Transactions in other currencies, excluded from the totals above. */
  foreignCount: number
}

/**
 * Income vs expenses for a set of transactions in the base currency.
 * Transfers move money between your own accounts and adjustments are balance
 * corrections — neither is income or spending.
 */
export function summarize(txns: Txn[], baseCurrency: string): PeriodSummary {
  let income = 0
  let expenses = 0
  let foreignCount = 0
  for (const t of txns) {
    if (t.txn_type !== 'income' && t.txn_type !== 'expense') continue
    if (t.currency !== baseCurrency) {
      foreignCount++
      continue
    }
    if (t.txn_type === 'income') income += t.amount_minor
    else expenses += t.amount_minor
  }
  const savings = income - expenses
  return {
    income,
    expenses,
    savings,
    savingsRate: income > 0 ? (savings / income) * 100 : 0,
    foreignCount,
  }
}

export function spendingByCategory(txns: Txn[], baseCurrency: string) {
  const out = new Map<string | null, number>()
  for (const t of txns) {
    if (t.txn_type !== 'expense' || t.currency !== baseCurrency) continue
    const key = t.category_id ?? null
    out.set(key, (out.get(key) ?? 0) + t.amount_minor)
  }
  return out
}

export type BudgetStatus = {
  limit: number
  spent: number
  remaining: number
  percent: number
  status: 'ok' | 'warning' | 'over'
}

export const BUDGET_WARNING_PERCENT = 80

export function budgetStatus(limitMinor: number, spentMinor: number): BudgetStatus {
  const percent = limitMinor > 0 ? (spentMinor / limitMinor) * 100 : 0
  return {
    limit: limitMinor,
    spent: spentMinor,
    remaining: limitMinor - spentMinor,
    percent,
    status: percent > 100 ? 'over' : percent >= BUDGET_WARNING_PERCENT ? 'warning' : 'ok',
  }
}

/** Spent amount of a budget = expenses in its categories (base currency only). */
export function budgetSpent(categoryIds: string[], txns: Txn[], currency: string) {
  const set = new Set(categoryIds)
  let spent = 0
  for (const t of txns) {
    if (
      t.txn_type === 'expense' &&
      t.currency === currency &&
      t.category_id &&
      set.has(t.category_id)
    )
      spent += t.amount_minor
  }
  return spent
}

export type AccountForNetWorth = {
  id: string
  account_type: string
  currency: string
  balance_minor: number
  include_in_net_worth: boolean
  opening_balance_minor?: number
}

export type NetWorth = {
  assets: number
  liabilities: number
  net: number
  /** Currencies of accounts excluded from the total (no exchange rates in the MVP). */
  otherCurrencies: { currency: string; net: number }[]
}

/**
 * Net worth = assets − liabilities. Liability accounts (credit cards, loans)
 * hold negative balances when you owe money. Accounts in other currencies are
 * reported separately rather than converted with made-up exchange rates.
 */
export function netWorth(accounts: AccountForNetWorth[], baseCurrency: string): NetWorth {
  let assets = 0
  let liabilities = 0
  const other = new Map<string, number>()
  for (const a of accounts) {
    if (!a.include_in_net_worth) continue
    if (a.currency !== baseCurrency) {
      other.set(a.currency, (other.get(a.currency) ?? 0) + a.balance_minor)
      continue
    }
    if (isLiability(a.account_type)) {
      if (a.balance_minor < 0) liabilities += -a.balance_minor
      else assets += a.balance_minor
    } else if (a.balance_minor >= 0) {
      assets += a.balance_minor
    } else {
      liabilities += -a.balance_minor
    }
  }
  return {
    assets,
    liabilities,
    net: assets - liabilities,
    otherCurrencies: [...other.entries()].map(([currency, net]) => ({ currency, net })),
  }
}

/** Net worth (base currency) at the end of each given date, derived from history. */
export function netWorthSeries(
  accounts: (AccountForNetWorth & { opening_balance_minor: number })[],
  txns: Txn[],
  dates: ISODate[],
  baseCurrency: string,
) {
  const included = accounts.filter((a) => a.include_in_net_worth && a.currency === baseCurrency)
  const ids = new Set(included.map((a) => a.id))
  const opening = included.reduce((s, a) => s + a.opening_balance_minor, 0)
  const relevant = txns
    .filter(
      (t) =>
        ids.has(t.account_id) || (t.transfer_account_id !== null && ids.has(t.transfer_account_id)),
    )
    .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on))
  const sorted = [...dates].sort()
  const out: { date: ISODate; net: number }[] = []
  let running = opening
  let i = 0
  for (const date of sorted) {
    while (i < relevant.length && relevant[i]!.occurred_on <= date) {
      const t = relevant[i]!
      for (const id of ids) running += accountDelta(t, id)
      i++
    }
    out.push({ date, net: running })
  }
  return out
}

/** Income/expenses per month (keys "yyyy-MM"). */
export function cashFlowByMonth(txns: Txn[], months: string[], baseCurrency: string) {
  return months.map((month) => {
    const s = summarize(
      txns.filter((t) => t.occurred_on.startsWith(month)),
      baseCurrency,
    )
    return { month, income: s.income, expenses: s.expenses, net: s.savings }
  })
}

export type RecurringLike = {
  txn_type: string
  amount_minor: number
  repeat_rule: unknown
  next_date: ISODate
  end_date: ISODate | null
  active: boolean
  currency?: string
}

/** Occurrences of recurring transactions between two dates (inclusive). */
export function recurringOccurrences(items: RecurringLike[], from: ISODate, to: ISODate) {
  const out: { item: RecurringLike; date: ISODate }[] = []
  for (const item of items) {
    if (!item.active) continue
    const rule = parseRepeatRule(item.repeat_rule)
    if (!rule) continue
    for (const date of occurrencesBetween(rule, item.next_date, from, to, item.end_date))
      out.push({ item, date })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

/** Recurring costs normalised to one month (e.g. a yearly 1200 = 100/month). */
export function monthlyRecurringTotals(items: RecurringLike[], baseCurrency: string) {
  let income = 0
  let expenses = 0
  for (const item of items) {
    if (!item.active || (item.currency && item.currency !== baseCurrency)) continue
    const rule = parseRepeatRule(item.repeat_rule)
    if (!rule) continue
    const monthly = Math.round(item.amount_minor * occurrencesPerMonth(rule))
    if (item.txn_type === 'income') income += monthly
    else if (item.txn_type === 'expense') expenses += monthly
  }
  return { income, expenses }
}

export type MonthForecast = {
  expectedIncome: number
  expectedExpenses: number
  expectedSavings: number
  /** Liquid balance expected at the end of the month. */
  expectedEndBalance: number
  /** Breakdown of the remaining part of the month. */
  remainingRecurringIncome: number
  remainingRecurringExpenses: number
  projectedVariableSpending: number
}

/**
 * End-of-month forecast:
 *   actual so far
 * + scheduled recurring transactions still due this month
 * + variable spending projected from the average daily non-recurring spending
 *   of the previous 90 days for the remaining days.
 */
export function forecastMonth(input: {
  today: ISODate
  monthEnd: ISODate
  monthToDate: Txn[]
  recurring: RecurringLike[]
  /** Transactions from the 90 days before today (for the variable spending rate). */
  history: Txn[]
  liquidBalance: number
  baseCurrency: string
}): MonthForecast {
  const { today, monthEnd, baseCurrency } = input
  const actual = summarize(input.monthToDate, baseCurrency)
  const upcoming = recurringOccurrences(
    input.recurring.filter((r) => !r.currency || r.currency === baseCurrency),
    addDaysISO(today, 1),
    monthEnd,
  )
  const remainingRecurringIncome = upcoming
    .filter((o) => o.item.txn_type === 'income')
    .reduce((s, o) => s + o.item.amount_minor, 0)
  const remainingRecurringExpenses = upcoming
    .filter((o) => o.item.txn_type === 'expense')
    .reduce((s, o) => s + o.item.amount_minor, 0)

  const variable = input.history.filter(
    (t) => t.txn_type === 'expense' && !t.recurring_id && t.currency === baseCurrency,
  )
  // Average over the observed history, but never fewer than 30 days so a single
  // purchase on day one does not get extrapolated over the whole month.
  const firstDate = input.history.reduce((m, t) => (t.occurred_on < m ? t.occurred_on : m), today)
  const historyDays = Math.min(90, Math.max(30, diffDaysISO(today, firstDate) + 1))
  const dailyVariable = variable.reduce((s, t) => s + t.amount_minor, 0) / historyDays
  const remainingDays = Math.max(0, diffDaysISO(monthEnd, today))
  const projectedVariableSpending = Math.round(dailyVariable * remainingDays)

  const expectedIncome = actual.income + remainingRecurringIncome
  const expectedExpenses = actual.expenses + remainingRecurringExpenses + projectedVariableSpending
  return {
    expectedIncome,
    expectedExpenses,
    expectedSavings: expectedIncome - expectedExpenses,
    expectedEndBalance:
      input.liquidBalance +
      remainingRecurringIncome -
      remainingRecurringExpenses -
      projectedVariableSpending,
    remainingRecurringIncome,
    remainingRecurringExpenses,
    projectedVariableSpending,
  }
}

/** Percentage change from previous to current (null when previous is 0). */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

/** Daily spending for a period (for sparklines / trend). */
export function dailySpending(txns: Txn[], from: ISODate, to: ISODate, baseCurrency: string) {
  const map = new Map<ISODate, number>()
  for (const t of txns) {
    if (t.txn_type !== 'expense' || t.currency !== baseCurrency) continue
    map.set(t.occurred_on, (map.get(t.occurred_on) ?? 0) + t.amount_minor)
  }
  return eachDayISO(from, to).map((date) => ({ date, amount: map.get(date) ?? 0 }))
}
