'use client'

import { CalendarDays, CheckSquare, Dumbbell, Repeat } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { colorClass } from '@/lib/colors'
import { useT } from '@/lib/i18n/client'
import { toggleTaskCompleted } from '@/lib/tasks/actions'
import { nowIndex, type TimelineEntry } from '@/lib/today/timeline'
import { cn } from '@/lib/utils'

const ICONS = { event: CalendarDays, task: CheckSquare, routine: Repeat, workout: Dumbbell }

function Row({
  entry,
  onToggle,
}: {
  entry: TimelineEntry
  onToggle: (e: TimelineEntry, done: boolean) => void
}) {
  const t = useT()
  const Icon = ICONS[entry.kind]
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="tabular text-muted-foreground w-12 shrink-0 pt-0.5 text-right text-sm font-medium">
        {entry.time ?? ''}
      </span>
      <span
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          entry.kind === 'event'
            ? colorClass(entry.color, 'bg')
            : entry.done
              ? 'bg-success'
              : 'bg-muted-foreground/40',
        )}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {entry.kind === 'task' ? (
          <Checkbox
            className="mt-0.5 rounded-full"
            checked={entry.done}
            aria-label={t('Complete {title}', { title: entry.title })}
            onCheckedChange={(v) => onToggle(entry, v === true)}
          />
        ) : (
          <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <Link href={entry.href ?? '#'} className="min-w-0 hover:underline">
          <span
            className={cn(
              'block truncate text-sm font-medium',
              entry.done && 'text-muted-foreground line-through',
            )}
          >
            {entry.title}
          </span>
          {(entry.meta || entry.endTime) && (
            <span className="text-muted-foreground block truncate text-xs">
              {[
                entry.endTime ? t('until {time}', { time: entry.endTime }) : null,
                entry.meta && t(entry.meta),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
        </Link>
      </div>
    </li>
  )
}

export function Timeline({
  timed,
  anytime,
  now,
}: {
  timed: TimelineEntry[]
  anytime: TimelineEntry[]
  now: string
}) {
  const t = useT()
  const [, startTransition] = useTransition()
  const [state, setState] = useOptimistic(
    { timed, anytime },
    (s, change: { key: string; done: boolean }) => ({
      timed: s.timed.map((e) => (e.key === change.key ? { ...e, done: change.done } : e)),
      anytime: s.anytime.map((e) => (e.key === change.key ? { ...e, done: change.done } : e)),
    }),
  )
  const toggle = (entry: TimelineEntry, done: boolean) =>
    startTransition(async () => {
      setState({ key: entry.key, done })
      const r = await toggleTaskCompleted({ id: entry.id, completed: done })
      if (!r.ok) toast.error(t(r.error))
      else if (done) toast.success(t('Task completed'))
    })

  if (state.timed.length === 0 && state.anytime.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t('Nothing scheduled today')}
        description={t('Add an event, give a task a time, or set up a routine to build your day.')}
      />
    )
  }
  const idx = nowIndex(state.timed, now)
  return (
    <div className="flex flex-col gap-6">
      {state.timed.length > 0 && (
        <ol className="relative flex flex-col divide-y" aria-label={t('Timeline')}>
          {state.timed.map((entry, i) => (
            <Fragment key={entry.key}>
              {i === idx && <NowMarker now={now} />}
              <Row entry={entry} onToggle={toggle} />
            </Fragment>
          ))}
          {idx === state.timed.length && <NowMarker now={now} />}
        </ol>
      )}
      {state.anytime.length > 0 && (
        <section aria-label={t('Anytime today')}>
          <h3 className="text-muted-foreground mb-1 text-xs font-semibold">{t('Anytime today')}</h3>
          <ul className="flex flex-col divide-y">
            {state.anytime.map((entry) => (
              <Row key={entry.key} entry={entry} onToggle={toggle} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function NowMarker({ now }: { now: string }) {
  const t = useT()
  return (
    <li className="flex items-center gap-3 py-1" aria-label={t('Now, {time}', { time: now })}>
      <span className="tabular text-destructive w-12 text-right text-xs font-semibold">{now}</span>
      <span className="bg-destructive size-2 rounded-full" aria-hidden />
      <span className="bg-destructive/60 h-px flex-1" aria-hidden />
    </li>
  )
}
