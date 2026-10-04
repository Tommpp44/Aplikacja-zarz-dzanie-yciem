import { addDaysISO, type ISODate } from '@/lib/dates'

export type ReflectionStatus = { dailyReview: boolean; journal: boolean; weeklyReview: boolean }

export type Nudge =
  | { kind: 'weekly-review'; title: string; body: string; href: string }
  | { kind: 'evening'; title: string; body: string; href: string; journalHref: string | null }

/**
 * A single, gentle prompt to close the loop: the weekly review on the last day
 * of the week, otherwise an evening wrap-up. Never shown once it is done.
 */
export function pickNudge(input: {
  hour: number
  today: ISODate
  weekStart: ISODate
  status: ReflectionStatus
}): Nudge | null {
  const { hour, today, weekStart, status } = input
  const lastDayOfWeek = addDaysISO(weekStart, 6) === today
  if (lastDayOfWeek && hour >= 12 && !status.weeklyReview) {
    return {
      kind: 'weekly-review',
      title: 'Your week is almost done',
      body: 'Ten minutes to look back: what went well, what to carry into next week.',
      href: '/reviews?type=weekly',
    }
  }
  if (hour >= 18 && !status.dailyReview) {
    return {
      kind: 'evening',
      title: 'Wrap up your day',
      body: status.journal
        ? 'Note a highlight and set yourself up for tomorrow.'
        : 'Note a highlight, jot a few lines in your journal and set up tomorrow.',
      href: '/reviews?type=daily',
      journalHref: status.journal ? null : '/journal',
    }
  }
  return null
}
