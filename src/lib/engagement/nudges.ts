import { msg } from '@/lib/i18n/translate'
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
      title: msg('Your week is almost done'),
      body: msg('Ten minutes to look back: what went well, what to carry into next week.'),
      href: '/reviews?type=weekly',
    }
  }
  if (hour >= 18 && !status.dailyReview) {
    return {
      kind: 'evening',
      title: msg('Wrap up your day'),
      body: status.journal
        ? msg('Note a highlight and set yourself up for tomorrow.')
        : msg('Note a highlight, jot a few lines in your journal and set up tomorrow.'),
      href: '/reviews?type=daily',
      journalHref: status.journal ? null : '/journal',
    }
  }
  return null
}

const DAY_MILESTONES = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365]
const WEEK_MILESTONES = [4, 8, 12, 26, 52]

/** Returns the milestone a streak just hit (exact match), otherwise null. */
export function streakMilestone(streak: number, unit: 'days' | 'weeks' = 'days') {
  const list = unit === 'weeks' ? WEEK_MILESTONES : DAY_MILESTONES
  if (list.includes(streak)) return streak
  if (unit === 'days' && streak > 365 && streak % 100 === 0) return streak
  return null
}

/** The most impressive milestone among habits completed today. */
export function bestMilestoneToday(
  items: {
    id: string
    name: string
    doneToday: boolean
    streak: number
    unit: 'days' | 'weeks'
  }[],
) {
  let best: { id: string; name: string; streak: number; unit: 'days' | 'weeks' } | null = null
  for (const i of items) {
    if (!i.doneToday) continue
    const m = streakMilestone(i.streak, i.unit)
    if (m === null) continue
    const score = i.unit === 'weeks' ? m * 7 : m
    const bestScore = best ? (best.unit === 'weeks' ? best.streak * 7 : best.streak) : -1
    if (score > bestScore) best = { id: i.id, name: i.name, streak: m, unit: i.unit }
  }
  return best
}
