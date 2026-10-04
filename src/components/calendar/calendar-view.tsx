'use client'

import { CheckSquare, ChevronLeft, ChevronRight, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { minutesOfDay } from '@/lib/calendar/expand'
import type { CalendarView as View } from '@/lib/calendar/schemas'
import { colorClass } from '@/lib/colors'
import { formatISODate, relativeDayLabel, weekdayShort, weekdayOf, type ISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { EventDialog, type EventFormValues } from './event-dialog'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'

const VIEW_LABELS = {
  day: msg('Day'),
  week: msg('Week'),
  month: msg('Month'),
  agenda: msg('Agenda'),
} as const

export type CalItem = {
  key: string
  kind: 'event' | 'task'
  id: string
  title: string
  color: string
  startDate: ISODate
  endDate: ISODate
  startTime: string | null
  endTime: string | null
  allDay: boolean
  location?: string | null
  done?: boolean
}

type Props = {
  view: View
  anchor: ISODate
  today: ISODate
  days: ISODate[]
  items: CalItem[]
  events: Record<string, EventFormValues>
  weekStartsOn: 0 | 1
  projects: { id: string; name: string }[]
  nav: { prev: string; next: string; today: string; views: Record<View, string> }
  title: string
}

const HOUR_PX = 48
const START_HOUR = 6

function itemsOn(items: CalItem[], date: ISODate) {
  return items.filter((i) => i.startDate <= date && i.endDate >= date)
}

export function CalendarView(props: Props) {
  const t = useT()
  const { view, today, days, items, nav } = props
  const [dialog, setDialog] = useState<EventFormValues | null>(null)

  const newEvent = (date: ISODate, hour?: number): EventFormValues => {
    const h = hour ?? 9
    const pad = (n: number) => String(n).padStart(2, '0')
    return {
      title: '',
      all_day: false,
      start_date: date,
      start_time: `${pad(h)}:00`,
      end_date: date,
      end_time: `${pad(Math.min(h + 1, 23))}:00`,
      color: 'indigo',
      repeat_rule: null,
    }
  }
  const open = (item: CalItem) => {
    if (item.kind === 'event' && props.events[item.id])
      setDialog({ ...props.events[item.id]!, id: item.id })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={nav.today}>{t('Today')}</Link>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={nav.prev} aria-label={t('Previous')}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={nav.next} aria-label={t('Next')}>
              <ChevronRight />
            </Link>
          </Button>
          <h2 className="text-lg font-semibold tracking-tight">{props.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <nav
            aria-label={t('Calendar view')}
            className="bg-muted inline-flex h-9 items-center gap-0.5 rounded-lg p-[3px]"
          >
            {(['day', 'week', 'month', 'agenda'] as const).map((v) => (
              <Link
                key={v}
                href={nav.views[v]}
                aria-current={view === v ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground hover:text-foreground flex h-full items-center rounded-md px-3 text-[13px] font-medium',
                  view === v && 'bg-card text-foreground shadow-xs',
                )}
              >
                {t(VIEW_LABELS[v])}
              </Link>
            ))}
          </nav>
          <Button onClick={() => setDialog(newEvent(view === 'day' ? props.anchor : today))}>
            <Plus /> {t('Event')}
          </Button>
        </div>
      </div>

      {view === 'month' && (
        <MonthGrid {...props} onOpen={open} onCreate={(d) => setDialog(newEvent(d))} />
      )}
      {(view === 'week' || view === 'day') && (
        <TimeGrid
          days={days}
          items={items}
          today={today}
          onOpen={open}
          onCreate={(d, h) => setDialog(newEvent(d, h))}
        />
      )}
      {view === 'agenda' && <Agenda days={days} items={items} today={today} onOpen={open} />}

      {dialog && (
        <EventDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          initial={dialog}
          projects={props.projects}
          weekStartsOn={props.weekStartsOn}
        />
      )}
    </div>
  )
}

function Chip({
  item,
  onOpen,
  compact = false,
}: {
  item: CalItem
  onOpen: (i: CalItem) => void
  compact?: boolean
}) {
  const content = (
    <>
      {item.kind === 'task' ? (
        <CheckSquare className="size-3 shrink-0" aria-hidden />
      ) : (
        <span
          className={cn('size-1.5 shrink-0 rounded-full', colorClass(item.color, 'bg'))}
          aria-hidden
        />
      )}
      {!item.allDay && item.startTime && (
        <span className="tabular text-muted-foreground shrink-0">{item.startTime}</span>
      )}
      <span className={cn('truncate', item.done && 'line-through opacity-60')}>{item.title}</span>
    </>
  )
  const cls = cn(
    'flex w-full min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] hover:bg-accent',
    !compact && 'text-xs',
    item.allDay && item.kind === 'event' && cn(colorClass(item.color, 'soft')),
  )
  return item.kind === 'task' ? (
    <Link href="/tasks?view=scheduled" className={cls}>
      {content}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={() => onOpen(item)}>
      {content}
    </button>
  )
}

function MonthGrid({
  days,
  items,
  today,
  anchor,
  weekStartsOn,
  onOpen,
  onCreate,
}: Props & { onOpen: (i: CalItem) => void; onCreate: (d: ISODate) => void }) {
  const t = useT()
  const weekdays = weekStartsOn === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-medium">
        {weekdays.map((d) => (
          <div key={d} className="py-2">
            {weekdayShort(d, t.locale)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const list = itemsOn(items, d)
          const inMonth = d.slice(0, 7) === anchor.slice(0, 7)
          return (
            <div
              key={d}
              className={cn(
                'group min-h-24 border-r border-b p-1 last:border-r-0 sm:min-h-28',
                !inMonth && 'bg-muted/40',
              )}
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/calendar?view=day&date=${d}`}
                  className={cn(
                    'tabular flex size-6 items-center justify-center rounded-full text-xs',
                    d === today
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : inMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {Number(d.slice(8))}
                </Link>
                <button
                  type="button"
                  aria-label={t('Add event on {date}', { date: d })}
                  onClick={() => onCreate(d)}
                  className="text-muted-foreground rounded p-0.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              <div className="mt-0.5 flex flex-col gap-0.5">
                {list.slice(0, 3).map((i) => (
                  <Chip key={i.key} item={i} onOpen={onOpen} compact />
                ))}
                {list.length > 3 && (
                  <Link
                    href={`/calendar?view=day&date=${d}`}
                    className="text-muted-foreground hover:text-foreground px-1 text-[11px]"
                  >
                    {t('+{n} more', { n: list.length - 3 })}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimeGrid({
  days,
  items,
  today,
  onOpen,
  onCreate,
}: {
  days: ISODate[]
  items: CalItem[]
  today: ISODate
  onOpen: (i: CalItem) => void
  onCreate: (d: ISODate, hour: number) => void
}) {
  const t = useT()
  const hours = useMemo(() => Array.from({ length: 24 - START_HOUR }, (_, i) => i + START_HOUR), [])
  const cols =
    days.length === 1 ? 'grid-cols-[48px_1fr]' : 'grid-cols-[48px_repeat(7,minmax(0,1fr))]'
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className={cn('grid border-b', cols)}>
        <div />
        {days.map((d) => (
          <div key={d} className="border-l px-2 py-2 text-center">
            <p className="text-muted-foreground text-xs">{weekdayShort(weekdayOf(d), t.locale)}</p>
            <p
              className={cn(
                'tabular mx-auto flex size-7 items-center justify-center rounded-full text-sm font-medium',
                d === today && 'bg-primary text-primary-foreground',
              )}
            >
              {Number(d.slice(8))}
            </p>
            <div className="mt-1 flex flex-col gap-0.5">
              {itemsOn(items, d)
                .filter((i) => i.allDay || !i.startTime)
                .map((i) => (
                  <Chip key={i.key} item={i} onOpen={onOpen} compact />
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="max-h-[65vh] overflow-y-auto">
        <div className={cn('relative grid', cols)}>
          <div>
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="text-muted-foreground tabular pr-2 text-right text-[11px]"
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {days.map((d) => (
            <div key={d} className="relative border-l">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-label={t('Add event {date} {time}', { date: d, time: `${h}:00` })}
                  onClick={() => onCreate(d, h)}
                  style={{ height: HOUR_PX }}
                  className="border-border/60 hover:bg-accent/40 block w-full border-b border-dashed"
                />
              ))}
              {itemsOn(items, d)
                .filter((i) => !i.allDay && i.startTime)
                .map((i) => {
                  const start = i.startDate === d ? minutesOfDay(i.startTime!) : 0
                  const end = i.endDate === d && i.endTime ? minutesOfDay(i.endTime) : 24 * 60
                  const top = ((Math.max(start, START_HOUR * 60) - START_HOUR * 60) / 60) * HOUR_PX
                  const height = Math.max(
                    22,
                    ((Math.max(end, start + 30) - Math.max(start, START_HOUR * 60)) / 60) * HOUR_PX,
                  )
                  return (
                    <button
                      key={i.key}
                      type="button"
                      onClick={() => onOpen(i)}
                      style={{ top, height }}
                      className={cn(
                        'absolute inset-x-1 overflow-hidden rounded-md border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-tight',
                        colorClass(i.color, 'soft'),
                        i.kind === 'task' ? 'border-muted-foreground' : 'border-current',
                        colorClass(i.color, 'text'),
                      )}
                    >
                      <span className="text-foreground block truncate font-medium">{i.title}</span>
                      <span className="tabular">
                        {i.startTime}
                        {i.endTime ? `–${i.endTime}` : ''}
                      </span>
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Agenda({
  days,
  items,
  today,
  onOpen,
}: {
  days: ISODate[]
  items: CalItem[]
  today: ISODate
  onOpen: (i: CalItem) => void
}) {
  const t = useT()
  const withItems = days
    .map((d) => ({ d, list: itemsOn(items, d) }))
    .filter((x) => x.list.length > 0)
  if (withItems.length === 0)
    return (
      <EmptyState
        title={t('Nothing scheduled')}
        description={t('Your next 30 days are clear. Add events or give tasks a date.')}
      />
    )
  return (
    <div className="flex flex-col gap-4">
      {withItems.map(({ d, list }) => (
        <section key={d} aria-label={d}>
          <h3
            className={cn(
              'mb-1 text-xs font-semibold',
              d === today ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {relativeDayLabel(d, today, t.locale)} · {formatISODate(d, 'd MMM', t.locale)}
          </h3>
          <ul className="bg-card divide-y rounded-xl border">
            {list.map((i) => (
              <li key={i.key}>
                <button
                  type="button"
                  onClick={() => onOpen(i)}
                  className="hover:bg-accent/60 flex w-full items-center gap-3 px-3 py-2.5 text-left"
                >
                  <span className="tabular text-muted-foreground w-24 shrink-0 text-xs">
                    {i.allDay || !i.startTime
                      ? t('All day')
                      : `${i.startTime}${i.endTime ? `–${i.endTime}` : ''}`}
                  </span>
                  {i.kind === 'task' ? (
                    <CheckSquare className="text-muted-foreground size-4 shrink-0" />
                  ) : (
                    <span
                      className={cn('size-2 shrink-0 rounded-full', colorClass(i.color, 'bg'))}
                    />
                  )}
                  <span
                    className={cn('flex-1 truncate text-sm', i.done && 'line-through opacity-60')}
                  >
                    {i.title}
                  </span>
                  {i.location && (
                    <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
                      <MapPin className="size-3" /> {i.location}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
