import { describe, expect, it } from 'vitest'
import { parseQuickAdd } from './quick-add'

const TODAY = '2026-10-04' // Sunday

describe('parseQuickAdd', () => {
  it('parses the canonical example', () => {
    expect(parseQuickAdd('Buy groceries tomorrow at 18:00', TODAY)).toMatchObject({
      title: 'Buy groceries',
      due_date: '2026-10-05',
      due_time: '18:00',
    })
  })

  it('parses priority, project and tags', () => {
    expect(parseQuickAdd('Call landlord p1 #Move-to-Berlin @phone @urgent', TODAY)).toMatchObject({
      title: 'Call landlord',
      priority: 1,
      project_name: 'Move to Berlin',
      tags: ['phone', 'urgent'],
    })
  })

  it('parses weekdays and relative dates', () => {
    expect(parseQuickAdd('Gym on friday', TODAY).due_date).toBe('2026-10-09')
    expect(parseQuickAdd('Review next monday', TODAY).due_date).toBe('2026-10-12')
    expect(parseQuickAdd('Dentist in 3 days', TODAY).due_date).toBe('2026-10-07')
    expect(parseQuickAdd('Plan trip in 2 weeks', TODAY).due_date).toBe('2026-10-18')
  })

  it('parses explicit dates and rolls past dates into next year', () => {
    expect(parseQuickAdd('Pay taxes 2026-12-01', TODAY).due_date).toBe('2026-12-01')
    expect(parseQuickAdd('Party 24.12', TODAY).due_date).toBe('2026-12-24')
    expect(parseQuickAdd('Renew card 15 jan', TODAY).due_date).toBe('2027-01-15')
    expect(parseQuickAdd('Invoice oct 20', TODAY).due_date).toBe('2026-10-20')
  })

  it('parses 12h times and assumes today', () => {
    expect(parseQuickAdd('Call mom at 6pm', TODAY)).toMatchObject({
      title: 'Call mom',
      due_date: TODAY,
      due_time: '18:00',
    })
  })

  it('parses recurrence', () => {
    expect(parseQuickAdd('Water plants every 3 days', TODAY)).toMatchObject({
      title: 'Water plants',
      repeat_rule: { freq: 'daily', interval: 3 },
      due_date: TODAY,
    })
    expect(parseQuickAdd('Standup every weekday at 9:30', TODAY)).toMatchObject({
      repeat_rule: { freq: 'weekly', weekdays: [1, 2, 3, 4, 5] },
      due_time: '09:30',
    })
    expect(parseQuickAdd('Team sync every tue', TODAY)).toMatchObject({
      repeat_rule: { freq: 'weekly', weekdays: [2] },
      due_date: '2026-10-06',
    })
  })

  it('parses duration and someday', () => {
    expect(parseQuickAdd('Read book for 30 min someday', TODAY)).toMatchObject({
      title: 'Read book',
      duration_minutes: 30,
      is_someday: true,
    })
  })

  it('keeps plain text untouched', () => {
    expect(parseQuickAdd('Write the report', TODAY)).toMatchObject({
      title: 'Write the report',
      due_date: null,
      priority: null,
    })
  })

  it('does not treat e-mail addresses as tags', () => {
    expect(parseQuickAdd('Email jan@example.com', TODAY).tags).toEqual([])
  })
})
