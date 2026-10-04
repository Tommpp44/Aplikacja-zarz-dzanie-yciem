'use client'

import { CheckCircle2, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useServerAction } from '@/hooks/use-server-action'
import type { ISODate } from '@/lib/dates'
import type { Units } from '@/lib/units'
import { deleteWorkout, finishWorkout, saveWorkoutAsTemplate } from '@/lib/workouts/actions'
import type { WorkoutInput } from '@/lib/workouts/schemas'
import { LogWorkoutDialog } from './log-workout-dialog'

export function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
  const text = `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ''}${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return (
    <span className="tabular font-mono text-sm" aria-label="Elapsed time" role="timer">
      {text}
    </span>
  )
}

export function WorkoutActions({
  workout,
  inProgress,
  today,
  units,
  goals,
}: {
  workout: WorkoutInput & { id: string }
  inProgress: boolean
  today: ISODate
  units: Units
  goals: { id: string; title: string }[]
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, run] = useServerAction()
  const router = useRouter()
  return (
    <div className="flex gap-2">
      {inProgress && (
        <Button
          disabled={pending}
          onClick={() =>
            run(() => finishWorkout({ id: workout.id }), {
              success: 'Workout completed — nice work!',
            })
          }
        >
          <CheckCircle2 /> Finish
        </Button>
      )}
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil /> Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More workout actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() =>
              run(() => saveWorkoutAsTemplate({ id: workout.id, name: workout.name }), {
                success: 'Saved as template',
              })
            }
          >
            <Copy /> Save as template
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogWorkoutDialog
        open={editing}
        onOpenChange={setEditing}
        today={today}
        units={units}
        goals={goals}
        workout={workout}
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this workout?"
        description="All exercises and sets of this session will be removed."
        onConfirm={() =>
          run(() => deleteWorkout({ id: workout.id }), {
            success: 'Workout deleted',
            onSuccess: () => router.push('/workouts'),
          })
        }
      />
    </div>
  )
}
