import { ArrowLeft, Dumbbell, Flame, FolderKanban, Landmark } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TrendChart } from '@/components/charts/lazy'
import {
  GoalActions,
  MarkBooleanGoal,
  MilestoneList,
  ProgressUpdater,
} from '@/components/goals/goal-detail-client'
import { GoalProgressBar, PaceBadge } from '@/components/goals/goal-progress-bar'
import { LinkedNotes } from '@/components/notes/linked-notes'
import { QuickAddBar } from '@/components/tasks/quick-add-bar'
import { TaskList } from '@/components/tasks/task-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { formatISODate } from '@/lib/dates'
import { listAccountOptions } from '@/lib/finance/accounts-repository'
import { getAccountBalancesMajor } from '@/lib/finance/balances'
import { computeGoalPace, computeGoalProgress } from '@/lib/goals/calculations'
import { formatGoalValue } from '@/lib/goals/format'
import { listGoalOptions } from '@/lib/goals/options'
import { getGoal, listProgressLogs } from '@/lib/goals/repository'
import type { GoalInput } from '@/lib/goals/schemas'
import { listProjectOptions } from '@/lib/projects/repository'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { listTasks } from '@/lib/tasks/repository'

export const metadata: Metadata = { title: 'Goal' }

export default async function GoalPage({ params }: PageProps<'/goals/[id]'>) {
  const { id } = await params
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const goal = await getGoal(supabase, user.id, id).catch(() => null)
  if (!goal) notFound()

  const [
    tasks,
    logs,
    accounts,
    projectOptions,
    goalOptions,
    linkedProjects,
    linkedHabits,
    linkedWorkouts,
    balances,
  ] = await Promise.all([
    listTasks(supabase, user.id, today, { goalId: id }),
    listProgressLogs(supabase, user.id, id, 200),
    listAccountOptions(supabase, user.id),
    listProjectOptions(supabase, user.id),
    listGoalOptions(supabase, user.id),
    supabase.from('projects').select('id, name, status').eq('user_id', user.id).eq('goal_id', id),
    supabase.from('habits').select('id, name, active').eq('user_id', user.id).eq('goal_id', id),
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('goal_id', id),
    goal.linked_account_id
      ? getAccountBalancesMajor(supabase, user.id)
      : Promise.resolve(new Map<string, number>()),
  ])

  const milestones = [...goal.milestones].sort((a, b) => a.position - b.position)
  const progress = computeGoalProgress(goal, {
    accountBalance: goal.linked_account_id ? (balances.get(goal.linked_account_id) ?? 0) : null,
    milestones,
    tasks,
  })
  const pace = computeGoalPace(goal, progress, today, logs)
  const account = accounts.find((a) => a.id === goal.linked_account_id)
  const unit =
    goal.progress_source === 'tasks'
      ? 'tasks'
      : goal.progress_source === 'milestones'
        ? 'milestones'
        : goal.unit
  const fmt = (v: number) => formatGoalValue(v, unit)
  const openTasks = tasks.filter((t) => !['completed', 'cancelled'].includes(t.status))
  const chartData = [...logs]
    .reverse()
    .map((l) => ({
      label: formatISODate(l.logged_at.slice(0, 10), 'd MMM'),
      value: Number(l.value),
    }))

  return (
    <>
      <Link
        href="/goals"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Goals
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{goal.title}</h1>
            <PaceBadge pace={pace} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm capitalize">
            {goal.category}
            {goal.description ? <span className="normal-case"> · {goal.description}</span> : null}
          </p>
        </div>
        <GoalActions
          goal={{
            ...(goal as unknown as GoalInput),
            id: goal.id,
            status: goal.status as GoalInput['status'] & string,
          }}
          accounts={accounts}
        />
      </div>

      <section
        aria-label="Progress"
        className="bg-card mb-6 flex flex-col gap-5 rounded-xl border p-5"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Stat
            label="Current"
            value={
              goal.target_type === 'boolean'
                ? progress.done
                  ? 'Done'
                  : 'Not yet'
                : fmt(progress.current)
            }
            size="lg"
            className="col-span-2 md:col-span-1"
          />
          <Stat
            label="Target"
            value={goal.target_type === 'boolean' ? 'Done' : fmt(progress.target)}
          />
          <Stat label="Progress" value={`${progress.percent.toFixed(1)}%`} />
          <Stat
            label="Pace"
            value={
              pace.requiredPerMonth !== null && !progress.done
                ? `${fmt(Math.ceil(pace.requiredPerMonth))}/mo`
                : '—'
            }
            hint={
              pace.requiredPerMonth !== null && !progress.done
                ? 'needed to finish on time'
                : undefined
            }
          />
          <Stat
            label="Expected completion"
            value={
              pace.projectedCompletion
                ? formatISODate(pace.projectedCompletion, 'd MMM yyyy')
                : progress.done
                  ? 'Achieved'
                  : '—'
            }
            hint={
              goal.deadline
                ? `Deadline ${formatISODate(goal.deadline, 'd MMM yyyy')}`
                : 'No deadline'
            }
            tone={
              pace.projectedCompletion && goal.deadline && pace.projectedCompletion > goal.deadline
                ? 'warning'
                : undefined
            }
          />
        </div>
        <GoalProgressBar percent={progress.percent} pace={pace} label="Goal progress" />
        {goal.progress_source === 'manual' &&
          goal.target_type !== 'boolean' &&
          goal.status !== 'completed' && (
            <ProgressUpdater
              goalId={goal.id}
              current={Number(goal.current_value)}
              unit={goal.unit}
            />
          )}
        {goal.progress_source === 'manual' && goal.target_type === 'boolean' && (
          <MarkBooleanGoal goalId={goal.id} done={progress.done} />
        )}
        {goal.progress_source === 'account' && (
          <p className="text-muted-foreground text-sm">
            Tracked automatically from{' '}
            <Link href="/finances/accounts" className="text-primary hover:underline">
              {account?.name ?? 'your account'}
            </Link>{' '}
            balance — every transaction updates this goal.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {goal.progress_source === 'manual' && chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Progress over time</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart
                  data={chartData}
                  ariaLabel="Goal progress over time"
                  format={
                    goal.unit && /^[A-Z]{3}$/.test(goal.unit) ? `money:${goal.unit}` : 'number'
                  }
                />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Tasks for this goal</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <QuickAddBar
                today={today}
                goalId={goal.id}
                placeholder="Add a task that moves this goal forward"
              />
              <TaskList
                tasks={openTasks}
                today={today}
                options={{ projects: projectOptions, goals: goalOptions }}
                weekStartsOn={prefs.week_start}
                emptyTitle="No open tasks"
                emptyDescription="What is the next small step?"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">Progress updates will appear here.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {logs.slice(0, 8).map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="tabular font-medium">{fmt(Number(l.value))}</span>
                        {l.note && <span className="text-muted-foreground ml-2">{l.note}</span>}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {formatISODate(l.logged_at.slice(0, 10), 'd MMM yyyy')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneList goalId={goal.id} milestones={milestones} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Connected</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {account && (
                <Link
                  href="/finances/accounts"
                  className="hover:text-primary flex items-center gap-2"
                >
                  <Landmark className="text-muted-foreground size-4" /> {account.name}
                </Link>
              )}
              {(linkedProjects.data ?? []).map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="hover:text-primary flex items-center gap-2"
                >
                  <FolderKanban className="text-muted-foreground size-4" /> {p.name}
                </Link>
              ))}
              {(linkedHabits.data ?? []).map((h) => (
                <Link
                  key={h.id}
                  href={`/habits/${h.id}`}
                  className="hover:text-primary flex items-center gap-2"
                >
                  <Flame className="text-muted-foreground size-4" /> {h.name}
                </Link>
              ))}
              {(linkedWorkouts.count ?? 0) > 0 && (
                <Link href="/workouts" className="hover:text-primary flex items-center gap-2">
                  <Dumbbell className="text-muted-foreground size-4" /> {linkedWorkouts.count}{' '}
                  workouts
                </Link>
              )}
              {!account &&
                !linkedProjects.data?.length &&
                !linkedHabits.data?.length &&
                !linkedWorkouts.count && (
                  <p className="text-muted-foreground">
                    Link projects, habits, workouts or an account to this goal from their settings.
                  </p>
                )}
            </CardContent>
          </Card>
          <LinkedNotes entityType="goal" entityId={goal.id} />
        </aside>
      </div>
    </>
  )
}
