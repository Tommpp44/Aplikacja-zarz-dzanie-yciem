'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
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
import { createRoutine, updateRoutine } from '@/lib/routines/actions'
import {
  ROUTINE_TYPES,
  ROUTINE_TYPE_LABELS,
  routineSchema,
  type RoutineInput,
} from '@/lib/routines/schemas'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'

const EMPTY: RoutineInput = {
  name: '',
  routine_type: 'morning',
  start_time: '07:00',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  items: [{ title: '', duration_minutes: 5, habit_id: null }],
}

export function RoutineFormDialog({
  open,
  onOpenChange,
  routine,
  habits,
  weekStartsOn,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  routine?: RoutineInput & { id: string }
  habits: { id: string; name: string }[]
  weekStartsOn: 0 | 1
}) {
  const t = useT()
  const [pending, run] = useServerAction()
  const form = useForm<RoutineInput>({
    resolver: zodResolver(routineSchema),
    defaultValues: routine ?? EMPTY,
  })
  const items = useFieldArray({ control: form.control, name: 'items' })
  useEffect(() => {
    if (open) form.reset(routine ?? EMPTY)
  }, [open, routine, form])
  const errors = form.formState.errors

  const submit = form.handleSubmit((values) => {
    const clean = {
      ...values,
      start_time: values.start_time || null,
      items: values.items
        .filter((i) => i.title.trim())
        .map((i) => ({
          ...i,
          duration_minutes: i.duration_minutes || null,
          habit_id: i.habit_id || null,
        })),
    }
    run(() => (routine ? updateRoutine({ ...clean, id: routine.id }) : createRoutine(clean)), {
      success: routine ? t('Routine updated') : t('Routine created'),
      onSuccess: () => onOpenChange(false),
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{routine ? t('Edit routine') : t('New routine')}</DialogTitle>
          <DialogDescription>
            {t(
              'A routine is an ordered checklist you repeat. Link steps to habits to log them automatically.',
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t('Name')}
              htmlFor="routine-name"
              error={errors.name?.message}
              className="col-span-2"
            >
              <Input
                id="routine-name"
                autoFocus
                placeholder={t('Morning routine')}
                {...form.register('name')}
              />
            </Field>
            <Field label={t('Type')} htmlFor="routine-type">
              <NativeSelect id="routine-type" {...form.register('routine_type')}>
                {ROUTINE_TYPES.map((it) => (
                  <option key={it} value={it}>
                    {t(ROUTINE_TYPE_LABELS[it])}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('Start time')} htmlFor="routine-time" optional>
              <Input id="routine-time" type="time" {...form.register('start_time')} />
            </Field>
          </div>
          <Field label={t('Days')} error={errors.weekdays?.message}>
            <Controller
              control={form.control}
              name="weekdays"
              render={({ field }) => (
                <div className="flex flex-wrap gap-1" role="group" aria-label={t('Days')}>
                  {orderedWeekdays(weekStartsOn).map((d) => {
                    const active = field.value.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          field.onChange(
                            active
                              ? field.value.filter((x) => x !== d)
                              : [...field.value, d].sort(),
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[13px] font-medium">{t('Steps')}</legend>
            {items.fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <span className="text-muted-foreground tabular w-4 text-right text-xs">
                  {index + 1}
                </span>
                <Input
                  aria-label={t('Step {n}', { n: index + 1 })}
                  placeholder={t('Drink water')}
                  {...form.register(`items.${index}.title`)}
                />
                <Input
                  aria-label={t('Step {n} minutes', { n: index + 1 })}
                  type="number"
                  min={1}
                  className="w-20"
                  placeholder={t('min')}
                  {...form.register(`items.${index}.duration_minutes`, {
                    setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                  })}
                />
                {habits.length > 0 && (
                  <NativeSelect
                    aria-label={t('Step {n} habit', { n: index + 1 })}
                    className="w-36"
                    {...form.register(`items.${index}.habit_id`)}
                  >
                    <option value="">{t('No habit')}</option>
                    {habits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
                <div className="flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('Move up')}
                    disabled={index === 0}
                    onClick={() => items.move(index, index - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('Move down')}
                    disabled={index === items.fields.length - 1}
                    onClick={() => items.move(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('Remove step')}
                    onClick={() => items.remove(index)}
                  >
                    <X />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => items.append({ title: '', duration_minutes: 5, habit_id: null })}
            >
              <Plus /> {t('Add step')}
            </Button>
          </fieldset>
          <DialogFooter>
            <SubmitButton pending={pending}>
              {routine ? t('Save') : t('Create routine')}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
