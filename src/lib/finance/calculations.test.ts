import { describe, expect, it } from 'vitest'
import {
  accountDelta,
  balanceOf,
  budgetSpent,
  budgetStatus,
  cashFlowByMonth,
  forecastMonth,
  monthlyRecurringTotals,
  netWorth,
  netWorthSeries,
  percentChange,
  recurringOccurrences,
  spendingByCategory,
  summarize,
  type Txn,
} from './calculations'

const t = (p: Partial<Txn>): Txn => ({
  account_id: 'main',
  transfer_account_id: null,
  txn_type: 'expense',
  amount_minor: 1000,
  transfer_amount_minor: null,
  occurred_on: '2026-10-01',
  category_id: null,
  currency: 'PLN',
  ...p,
})

describe('balances', () => {
  const txns = [
    t({ txn_type: 'income', amount_minor: 1_000_000 }),
    t({ txn_type: 'expense', amount_minor: 5_450, occurred_on: '2026-10-02' }),
    t({
      txn_type: 'transfer',
      amount_minor: 200_000,
      transfer_account_id: 'savings',
      transfer_amount_minor: 200_000,
      occurred_on: '2026-10-03',
    }),
    t({ txn_type: 'adjustment', amount_minor: -1_000, occurred_on: '2026-10-04' }),
  ]

  it('applies income, expense, transfer and adjustment to the right accounts', () => {
    expect(balanceOf(50_000, txns, 'main')).toBe(50_000 + 1_000_000 - 5_450 - 200_000 - 1_000)
    expect(balanceOf(0, txns, 'savings')).toBe(200_000)
  })

  it('transfers never change total money', () => {
    const transfer = txns[2]!
    expect(accountDelta(transfer, 'main') + accountDelta(transfer, 'savings')).toBe(0)
  })

  it('supports cross-currency transfers with a destination amount', () => {
    const fx = t({
      txn_type: 'transfer',
      amount_minor: 43_000,
      transfer_account_id: 'eur',
      transfer_amount_minor: 10_000,
    })
    expect(accountDelta(fx, 'main')).toBe(-43_000)
    expect(accountDelta(fx, 'eur')).toBe(10_000)
  })

  it('computes balances as of a date', () => {
    expect(balanceOf(0, txns, 'main', '2026-10-01')).toBe(1_000_000)
  })

  it('is exact with many small amounts (no float drift)', () => {
    const many = Array.from({ length: 1000 }, () => t({ txn_type: 'income', amount_minor: 1 }))
    expect(balanceOf(0, many, 'main')).toBe(1000)
  })
})

describe('summaries', () => {
  const txns = [
    t({ txn_type: 'income', amount_minor: 1_045_000 }),
    t({ txn_type: 'expense', amount_minor: 623_000, category_id: 'food' }),
    t({ txn_type: 'transfer', amount_minor: 100_000, transfer_account_id: 'savings' }),
    t({ txn_type: 'adjustment', amount_minor: 5_000 }),
    t({ txn_type: 'expense', amount_minor: 10_000, currency: 'EUR' }),
  ]

  it('excludes transfers, adjustments and other currencies', () => {
    const s = summarize(txns, 'PLN')
    expect(s.income).toBe(1_045_000)
    expect(s.expenses).toBe(623_000)
    expect(s.savings).toBe(422_000)
    expect(s.savingsRate).toBeCloseTo(40.38, 1)
    expect(s.foreignCount).toBe(1)
  })

  it('handles zero income', () => {
    expect(summarize([t({})], 'PLN').savingsRate).toBe(0)
  })

  it('groups spending by category', () => {
    expect(spendingByCategory(txns, 'PLN').get('food')).toBe(623_000)
  })

  it('builds monthly cash flow', () => {
    const flow = cashFlowByMonth(
      [...txns, t({ occurred_on: '2026-09-15', amount_minor: 300 })],
      ['2026-09', '2026-10'],
      'PLN',
    )
    expect(flow[0]).toEqual({ month: '2026-09', income: 0, expenses: 300, net: -300 })
    expect(flow[1]!.net).toBe(422_000)
  })

  it('computes percent change', () => {
    expect(percentChange(112, 100)).toBeCloseTo(12)
    expect(percentChange(5, 0)).toBeNull()
  })
})

describe('budgets', () => {
  it('reports used, remaining and status', () => {
    expect(budgetStatus(80_000, 56_000)).toMatchObject({
      remaining: 24_000,
      percent: 70,
      status: 'ok',
    })
    expect(budgetStatus(80_000, 64_000).status).toBe('warning')
    expect(budgetStatus(80_000, 90_000)).toMatchObject({ remaining: -10_000, status: 'over' })
  })

  it('only counts expenses in budget categories and currency', () => {
    const txns = [
      t({ category_id: 'food', amount_minor: 100 }),
      t({ category_id: 'food', amount_minor: 50, txn_type: 'income' }),
      t({ category_id: 'fun', amount_minor: 70 }),
      t({ category_id: 'food', amount_minor: 30, currency: 'EUR' }),
    ]
    expect(budgetSpent(['food'], txns, 'PLN')).toBe(100)
  })
})

