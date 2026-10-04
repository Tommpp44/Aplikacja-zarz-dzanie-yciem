import { describe, expect, it } from 'vitest'
import { GOTO_SHORTCUTS, gotoHref, isTypingTarget } from './shortcuts'

describe('shortcuts', () => {
  it('maps keys to routes and has no duplicates', () => {
    expect(gotoHref('t')).toBe('/tasks')
    expect(gotoHref('F')).toBe('/finances')
    expect(gotoHref('x')).toBeNull()
    const keys = GOTO_SHORTCUTS.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('detects typing targets', () => {
    expect(isTypingTarget(document.createElement('input'))).toBe(true)
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true)
    expect(isTypingTarget(document.createElement('div'))).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})
