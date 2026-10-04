'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ColorPicker } from '@/components/shared/color-picker'
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
import { useServerAction } from '@/hooks/use-server-action'
import { weekdayShort, orderedWeekdays } from '@/lib/dates'
import { createHabit, updateHabit } from '@/lib/habits/actions'
import {
  FREQUENCY_LABELS,
  HABIT_FREQUENCIES,
  HABIT_TYPES,
  HABIT_TYPE_LABELS,
  habitSchema,
  type HabitInput,
} from '@/lib/habits/schemas'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'

const EMPTY: HabitInput = {
  name: '',
  habit_type: 'boolean',
  target: 1,
  unit: '',
  frequency: 'daily',
  weekdays: [],
  times_per_week: 3,
  interval_days: 2,
  color: 'indigo',
  reminder_time: null,
  goal_id: null,
}

export function HabitFormDialog({
  open,
  onOpenChange,
  habit,
  goals,
  weekStartsOn = 1,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit?: HabitInput & { id: string }
  goals: { id: string; title: string }[]
  weekStartsOn?: 0 | 1
}) {
  const t = useT()
  const [pending, run] = useServerAction()
  const form = useForm<HabitInput>({
    resolver: zodResolver(habitSchema),
    defaultValues: habit ?? EMPTY,
  })
  useEffect(() => {
    if (open) form.reset(habit ?? EMPTY)
  }, [open, habit, form])
  const type = useWatch({ control: form.control, name: 'habit_type' })
  const frequency = useWatch({ control: form.control, name: 'frequency' })
  const errors = form.formState.errors
  const num = { setValueAs: (v: string) => (v === '' ? null : Number(String(v).replace(',', '.'))) }

  const submit = form.handleSubmit((values) => {
    const clean = {
      ...values,
      reminder_time: values.reminder_time || null,
      goal_id: values.goal_id || null,
      target: values.habit_type === 'boolean' ? 1 : values.target,
    }
    run(() => (habit ? updateHabit({ ...clean, id: habit.id }) : createHabit(clean)), {
      success: habit ? t('Habit updated') : t('Habit created'),
      onSuccess: () => onOpenChange(false),
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit ? t('Edit habit') : t('New habit')}</DialogTitle>
          <DialogDescription>{t('Small, specific and repeatable works best.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Field label={t('Habit')} htmlFor="habit-name" error={errors.name?.message}>
            <Input
              id="habit-name"
              autoFocus
              placeholder={t('Read 20 minutes')}
              {...form.register('name')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Type')} htmlFor="habit-type">
              <NativeSelect id="habit-type" {...form.register('habit_type')}>
                {HABIT_TYPES.map((it) => (
                  <option key={it} value={it}>
                    {t(HABIT_TYPE_LABELS[it])}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('How often')} htmlFor="habit-frequency">
              <NativeSelect id="habit-frequency" {...form.register('frequency')}>
                {HABIT_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {t(FREQUENCY_LABELS[f])}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          {type !== 'boolean' && (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={type === 'duration' ? t('Daily target (minutes)') : t('Daily target')}
                htmlFor="habit-target"
                error={errors.target?.message}
              >
                <Input id="habit-target" inputMode="decimal" {...form.register('target', num)} />
              </Field>
              {type !== 'duration' && (
                <Field label={t('Unit')} htmlFor="habit-unit" optional>
                  <Input
                    id="habit-unit"
                    placeholder={type === 'numeric' ? 'L' : 'reps'}
                    {...form.register('unit')}
                  />
                </Field>
              )}
            </div>
          )}
          {frequency === 'weekdays' && (
            <Field label={t('Days')} error={errors.weekdays?.message}>
              <Controller
                control={form.control}
                name="weekdays"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-1" role="group" aria-label={t('Days')}>
                    {orderedWeekdays(weekStartsOn).map((d) => {
                      const value = field.value ?? []
                      const active = value.includes(d)
                      return (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            field.onChange(
                              active ? value.filter((x) => x !== d) : [...value, d].sort(),
                            )
                          }
                          className={cn(
                            'h-8 min-w-11 rounded-md border px-2 text-xs font-medium',
                            active
                              ? 'border-primary bg-primary-soft text-primary'
                              : 'bg-card text-muted-foreground',
                          )}
                        >
                          {weekdayShort(d, t.locale)}
                        </button>
                      )
                    })}
                  </div>
                )}
              />
            </Field>
          )}
          {frequency === 'times_per_week' && (
            <Field
              label={t('Times per week')}
              htmlFor="habit-tpw"
              error={errors.times_per_week?.message}
            >
              <Input
                id="habit-tpw"
                type="number"
                min={1}
                max={7}
                {...form.register('times_per_week', num)}
              />
            </Field>
          )}
          {frequency === 'interval' && (
            <Field
              label={t('Every N days')}
              htmlFor="habit-interval"
              error={errors.interval_days?.message}
            >
              <Input
                id="habit-interval"
                type="number"
                min={1}
                max={365}
                {...form.register('interval_days', num)}
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Reminder')} htmlFor="habit-reminder" optional>
              <Input id="habit-reminder" type="time" {...form.register('reminder_time')} />
            </Field>
            <Field label={t('Supports goal')} htmlFor="habit-goal" optional>
              <NativeSelect id="habit-goal" {...form.register('goal_id')}>
                <option value="">{t('None')}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label={t('Color')}>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <ColorPicker value={field.value ?? 'indigo'} onChange={field.onChange} />
              )}
            />
          </Field>
          <DialogFooter>
            <SubmitButton pending={pending}>{habit ? t('Save') : t('Create habit')}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
