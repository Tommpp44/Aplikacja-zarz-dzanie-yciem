import { describe, expect, it } from 'vitest'
import { guessShoppingCategory, parseShoppingItem } from './parse'

describe('shopping parsing', () => {
  it('parses quantities and units', () => {
    expect(parseShoppingItem('2 kg chicken')).toEqual({ quantity: 2, unit: 'kg', name: 'chicken' })
    expect(parseShoppingItem('Eggs x12')).toEqual({ quantity: 12, unit: null, name: 'Eggs' })
    expect(parseShoppingItem('1,5 l milk')).toEqual({ quantity: 1.5, unit: 'l', name: 'milk' })
    expect(parseShoppingItem('Toilet paper')).toEqual({
      quantity: null,
      unit: null,
      name: 'Toilet paper',
    })
  })
  it('guesses categories', () => {
    expect(guessShoppingCategory('Milk')).toBe('Dairy')
    expect(guessShoppingCategory('Toilet paper')).toBe('Household')
    expect(guessShoppingCategory('Batteries')).toBeNull()
  })
})
