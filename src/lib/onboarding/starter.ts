import { addDaysISO, weekdayOf, type ISODate } from '@/lib/dates'
import type { Locale } from '@/lib/i18n/config'
import { makeT, msg } from '@/lib/i18n/translate'
import type { INTERESTS } from '@/lib/settings/schemas'

export const STARTER_PACKS = ['habits', 'routine', 'goal', 'tasks'] as const
export type StarterPack = (typeof STARTER_PACKS)[number]
type Interest = (typeof INTERESTS)[number]

export const STARTER_PACK_META: Record<StarterPack, { label: string; hint: string }> = {
  habits: {
    label: msg('Three tiny habits'),
    hint: msg('Drink water, read 10 minutes, walk 20 minutes'),
  },
  routine: { label: msg('A morning routine'), hint: msg('Water, stretch, plan the day') },
  goal: { label: msg('A first goal'), hint: msg('Something measurable for this year') },
  tasks: { label: msg('A weekly planning ritual'), hint: msg('Plan your week + a weekly review') },
}

/** Packs pre-selected from the interests picked in step 1. */
export function defaultStarterPacks(interests: readonly Interest[]): StarterPack[] {
  const all = interests.length === 0 || interests.includes('everything')
  const has = (i: Interest) => all || interests.includes(i)
  const out: StarterPack[] = []
  if (has('habits') || has('fitness')) out.push('habits')
  if (has('habits') || has('planning')) out.push('routine')
  if (has('goals') || has('finances')) out.push('goal')
  if (has('productivity') || has('planning')) out.push('tasks')
  return out.length ? out : ['habits', 'tasks']
}

export type StarterPlan = {
  goal: {
    title: string
    category: 'finance' | 'learning'
    target_value: number
    unit: string
    deadline: ISODate
  } | null
  habits: {
    key: 'water' | 'read' | 'walk'
    name: string
    habit_type: 'boolean' | 'duration'
    target: number
    color: string
    linkToGoal: boolean
  }[]
  routine: {
    name: string
    start_time: string
    items: { title: string; duration_minutes: number; habit: 'water' | null }[]
  } | null
  tasks: {
    title: string
    priority: number
    due_date: ISODate
    repeat_rule: { freq: 'weekly'; interval: 1; weekdays: number[] } | null
  }[]
}

/** Pure description of what the selected packs create — localized, no I/O. */
export function buildStarterPlan(input: {
  packs: readonly StarterPack[]
  interests: readonly Interest[]
  today: ISODate
  currency: string
  locale: Locale
  weekStartsOn: 0 | 1
}): StarterPlan {
  const t = makeT(input.locale)
  const has = (p: StarterPack) => input.packs.includes(p)
  const finance = input.interests.includes('finances')
  const yearEnd = `${input.today.slice(0, 4)}-12-31`

  const goal = has('goal')
    ? finance
      ? {
          title: t('Build an emergency fund'),
          category: 'finance' as const,
          target_value: input.currency === 'PLN' ? 10000 : 3000,
          unit: input.currency,
          deadline: yearEnd,
        }
      : {
          title: t('Read 12 books this year'),
          category: 'learning' as const,
          target_value: 12,
          unit: t('books'),
          deadline: yearEnd,
        }
    : null

  const habits: StarterPlan['habits'] = has('habits')
    ? [
        {
          key: 'water',
          name: t('Drink a glass of water'),
          habit_type: 'boolean',
          target: 1,
          color: 'cyan',
          linkToGoal: false,
        },
        {
          key: 'read',
          name: t('Read 10 minutes'),
          habit_type: 'duration',
          target: 10,
          color: 'violet',
          linkToGoal: goal?.category === 'learning',
        },
        {
          key: 'walk',
          name: t('Walk 20 minutes'),
          habit_type: 'duration',
          target: 20,
          color: 'emerald',
          linkToGoal: false,
        },
      ]
    : []

  const routine = has('routine')
    ? {
        name: t('Morning routine'),
        start_time: '07:00',
        items: [
          {
            title: t('Drink a glass of water'),
            duration_minutes: 1,
            habit: has('habits') ? ('water' as const) : null,
          },
          { title: t('Stretch'), duration_minutes: 5, habit: null },
          { title: t('Plan the day'), duration_minutes: 5, habit: null },
        ],
      }
    : null

  // Weekly review on the last day of the user's week.
  const lastWeekday = input.weekStartsOn === 1 ? 0 : 6
  let reviewDay = input.today
  while (weekdayOf(reviewDay) !== lastWeekday) reviewDay = addDaysISO(reviewDay, 1)

  const tasks: StarterPlan['tasks'] = has('tasks')
    ? [
        { title: t('Plan your week'), priority: 2, due_date: input.today, repeat_rule: null },
        {
          title: t('Weekly review'),
          priority: 3,
          due_date: reviewDay,
          repeat_rule: { freq: 'weekly', interval: 1, weekdays: [lastWeekday] },
        },
      ]
    : []

  return { goal, habits, routine, tasks }
}
