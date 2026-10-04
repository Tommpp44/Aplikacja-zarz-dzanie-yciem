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
      label: 'Capture your first task',
      hint: 'Try “Call mom tomorrow at 18:00”',
      href: '/tasks?view=inbox',
      done: c.tasks > 0,
    },
    {
      id: 'habit',
      label: 'Create a habit',
      hint: 'Start tiny — 1 glass of water counts',
      href: '/habits?new=1',
      done: c.habits > 0,
    },
    {
      id: 'goal',
      label: 'Set a goal',
      hint: 'Make it measurable',
      href: '/goals?new=1',
      done: c.goals > 0,
    },
    {
      id: 'account',
      label: 'Add your main account',
      hint: 'Balances follow your transactions',
      href: '/finances/accounts?new=1',
      done: c.accounts > 0,
    },
    {
      id: 'event',
      label: 'Plan something in your calendar',
      hint: 'Meetings, gym, dinner…',
      href: '/calendar?view=week',
      done: c.events > 0,
    },
    {
      id: 'workout',
      label: 'Log a workout',
      hint: 'A walk is a workout too',
      href: '/workouts',
      done: c.workouts > 0,
    },
    {
      id: 'reflect',
      label: 'Write a note or journal entry',
      hint: 'Two sentences are enough',
      href: '/journal',
      done: c.notes + c.journal > 0,
    },
  ]
}

export function checklistProgress(items: ChecklistItem[]) {
  const done = items.filter((i) => i.done).length
  return { done, total: items.length, complete: done === items.length }
}
