import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const quickAddTask = vi.fn()
vi.mock('@/lib/tasks/actions', () => ({
  quickAddTask: (...args: unknown[]) => quickAddTask(...args),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const { QuickAddBar } = await import('./quick-add-bar')

describe('QuickAddBar', () => {
  beforeEach(() => quickAddTask.mockReset())

  it('previews parsed date, priority and tags while typing', async () => {
    render(<QuickAddBar today="2026-10-04" />)
    await userEvent.type(
      screen.getByLabelText('Quick add task'),
      'Buy groceries tomorrow at 18:00 p2 @errands',
    )
    expect(screen.getByText('Tomorrow 18:00')).toBeInTheDocument()
    expect(screen.getByText('P2')).toBeInTheDocument()
    expect(screen.getByText('errands')).toBeInTheDocument()
  })

  it('submits on Enter and clears the input', async () => {
    quickAddTask.mockResolvedValue({
      ok: true,
      data: { id: 't1', title: 'Call mom', due_date: null },
    })
    const onCreated = vi.fn()
    render(<QuickAddBar today="2026-10-04" projectId="p1" onCreated={onCreated} />)
    const input = screen.getByLabelText('Quick add task')
    await userEvent.type(input, 'Call mom{Enter}')
    expect(quickAddTask).toHaveBeenCalledWith({
      text: 'Call mom',
      project_id: 'p1',
      goal_id: undefined,
      parent_task_id: undefined,
      defaults: undefined,
    })
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(input).toHaveValue('')
  })

  it('does not submit empty input', async () => {
    render(<QuickAddBar today="2026-10-04" />)
    await userEvent.type(screen.getByLabelText('Quick add task'), '   {Enter}')
    expect(quickAddTask).not.toHaveBeenCalled()
  })
})
