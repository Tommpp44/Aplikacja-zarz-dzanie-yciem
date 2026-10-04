'use client'

import { Check, Minus, Plus } from 'lucide-react'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { colorClass } from '@/lib/colors'
import { logHabit } from '@/lib/habits/actions'
import { cn } from '@/lib/utils'

type HabitBits = {
  id: string
  name: string
  habit_type: string
  target: number
  unit: string | null
  color: string
}

function step(habit: HabitBits) {
  if (habit.habit_type === 'duration') return 5
  if (habit.habit_type === 'numeric') return habit.target <= 5 ? 0.25 : 1
  return habit.target >= 20 ? 10 : 1
}

/**
 * One-click habit control: a check for yes/no habits, a stepper for amounts.
 * Updates optimistically; the server confirms in the background.
 */
export function HabitCheck({
  habit,
  date,
  value,
  size = 'md',
}: {
  habit: HabitBits
  date: string
  value: number
  size?: 'sm' | 'md'
}) {
  const [, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(value)
  const done = optimistic >= habit.target

  const save = (next: number) =>
    startTransition(async () => {
      const clamped = Math.max(0, Math.round(next * 100) / 100)
      setOptimistic(clamped)
      const result = await logHabit({ habit_id: habit.id, date, value: clamped })
      if (!result.ok) toast.error(result.error)
    })

  if (habit.habit_type === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => save(done ? 0 : 1)}
        aria-pressed={done}
        aria-label={done ? `Undo ${habit.name}` : `Mark ${habit.name} as done`}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full border-2 transition-all',
          size === 'sm' ? 'size-7' : 'size-9',
          done
            ? cn('border-transparent text-white', colorClass(habit.color, 'bg'))
            : 'border-input hover:border-primary/60',
        )}
      >
        {done && <Check className="size-4" strokeWidth={3} />}
      </button>
    )
  }

  const s = step(habit)
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label={`Decrease ${habit.name}`}
        disabled={optimistic <= 0}
        onClick={() => save(optimistic - s)}
        className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md border disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span
        className={cn('tabular min-w-16 text-center text-xs font-medium', done && 'text-success')}
        aria-live="polite"
      >
        {optimistic}/{habit.target}
        {habit.unit ? ` ${habit.unit}` : ''}
      </span>
      <button
        type="button"
        aria-label={`Increase ${habit.name}`}
        onClick={() => save(optimistic + s)}
        className={cn(
          'flex size-7 items-center justify-center rounded-md border',
          done
            ? 'bg-success-soft text-success border-transparent'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {done ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
      </button>
    </div>
  )
}
