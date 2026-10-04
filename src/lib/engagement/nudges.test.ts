import { describe, expect, it } from 'vitest'
import { pickNudge } from './nudges'

const none = { dailyReview: false, journal: false, weeklyReview: false }

describe('pickNudge', () => {
  it('stays quiet during the day', () => {
    expect(
      pickNudge({ hour: 10, today: '2026-10-07', weekStart: '2026-10-05', status: none }),
    ).toBeNull()
  })

  it('suggests an evening wrap-up with a journal link', () => {
    const n = pickNudge({ hour: 19, today: '2026-10-07', weekStart: '2026-10-05', status: none })
    expect(n).toMatchObject({ kind: 'evening', journalHref: '/journal' })
  })

  it('omits the journal link once written and hides after the review', () => {
    const n = pickNudge({
      hour: 20,
      today: '2026-10-07',
      weekStart: '2026-10-05',
      status: { ...none, journal: true },
    })
    expect(n).toMatchObject({ kind: 'evening', journalHref: null })
    expect(
      pickNudge({
        hour: 20,
        today: '2026-10-07',
        weekStart: '2026-10-05',
        status: { ...none, dailyReview: true },
      }),
    ).toBeNull()
  })

  it('prefers the weekly review on the last day of the week', () => {
    const n = pickNudge({ hour: 15, today: '2026-10-11', weekStart: '2026-10-05', status: none })
    expect(n?.kind).toBe('weekly-review')
    const done = pickNudge({
      hour: 19,
      today: '2026-10-11',
      weekStart: '2026-10-05',
      status: { ...none, weeklyReview: true },
    })
    expect(done?.kind).toBe('evening')
  })
})
