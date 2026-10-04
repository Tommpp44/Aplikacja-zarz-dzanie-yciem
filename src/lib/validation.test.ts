import { describe, expect, it } from 'vitest'
import { optionalDate, optionalUuid } from './validation'

describe('blankable', () => {
  it('normalises blanks to null', () => {
    expect(optionalDate.parse('')).toBeNull()
    expect(optionalDate.parse(null)).toBeNull()
    expect(optionalDate.parse(undefined)).toBeUndefined()
    expect(optionalDate.parse('2026-10-04')).toBe('2026-10-04')
  })
  it('still validates real values', () => {
    expect(optionalUuid.safeParse('nope').success).toBe(false)
    expect(optionalDate.safeParse('2026-13-01').success).toBe(false)
  })
})
