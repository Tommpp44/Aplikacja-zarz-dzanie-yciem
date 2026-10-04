import 'server-only'
import { addDaysISO, type ISODate } from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import { listHabitLogs, listHabits } from './repository'
import {
  computeHabitStats,
  isActiveOn,
  isDueOn,
  isLogComplete,
  isOpenToday,
  isWeeklyHabit,
  weekProgress,
  type HabitLog,
} from './stats'

/** Habits with today's state and summary statistics (used by Habits, Today and Dashboard). */
export async function getHabitsOverview(
  db: DB,
  userId: string,
  today: ISODate,
  weekStartsOn: 0 | 1,
  historyDays = 120,
) {
  const habits = await listHabits(db, userId)
  const logs = habits.length
    ? await listHabitLogs(db, userId, addDaysISO(today, -historyDays), today)
    : []
  const byHabit = new Map<string, HabitLog[]>()
  for (const l of logs) byHabit.set(l.habit_id, [...(byHabit.get(l.habit_id) ?? []), l])

  const items = habits.map((habit) => {
    const habitLogs = byHabit.get(habit.id) ?? []
    const h = { ...habit, target: Number(habit.target) }
    const todayValue = habitLogs.find((l) => l.log_date === today)?.value ?? 0
    const relevantToday = isWeeklyHabit(h) ? isActiveOn(h, today) : isDueOn(h, today)
    return {
      habit: h,
      logs: habitLogs,
      todayValue,
      relevantToday,
      doneToday: isLogComplete(h, todayValue),
      openToday: isOpenToday(h, habitLogs, today, weekStartsOn),
      week: isWeeklyHabit(h) ? weekProgress(h, habitLogs, today, weekStartsOn) : null,
      stats: computeHabitStats(h, habitLogs, today, { from: addDaysISO(today, -29), weekStartsOn }),
    }
  })
  const dueToday = items.filter(
    (i) => i.relevantToday && (!i.week || i.week.count < i.week.target || i.doneToday),
  )
  const doneToday = dueToday.filter((i) => i.doneToday)
  return { items, dueCount: dueToday.length, doneCount: doneToday.length }
}

export type HabitOverviewItem = Awaited<ReturnType<typeof getHabitsOverview>>['items'][number]
