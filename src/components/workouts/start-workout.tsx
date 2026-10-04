'use client'

import { ChevronDown, Dumbbell, NotebookPen, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useServerAction } from '@/hooks/use-server-action'
import type { ISODate } from '@/lib/dates'
import type { Units } from '@/lib/units'
import { startWorkout } from '@/lib/workouts/actions'
import type { WorkoutType } from '@/lib/workouts/schemas'
import { LogWorkoutDialog } from './log-workout-dialog'
import { useT } from '@/lib/i18n/client'

/** One tap to start a session; templates and manual logging in the menu. */
export function StartWorkout({
  templates,
  today,
  units,
  goals,
  defaultLogType,
}: {
  templates: { id: string; name: string; workout_type: string }[]
  today: ISODate
  units: Units
  goals: { id: string; title: string }[]
  defaultLogType?: WorkoutType
}) {
  const t = useT()
  const [pending, run] = useServerAction()
  const [logging, setLogging] = useState(false)
  const router = useRouter()
  const start = (input: Parameters<typeof startWorkout>[0]) =>
    run(() => startWorkout(input), { onSuccess: (d) => router.push(`/workouts/${d.id}`) })
  return (
    <div className="flex">
      <Button
        className="rounded-r-none"
        disabled={pending}
        onClick={() => start({ workout_type: 'strength' })}
      >
        <Play /> {t('Start workout')}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="border-primary-foreground/20 rounded-l-none border-l px-2"
            aria-label={t('More ways to start')}
            disabled={pending}
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={() => setLogging(true)}>
            <NotebookPen /> {t('Log a finished workout')}
          </DropdownMenuItem>
          {templates.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t('From template')}</DropdownMenuLabel>
              {templates.map((it) => (
                <DropdownMenuItem
                  key={it.id}
                  onSelect={() =>
                    start({ workout_type: it.workout_type as WorkoutType, template_id: it.id })
                  }
                >
                  <Dumbbell /> {it.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <LogWorkoutDialog
        open={logging}
        onOpenChange={setLogging}
        today={today}
        units={units}
        goals={goals}
        defaultType={defaultLogType}
      />
    </div>
  )
}

export function StartPlannedSession({
  sessionId,
  type,
  label = 'Start',
}: {
  sessionId: string
  type: WorkoutType
  label?: string
}) {
  const [pending, run] = useServerAction()
  const router = useRouter()
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        run(() => startWorkout({ workout_type: type, plan_session_id: sessionId }), {
          onSuccess: (d) => router.push(`/workouts/${d.id}`),
        })
      }
    >
      <Play /> {label}
    </Button>
  )
}
