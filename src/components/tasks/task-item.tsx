'use client'

import { CalendarClock, GitBranch, Repeat, Tag } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ColorDot } from '@/components/ui/color-dot'
import type { ISODate } from '@/lib/dates'
import type { TaskListItem } from '@/lib/tasks/repository'
import { dueLabel, dueTone, PRIORITY_RING } from '@/lib/tasks/format'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'

export function TaskItem({
  task,
  today,
  onToggle,
  onOpen,
  showProject = true,
}: {
  task: TaskListItem
  today: ISODate
  onToggle: (completed: boolean) => void
  onOpen: () => void
  showProject?: boolean
}) {
  const t = useT()
  const done = task.status === 'completed'
  const label = dueLabel(task.due_date, task.due_time, today)
  const tone = done ? null : dueTone(task.due_date, today)
  const subDone = task.subtasks.filter((s) => s.status === 'completed').length
  const tags = task.task_tags
    .map((it) => it.tag)
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  return (
    <li className="group hover:bg-accent/60 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors">
      <Checkbox
        checked={done}
        onCheckedChange={(v) => onToggle(v === true)}
        aria-label={
          done
            ? t('Mark "{title}" as not done', { title: task.title })
            : t('Complete "{title}"', { title: task.title })
        }
        className={cn('mt-0.5 size-[18px] rounded-full', PRIORITY_RING[task.priority])}
      />
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
      >
        <span className={cn('text-sm leading-5', done && 'text-muted-foreground line-through')}>
          {task.title}
        </span>
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs empty:hidden">
          {label && (
            <span
              className={cn(
                'inline-flex items-center gap-1',
                tone === 'overdue' && 'text-destructive',
                tone === 'today' && 'text-success',
                tone === 'soon' && 'text-warning',
              )}
            >
              <CalendarClock className="size-3" aria-hidden />
              {label}
            </span>
          )}
          {task.repeat_rule && <Repeat className="size-3" aria-label={t('Repeats')} />}
          {task.subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <GitBranch className="size-3" aria-hidden />
              {subDone}/{task.subtasks.length}
            </span>
          )}
          {showProject && task.project && (
            <span className="inline-flex items-center gap-1.5">
              <ColorDot color={task.project.color} />
              {task.project.name}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag.id} className="inline-flex items-center gap-0.5">
              <Tag className="size-3" aria-hidden />
              {tag.name}
            </span>
          ))}
        </span>
      </button>
      {task.priority < 4 && !done && (
        <span className="text-muted-foreground tabular mt-0.5 text-[11px] font-semibold">
          P{task.priority}
        </span>
      )}
    </li>
  )
}