describe('net worth', () => {
  const accounts = [
    {
      id: 'main',
      account_type: 'checking',
      currency: 'PLN',
      balance_minor: 500_000,
      include_in_net_worth: true,
      opening_balance_minor: 100_000,
    },
    {
      id: 'card',
      account_type: 'credit_card',
      currency: 'PLN',
      balance_minor: -120_000,
      include_in_net_worth: true,
      opening_balance_minor: 0,
    },
    {
      id: 'loan',
      account_type: 'loan',
      currency: 'PLN',
      balance_minor: -1_000_000,
      include_in_net_worth: true,
      opening_balance_minor: -1_000_000,
    },
    {
      id: 'eur',
      account_type: 'savings',
      currency: 'EUR',
      balance_minor: 50_000,
      include_in_net_worth: true,
      opening_balance_minor: 50_000,
    },
    {
      id: 'hidden',
      account_type: 'cash',
      currency: 'PLN',
      balance_minor: 999,
      include_in_net_worth: false,
      opening_balance_minor: 999,
    },
  ]

  it('computes assets minus liabilities and reports other currencies separately', () => {
    expect(netWorth(accounts, 'PLN')).toEqual({
      assets: 500_000,
      liabilities: 1_120_000,
      net: -620_000,
      otherCurrencies: [{ currency: 'EUR', net: 50_000 }],
    })
  })

  it('derives a historical series from transactions', () => {
    const txns = [
      t({ txn_type: 'income', amount_minor: 400_000, occurred_on: '2026-09-10' }),
      t({ account_id: 'card', amount_minor: 120_000, occurred_on: '2026-09-20' }),
      // transfer between included accounts does not change net worth
      t({
        txn_type: 'transfer',
        amount_minor: 50_000,
        transfer_account_id: 'card',
        occurred_on: '2026-09-25',
      }),
    ]
    const series = netWorthSeries(accounts, txns, ['2026-09-01', '2026-09-15', '2026-09-30'], 'PLN')
    expect(series.map((p) => p.net)).toEqual([-900_000, -500_000, -620_000])
  })
})

describe('recurring and forecast', () => {
  const recurring = [
    {
      txn_type: 'expense',
      amount_minor: 250_000,
      repeat_rule: { freq: 'monthly', interval: 1 },
      next_date: '2026-10-10',
      end_date: null,
      active: true,
    },
    {
      txn_type: 'income',
      amount_minor: 1_000_000,
      repeat_rule: { freq: 'monthly', interval: 1 },
      next_date: '2026-10-25',
      end_date: null,
      active: true,
    },
    {
      txn_type: 'expense',
      amount_minor: 120_000,
      repeat_rule: { freq: 'yearly', interval: 1 },
      next_date: '2027-01-15',
      end_date: null,
      active: true,
    },
    {
      txn_type: 'expense',
      amount_minor: 999,
      repeat_rule: { freq: 'weekly', interval: 1 },
      next_date: '2026-10-05',
      end_date: null,
      active: false,
    },
  ]

  it('expands occurrences in a range', () => {
    expect(recurringOccurrences(recurring, '2026-10-01', '2026-10-31').map((o) => o.date)).toEqual([
      '2026-10-10',
      '2026-10-25',
    ])
  })

  it('normalises recurring costs to a month', () => {
    expect(monthlyRecurringTotals(recurring, 'PLN')).toEqual({
      income: 1_000_000,
      expenses: 260_000,
    })
  })

  it('forecasts the end of the month', () => {
    const history = Array.from({ length: 90 }, (_, i) =>
      t({
        amount_minor: 1_000,
        occurred_on: `2026-${String(7 + Math.floor(i / 31)).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      }),
    )
    const f = forecastMonth({
      today: '2026-10-05',
      monthEnd: '2026-10-31',
      monthToDate: [t({ txn_type: 'expense', amount_minor: 30_000 })],
      recurring,
      history: [...history, t({ occurred_on: '2026-07-07', amount_minor: 1 })],
      liquidBalance: 500_000,
      baseCurrency: 'PLN',
    })
    expect(f.remainingRecurringIncome).toBe(1_000_000)
    expect(f.remainingRecurringExpenses).toBe(250_000)
    expect(f.projectedVariableSpending).toBeGreaterThan(0)
    expect(f.expectedIncome).toBe(1_000_000)
    expect(f.expectedExpenses).toBe(30_000 + 250_000 + f.projectedVariableSpending)
    expect(f.expectedEndBalance).toBe(500_000 + 1_000_000 - 250_000 - f.projectedVariableSpending)
  })

  it('does not extrapolate a single day of history', () => {
    const f = forecastMonth({
      today: '2026-10-04',
      monthEnd: '2026-10-31',
      monthToDate: [t({ occurred_on: '2026-10-04', amount_minor: 5_400 })],
      recurring: [],
      history: [t({ occurred_on: '2026-10-04', amount_minor: 5_400 })],
      liquidBalance: 0,
      baseCurrency: 'PLN',
    })
    // 54 PLN averaged over 30 days * 27 remaining days
    expect(f.projectedVariableSpending).toBe(4_860)
  })
})
