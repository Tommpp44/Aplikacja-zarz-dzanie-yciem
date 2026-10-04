'use client'

import { Check } from 'lucide-react'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { colorClass } from '@/lib/colors'
import { addDaysISO, weekdayShort, weekdayOf, type ISODate } from '@/lib/dates'
import { logHabit } from '@/lib/habits/actions'
import { isDueOn, isLogComplete, isWeeklyHabit, type HabitLike } from '@/lib/habits/stats'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'

/** Mon–Sun strip: ✓ done, ✕ missed, · not scheduled. Past days are clickable. */
export function WeekGrid({
  habit,
  logs,
  weekStart,
  today,
}: {
  habit: HabitLike & { id: string; name: string; color: string; habit_type: string }
  logs: { log_date: string; value: number }[]
  weekStart: ISODate
  today: ISODate
}) {
  const t = useT()
  const [, startTransition] = useTransition()
  const [optimisticLogs, apply] = useOptimistic(
    logs,
    (state, change: { date: string; value: number }) => [
      ...state.filter((l) => l.log_date !== change.date),
      ...(change.value > 0 ? [{ log_date: change.date, value: change.value }] : []),
    ],
  )
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))

  return (
    <div
      className="flex gap-1"
      role="group"
      aria-label={t('{name} this week', { name: habit.name })}
    >
      {days.map((d) => {
        const value = optimisticLogs.find((l) => l.log_date === d)?.value ?? 0
        const done = isLogComplete(habit, value)
        const future = d > today
        const due = isWeeklyHabit(habit) || isDueOn(habit, d)
        const missed = !done && due && d < today && !isWeeklyHabit(habit)
        const label = `${weekdayShort(weekdayOf(d), t.locale)} ${d}: ${done ? t('done') : missed ? t('missed') : future ? t('upcoming') : due ? t('open') : t('not scheduled')}`
        return (
          <button
            key={d}
            type="button"
            disabled={future || d < habit.start_date}
            aria-label={label}
            title={label}
            onClick={() =>
              startTransition(async () => {
                const next = done ? 0 : habit.target
                apply({ date: d, value: next })
                const r = await logHabit({ habit_id: habit.id, date: d, value: next })
                if (!r.ok) toast.error(t(r.error))
              })
            }
            className={cn(
              'flex size-7 flex-col items-center justify-center rounded-md text-[10px] font-medium transition-colors disabled:cursor-default',
              done && cn(colorClass(habit.color, 'bg'), 'text-white'),
              !done && missed && 'bg-destructive-soft text-destructive',
              !done &&
                !missed &&
                due &&
                !future &&
                'bg-muted text-muted-foreground hover:bg-accent',
              !done && (!due || future) && 'text-muted-foreground border border-dashed',
              d === today && !done && 'ring-ring ring-1',
            )}
          >
            {done ? (
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            ) : (
              weekdayShort(weekdayOf(d), t.locale)!.slice(0, 2)
            )}
          </button>
        )
      })}
    </div>
  )
}
