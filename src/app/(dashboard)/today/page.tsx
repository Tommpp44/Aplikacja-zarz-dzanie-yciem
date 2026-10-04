import { Flame } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { HabitCheck } from '@/components/habits/habit-check'
import { RoutineCard } from '@/components/routines/routine-card'
import { QuickAddBar } from '@/components/tasks/quick-add-bar'
import { TaskList } from '@/components/tasks/task-list'
import { FocusEditor } from '@/components/today/focus-editor'
import { Timeline } from '@/components/today/timeline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Progress } from '@/components/ui/progress'
import { SegmentedLinks } from '@/components/ui/segmented'
import { StartPlannedSession } from '@/components/workouts/start-workout'
import { formatISODate } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { listProjectOptions } from '@/lib/projects/repository'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { getTodayData } from '@/lib/today/service'
import { percent } from '@/lib/utils'
import type { WorkoutType } from '@/lib/workouts/schemas'

export const metadata: Metadata = { title: 'Today' }

const VIEWS = ['timeline', 'list', 'focus'] as const

export default async function TodayPage({ searchParams }: PageProps<'/today'>) {
  const sp = await searchParams
  const view = VIEWS.includes(sp.view as (typeof VIEWS)[number])
    ? (sp.view as (typeof VIEWS)[number])
    : 'timeline'
  const ctx = await getOnboardedUserContext()
  const { today, prefs, supabase, user } = ctx
  const [data, projects, goals] = await Promise.all([
    getTodayData(ctx),
    listProjectOptions(supabase, user.id),
    listGoalOptions(supabase, user.id),
  ])
  const habitItems = data.habits.items.filter((i) => i.relevantToday)
  const openTasks = data.tasks.filter((t) => !['completed', 'cancelled'].includes(t.status))
  const topTasks = [...openTasks]
    .sort(
      (a, b) => a.priority - b.priority || (a.due_time ?? '99').localeCompare(b.due_time ?? '99'),
    )
    .slice(0, 3)
  const options = { projects, goals }

  return (
    <>
      <PageHeader
        title="Today"
        description={`${formatISODate(today, 'EEEE, d MMMM')} · ${openTasks.length} tasks · ${data.habits.doneCount}/${data.habits.dueCount} habits`}
      >
        <SegmentedLinks
          label="Today view"
          active={view}
          items={[
            { value: 'timeline', label: 'Timeline', href: '/today' },
            { value: 'list', label: 'List', href: '/today?view=list' },
            { value: 'focus', label: 'Focus', href: '/today?view=focus' },
          ]}
        />
      </PageHeader>

      {view === 'focus' ? (
        <div className="mx-auto flex max-w-2xl flex-col gap-8 py-4">
          <FocusEditor focus={data.focus} today={today} size="lg" />
          <section aria-labelledby="top3">
            <h2 id="top3" className="text-muted-foreground mb-3 text-sm font-semibold">
              Most important tasks
            </h2>
            <TaskList
              tasks={topTasks}
              today={today}
              options={options}
              weekStartsOn={prefs.week_start}
              emptyTitle="Nothing urgent"
              emptyDescription="Pick one meaningful task and do it first."
            />
          </section>
          {data.timeline.timed.find((e) => !e.done && e.time! >= data.now) && (
            <section aria-labelledby="next">
              <h2 id="next" className="text-muted-foreground mb-2 text-sm font-semibold">
                Next up
              </h2>
              {(() => {
                const next = data.timeline.timed.find((e) => !e.done && e.time! >= data.now)!
                return (
                  <Link
                    href={next.href ?? '/today'}
                    className="bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-4"
                  >
                    <span className="tabular text-lg font-semibold">{next.time}</span>
                    <span className="font-medium">{next.title}</span>
                  </Link>
                )
              })()}
            </section>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="pt-4">
                <FocusEditor focus={data.focus} today={today} />
              </CardContent>
            </Card>
            {view === 'timeline' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <Timeline
                    timed={data.timeline.timed}
                    anytime={data.timeline.anytime}
                    now={data.now}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                {data.routines.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {data.routines.map((r) => (
                      <RoutineCard
                        key={r.id}
                        routine={r}
                        scheduledToday
                        habits={[]}
                        weekStartsOn={prefs.week_start}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                {data.overdue.length > 0 && (
                  <Badge variant="destructive">{data.overdue.length} overdue</Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <QuickAddBar
                  today={today}
                  defaults={{ due_date: today }}
                  placeholder="Add a task for today"
                />
                <TaskList
                  tasks={openTasks}
                  today={today}
                  options={options}
                  weekStartsOn={prefs.week_start}
                  grouping="today"
                  emptyTitle="All done for today"
                  emptyDescription="Nice. Plan tomorrow or take a break."
                />
              </CardContent>
            </Card>
          </div>
          <aside className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Habits</CardTitle>
                <span className="text-muted-foreground tabular text-xs">
                  {data.habits.doneCount}/{data.habits.dueCount}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {habitItems.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Flame}
                    title="No habits today"
                    description={
                      data.habits.items.length === 0
                        ? 'Start with one tiny habit — consistency beats intensity.'
                        : 'Nothing due today. Enjoy the breathing room.'
                    }
                    action={
                      data.habits.items.length === 0 ? (
                        <Button asChild size="sm">
                          <Link href="/habits?new=1">Create a habit</Link>
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <>
                    <Progress
                      value={percent(data.habits.doneCount, data.habits.dueCount)}
                      tone="success"
                      label="Habits completed today"
                    />
                    <ul className="flex flex-col gap-2">
                      {habitItems.map((i) => (
                        <li key={i.habit.id} className="flex items-center justify-between gap-3">
                          <Link
                            href={`/habits/${i.habit.id}`}
                            className="truncate text-sm hover:underline"
                          >
                            {i.habit.name}
                            {i.week && (
                              <span className="text-muted-foreground ml-1 text-xs">
                                ({i.week.count}/{i.week.target} wk)
                              </span>
                            )}
                          </Link>
                          <HabitCheck habit={i.habit} date={today} value={i.todayValue} size="sm" />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Training</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {data.training.inProgress && (
                  <Link
                    href={`/workouts/${data.training.inProgress.id}`}
                    className="text-warning font-medium hover:underline"
                  >
                    {data.training.inProgress.name} in progress →
                  </Link>
                )}
                {data.training.todaysSessions.length === 0 ? (
                  <p className="text-muted-foreground">No planned session today.</p>
                ) : (
                  data.training.todaysSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <span>{s.title}</span>
                      {s.workout_type === 'rest' ? (
                        <Badge variant="secondary">Rest</Badge>
                      ) : s.done ? (
                        <Badge variant="success">Done</Badge>
                      ) : (
                        <StartPlannedSession
                          sessionId={s.id}
                          type={s.workout_type as WorkoutType}
                        />
                      )}
                    </div>
                  ))
                )}
                <p className="text-muted-foreground text-xs">
                  {data.training.thisWeek.target
                    ? `${data.training.thisWeek.count}/${data.training.thisWeek.target}`
                    : data.training.thisWeek.count}{' '}
                  workouts this week
                  {data.training.activityToday?.steps
                    ? ` · ${data.training.activityToday.steps.toLocaleString('pl-PL')} steps today`
                    : ''}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </>
  )
}
