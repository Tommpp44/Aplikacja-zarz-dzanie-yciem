import { describe, expect, it } from 'vitest'
import { zonedToUtc } from '@/lib/dates'
import { expandEvents, occurrencesOn } from './expand'

const TZ = 'Europe/Warsaw'
const ev = (p: Partial<Parameters<typeof expandEvents>[0][number]>) => ({
  id: 'e1',
  title: 'Event',
  starts_at: zonedToUtc('2026-10-05', '09:00', TZ).toISOString(),
  ends_at: zonedToUtc('2026-10-05', '10:00', TZ).toISOString(),
  all_day: false,
  repeat_rule: null,
  repeat_until: null,
  color: 'indigo',
  ...p,
})

describe('expandEvents', () => {
  it('returns single events in range with local times', () => {
    const [o] = expandEvents([ev({})], '2026-10-01', '2026-10-31', TZ)
    expect(o).toMatchObject({ startDate: '2026-10-05', startTime: '09:00', endTime: '10:00' })
    expect(expandEvents([ev({})], '2026-11-01', '2026-11-30', TZ)).toHaveLength(0)
  })

  it('keeps local time across DST for recurring events', () => {
    const occ = expandEvents(
      [ev({ repeat_rule: { freq: 'weekly', interval: 1 } })],
      '2026-10-19',
      '2026-11-02',
      TZ,
    )
    expect(occ.map((o) => o.startDate)).toEqual(['2026-10-19', '2026-10-26', '2026-11-02'])
    // 09:00 CEST = 07:00Z, 09:00 CET = 08:00Z
    expect(occ[0]!.start.toISOString()).toBe('2026-10-19T07:00:00.000Z')
    expect(occ[1]!.start.toISOString()).toBe('2026-10-26T08:00:00.000Z')
  })

  it('respects repeat_until', () => {
    expect(
      expandEvents(
        [ev({ repeat_rule: { freq: 'daily', interval: 1 }, repeat_until: '2026-10-07' })],
        '2026-10-01',
        '2026-10-31',
        TZ,
      ),
    ).toHaveLength(3)
  })

  it('handles multi-day all-day events (exclusive end)', () => {
    const trip = ev({
      all_day: true,
      starts_at: zonedToUtc('2026-10-10', '00:00', TZ).toISOString(),
      ends_at: zonedToUtc('2026-10-13', '00:00', TZ).toISOString(),
    })
    const occ = expandEvents([trip], '2026-10-12', '2026-10-20', TZ)
    expect(occ).toHaveLength(1)
    expect(occ[0]).toMatchObject({ startDate: '2026-10-10', endDate: '2026-10-12' })
    expect(occurrencesOn(occ, '2026-10-12')).toHaveLength(1)
    expect(occurrencesOn(occ, '2026-10-13')).toHaveLength(0)
  })
})
