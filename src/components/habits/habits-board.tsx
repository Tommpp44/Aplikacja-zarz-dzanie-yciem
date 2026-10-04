'use client'

import { Flame, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { ISODate } from '@/lib/dates'
import type { HabitOverviewItem } from '@/lib/habits/service'
import { FREQUENCY_LABELS } from '@/lib/habits/schemas'
import { cn } from '@/lib/utils'
import { HabitCheck } from './habit-check'
import { HabitFormDialog } from './habit-form-dialog'
import { WeekGrid } from './week-grid'

export function HabitsBoard({
  items,
  today,
  weekStart,
  goals,
  weekStartsOn,
  openNew = false,
}: {
  items: HabitOverviewItem[]
  today: ISODate
  weekStart: ISODate
  goals: { id: string; title: string }[]
  weekStartsOn: 0 | 1
  openNew?: boolean
}) {
  const [creating, setCreating] = useState(openNew)
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus /> New habit
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No habits yet"
          description="Start with one tiny habit you can do every day — like drinking water or reading 10 pages."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Create habit
            </Button>
          }
        />
      ) : (
        <ul className="bg-card flex flex-col divide-y rounded-xl border">
          {items.map(({ habit, logs, todayValue, relevantToday, week, stats }) => (
            <li key={habit.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {relevantToday ? (
                  <HabitCheck habit={habit} date={today} value={todayValue} />
                ) : (
                  <span
                    className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed text-[10px]"
                    title="Not scheduled today"
                  >
                    off
                  </span>
                )}
                <Link href={`/habits/${habit.id}`} className="min-w-0 hover:underline">
                  <p className={cn('truncate text-sm font-medium')}>{habit.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {week
                      ? `${week.count}/${week.target} this week`
                      : FREQUENCY_LABELS[habit.frequency as keyof typeof FREQUENCY_LABELS]}
                    {' · '}
                    <span className="tabular">{Math.round(stats.consistency)}%</span> last 30 days
                    {stats.currentStreak > 0 && (
                      <>
                        {' · '}
                        <Flame className="text-warning inline size-3" aria-hidden />{' '}
                        {stats.currentStreak} {stats.streakUnit === 'weeks' ? 'wk' : 'd'}
                      </>
                    )}
                  </p>
                </Link>
              </div>
              <WeekGrid habit={habit} logs={logs} weekStart={weekStart} today={today} />
            </li>
          ))}
        </ul>
      )}
      <HabitFormDialog
        open={creating}
        onOpenChange={setCreating}
        goals={goals}
        weekStartsOn={weekStartsOn}
      />
    </>
  )
}
