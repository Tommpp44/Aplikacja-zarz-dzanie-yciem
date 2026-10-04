import 'server-only'
import { getCalendarItems } from '@/lib/calendar/service'
import { nowTimeHHmm, shortTime, weekdayOf } from '@/lib/dates'
import { getHabitsOverview } from '@/lib/habits/service'
import { listRoutines } from '@/lib/routines/repository'
import { routineDuration } from '@/lib/routines/schemas'
import type { UserContext } from '@/lib/settings/service'
import { listTasks } from '@/lib/tasks/repository'
import { getTrainingOverview } from '@/lib/workouts/service'
import { buildTimeline, type TimelineEntry } from './timeline'

/** Everything that happens today, from every module, in one structure. */
export async function getTodayData(ctx: UserContext) {
  const { supabase, user, today, timezone, prefs } = ctx
  const [calendar, tasks, habits, routines, training] = await Promise.all([
    getCalendarItems(supabase, user.id, today, today, timezone, { includeTasks: false }),
    listTasks(supabase, user.id, today, { view: 'today' }),
    getHabitsOverview(supabase, user.id, today, prefs.week_start),
    listRoutines(supabase, user.id, today),
    getTrainingOverview(supabase, user.id, today, prefs.week_start),
  ])
  const weekday = weekdayOf(today)
  const todaysRoutines = routines.filter((r) => r.active && r.weekdays.includes(weekday))

  const entries: TimelineEntry[] = [
    ...calendar.items.map((i) => ({
      key: i.key,
      kind: 'event' as const,
      id: i.id,
      title: i.title,
      time: i.allDay ? null : i.startDate < today ? '00:00' : i.startTime,
      endTime: i.allDay ? null : i.endDate > today ? '23:59' : i.endTime,
      color: i.color,
      href: `/calendar?view=day&date=${today}`,
      meta: i.location ?? undefined,
    })),
    ...tasks
      .filter((t) => t.due_date === today)
      .map((t) => ({
        key: `task:${t.id}`,
        kind: 'task' as const,
        id: t.id,
        title: t.title,
        time: shortTime(t.due_time),
        done: t.status === 'completed',
        href: '/tasks?view=today',
        meta: t.project?.name,
      })),
    ...todaysRoutines.map((r) => ({
      key: `routine:${r.id}`,
      kind: 'routine' as const,
      id: r.id,
      title: r.name,
      time: shortTime(r.start_time),
      done: r.items.length > 0 && (r.run?.completed_item_ids.length ?? 0) >= r.items.length,
      href: '/routines',
      meta: r.items.length
        ? `${r.run?.completed_item_ids.length ?? 0}/${r.items.length} steps · ~${routineDuration(r.items)} min`
        : undefined,
    })),
    ...training.todaysSessions
      .filter((s) => s.workout_type !== 'rest')
      .map((s) => ({
        key: `session:${s.id}`,
        kind: 'workout' as const,
        id: s.id,
        title: s.title,
        time: null,
        done: s.done,
        href: '/workouts',
        meta: s.planName,
      })),
  ]
  const focus = prefs.focus_date === today ? prefs.focus_text : null
  return {
    timeline: buildTimeline(entries),
    now: nowTimeHHmm(timezone),
    tasks,
    overdue: tasks.filter((t) => t.due_date !== null && t.due_date < today),
    habits,
    routines: todaysRoutines,
    training,
    events: calendar.items,
    focus,
  }
}
