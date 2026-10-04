import { describe, expect, it } from 'vitest'
import { toPushPayload } from './payload'

describe('toPushPayload', () => {
  it('keeps only same-site links and trims long text', () => {
    expect(toPushPayload({ title: 'Hi', href: '/habits', dedupe_key: 'k' })).toEqual({
      title: 'Hi',
      body: undefined,
      url: '/habits',
      tag: 'k',
    })
    expect(toPushPayload({ title: 'x', href: 'https://evil.example', dedupe_key: 'k' }).url).toBe(
      '/dashboard',
    )
    expect(toPushPayload({ title: 'x', href: '//evil.example', dedupe_key: 'k' }).url).toBe(
      '/dashboard',
    )
    expect(
      toPushPayload({ title: 'a'.repeat(300), body: 'b'.repeat(400), dedupe_key: 'k' }),
    ).toMatchObject({
      title: 'a'.repeat(120),
      body: 'b'.repeat(240),
    })
  })
})
