import { describe, expect, it } from 'vitest'
import { parseIcs, parseRRule } from './ics'

const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'UID:one@example.com',
  'DTSTART;TZID=Europe/Warsaw:20261005T090000',
  'DTEND;TZID=Europe/Warsaw:20261005T100000',
  'SUMMARY:Stand-up\\, team',
  'LOCATION:Office',
  'DESCRIPTION:Line one\\nline two that is folded',
  '  and continued',
  'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261231T000000Z',
  'BEGIN:VALARM',
  'DESCRIPTION:Reminder',
  'END:VALARM',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:two@example.com',
  'DTSTART;VALUE=DATE:20261010',
  'DTEND;VALUE=DATE:20261012',
  'SUMMARY:Weekend trip',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:three@example.com',
  'DTSTART:20261006T120000Z',
  'DURATION:PT1H30M',
  'SUMMARY:Call',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:one@example.com',
  'RECURRENCE-ID;TZID=Europe/Warsaw:20261007T090000',
  'DTSTART;TZID=Europe/Warsaw:20261007T110000',
  'SUMMARY:Moved stand-up',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:four@example.com',
  'DTSTART;TZID=Central European Standard Time:20261008T080000',
  'DTEND;TZID=Central European Standard Time:20261008T083000',
  'SUMMARY:Outlook meeting',
  'STATUS:CONFIRMED',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:five@example.com',
  'DTSTART:20261009T080000Z',
  'SUMMARY:Cancelled',
  'STATUS:CANCELLED',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

describe('parseIcs', () => {
  const events = parseIcs(ICS)

  it('parses events and skips overrides and cancelled ones', () => {
    expect(events.map((e) => e.uid)).toEqual([
      'one@example.com',
      'two@example.com',
      'three@example.com',
      'four@example.com',
    ])
  })

  it('handles time zones, escaping, folding and recurrence', () => {
    expect(events[0]).toMatchObject({
      title: 'Stand-up, team',
      location: 'Office',
      description: 'Line one\nline two that is folded and continued',
      startDate: '2026-10-05',
      startTime: '09:00',
      endTime: '10:00',
      timeZone: 'Europe/Warsaw',
      repeatRule: { freq: 'weekly', interval: 1, weekdays: [1, 3] },
      repeatUntil: '2026-12-31',
    })
  })

  it('converts exclusive all-day ends and durations', () => {
    expect(events[1]).toMatchObject({
      allDay: true,
      startDate: '2026-10-10',
      endDate: '2026-10-11',
    })
    expect(events[2]).toMatchObject({ timeZone: 'UTC', startTime: '12:00', endTime: '13:30' })
    expect(events[3]).toMatchObject({ timeZone: 'Europe/Warsaw', startTime: '08:00' })
  })
})

describe('parseRRule', () => {
  it('maps supported rules and rejects complex ones', () => {
    expect(parseRRule('FREQ=MONTHLY;BYMONTHDAY=15;COUNT=3', '2026-01-15')).toEqual({
      rule: { freq: 'monthly', interval: 1, monthDay: 15 },
      until: '2026-03-18',
    })
    expect(parseRRule('FREQ=MONTHLY;BYDAY=2MO', '2026-01-12')).toBeNull()
    expect(parseRRule('FREQ=YEARLY;INTERVAL=2', '2026-01-01')?.rule).toEqual({
      freq: 'yearly',
      interval: 2,
    })
  })
})
