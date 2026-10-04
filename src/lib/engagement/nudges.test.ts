import { describe, expect, it } from 'vitest'
import { bestMilestoneToday, pickNudge, streakMilestone } from './nudges'

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

describe('streak milestones', () => {
  it('recognises exact milestones only', () => {
    expect(streakMilestone(7)).toBe(7)
    expect(streakMilestone(8)).toBeNull()
    expect(streakMilestone(4, 'weeks')).toBe(4)
    expect(streakMilestone(7, 'weeks')).toBeNull()
    expect(streakMilestone(500)).toBe(500)
  })

  it('picks the biggest milestone among habits done today', () => {
    expect(
      bestMilestoneToday([
        { id: 'a', name: 'Read', doneToday: true, streak: 7, unit: 'days' },
        { id: 'b', name: 'Gym', doneToday: true, streak: 4, unit: 'weeks' },
        { id: 'c', name: 'Water', doneToday: false, streak: 30, unit: 'days' },
      ]),
    ).toMatchObject({ id: 'b', streak: 4 })
    expect(bestMilestoneToday([])).toBeNull()
  })
})
