import { describe, expect, it } from 'vitest'
import { formatMoney, minorToInput, parseAmountToMinor, sumMinor } from './money'

describe('parseAmountToMinor', () => {
  it.each([
    ['54', 5400],
    ['54,5', 5450],
    ['54.50', 5450],
    ['1 234,56', 123456],
    ['1,234.56', 123456],
    ['1.234,56', 123456],
    ['1.000', 100000],
    ['12,500', 1250000],
    ['0.1', 10],
    ['0.105', 11],
    ['-20', -2000],
    ['+7', 700],
    ['1.000.000', 100000000],
  ])('parses %s', (input, expected) => {
    expect(parseAmountToMinor(input, 'PLN')).toBe(expected)
  })

  it('handles zero-decimal currencies', () => {
    expect(parseAmountToMinor('1500', 'JPY')).toBe(1500)
    expect(parseAmountToMinor('1.500', 'JPY')).toBe(1500)
  })

  it.each(['', 'abc', '12a', '--1', '.'])('rejects %s', (input) => {
    expect(parseAmountToMinor(input, 'PLN')).toBeNull()
  })

  it('avoids floating point errors', () => {
    expect(parseAmountToMinor('0.1', 'PLN')! + parseAmountToMinor('0.2', 'PLN')!).toBe(30)
    expect(sumMinor([10, 20])).toBe(30)
  })
})

describe('formatting', () => {
  it('formats PLN', () => {
    expect(formatMoney(12345678, 'PLN').replace(/\s/g, ' ')).toBe('123 456,78 zł')
  })
  it('formats signed values', () => {
    expect(formatMoney(-500, 'EUR', { signed: true })).toContain('-')
  })
  it('converts minor to input', () => {
    expect(minorToInput(123405, 'PLN')).toBe('1234.05')
    expect(minorToInput(-5, 'PLN')).toBe('-0.05')
    expect(minorToInput(1500, 'JPY')).toBe('1500')
  })
})
