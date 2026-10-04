import { ArrowLeft, Target } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LinkedNotes } from '@/components/notes/linked-notes'
import { ProjectActions } from '@/components/projects/project-actions'
import { QuickAddBar } from '@/components/tasks/quick-add-bar'
import { TaskList } from '@/components/tasks/task-list'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Stat } from '@/components/ui/stat'
import { diffDaysISO, formatISODate } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { getProject, listProjectOptions } from '@/lib/projects/repository'
import {
  PROJECT_STATUS_LABELS,
  projectProgress,
  type ProjectInput,
  type ProjectStatus,
} from '@/lib/projects/schemas'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { listTasks } from '@/lib/tasks/repository'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Project')

export default async function ProjectPage({ params }: PageProps<'/projects/[id]'>) {
  const t = await getT()
  const { id } = await params
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const project = await getProject(supabase, user.id, id).catch(() => null)
  if (!project) notFound()
  const [tasks, projects, goals] = await Promise.all([
    listTasks(supabase, user.id, today, { projectId: id }),
    listProjectOptions(supabase, user.id),
    listGoalOptions(supabase, user.id),
  ])
  const open = tasks.filter(
    (t) => !['completed', 'cancelled'].includes(t.status) && !t.parent_task_id,
  )
  const done = tasks.filter((it) => it.status === 'completed' && !it.parent_task_id)
  const progress = projectProgress(tasks)
  const daysLeft = project.deadline ? diffDaysISO(project.deadline, today) : null

  return (
    <>
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> {t('Projects')}
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <Badge variant="secondary">
              {t(PROJECT_STATUS_LABELS[project.status as ProjectStatus])}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ProjectActions
            project={{ ...(project as unknown as ProjectInput), id: project.id }}
            goals={goals}
            taskCount={tasks.length}
          />
        </div>
      </div>

      <div className="bg-card mb-6 grid gap-4 rounded-xl border p-5 sm:grid-cols-4">
        <Stat
          label={t('Progress')}
          value={`${Math.round(progress.percent)}%`}
          hint={t('{n} of {value} tasks', { n: progress.done, value: progress.total })}
        />
        <Stat label={t('Open tasks')} value={open.length} />
        <Stat
          label={t('Deadline')}
          value={project.deadline ? formatISODate(project.deadline, 'd MMM yyyy') : '—'}
          hint={
            daysLeft === null
              ? t('No deadline')
              : daysLeft < 0
                ? t.plural(-daysLeft, '{n} day overdue', '{n} days overdue')
                : t.plural(daysLeft, '{n} day left', '{n} days left')
          }
          tone={daysLeft !== null && daysLeft < 0 ? 'negative' : undefined}
        />
        <Stat label={t('Priority')} value={`P${project.priority}`} />
        <Progress
          value={progress.percent}
          className="sm:col-span-4"
          label={t('Project progress')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="flex flex-col gap-4" aria-label={t('Tasks')}>
          <QuickAddBar
            today={today}
            projectId={project.id}
            goalId={project.goal_id ?? undefined}
            placeholder={t('Add a task to this project')}
          />
          <TaskList
            tasks={open}
            today={today}
            options={{ projects, goals }}
            weekStartsOn={prefs.week_start}
            showProject={false}
            emptyTitle={t('No open tasks')}
            emptyDescription={t('Break the project into small next actions.')}
          />
          {done.length > 0 && (
            <details className="bg-card rounded-xl border px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">
                {t('Completed')} ({done.length})
              </summary>
              <div className="mt-3">
                <TaskList
                  tasks={done}
                  today={today}
                  options={{ projects, goals }}
                  weekStartsOn={prefs.week_start}
                  showProject={false}
                />
              </div>
            </details>
          )}
        </section>
        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('Linked goal')}</CardTitle>
            </CardHeader>
            <CardContent>
              {project.goal ? (
                <Link
                  href={`/goals/${project.goal.id}`}
                  className="text-primary flex items-center gap-2 text-sm hover:underline"
                >
                  <Target className="size-4" /> {project.goal.title}
                </Link>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t('Link this project to a goal to see how it moves you forward.')}
                </p>
              )}
            </CardContent>
          </Card>
          <LinkedNotes entityType="project" entityId={project.id} />
        </aside>
      </div>
    </>
  )
}
