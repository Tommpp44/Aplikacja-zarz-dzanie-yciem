import { msg } from '@/lib/i18n/translate'

export type ChecklistCounts = {
  tasks: number
  habits: number
  goals: number
  accounts: number
  events: number
  workouts: number
  notes: number
  journal: number
}

export type ChecklistItem = { id: string; label: string; hint: string; href: string; done: boolean }

/** First-week checklist: small, concrete steps that make LifeOS useful quickly. */
export function buildChecklist(c: ChecklistCounts): ChecklistItem[] {
  return [
    {
      id: 'task',
      label: msg('Capture your first task'),
      hint: msg('Try “Call mom tomorrow at 18:00”'),
      href: '/tasks?view=inbox',
      done: c.tasks > 0,
    },
    {
      id: 'habit',
      label: msg('Create a habit'),
      hint: msg('Start tiny — 1 glass of water counts'),
      href: '/habits?new=1',
      done: c.habits > 0,
    },
    {
      id: 'goal',
      label: msg('Set a goal'),
      hint: msg('Make it measurable'),
      href: '/goals?new=1',
      done: c.goals > 0,
    },
    {
      id: 'account',
      label: msg('Add your main account'),
      hint: msg('Balances follow your transactions'),
      href: '/finances/accounts?new=1',
      done: c.accounts > 0,
    },
    {
      id: 'event',
      label: msg('Plan something in your calendar'),
      hint: msg('Meetings, gym, dinner…'),
      href: '/calendar?view=week',
      done: c.events > 0,
    },
    {
      id: 'workout',
      label: msg('Log a workout'),
      hint: msg('A walk is a workout too'),
      href: '/workouts',
      done: c.workouts > 0,
    },
    {
      id: 'reflect',
      label: msg('Write a note or journal entry'),
      hint: msg('Two sentences are enough'),
      href: '/journal',
      done: c.notes + c.journal > 0,
    },
  ]
}

export function checklistProgress(items: ChecklistItem[]) {
  const done = items.filter((i) => i.done).length
  return { done, total: items.length, complete: done === items.length }
}
