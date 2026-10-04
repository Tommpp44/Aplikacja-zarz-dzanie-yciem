'use client'

import { Clock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useOptimistic, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { useServerAction } from '@/hooks/use-server-action'
import { minutesToLabel, shortTime, WEEKDAY_SHORT } from '@/lib/dates'
import { deleteRoutine, toggleRoutineItem } from '@/lib/routines/actions'
import type { RoutineWithRun } from '@/lib/routines/repository'
import {
  ROUTINE_TYPE_LABELS,
  routineDuration,
  type RoutineInput,
  type RoutineType,
} from '@/lib/routines/schemas'
import { percent } from '@/lib/utils'
import { RoutineFormDialog } from './routine-form-dialog'

export function RoutineCard({
  routine,
  scheduledToday,
  habits,
  weekStartsOn,
}: {
  routine: RoutineWithRun
  scheduledToday: boolean
  habits: { id: string; name: string }[]
  weekStartsOn: 0 | 1
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [, startTransition] = useTransition()
  const [, run] = useServerAction()
  const [done, setDone] = useOptimistic(
    new Set(routine.run?.completed_item_ids ?? []),
    (state, change: { id: string; done: boolean }) => {
      const next = new Set(state)
      if (change.done) next.add(change.id)
      else next.delete(change.id)
      return next
    },
  )
  const completed = routine.items.filter((i) => done.has(i.id)).length
  const total = routine.items.length
  const minutes = routineDuration(routine.items)

  return (
    <article className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-xs">
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-medium">{routine.name}</h2>
            <Badge variant="secondary">
              {ROUTINE_TYPE_LABELS[routine.routine_type as RoutineType]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
            {routine.start_time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {shortTime(routine.start_time)}
              </span>
            )}
            {minutes > 0 && <span>~{minutesToLabel(minutes)}</span>}
            <span>
              {routine.weekdays.length === 7
                ? 'Every day'
                : routine.weekdays.map((d) => WEEKDAY_SHORT[d]).join(', ')}
            </span>
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`${routine.name} actions`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      {total > 0 && (
        <div className="flex items-center gap-3">
          <Progress
            value={percent(completed, total)}
            tone={completed === total ? 'success' : 'primary'}
            label={`${routine.name} progress`}
          />
          <span className="text-muted-foreground tabular text-xs">
            {completed}/{total}
          </span>
        </div>
      )}
      <ol className="flex flex-col gap-0.5">
        {routine.items.map((item) => (
          <li key={item.id}>
            <label className="hover:bg-accent/60 flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5">
              <Checkbox
                checked={done.has(item.id)}
                disabled={!scheduledToday}
                onCheckedChange={(v) =>
                  startTransition(async () => {
                    setDone({ id: item.id, done: v === true })
                    const r = await toggleRoutineItem({
                      routine_id: routine.id,
                      item_id: item.id,
                      done: v === true,
                    })
                    if (!r.ok) toast.error(r.error)
                  })
                }
              />
              <span
                className={`flex-1 text-sm ${done.has(item.id) ? 'text-muted-foreground line-through' : ''}`}
              >
                {item.title}
              </span>
              {item.duration_minutes && (
                <span className="text-muted-foreground text-xs">{item.duration_minutes} min</span>
              )}
            </label>
          </li>
        ))}
      </ol>
      {!scheduledToday && <p className="text-muted-foreground text-xs">Not scheduled today.</p>}
      <RoutineFormDialog
        open={editing}
        onOpenChange={setEditing}
        habits={habits}
        weekStartsOn={weekStartsOn}
        routine={{
          id: routine.id,
          name: routine.name,
          routine_type: routine.routine_type as RoutineInput['routine_type'],
          description: routine.description,
          start_time: shortTime(routine.start_time),
          weekdays: routine.weekdays,
          items: routine.items.map((i) => ({
            id: i.id,
            title: i.title,
            duration_minutes: i.duration_minutes,
            habit_id: i.habit_id,
          })),
        }}
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this routine?"
        description="The routine and its history will be removed. Linked habits are kept."
        onConfirm={() =>
          run(() => deleteRoutine({ id: routine.id }), { success: 'Routine deleted' })
        }
      />
    </article>
  )
}
