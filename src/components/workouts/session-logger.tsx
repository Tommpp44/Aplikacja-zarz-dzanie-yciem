'use client'

import { Check, Plus, Trophy, X } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { useServerAction } from '@/hooks/use-server-action'
import { kgToDisplay, weightUnit, type Units } from '@/lib/units'
import {
  addExerciseToWorkout,
  addSet,
  deleteSet,
  removeWorkoutExercise,
  updateSet,
} from '@/lib/workouts/actions'
import { estimatedOneRepMax, totalVolume } from '@/lib/workouts/stats'
import { cn } from '@/lib/utils'

type SetRow = {
  id: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  completed: boolean
}
type ExerciseBlock = {
  id: string
  exercise: { id: string; name: string; category: string; muscle_group: string | null } | null
  sets: SetRow[]
}

function round(n: number) {
  return Math.round(n * 10) / 10
}

function SetLine({
  set,
  units,
  previousBest,
}: {
  set: SetRow
  units: Units
  previousBest?: number
}) {
  const [state, setState] = useState({
    weight: set.weight_kg === null ? '' : String(round(kgToDisplay(set.weight_kg, units))),
    reps: set.reps === null ? '' : String(set.reps),
    rpe: set.rpe === null ? '' : String(set.rpe),
    completed: set.completed,
  })
  const [, startTransition] = useTransition()
  const [, run] = useServerAction()
  const save = (patch: Partial<typeof state>) => {
    const next = { ...state, ...patch }
    setState(next)
    startTransition(async () => {
      const r = await updateSet({
        id: set.id,
        weight: next.weight === '' ? null : Number(next.weight.replace(',', '.')),
        reps: next.reps === '' ? null : Math.round(Number(next.reps)),
        rpe: next.rpe === '' ? null : Number(next.rpe.replace(',', '.')),
        completed: next.completed,
      })
      if (!r.ok) toast.error(r.error)
    })
  }
  const weightKg = state.weight ? Number(state.weight.replace(',', '.')) : 0
  const e1rm = estimatedOneRepMax(
    units === 'imperial' ? weightKg * 0.45359237 : weightKg,
    Number(state.reps) || 0,
  )
  const pr =
    state.completed && previousBest !== undefined && previousBest > 0 && e1rm > previousBest
  const inputCls =
    'h-9 w-full rounded-md border border-input bg-card px-2 text-center text-sm tabular outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'

  return (
    <tr className={cn(state.completed && 'bg-success-soft/50')}>
      <td className="text-muted-foreground tabular py-1 pr-2 text-center text-xs">
        {set.set_number}
      </td>
      <td className="px-1 py-1">
        <input
          aria-label={`Set ${set.set_number} weight`}
          inputMode="decimal"
          className={inputCls}
          value={state.weight}
          onChange={(e) => setState({ ...state, weight: e.target.value })}
          onBlur={() => save({})}
        />
      </td>
      <td className="px-1 py-1">
        <input
          aria-label={`Set ${set.set_number} reps`}
          inputMode="numeric"
          className={inputCls}
          value={state.reps}
          onChange={(e) => setState({ ...state, reps: e.target.value })}
          onBlur={() => save({})}
        />
      </td>
      <td className="hidden px-1 py-1 sm:table-cell">
        <input
          aria-label={`Set ${set.set_number} RPE`}
          inputMode="decimal"
          className={inputCls}
          value={state.rpe}
          placeholder="–"
          onChange={(e) => setState({ ...state, rpe: e.target.value })}
          onBlur={() => save({})}
        />
      </td>
      <td className="px-1 py-1 text-center">
        <button
          type="button"
          aria-pressed={state.completed}
          aria-label={
            state.completed ? `Set ${set.set_number} done` : `Mark set ${set.set_number} done`
          }
          onClick={() => save({ completed: !state.completed })}
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md border',
            state.completed
              ? 'bg-success border-transparent text-white'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {pr ? <Trophy className="size-4" /> : <Check className="size-4" />}
        </button>
      </td>
      <td className="pl-1 text-center">
        <button
          type="button"
          aria-label={`Delete set ${set.set_number}`}
          onClick={() => run(() => deleteSet({ id: set.id }))}
          className="text-muted-foreground hover:text-foreground rounded p-1"
        >
          <X className="size-3.5" />
        </button>
      </td>
    </tr>
  )
}

export function SessionLogger({
  workoutId,
  blocks,
  exercises,
  units,
  bests,
}: {
  workoutId: string
  blocks: ExerciseBlock[]
  exercises: { id: string; name: string; muscle_group: string | null }[]
  units: Units
  bests: Record<string, number>
}) {
  const [pending, run] = useServerAction()
  const [selected, setSelected] = useState('')
  const volume = useMemo(() => totalVolume(blocks.flatMap((b) => b.sets)), [blocks])
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b) => (
        <section
          key={b.id}
          className="bg-card rounded-xl border p-4"
          aria-label={b.exercise?.name ?? 'Exercise'}
        >
          <header className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-medium">{b.exercise?.name}</h3>
              <p className="text-muted-foreground text-xs">
                {b.exercise?.muscle_group}
                {bests[b.exercise?.id ?? '']
                  ? ` · best e1RM ${round(kgToDisplay(bests[b.exercise!.id]!, units))} ${weightUnit(units)}`
                  : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${b.exercise?.name}`}
              onClick={() => run(() => removeWorkoutExercise({ id: b.id }))}
            >
              <X />
            </Button>
          </header>
          <table className="w-full">
            <thead>
              <tr className="text-muted-foreground text-[11px]">
                <th className="w-8 font-medium">Set</th>
                <th className="font-medium">{weightUnit(units)}</th>
                <th className="font-medium">Reps</th>
                <th className="hidden font-medium sm:table-cell">RPE</th>
                <th className="w-12 font-medium">Done</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {b.sets.map((s) => (
                <SetLine
                  key={s.id}
                  set={s}
                  units={units}
                  previousBest={bests[b.exercise?.id ?? '']}
                />
              ))}
            </tbody>
          </table>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            disabled={pending}
            onClick={() => run(() => addSet({ workout_exercise_id: b.id }))}
          >
            <Plus /> Add set
          </Button>
        </section>
      ))}
      <div className="flex flex-col gap-2 rounded-xl border border-dashed p-4 sm:flex-row">
        <NativeSelect
          aria-label="Exercise"
          className="flex-1"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose an exercise…</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.muscle_group ? ` — ${e.muscle_group}` : ''}
            </option>
          ))}
        </NativeSelect>
        <Button
          variant="outline"
          disabled={!selected || pending}
          onClick={() =>
            run(() => addExerciseToWorkout({ workout_id: workoutId, exercise_id: selected }), {
              onSuccess: () => setSelected(''),
            })
          }
        >
          <Plus /> Add exercise
        </Button>
      </div>
      {volume > 0 && (
        <p className="text-muted-foreground text-right text-xs">
          Total volume:{' '}
          <span className="tabular text-foreground font-medium">
            {Math.round(kgToDisplay(volume, units)).toLocaleString('pl-PL')} {weightUnit(units)}
          </span>
        </p>
      )}
    </div>
  )
}
