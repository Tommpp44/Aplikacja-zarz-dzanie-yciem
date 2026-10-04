import { describe, expect, it } from 'vitest'
import { csvToTransactions, parseCsv, toCsv } from './csv'

describe('csv', () => {
  it('parses quotes, escaped quotes and newlines', () => {
    expect(parseCsv('a,b\n"x, y","He said ""hi"""\n"multi\nline",2')).toEqual([
      ['a', 'b'],
      ['x, y', 'He said "hi"'],
      ['multi\nline', '2'],
    ])
  })

  it('detects semicolon delimiters', () => {
    expect(parseCsv('data;kwota\n01.10.2026;-54,50')).toEqual([
      ['data', 'kwota'],
      ['01.10.2026', '-54,50'],
    ])
  })

  it('round-trips and neutralises formulas', () => {
    expect(toCsv([['=SUM(A1)', '-12.50', 'a,b']])).toBe(`'=SUM(A1),-12.50,"a,b"`)
  })

  it('converts bank exports to transactions', () => {
    const { rows, errors } = csvToTransactions(
      'Data;Kwota;Odbiorca;Opis\n01.10.2026;-54,50;Lidl;Zakupy\n2026-10-02;10450,00;ACME;Salary\nbad;1;x;y',
    )
    expect(errors).toEqual([{ line: 4, message: 'Invalid date' }])
    expect(rows).toEqual([
      {
        occurred_on: '2026-10-01',
        amount: '54,50',
        txn_type: 'expense',
        category: undefined,
        merchant: 'Lidl',
        description: 'Zakupy',
      },
      {
        occurred_on: '2026-10-02',
        amount: '10450,00',
        txn_type: 'income',
        category: undefined,
        merchant: 'ACME',
        description: 'Salary',
      },
    ])
  })

  it('requires date and amount columns', () => {
    expect(csvToTransactions('foo,bar\n1,2').errors[0]!.message).toMatch(/date/)
  })
})
