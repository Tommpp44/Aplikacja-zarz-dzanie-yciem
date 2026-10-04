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
import { createGoal, updateGoal } from '@/lib/goals/actions'
import {
  GOAL_CATEGORIES,
  PROGRESS_SOURCES,
  PROGRESS_SOURCE_LABELS,
  goalSchema,
  type GoalInput,
} from '@/lib/goals/schemas'
import { useT } from '@/lib/i18n/client'

const EMPTY: GoalInput = {
  title: '',
  description: '',
  category: 'personal',
  target_type: 'numeric',
  progress_source: 'manual',
  start_value: 0,
  target_value: null,
  current_value: 0,
  unit: '',
  deadline: null,
}

export type GoalFormAccount = { id: string; name: string; currency: string }

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  accounts,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: GoalInput & { id: string }
  accounts: GoalFormAccount[]
}) {
  const t = useT()
  const router = useRouter()
  const [pending, run] = useServerAction()
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ?? EMPTY,
  })
  useEffect(() => {
    if (open) form.reset(goal ?? EMPTY)
  }, [open, goal, form])

  const targetType = useWatch({ control: form.control, name: 'target_type' })
  const source = useWatch({ control: form.control, name: 'progress_source' })
  const numeric = targetType === 'numeric' && (source === 'manual' || source === 'account')
  const errors = form.formState.errors

  const submit = form.handleSubmit((values) => {
    const clean: GoalInput = {
      ...values,
      deadline: values.deadline || null,
      linked_account_id: values.linked_account_id || null,
      target_value: values.target_value ?? null,
    }
    run(() => (goal ? updateGoal({ ...clean, id: goal.id }) : createGoal(clean)), {
      success: goal ? t('Goal updated') : t('Goal created'),
      onSuccess: (data) => {
        onOpenChange(false)
        if (!goal && data) router.push(`/goals/${data.id}`)
      },
      onError: (r) =>
        Object.entries(r.fieldErrors ?? {}).forEach(([k, m]) =>
          form.setError(k as keyof GoalInput, { message: m }),
        ),
    })
  })

  const num = {
    setValueAs: (v: string) =>
      v === '' || v === null ? null : Number(String(v).replace(',', '.')),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{goal ? t('Edit goal') : t('New goal')}</DialogTitle>
          <DialogDescription>
            {t(
              'Make it measurable. Link it to an account, tasks or milestones to track it automatically.',
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Field label={t('Goal')} htmlFor="goal-title" error={errors.title?.message}>
            <Input
              id="goal-title"
              autoFocus
              placeholder={t('Build emergency fund')}
              {...form.register('title')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Category')} htmlFor="goal-category">
              <NativeSelect id="goal-category" {...form.register('category')}>
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c[0]!.toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              label={t('Deadline')}
              htmlFor="goal-deadline"
              optional
              error={errors.deadline?.message}
            >
              <Input id="goal-deadline" type="date" {...form.register('deadline')} />
            </Field>
          </div>
          <Field label={t('Measure progress by')} htmlFor="goal-source">
            <NativeSelect id="goal-source" {...form.register('progress_source')}>
              {PROGRESS_SOURCES.map((s) => (
                <option key={s} value={s} disabled={s === 'account' && accounts.length === 0}>
                  {t(PROGRESS_SOURCE_LABELS[s])}
                  {s === 'account' && accounts.length === 0
                    ? ` (${t('add an account first')})`
                    : ''}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {source === 'account' && (
            <Field
              label={t('Account')}
              htmlFor="goal-account"
              error={errors.linked_account_id?.message}
            >
              <NativeSelect id="goal-account" {...form.register('linked_account_id')}>
                <option value="">{t('Choose…')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          {(source === 'manual' || source === 'account') && (
            <Field label={t('Target type')} htmlFor="goal-target-type">
              <NativeSelect id="goal-target-type" {...form.register('target_type')}>
                <option value="numeric">{t('Number (e.g. 30 000 PLN, 10 kg, 12 books)')}</option>
                {source === 'manual' && (
                  <option value="percentage">{t('Percentage (0–100%)')}</option>
                )}
                {source === 'manual' && <option value="boolean">{t('Done / not done')}</option>}
              </NativeSelect>
            </Field>
          )}
          {numeric && (
            <div className="grid grid-cols-3 gap-3">
              {source === 'manual' && (
                <Field label={t('Start')} htmlFor="goal-start">
                  <Input
                    id="goal-start"
                    inputMode="decimal"
                    {...form.register('start_value', num)}
                  />
                </Field>
              )}
              <Field label={t('Target')} htmlFor="goal-target" error={errors.target_value?.message}>
                <Input
                  id="goal-target"
                  inputMode="decimal"
                  placeholder="30000"
                  {...form.register('target_value', num)}
                />
              </Field>
              <Field label={t('Unit')} htmlFor="goal-unit" optional>
                <Input id="goal-unit" placeholder={t('PLN')} {...form.register('unit')} />
              </Field>
            </div>
          )}
          {source === 'manual' && targetType !== 'boolean' && !goal && (
            <Field label={t('Current value')} htmlFor="goal-current">
              <Input
                id="goal-current"
                inputMode="decimal"
                {...form.register('current_value', num)}
              />
            </Field>
          )}
          <Field label={t('Why it matters')} htmlFor="goal-description" optional>
            <Textarea id="goal-description" rows={2} {...form.register('description')} />
          </Field>
          <DialogFooter>
            <SubmitButton pending={pending}>{goal ? t('Save') : t('Create goal')}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
