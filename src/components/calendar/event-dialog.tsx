'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ColorPicker } from '@/components/shared/color-picker'
import { RepeatRulePicker } from '@/components/shared/repeat-rule-picker'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useServerAction } from '@/hooks/use-server-action'
import { createEvent, deleteEvent, updateEvent } from '@/lib/calendar/actions'
import { eventSchema, type EventInput } from '@/lib/calendar/schemas'

export type EventFormValues = EventInput & { id?: string }

export function EventDialog({
  open,
  onOpenChange,
  initial,
  projects = [],
  weekStartsOn = 1,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: EventFormValues
  projects?: { id: string; name: string }[]
  weekStartsOn?: 0 | 1
}) {
  const [pending, run] = useServerAction()
  const form = useForm<EventInput>({ resolver: zodResolver(eventSchema), defaultValues: initial })
  useEffect(() => {
    if (open) form.reset(initial)
  }, [open, initial, form])
  const allDay = useWatch({ control: form.control, name: 'all_day' })
  const repeat = useWatch({ control: form.control, name: 'repeat_rule' })
  const startDate = useWatch({ control: form.control, name: 'start_date' })
  const errors = form.formState.errors

  const submit = form.handleSubmit((values) => {
    const clean = {
      ...values,
      project_id: values.project_id || null,
      repeat_until: values.repeat_until || null,
    }
    run(() => (initial.id ? updateEvent({ ...clean, id: initial.id }) : createEvent(clean)), {
      success: initial.id ? 'Event updated' : 'Event created',
      onSuccess: () => onOpenChange(false),
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial.id ? 'Edit event' : 'New event'}</DialogTitle>
          <DialogDescription>
            {initial.id && initial.repeat_rule
              ? 'Changes apply to the whole series.'
              : 'Times are in your timezone.'}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Title" htmlFor="event-title" error={errors.title?.message}>
            <Input id="event-title" autoFocus placeholder="Dentist" {...form.register('title')} />
          </Field>
          <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            All day
            <Controller
              control={form.control}
              name="all_day"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts" htmlFor="event-start-date" error={errors.start_date?.message}>
              <Input
                id="event-start-date"
                type="date"
                {...form.register('start_date', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    if (form.getValues('end_date') < e.target.value)
                      form.setValue('end_date', e.target.value)
                  },
                })}
              />
            </Field>
            {!allDay && (
              <Field label="Time" htmlFor="event-start-time" error={errors.start_time?.message}>
                <Input id="event-start-time" type="time" {...form.register('start_time')} />
              </Field>
            )}
            <Field label="Ends" htmlFor="event-end-date" error={errors.end_date?.message}>
              <Input
                id="event-end-date"
                type="date"
                min={startDate}
                {...form.register('end_date')}
              />
            </Field>
            {!allDay && (
              <Field label="Time" htmlFor="event-end-time">
                <Input id="event-end-time" type="time" {...form.register('end_time')} />
              </Field>
            )}
          </div>
          <Field label="Repeat" htmlFor="event-repeat">
            <Controller
              control={form.control}
              name="repeat_rule"
              render={({ field }) => (
                <RepeatRulePicker
                  id="event-repeat"
                  value={
                    field.value ? { ...field.value, interval: field.value.interval ?? 1 } : null
                  }
                  onChange={field.onChange}
                  weekStartsOn={weekStartsOn}
                />
              )}
            />
          </Field>
          {repeat && (
            <Field label="Repeat until" htmlFor="event-until" optional>
              <Input id="event-until" type="date" {...form.register('repeat_until')} />
            </Field>
          )}
          <Field label="Location" htmlFor="event-location" optional>
            <Input id="event-location" {...form.register('location')} />
          </Field>
          <Field label="Description" htmlFor="event-description" optional>
            <Textarea id="event-description" rows={2} {...form.register('description')} />
          </Field>
          {projects.length > 0 && (
            <Field label="Project" htmlFor="event-project" optional>
              <NativeSelect id="event-project" {...form.register('project_id')}>
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          <Field label="Color">
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <ColorPicker value={field.value ?? 'indigo'} onChange={field.onChange} />
              )}
            />
          </Field>
          <DialogFooter className="sm:justify-between">
            {initial.id ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() =>
                  run(() => deleteEvent({ id: initial.id! }), {
                    success: 'Event deleted',
                    onSuccess: () => onOpenChange(false),
                  })
                }
              >
                <Trash2 /> Delete{initial.repeat_rule ? ' series' : ''}
              </Button>
            ) : (
              <span />
            )}
            <SubmitButton pending={pending}>{initial.id ? 'Save' : 'Create event'}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
