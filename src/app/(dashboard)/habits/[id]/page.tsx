import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BarsChart } from '@/components/charts/lazy'
import { HabitActions } from '@/components/habits/habit-actions'
import { HabitCheck } from '@/components/habits/habit-check'
import { MonthHeatmap } from '@/components/habits/month-heatmap'
import { LinkedNotes } from '@/components/notes/linked-notes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { addDaysISO, addMonthsISO, formatISODate, startOfMonthISO } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { getHabit, listHabitLogs } from '@/lib/habits/repository'
import { FREQUENCY_LABELS, type HabitInput } from '@/lib/habits/schemas'
import { computeHabitStats, isActiveOn } from '@/lib/habits/stats'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Habit' }

export default async function HabitPage({ params, searchParams }: PageProps<'/habits/[id]'>) {
  const { id } = await params
  const sp = await searchParams
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const row = await getHabit(supabase, user.id, id).catch(() => null)
  if (!row) notFound()
  const habit = { ...row, target: Number(row.target) }
  const month =
    typeof sp.month === 'string' && /^\d{4}-\d{2}$/.test(sp.month)
      ? `${sp.month}-01`
      : startOfMonthISO(today)

  const [logs, goals] = await Promise.all([
    listHabitLogs(supabase, user.id, habit.start_date, today, [id]),
    listGoalOptions(supabase, user.id),
  ])
  const all = computeHabitStats(habit, logs, today, { weekStartsOn: prefs.week_start })
  const last30 = computeHabitStats(habit, logs, today, {
    from: addDaysISO(today, -29),
    weekStartsOn: prefs.week_start,
  })
  const todayValue = logs.find((l) => l.log_date === today)?.value ?? 0
  const unitLabel = all.streakUnit === 'weeks' ? 'weeks' : 'days'
  const prevMonth = addMonthsISO(month, -1).slice(0, 7)
  const nextMonth = addMonthsISO(month, 1).slice(0, 7)

  return (
    <>
      <Link
        href="/habits"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Habits
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {habit.active && isActiveOn(habit, today) && (
            <HabitCheck habit={habit} date={today} value={todayValue} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{habit.name}</h1>
              {!habit.active && <Badge variant="secondary">Archived</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">
              {FREQUENCY_LABELS[habit.frequency as keyof typeof FREQUENCY_LABELS]}
              {habit.habit_type !== 'boolean' &&
                ` · target ${habit.target}${habit.unit ? ` ${habit.unit}` : ''}`}
              {` · since ${formatISODate(habit.start_date, 'd MMM yyyy')}`}
            </p>
          </div>
        </div>
        <HabitActions
          habit={{
            ...(habit as unknown as HabitInput),
            id: habit.id,
            reminder_time: habit.reminder_time?.slice(0, 5) ?? null,
          }}
          active={habit.active}
          goals={goals}
          weekStartsOn={prefs.week_start}
        />
      </div>

      <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Current streak" value={all.currentStreak} hint={unitLabel} />
        <Stat label="Best streak" value={all.bestStreak} hint={unitLabel} />
        <Stat
          label="Completion rate"
          value={`${Math.round(all.completionRate)}%`}
          hint="all time"
        />
        <Stat
          label="Consistency"
          value={`${Math.round(last30.consistency)}%`}
          hint="last 30 days"
        />
        <Stat
          label="Missed"
          value={last30.missedDays}
          hint="days, last 30"
          tone={last30.missedDays > 5 ? 'warning' : undefined}
        />
        <Stat label="Completions" value={all.totalCompletions} hint="total" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{formatISODate(month, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/habits/${id}?month=${prevMonth}`} aria-label="Previous month">
                  <ChevronLeft />
                </Link>
              </Button>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/habits/${id}?month=${nextMonth}`} aria-label="Next month">
                  <ChevronRight />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <MonthHeatmap
              habit={habit}
              logs={logs}
              month={month}
              today={today}
              weekStartsOn={prefs.week_start}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weekly trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BarsChart
              ariaLabel="Weekly completion rate"
              format="percent"
              height={200}
              data={all.weeklyTrend.map((w) => ({
                label: formatISODate(w.weekStart, 'd MMM'),
                rate: Math.round(w.rate),
              }))}
              series={[{ key: 'rate', label: 'Completion' }]}
            />
            {all.monthly.length > 0 && (
              <ul className="mt-4 flex flex-col gap-1 text-sm">
                {all.monthly.slice(-6).map((m) => (
                  <li key={m.month} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {formatISODate(m.month, 'MMMM yyyy')}
                    </span>
                    <span className="tabular font-medium">{Math.round(m.rate)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <LinkedNotes entityType="habit" entityId={habit.id} />
        </div>
      </div>
    </>
  )
}
