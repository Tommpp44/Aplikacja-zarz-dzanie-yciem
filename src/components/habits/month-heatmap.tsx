import {
  addDaysISO,
  endOfMonthISO,
  startOfWeekISO,
  weekdayShort,
  orderedWeekdays,
  type ISODate,
} from '@/lib/dates'
import { colorClass } from '@/lib/colors'
import { isDueOn, isLogComplete, isWeeklyHabit, type HabitLike } from '@/lib/habits/stats'
import { cn } from '@/lib/utils'

/** Month calendar: completed days are filled with the habit colour. */
export function MonthHeatmap({
  habit,
  logs,
  month,
  today,
  weekStartsOn,
}: {
  habit: HabitLike & { color: string }
  logs: { log_date: string; value: number }[]
  month: ISODate
  today: ISODate
  weekStartsOn: 0 | 1
}) {
  const end = endOfMonthISO(month)
  const start = startOfWeekISO(month, weekStartsOn)
  const days: ISODate[] = []
  for (let d = start; d <= end || days.length % 7 !== 0; d = addDaysISO(d, 1)) days.push(d)
  const values = new Map(logs.map((l) => [l.log_date, l.value]))
  return (
    <div>
      <div className="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-[11px]">
        {orderedWeekdays(weekStartsOn).map((d) => (
          <span key={d}>{weekdayShort(d)}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = d.slice(0, 7) === month.slice(0, 7)
          const value = values.get(d) ?? 0
          const done = isLogComplete(habit, value)
          const partial = !done && value > 0
          const due = isWeeklyHabit(habit) || isDueOn(habit, d)
          const missed =
            inMonth && due && !done && d < today && d >= habit.start_date && !isWeeklyHabit(habit)
          return (
            <div
              key={d}
              title={`${d}${value ? ` · ${value}` : ''}`}
              className={cn(
                'tabular flex aspect-square items-center justify-center rounded-md text-xs',
                !inMonth && 'opacity-0',
                done && cn(colorClass(habit.color, 'bg'), 'text-white'),
                partial && colorClass(habit.color, 'soft'),
                missed && 'bg-destructive-soft text-destructive',
                !done && !partial && !missed && 'bg-muted/60 text-muted-foreground',
                d === today && 'ring-ring ring-1',
              )}
            >
              {Number(d.slice(8))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
