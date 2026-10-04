import { describe, expect, it } from 'vitest'
import { buildTimeline, nowIndex, type TimelineEntry } from './timeline'

const e = (p: Partial<TimelineEntry>): TimelineEntry => ({
  key: Math.random().toString(),
  kind: 'task',
  id: 'x',
  title: 't',
  time: null,
  ...p,
})

describe('buildTimeline', () => {
  it('orders timed entries and keeps anytime entries separate', () => {
    const { timed, anytime } = buildTimeline([
      e({ title: 'Gym', kind: 'workout', time: '17:30' }),
      e({ title: 'Morning routine', kind: 'routine', time: '08:00' }),
      e({ title: 'Report', time: '13:00' }),
      e({ title: 'Lunch', kind: 'event', time: '12:30' }),
      e({ title: 'Read', time: null }),
    ])
    expect(timed.map((t) => t.title)).toEqual(['Morning routine', 'Lunch', 'Report', 'Gym'])
    expect(anytime.map((t) => t.title)).toEqual(['Read'])
    expect(nowIndex(timed, '12:45')).toBe(2)
    expect(nowIndex([{ ...timed[1]!, endTime: '13:30' }], '12:45')).toBe(0)
    expect(nowIndex(timed, '23:00')).toBe(4)
  })
})
