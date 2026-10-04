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
import { getT, pageTitle } from '@/lib/i18n/server'
import { msg } from '@/lib/i18n/translate'

export const generateMetadata = pageTitle('Tasks')

const VIEW_META: Record<TaskView, { label: string; empty: string; emptyDescription: string }> = {
  inbox: {
    label: msg('Inbox'),
    empty: msg('Inbox zero'),
    emptyDescription: msg('Capture anything on your mind — sort it out later.'),
  },
  today: {
    label: msg('Today'),
    empty: msg('Nothing due today'),
    emptyDescription: msg('Enjoy the space, or pull something from Upcoming.'),
  },
  upcoming: {
    label: msg('Upcoming'),
    empty: msg('Nothing planned for the next two weeks'),
    emptyDescription: msg('Add a date to a task to see it here.'),
  },
  scheduled: {
    label: msg('Scheduled'),
    empty: msg('No scheduled tasks'),
    emptyDescription: msg('Tasks with a due date appear here.'),
  },
  someday: {
    label: msg('Someday'),
    empty: msg('No someday tasks'),
    emptyDescription: msg(msg('Park ideas here with "someday" in Quick Add.')),
  },
  completed: {
    label: msg('Completed'),
    empty: msg('No completed tasks yet'),
    emptyDescription: msg('Completed tasks are listed here, newest first.'),
  },
}

const PAGE_SIZE = 50

export default async function TasksPage({ searchParams }: PageProps<'/tasks'>) {
  const t = await getT()
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
        title={t('Tasks')}
        description={
          counts.overdue > 0
            ? t('{today} due today · {overdue} overdue', {
                today: counts.today,
                overdue: counts.overdue,
              })
            : t('{today} due today · {inbox} in inbox', {
                today: counts.today,
                inbox: counts.inbox,
              })
        }
      >
        <SegmentedLinks
          label={t('Task views')}
          active={view}
          items={TASK_VIEWS.map((v) => ({
            value: v,
            label: t(VIEW_META[v].label),
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
          emptyTitle={t(meta.empty)}
          emptyDescription={t(meta.emptyDescription)}
        />
        {view === 'completed' && (page > 0 || hasMore) && (
          <div className="flex justify-between">
            {page > 0 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tasks?view=completed&page=${page - 1}`}>{t('Newer')}</Link>
              </Button>
            ) : (
              <span />
            )}
            {hasMore && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tasks?view=completed&page=${page + 1}`}>{t('Older')}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
