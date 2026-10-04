'use client'

import { CheckCircle2 } from 'lucide-react'
import { useOptimistic, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import { relativeDayLabel, type ISODate } from '@/lib/dates'
import { toggleTaskCompleted } from '@/lib/tasks/actions'
import type { TaskListItem } from '@/lib/tasks/repository'
import { TaskDetailSheet } from './task-detail-sheet'
import { TaskItem } from './task-item'
import type { TaskOptions } from './types'
import { useT } from '@/lib/i18n/client'
import type { T } from '@/lib/i18n/translate'

type Grouping = 'none' | 'date' | 'today'

function groupTasks(tasks: TaskListItem[], grouping: Grouping, today: ISODate, t: T) {
  if (grouping === 'none') return [{ key: 'all', label: null as string | null, tasks }]
  const groups = new Map<string, { key: string; label: string | null; tasks: TaskListItem[] }>()
  for (const task of tasks) {
    let key: string
    let label: string
    if (grouping === 'today') {
      const overdue = task.due_date !== null && task.due_date < today
      key = overdue ? 'overdue' : 'today'
      label = overdue ? t('Overdue') : t('Today')
    } else {
      key = task.due_date ?? 'none'
      label = task.due_date ? relativeDayLabel(task.due_date, today, t.locale) : t('No date')
    }
    if (!groups.has(key)) groups.set(key, { key, label, tasks: [] })
    groups.get(key)!.tasks.push(task)
  }
  const list = [...groups.values()]
  if (grouping === 'today') list.sort((a) => (a.key === 'overdue' ? -1 : 1))
  return list
}

export function TaskList({
  tasks,
  today,
  options,
  weekStartsOn,
  grouping = 'none',
  showProject = true,
  emptyTitle = 'Nothing here',
  emptyDescription,
}: {
  tasks: TaskListItem[]
  today: ISODate
  options: TaskOptions
  weekStartsOn: 0 | 1
  grouping?: Grouping
  showProject?: boolean
  emptyTitle?: string
  emptyDescription?: string
}) {
  const t = useT()
  const [openId, setOpenId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(
    tasks,
    (state, change: { id: string; completed: boolean }) =>
      state.map((it) =>
        it.id === change.id ? { ...it, status: change.completed ? 'completed' : 'todo' } : it,
      ),
  )

  const toggle = (task: TaskListItem, completed: boolean) =>
    startTransition(async () => {
      setOptimistic({ id: task.id, completed })
      const result = await toggleTaskCompleted({ id: task.id, completed })
      if (!result.ok) {
        toast.error(t(result.error))
        return
      }
      if (completed) {
        toast.success(
          result.data.nextDueDate
            ? t('Done — next on {date}', {
                date: relativeDayLabel(result.data.nextDueDate, today, t.locale),
              })
            : t('Task completed'),
          result.data.nextDueDate
            ? undefined
            : {
                action: {
                  label: t('Undo'),
                  onClick: () => void toggleTaskCompleted({ id: task.id, completed: false }),
                },
              },
        )
      }
    })

  if (optimistic.length === 0) {
    return <EmptyState icon={CheckCircle2} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {groupTasks(optimistic, grouping, today, t).map((group) => (
          <section key={group.key} aria-label={group.label ?? t('Tasks')}>
            {group.label && (
              <h2
                className={`mb-1 px-2 text-xs font-semibold ${group.key === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {group.label} <span className="tabular font-normal">{group.tasks.length}</span>
              </h2>
            )}
            <ul className="flex flex-col">
              {group.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  today={today}
                  showProject={showProject}
                  onToggle={(c) => toggle(task, c)}
                  onOpen={() => setOpenId(task.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <TaskDetailSheet
        taskId={openId}
        onClose={() => setOpenId(null)}
        today={today}
        options={options}
        weekStartsOn={weekStartsOn}
      />
    </>
  )
}
