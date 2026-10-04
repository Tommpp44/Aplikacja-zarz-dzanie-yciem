import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TaskListItem } from '@/lib/tasks/repository'
import { TaskItem } from './task-item'

const task = (p: Partial<TaskListItem> = {}): TaskListItem =>
  ({
    id: 't1',
    title: 'Prepare report',
    status: 'todo',
    priority: 1,
    due_date: '2026-10-03',
    due_time: '13:00:00',
    repeat_rule: null,
    project: { id: 'p', name: 'Work', color: 'blue' },
    goal: null,
    subtasks: [
      { id: 's1', status: 'completed' },
      { id: 's2', status: 'todo' },
    ],
    task_tags: [{ tag: { id: 'g', name: 'urgent', color: 'slate' } }],
    ...p,
  }) as TaskListItem

describe('TaskItem', () => {
  it('shows due, project, subtask progress and tags', () => {
    render(
      <ul>
        <TaskItem task={task()} today="2026-10-04" onToggle={vi.fn()} onOpen={vi.fn()} />
      </ul>,
    )
    expect(screen.getByText('Yesterday 13:00')).toHaveClass('text-destructive')
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.getByText('urgent')).toBeInTheDocument()
    expect(screen.getByText('P1')).toBeInTheDocument()
  })

  it('toggles completion and opens details', async () => {
    const onToggle = vi.fn()
    const onOpen = vi.fn()
    render(
      <ul>
        <TaskItem task={task()} today="2026-10-04" onToggle={onToggle} onOpen={onOpen} />
      </ul>,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Complete "Prepare report"' }))
    expect(onToggle).toHaveBeenCalledWith(true)
    await userEvent.click(screen.getByText('Prepare report'))
    expect(onOpen).toHaveBeenCalled()
  })
})
