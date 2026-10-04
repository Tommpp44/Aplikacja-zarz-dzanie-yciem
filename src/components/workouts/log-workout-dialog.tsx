'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { SubmitButton } from '@/components/ui/submit-button'
import { Textarea } from '@/components/ui/textarea'
import { useServerAction } from '@/hooks/use-server-action'
import type { ISODate } from '@/lib/dates'
import { distanceUnit, type Units } from '@/lib/units'
import { createWorkout, updateWorkout } from '@/lib/workouts/actions'
import {
  DISTANCE_TYPES,
  WORKOUT_TYPES,
  WORKOUT_TYPE_LABELS,
  workoutSchema,
  type WorkoutInput,
} from '@/lib/workouts/schemas'
import { useT } from '@/lib/i18n/client'

export function LogWorkoutDialog({
  open,
  onOpenChange,
  today,
  units,
  goals,
  workout,
  defaultType = 'running',
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  today: ISODate
  units: Units
  goals: { id: string; title: string }[]
  workout?: WorkoutInput & { id: string }
  defaultType?: WorkoutInput['workout_type']
}) {
  const t = useT()
  const router = useRouter()
  const [pending, run] = useServerAction()
  const empty: WorkoutInput = {
    name: t(WORKOUT_TYPE_LABELS[defaultType]),
    workout_type: defaultType,
    performed_on: today,
    status: 'completed',
    duration_minutes: null,
    distance: null,
    notes: '',
  }
  const form = useForm<WorkoutInput>({
    resolver: zodResolver(workoutSchema),
    defaultValues: workout ?? empty,
  })
  useEffect(() => {
    if (open) form.reset(workout ?? empty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workout])
  const type = useWatch({ control: form.control, name: 'workout_type' })
  const num = {
    setValueAs: (v: string) =>
      v === '' || v === null ? null : Number(String(v).replace(',', '.')),
  }
  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{workout ? t('Edit workout') : t('Log workout')}</DialogTitle>
          <DialogDescription>
            {t('Record a run, ride, match or any session in seconds.')}
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            run(
              () =>
                workout ? updateWorkout({ ...values, id: workout.id }) : createWorkout(values),
              {
                success: workout ? t('Workout updated') : t('Workout logged'),
                onSuccess: (d) => {
                  onOpenChange(false)
                  if (!workout) router.push(`/workouts/${d.id}`)
                },
              },
            ),
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Type')} htmlFor="w-type">
              <NativeSelect
                id="w-type"
                {...form.register('workout_type', {
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const name = form.getValues('name')
                    if (
                      !name ||
                      (WORKOUT_TYPES as readonly string[]).some(
                        (wt) =>
                          t(WORKOUT_TYPE_LABELS[wt as keyof typeof WORKOUT_TYPE_LABELS]) === name,
                      )
                    ) {
                      form.setValue(
                        'name',
                        t(WORKOUT_TYPE_LABELS[e.target.value as keyof typeof WORKOUT_TYPE_LABELS]),
                      )
                    }
                  },
                })}
              >
                {WORKOUT_TYPES.map((it) => (
                  <option key={it} value={it}>
                    {t(WORKOUT_TYPE_LABELS[it])}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('Date')} htmlFor="w-date">
              <Input id="w-date" type="date" {...form.register('performed_on')} />
            </Field>
          </div>
          <Field label={t('Name')} htmlFor="w-name" error={errors.name?.message}>
            <Input id="w-name" {...form.register('name')} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={t('Duration (min)')} htmlFor="w-duration">
              <Input
                id="w-duration"
                inputMode="numeric"
                {...form.register('duration_minutes', num)}
              />
            </Field>
            {DISTANCE_TYPES.includes(type) && (
              <Field label={`Distance (${distanceUnit(units)})`} htmlFor="w-distance">
                <Input id="w-distance" inputMode="decimal" {...form.register('distance', num)} />
              </Field>
            )}
            <Field label={t('Calories')} htmlFor="w-cal" optional>
              <Input id="w-cal" inputMode="numeric" {...form.register('calories', num)} />
            </Field>
            {DISTANCE_TYPES.includes(type) && (
              <>
                <Field label={t('Elevation (m)')} htmlFor="w-elev" optional>
                  <Input id="w-elev" inputMode="numeric" {...form.register('elevation_m', num)} />
                </Field>
                <Field label={t('Avg HR')} htmlFor="w-hr" optional>
                  <Input id="w-hr" inputMode="numeric" {...form.register('avg_heart_rate', num)} />
                </Field>
              </>
            )}
          </div>
          {goals.length > 0 && (
            <Field label={t('Towards goal')} htmlFor="w-goal" optional>
              <NativeSelect id="w-goal" {...form.register('goal_id')}>
                <option value="">{t('None')}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          <Field label={t('Notes')} htmlFor="w-notes" optional>
            <Textarea id="w-notes" rows={2} {...form.register('notes')} />
          </Field>
          <DialogFooter>
            <SubmitButton pending={pending}>{workout ? t('Save') : t('Log workout')}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
