import { ArrowLeft, Target } from 'lucide-react'
import type { Metadata } from 'next'
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

export const metadata: Metadata = { title: 'Project' }

export default async function ProjectPage({ params }: PageProps<'/projects/[id]'>) {
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
  const done = tasks.filter((t) => t.status === 'completed' && !t.parent_task_id)
  const progress = projectProgress(tasks)
  const daysLeft = project.deadline ? diffDaysISO(project.deadline, today) : null

  return (
    <>
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Projects
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <Badge variant="secondary">
              {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
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
          label="Progress"
          value={`${Math.round(progress.percent)}%`}
          hint={`${progress.done} of ${progress.total} tasks`}
        />
        <Stat label="Open tasks" value={open.length} />
        <Stat
          label="Deadline"
          value={project.deadline ? formatISODate(project.deadline, 'd MMM yyyy') : '—'}
          hint={
            daysLeft === null
              ? 'No deadline'
              : daysLeft < 0
                ? `${-daysLeft} days overdue`
                : `${daysLeft} days left`
          }
          tone={daysLeft !== null && daysLeft < 0 ? 'negative' : undefined}
        />
        <Stat label="Priority" value={`P${project.priority}`} />
        <Progress value={progress.percent} className="sm:col-span-4" label="Project progress" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="flex flex-col gap-4" aria-label="Tasks">
          <QuickAddBar
            today={today}
            projectId={project.id}
            goalId={project.goal_id ?? undefined}
            placeholder="Add a task to this project"
          />
          <TaskList
            tasks={open}
            today={today}
            options={{ projects, goals }}
            weekStartsOn={prefs.week_start}
            showProject={false}
            emptyTitle="No open tasks"
            emptyDescription="Break the project into small next actions."
          />
          {done.length > 0 && (
            <details className="bg-card rounded-xl border px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">
                Completed ({done.length})
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
              <CardTitle>Linked goal</CardTitle>
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
                  Link this project to a goal to see how it moves you forward.
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
