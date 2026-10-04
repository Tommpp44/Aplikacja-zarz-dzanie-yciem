import { CalendarView } from '@/components/calendar/calendar-view'
import { getCalendarItems } from '@/lib/calendar/service'
import { CALENDAR_VIEWS, type CalendarView as View } from '@/lib/calendar/schemas'
import {
  addDaysISO,
  addMonthsISO,
  eachDayISO,
  endOfMonthISO,
  formatISODate,
  isISODate,
  startOfMonthISO,
  startOfWeekISO,
} from '@/lib/dates'
import { listProjectOptions } from '@/lib/projects/repository'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Calendar')

export default async function CalendarPage({ searchParams }: PageProps<'/calendar'>) {
  const t = await getT()
  const sp = await searchParams
  const { supabase, user, today, timezone, prefs } = await getOnboardedUserContext()
  const view: View = CALENDAR_VIEWS.includes(sp.view as View) ? (sp.view as View) : 'week'
  const anchor = typeof sp.date === 'string' && isISODate(sp.date) ? sp.date : today
  const ws = prefs.week_start

  let from: string
  let to: string
  let prev: string
  let next: string
  let title: string
  switch (view) {
    case 'day':
      from = to = anchor
      prev = addDaysISO(anchor, -1)
      next = addDaysISO(anchor, 1)
      title = formatISODate(anchor, 'EEEE, d MMMM yyyy')
      break
    case 'month':
      from = startOfWeekISO(startOfMonthISO(anchor), ws)
      to = addDaysISO(startOfWeekISO(endOfMonthISO(anchor), ws), 6)
      prev = addMonthsISO(startOfMonthISO(anchor), -1)
      next = addMonthsISO(startOfMonthISO(anchor), 1)
      title = formatISODate(anchor, 'MMMM yyyy')
      break
    case 'agenda':
      from = anchor
      to = addDaysISO(anchor, 29)
      prev = addDaysISO(anchor, -30)
      next = addDaysISO(anchor, 30)
      title = `${formatISODate(from, 'd MMM')} – ${formatISODate(to, 'd MMM yyyy')}`
      break
    default:
      from = startOfWeekISO(anchor, ws)
      to = addDaysISO(from, 6)
      prev = addDaysISO(from, -7)
      next = addDaysISO(from, 7)
      title = `${formatISODate(from, 'd MMM')} – ${formatISODate(to, 'd MMM yyyy')}`
  }

  const [{ items, events }, projects] = await Promise.all([
    getCalendarItems(supabase, user.id, from, to, timezone),
    listProjectOptions(supabase, user.id),
  ])
  const href = (v: View, d: string) => `/calendar?view=${v}&date=${d}`

  return (
    <>
      <h1 className="sr-only">{t('Calendar')}</h1>
      <CalendarView
        view={view}
        anchor={anchor}
        today={today}
        days={eachDayISO(from, to)}
        items={items}
        events={events}
        weekStartsOn={ws}
        projects={projects}
        title={title}
        nav={{
          prev: href(view, prev),
          next: href(view, next),
          today: href(view, today),
          views: {
            day: href('day', anchor),
            week: href('week', anchor),
            month: href('month', anchor),
            agenda: href('agenda', anchor),
          },
        }}
      />
    </>
  )
}
