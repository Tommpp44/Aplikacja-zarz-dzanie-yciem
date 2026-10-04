import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { QuickAddBar } from '@/components/tasks/quick-add-bar'
import { TaskFilters } from '@/components/tasks/task-filters'
import { TaskList } from '@/components/tasks/task-list'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented'
import { listGoalOptions } from '@/lib/goals/options'
import { listProjectOptions } from '@/lib/projects/repository'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { countOpenByView, listTags, listTasks } from '@/lib/tasks/repository'
import { TASK_VIEWS, type TaskView } from '@/lib/tasks/schemas'

export const metadata: Metadata = { title: 'Tasks' }

const VIEW_META: Record<TaskView, { label: string; empty: string; emptyDescription: string }> = {
  inbox: {
    label: 'Inbox',
    empty: 'Inbox zero',
    emptyDescription: 'Capture anything on your mind — sort it out later.',
  },
  today: {
    label: 'Today',
    empty: 'Nothing due today',
    emptyDescription: 'Enjoy the space, or pull something from Upcoming.',
  },
  upcoming: {
    label: 'Upcoming',
    empty: 'Nothing planned for the next two weeks',
    emptyDescription: 'Add a date to a task to see it here.',
  },
  scheduled: {
    label: 'Scheduled',
    empty: 'No scheduled tasks',
    emptyDescription: 'Tasks with a due date appear here.',
  },
  someday: {
    label: 'Someday',
    empty: 'No someday tasks',
    emptyDescription: 'Park ideas here with "someday" in Quick Add.',
  },
  completed: {
    label: 'Completed',
    empty: 'No completed tasks yet',
    emptyDescription: 'Completed tasks are listed here, newest first.',
  },
}

const PAGE_SIZE = 50

export default async function TasksPage({ searchParams }: PageProps<'/tasks'>) {
  const params = await searchParams
  const view: TaskView = TASK_VIEWS.includes(params.view as TaskView)
    ? (params.view as TaskView)
    : 'today'
  const page = Math.max(0, Number(params.page) || 0)
  const { supabase, user, today, prefs } = await getOnboardedUserContext()

  const [tasks, counts, projects, goals, tags] = await Promise.all([
    listTasks(supabase, user.id, today, {
      view,
      priority: Number(params.priority) || undefined,
      projectId: typeof params.project === 'string' ? params.project : undefined,
      tagId: typeof params.tag === 'string' ? params.tag : undefined,
      search: typeof params.q === 'string' ? params.q : undefined,
      limit: view === 'completed' ? PAGE_SIZE + 1 : 300,
      offset: view === 'completed' ? page * PAGE_SIZE : 0,
    }),
    countOpenByView(supabase, user.id, today),
    listProjectOptions(supabase, user.id),
    listGoalOptions(supabase, user.id),
    listTags(supabase, user.id),
  ])
  const hasMore = view === 'completed' && tasks.length > PAGE_SIZE
  const visible = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks
  const meta = VIEW_META[view]
  const options = { projects, goals }

  return (
    <>
      <PageHeader
        title="Tasks"
        description={
          counts.overdue > 0
            ? `${counts.today} due today · ${counts.overdue} overdue`
            : `${counts.today} due today · ${counts.inbox} in inbox`
        }
      >
        <SegmentedLinks
          label="Task views"
          active={view}
          items={TASK_VIEWS.map((v) => ({
            value: v,
            label: VIEW_META[v].label,
            href: `/tasks?view=${v}`,
            count: v === 'inbox' ? counts.inbox : v === 'today' ? counts.today : undefined,
          }))}
        />
      </PageHeader>
      <div className="flex flex-col gap-4">
        {view !== 'completed' && (
          <QuickAddBar
            today={today}
            defaults={
              view === 'today'
                ? { due_date: today }
                : view === 'someday'
                  ? { is_someday: true }
                  : undefined
            }
          />
        )}
        <Suspense>
          <TaskFilters options={options} tags={tags} />
        </Suspense>
        <TaskList
          tasks={visible}
          today={today}
          options={options}
          weekStartsOn={prefs.week_start}
          grouping={
            view === 'today'
              ? 'today'
              : view === 'upcoming' || view === 'scheduled'
                ? 'date'
                : 'none'
          }
          emptyTitle={meta.empty}
          emptyDescription={meta.emptyDescription}
        />
        {view === 'completed' && (page > 0 || hasMore) && (
          <div className="flex justify-between">
            {page > 0 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tasks?view=completed&page=${page - 1}`}>Newer</Link>
              </Button>
            ) : (
              <span />
            )}
            {hasMore && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tasks?view=completed&page=${page + 1}`}>Older</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
