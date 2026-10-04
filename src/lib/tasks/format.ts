import { diffDaysISO, relativeDayLabel, shortTime, type ISODate } from '@/lib/dates'

export function dueLabel(dueDate: ISODate | null, dueTime: string | null, today: ISODate) {
  if (!dueDate) return null
  const day = relativeDayLabel(dueDate, today)
  const time = shortTime(dueTime)
  return time ? `${day} ${time}` : day
}

export function dueTone(
  dueDate: ISODate | null,
  today: ISODate,
): 'overdue' | 'today' | 'soon' | 'later' | null {
  if (!dueDate) return null
  const diff = diffDaysISO(dueDate, today)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 2) return 'soon'
  return 'later'
}

export const PRIORITY_RING: Record<number, string> = {
  1: 'border-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive',
  2: 'border-warning data-[state=checked]:bg-warning data-[state=checked]:border-warning',
  3: 'border-primary data-[state=checked]:bg-primary',
  4: '',
}
