'use client'

import {
  Archive,
  CheckCircle2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useServerAction } from '@/hooks/use-server-action'
import {
  addMilestone,
  deleteGoal,
  deleteMilestone,
  setGoalStatus,
  toggleMilestone,
  updateGoalProgress,
} from '@/lib/goals/actions'
import type { GoalInput } from '@/lib/goals/schemas'
import { formatISODate } from '@/lib/dates'
import { GoalFormDialog, type GoalFormAccount } from './goal-form-dialog'
import { useT } from '@/lib/i18n/client'

export function GoalActions({
  goal,
  accounts,
}: {
  goal: GoalInput & { id: string }
  accounts: GoalFormAccount[]
}) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, run] = useServerAction()
  const router = useRouter()
  const status = (s: 'active' | 'paused' | 'completed' | 'archived', message: string) =>
    run(() => setGoalStatus({ id: goal.id, status: s }), { success: message })

  return (
    <div className="flex gap-2">
      {goal.status !== 'completed' && (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => status('completed', 'Goal completed — well done!')}
        >
          <CheckCircle2 /> Mark achieved
        </Button>
      )}
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil /> {t('Edit')}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('More goal actions')}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {goal.status === 'active' ? (
            <DropdownMenuItem onSelect={() => status('paused', 'Goal paused')}>
              <Pause /> {t('Pause')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => status('active', 'Goal reactivated')}>
              <Play /> {t('Set active')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => status('archived', 'Goal archived')}>
            <Archive /> {t('Archive')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <GoalFormDialog open={editing} onOpenChange={setEditing} goal={goal} accounts={accounts} />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('Delete this goal?')}
        description={t(
          'Milestones and progress history are deleted. Linked tasks, projects and habits are kept. Archive instead if you want to keep the history.',
        )}
        onConfirm={() =>
          run(() => deleteGoal({ id: goal.id }), {
            success: t('Goal deleted'),
            onSuccess: () => router.push('/goals'),
          })
        }
      />
    </div>
  )
}

export function ProgressUpdater({
  goalId,
  current,
  unit,
}: {
  goalId: string
  current: number
  unit: string | null
}) {
  const t = useT()
  const [value, setValue] = useState(String(current))
  const [note, setNote] = useState('')
  const [pending, run] = useServerAction()
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault()
        const n = Number(value.replace(',', '.'))
        if (!Number.isFinite(n)) return
        run(() => updateGoalProgress({ id: goalId, value: n, note: note || undefined }), {
          success: t('Progress updated'),
          onSuccess: () => setNote(''),
        })
      }}
    >
      <label className="sr-only" htmlFor="goal-value">
        {t('Current value')}
      </label>
      <div className="relative sm:w-40">
        <Input
          id="goal-value"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {unit && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
            {unit}
          </span>
        )}
      </div>
      <Input
        aria-label={t('Note (optional)')}
        placeholder={t('Note (optional)')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
      />
      <Button type="submit" disabled={pending}>
        {t('Update')}
      </Button>
    </form>
  )
}

export function MarkBooleanGoal({ goalId, done }: { goalId: string; done: boolean }) {
  const t = useT()
  const [pending, run] = useServerAction()
  return (
    <Button
      disabled={pending}
      variant={done ? 'outline' : 'default'}
      onClick={() =>
        run(() => updateGoalProgress({ id: goalId, value: done ? 0 : 1 }), {
          success: done ? t('Marked as not done') : t('Marked as done'),
        })
      }
    >
      {done ? t('Mark as not done') : t('Mark as done')}
    </Button>
  )
}

type Milestone = { id: string; title: string; completed_at: string | null; due_date: string | null }

export function MilestoneList({ goalId, milestones }: { goalId: string; milestones: Milestone[] }) {
  const t = useT()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [pending, run] = useServerAction()
  return (
    <div className="flex flex-col gap-3">
      {milestones.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t('Break the goal into a few checkpoints.')}
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {milestones.map((m) => (
            <li key={m.id} className="group flex items-center gap-3 rounded-md px-1 py-1.5">
              <Checkbox
                checked={Boolean(m.completed_at)}
                aria-label={t('Milestone {name}', { name: m.title })}
                onCheckedChange={(v) =>
                  run(() => toggleMilestone({ id: m.id, completed: v === true }), {
                    success: v === true ? t('Milestone reached') : undefined,
                  })
                }
              />
              <span
                className={`flex-1 text-sm ${m.completed_at ? 'text-muted-foreground line-through' : ''}`}
              >
                {m.title}
              </span>
              {m.due_date && (
                <span className="text-muted-foreground text-xs">
                  {formatISODate(m.due_date, 'd MMM', t.locale)}
                </span>
              )}
              <button
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={t('Delete milestone {title}', { title: m.title })}
                onClick={() => run(() => deleteMilestone({ id: m.id }))}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ol>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          run(() => addMilestone({ goal_id: goalId, title, due_date: due || null }), {
            onSuccess: () => {
              setTitle('')
              setDue('')
            },
          })
        }}
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('Add milestone')}
          aria-label={t('Milestone title')}
        />
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label={t('Milestone date')}
          className="w-40"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          disabled={pending}
          aria-label={t('Add milestone')}
        >
          <Plus />
        </Button>
      </form>
    </div>
  )
}
