import { describe, expect, it } from 'vitest'
import { dailyAgendaEmail, escapeHtml, weeklySummaryEmail } from './templates'

const site = 'https://lifeos.example'

describe('email templates', () => {
  it('escapes user content', () => {
    expect(escapeHtml('<b>"x" & \'y\'</b>')).toBe(
      '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;',
    )
    const mail = dailyAgendaEmail(
      {
        name: 'Ala',
        today: '2026-10-05',
        tasks: [{ title: '<script>alert(1)</script>', time: '09:00', overdue: true }],
        events: [],
        habits: [],
        focus: null,
      },
      'en',
      site,
    )
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&lt;script&gt;')
    expect(mail.text).toContain('09:00 · <script>alert(1)</script> (overdue)')
    expect(mail.subject).toBe('Your day: 1 tasks, 0 events')
    expect(mail.html).toContain(`${site}/today`)
  })

  it('is localized', () => {
    const mail = dailyAgendaEmail(
      {
        name: 'Ala',
        today: '2026-10-05',
        tasks: [],
        events: [],
        habits: ['Woda'],
        focus: 'Raport',
      },
      'pl',
      site,
    )
    expect(mail.text).toContain('Dzień dobry, Ala')
    expect(mail.text).toContain('poniedziałek, 5 października')
    expect(mail.text).toContain('Woda')
  })

  it('summarises a week', () => {
    const mail = weeklySummaryEmail(
      {
        from: '2026-09-28',
        to: '2026-10-04',
        tasks: { completed: 7, created: 9, overdue: 1, completedTitles: ['Report'] },
        habits: { done: 20, due: 25, rate: 80 },
        workouts: { count: 3, minutes: 150, names: [] },
        money: { income: 0, expenses: 120000, savings: 0, savingsRate: 0, currency: 'PLN' },
        events: 4,
        notes: 2,
        projectsCompleted: 0,
        goalsCompleted: 1,
      },
      { name: 'Ala', nextPriorities: ['Ship v2'] },
      'en',
      site,
    )
    expect(mail.subject).toContain('28 Sep – 4 Oct')
    expect(mail.text).toContain('Tasks completed: 7')
    expect(mail.text).toContain('Habits: 20/25 (80%)')
    expect(mail.text).toContain('Workouts: 3 (2 h 30 min)')
    expect(mail.text).toContain('Ship v2')
  })
})
