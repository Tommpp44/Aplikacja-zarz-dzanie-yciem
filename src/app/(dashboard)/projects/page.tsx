import { FolderKanban } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { NewProjectButton } from '@/components/projects/new-project-button'
import { Badge } from '@/components/ui/badge'
import { ColorDot } from '@/components/ui/color-dot'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Progress } from '@/components/ui/progress'
import { SegmentedLinks } from '@/components/ui/segmented'
import { diffDaysISO, formatISODate } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { listProjects } from '@/lib/projects/repository'
import { PROJECT_STATUS_LABELS, projectProgress, type ProjectStatus } from '@/lib/projects/schemas'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Projects' }

const FILTERS = ['active', 'all', 'completed', 'archived'] as const

export default async function ProjectsPage({ searchParams }: PageProps<'/projects'>) {
  const params = await searchParams
  const filter = FILTERS.includes(params.filter as (typeof FILTERS)[number])
    ? (params.filter as (typeof FILTERS)[number])
    : 'active'
  const { supabase, user, today } = await getOnboardedUserContext()
  const [all, goals] = await Promise.all([
    listProjects(supabase, user.id, true),
    listGoalOptions(supabase, user.id),
  ])
  const projects = all.filter((p) =>
    filter === 'all'
      ? p.status !== 'archived'
      : filter === 'active'
        ? ['planning', 'active', 'on_hold'].includes(p.status)
        : p.status === filter,
  )

  return (
    <>
      <PageHeader
        title="Projects"
        description="Groups of tasks that lead to a result."
        actions={<NewProjectButton goals={goals} defaultOpen={params.new === '1'} />}
      >
        <SegmentedLinks
          label="Project filter"
          active={filter}
          items={FILTERS.map((f) => ({
            value: f,
            label: f[0]!.toUpperCase() + f.slice(1),
            href: `/projects?filter=${f}`,
          }))}
        />
      </PageHeader>
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects here"
          description="Create a project to group related tasks — like “Move to Berlin” or “Launch website”."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const progress = projectProgress(p.tasks)
            const daysLeft = p.deadline ? diffDaysISO(p.deadline, today) : null
            return (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="bg-card hover:border-primary/40 flex h-full flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <ColorDot color={p.color} className="size-2.5" />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <Badge
                      variant={
                        p.status === 'completed'
                          ? 'success'
                          : p.status === 'on_hold'
                            ? 'warning'
                            : 'secondary'
                      }
                    >
                      {PROJECT_STATUS_LABELS[p.status as ProjectStatus]}
                    </Badge>
                  </div>
                  {p.description && (
                    <p className="text-muted-foreground line-clamp-2 text-[13px]">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-auto flex flex-col gap-1.5">
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span className="tabular">
                        {progress.done}/{progress.total} tasks
                      </span>
                      <span className="tabular">{Math.round(progress.percent)}%</span>
                    </div>
                    <Progress value={progress.percent} label={`${p.name} progress`} />
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span className="truncate">{p.goal ? `→ ${p.goal.title}` : ''}</span>
                      {p.deadline && (
                        <span
                          className={
                            daysLeft !== null && daysLeft < 0 && p.status !== 'completed'
                              ? 'text-destructive'
                              : ''
                          }
                        >
                          Due {formatISODate(p.deadline, 'd MMM')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
