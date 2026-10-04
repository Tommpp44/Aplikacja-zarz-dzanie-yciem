import { describe, expect, it } from 'vitest'
import { parseTransactionText } from './parse-transaction'

const TODAY = '2026-10-04'

describe('parseTransactionText', () => {
  it('parses the canonical example', () => {
    expect(parseTransactionText('Spent 54 PLN on groceries at Lidl.', TODAY)).toMatchObject({
      txn_type: 'expense',
      amount: '54',
      currency: 'PLN',
      categoryName: 'Food',
      merchant: 'Lidl',
      occurred_on: TODAY,
    })
  })

  it('detects income and relative dates', () => {
    expect(parseTransactionText('Got salary 10 450 zł yesterday', TODAY)).toMatchObject({
      txn_type: 'income',
      amount: '10450',
      currency: 'PLN',
      categoryName: 'Salary',
      occurred_on: '2026-10-03',
    })
  })

  it('handles decimal commas and leading merchants', () => {
    expect(parseTransactionText('Uber 23,50', TODAY)).toMatchObject({
      amount: '23,50',
      categoryName: 'Transport',
      merchant: 'Uber',
    })
  })

  it('handles currency symbols', () => {
    expect(parseTransactionText('Netflix €12.99', TODAY)).toMatchObject({
      amount: '12.99',
      currency: 'EUR',
      categoryName: 'Subscriptions',
    })
  })

  it('returns a draft without amount when none is present', () => {
    expect(parseTransactionText('coffee with Anna', TODAY)).toMatchObject({
      amount: null,
      categoryName: 'Food',
    })
  })
})
