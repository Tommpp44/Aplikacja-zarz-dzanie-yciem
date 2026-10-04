import type { ISODate } from '@/lib/dates'

export type TimelineEntry = {
  key: string
  kind: 'event' | 'task' | 'routine' | 'workout'
  id: string
  title: string
  time: string | null
  endTime?: string | null
  color?: string
  done?: boolean
  href?: string
  meta?: string
}

/** Merges everything scheduled today into one ordered timeline ("anytime" items last). */
export function buildTimeline(entries: TimelineEntry[]) {
  const timed = entries
    .filter((e) => e.time)
    .sort((a, b) => a.time!.localeCompare(b.time!) || kindOrder(a.kind) - kindOrder(b.kind))
  const anytime = entries
    .filter((e) => !e.time)
    .sort((a, b) => kindOrder(a.kind) - kindOrder(b.kind))
  return { timed, anytime }
}

function kindOrder(kind: TimelineEntry['kind']) {
  return { routine: 0, event: 1, workout: 2, task: 3 }[kind]
}

/** Index of the first entry that is still ahead of "now" (for the now-marker). */
export function nowIndex(timed: TimelineEntry[], now: string) {
  const i = timed.findIndex((e) => (e.endTime ?? e.time)! >= now)
  return i === -1 ? timed.length : i
}

export function isToday(date: ISODate, today: ISODate) {
  return date === today
}
