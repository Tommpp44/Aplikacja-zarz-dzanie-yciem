import { describe, expect, it } from 'vitest'
import { notificationSettingsSchema } from '@/lib/settings/schemas'
import { computeNotifications, type NotificationFacts } from './engine'

const facts: NotificationFacts = {
  today: '2026-10-04',
  nowTime: '09:00',
  tasksDueToday: 3,
  overdueTasks: 1,
  habitsOpenWithReminder: [
    { id: 'h1', name: 'Meditate', reminder_time: '08:00:00' },
    { id: 'h2', name: 'Read', reminder_time: '21:00:00' },
  ],
  plannedWorkouts: [{ id: 'w', title: 'Intervals' }],
  budgets: [
    { id: 'b1', name: 'Food', status: 'warning', month: '2026-10' },
    { id: 'b2', name: 'Fun', status: 'ok', month: '2026-10' },
  ],
  deadlines: [
    { kind: 'goal', id: 'g1', title: 'Emergency fund', deadline: '2026-10-05', daysLeft: 1 },
    { kind: 'project', id: 'p1', title: 'Website', deadline: '2026-11-01', daysLeft: 28 },
  ],
  goalsCompletedToday: [],
  milestonesToday: [],
  recurringDue: [{ id: 'r', name: 'Rent', date: '2026-10-04' }],
  taskReminders: [{ id: 't1', title: 'Call bank', reminder_at: '2026-10-04T07:00:00Z' }],
}

describe('computeNotifications', () => {
  it('creates aggregated, deduplicated notifications for enabled categories', () => {
    const settings = notificationSettingsSchema.parse({ habit_reminders: true })
    const n = computeNotifications(facts, settings)
    expect(n.map((x) => x.dedupe_key)).toEqual([
      'task_overdue:2026-10-04',
      'task_reminder:t1:2026-10-04T07:00:00Z',
      'task_due:2026-10-04',
      'habit:h1:2026-10-04',
      'workout:2026-10-04',
      'budget:b1:warning:2026-10',
      'deadline:goal:g1:2026-10-05',
      'recurring:2026-10-04',
    ])
    expect(n.find((x) => x.kind === 'deadline')!.title).toBe('Emergency fund is due tomorrow')
  })

  it('respects disabled categories (habit reminders are off by default)', () => {
    const n = computeNotifications(
      facts,
      notificationSettingsSchema.parse({ task_reminders: false, budget_warnings: false }),
    )
    expect(
      n.some(
        (x) =>
          x.kind === 'habit_reminder' || x.kind.startsWith('task') || x.kind === 'budget_warning',
      ),
    ).toBe(false)
  })
})
