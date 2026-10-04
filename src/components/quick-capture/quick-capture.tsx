'use client'

import {
  CalendarDays,
  CheckSquare,
  Dumbbell,
  FileText,
  Flame,
  NotebookPen,
  Play,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { EventDialog } from '@/components/calendar/event-dialog'
import { TransactionDialog } from '@/components/finances/transaction-dialog'
import { GoalFormDialog } from '@/components/goals/goal-form-dialog'
import { HabitFormDialog } from '@/components/habits/habit-form-dialog'
import { QuickAddBar } from '@/components/tasks/quick-add-bar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { Skeleton } from '@/components/ui/skeleton'
import { LogWorkoutDialog } from '@/components/workouts/log-workout-dialog'
import { useServerAction } from '@/hooks/use-server-action'
import { useUIStore, type CaptureKind } from '@/hooks/use-ui-store'
import { getCaptureOptions } from '@/lib/search/actions'
import { startWorkout } from '@/lib/workouts/actions'
import type { WorkoutType } from '@/lib/workouts/schemas'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'

type Options = Extract<Awaited<ReturnType<typeof getCaptureOptions>>, { ok: true }>['data']

const ITEMS: { kind: CaptureKind; label: string; icon: LucideIcon; hint: string }[] = [
  { kind: 'task', label: msg('Task'), icon: CheckSquare, hint: msg('Something to do') },
  { kind: 'expense', label: msg('Expense'), icon: Wallet, hint: msg('Money spent or earned') },
  { kind: 'habit', label: msg('Habit'), icon: Flame, hint: msg('Something to repeat') },
  { kind: 'workout', label: msg('Workout'), icon: Dumbbell, hint: msg('Start or log training') },
  { kind: 'note', label: msg('Note'), icon: NotebookPen, hint: msg('Capture a thought') },
  {
    kind: 'event',
    label: msg('Event'),
    icon: CalendarDays,
    hint: msg('Something in your calendar'),
  },
  { kind: 'goal', label: msg('Goal'), icon: Target, hint: msg('An outcome to work towards') },
]

/**
 * Quick capture: available everywhere via "+" (sidebar, mobile nav) or the "c"
 * key. Each form uses smart defaults (today, last account, last category).
 */
export function QuickCapture() {
  const t = useT()
  const menuOpen = useUIStore((s) => s.captureMenuOpen)
  const setMenuOpen = useUIStore((s) => s.setCaptureMenuOpen)
  const capture = useUIStore((s) => s.capture)
  const openCapture = useUIStore((s) => s.openCapture)
  const close = useUIStore((s) => s.closeCapture)
  const [options, setOptions] = useState<Options | null>(null)
  const [pending, run] = useServerAction()
  const router = useRouter()

  useEffect(() => {
    if (!capture || capture === 'note') return
    let cancelled = false
    void getCaptureOptions({}).then((r) => {
      if (!cancelled && r.ok) setOptions(r.data)
    })
    return () => {
      cancelled = true
    }
  }, [capture])

  useEffect(() => {
    if (capture === 'note') {
      close()
      router.push('/notes/new')
    }
  }, [capture, close, router])

  const onOpenChange = (open: boolean) => {
    if (!open) {
      close()
      setOptions(null)
    }
  }

  return (
    <>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Quick capture')}</DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              {t('Press')} <Kbd>c</Kbd> {t('anywhere to open this.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => openCapture(item.kind)}
                  className="bg-card hover:border-primary/50 hover:bg-accent/50 flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors"
                >
                  <Icon className="text-primary size-5" aria-hidden />
                  <span className="text-sm font-medium">{t(item.label)}</span>
                  <span className="text-muted-foreground text-xs">{t(item.hint)}</span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {capture === 'task' && (
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('New task')}</DialogTitle>
              <DialogDescription>
                {t('Try “Buy groceries tomorrow at 18:00 p2 #Home”.')}
              </DialogDescription>
            </DialogHeader>
            {options ? (
              <QuickAddBar today={options.today} autoFocus onCreated={close} />
            ) : (
              <Skeleton className="h-11" />
            )}
          </DialogContent>
        </Dialog>
      )}

      {capture === 'expense' &&
        (options ? (
          <TransactionDialog
            open
            onOpenChange={onOpenChange}
            accounts={options.accounts}
            categories={options.categories}
            today={options.today}
            lastUsed={options.lastUsed}
            defaultType="expense"
          />
        ) : (
          <LoadingDialog onOpenChange={onOpenChange} />
        ))}

      {capture === 'habit' &&
        (options ? (
          <HabitFormDialog
            open
            onOpenChange={onOpenChange}
            goals={options.goals}
            weekStartsOn={options.weekStartsOn}
          />
        ) : (
          <LoadingDialog onOpenChange={onOpenChange} />
        ))}

      {capture === 'goal' &&
        (options ? (
          <GoalFormDialog open onOpenChange={onOpenChange} accounts={options.accounts} />
        ) : (
          <LoadingDialog onOpenChange={onOpenChange} />
        ))}

      {capture === 'event' &&
        (options ? (
          <EventDialog
            open
            onOpenChange={onOpenChange}
            projects={options.projects}
            weekStartsOn={options.weekStartsOn}
            initial={{
              title: '',
              all_day: false,
              start_date: options.today,
              start_time: '09:00',
              end_date: options.today,
              end_time: '10:00',
              color: 'indigo',
              repeat_rule: null,
            }}
          />
        ) : (
          <LoadingDialog onOpenChange={onOpenChange} />
        ))}

      {capture === 'workout' && (
        <WorkoutCapture
          options={options}
          onOpenChange={onOpenChange}
          pending={pending}
          start={(type) =>
            run(() => startWorkout({ workout_type: type }), {
              onSuccess: (d) => {
                close()
                router.push(`/workouts/${d.id}`)
              },
            })
          }
        />
      )}
    </>
  )
}

function WorkoutCapture({
  options,
  onOpenChange,
  start,
  pending,
}: {
  options: Options | null
  onOpenChange: (o: boolean) => void
  start: (t: WorkoutType) => void
  pending: boolean
}) {
  const t = useT()
  const [logging, setLogging] = useState(false)
  if (!options) return <LoadingDialog onOpenChange={onOpenChange} />
  if (logging)
    return (
      <LogWorkoutDialog
        open
        onOpenChange={onOpenChange}
        today={options.today}
        units={options.units}
        goals={options.goals}
        defaultType={(options.lastUsed.workout_type as WorkoutType) ?? 'running'}
      />
    )
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('Workout')}</DialogTitle>
          <DialogDescription>
            {t('Start a live session or log one you already did.')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button disabled={pending} onClick={() => start('strength')}>
            <Play /> {t('Start strength session')}
          </Button>
          <Button variant="outline" onClick={() => setLogging(true)}>
            <FileText /> {t('Log a finished workout')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LoadingDialog({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  const t = useT()
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent aria-busy="true">
        <DialogHeader>
          <DialogTitle>{t('Loading…')}</DialogTitle>
          <DialogDescription className="sr-only">{t('Preparing the form')}</DialogDescription>
        </DialogHeader>
        <Skeleton className="h-9" />
        <Skeleton className="h-24" />
      </DialogContent>
    </Dialog>
  )
}
