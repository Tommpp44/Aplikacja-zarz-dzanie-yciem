import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const { isPrivateAddress, normalizeFeedUrl } = await import('./safe-fetch')

describe('SSRF guard', () => {
  it('blocks private and special addresses', () => {
    for (const ip of [
      '127.0.0.1',
      '10.1.2.3',
      '172.16.0.1',
      '192.168.1.1',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      'fd00::1',
      'fe80::1',
      '::ffff:127.0.0.1',
    ])
      expect(isPrivateAddress(ip), ip).toBe(true)
    for (const ip of ['8.8.8.8', '142.250.74.110', '2a00:1450:4001::200e'])
      expect(isPrivateAddress(ip), ip).toBe(false)
  })

  it('accepts https and webcal links only', () => {
    expect(normalizeFeedUrl('webcal://p01-calendars.icloud.com/x.ics').protocol).toBe('https:')
    expect(() => normalizeFeedUrl('http://example.com/cal.ics')).toThrow()
    expect(() => normalizeFeedUrl('file:///etc/passwd')).toThrow()
    expect(() => normalizeFeedUrl('https://user:pw@example.com/cal.ics')).toThrow()
  })
})
