'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SubmitButton } from '@/components/ui/submit-button'
import { requestPasswordReset, updatePassword } from '@/lib/auth/actions'
import { newPasswordSchema, resetRequestSchema } from '@/lib/auth/schemas'
import { useT } from '@/lib/i18n/client'

export function ForgotPasswordForm() {
  const t = useT()
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()
  const form = useForm<z.input<typeof resetRequestSchema>>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: '' },
  })
  if (sent) {
    return (
      <p className="bg-card text-muted-foreground rounded-xl border p-6 text-center text-sm">
        {t('If an account exists for that email, a reset link is on its way.')}
      </p>
    )
  }
  return (
    <form
      noValidate
      className="bg-card flex flex-col gap-4 rounded-xl border p-6"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await requestPasswordReset(values)
          if (!result.ok) {
            toast.error(t(result.error))
            return
          }
          setSent(true)
        }),
      )}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t('Reset password')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('We will email you a secure reset link.')}
        </p>
      </div>
      <Field label={t('Email')} htmlFor="email" error={form.formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
      </Field>
      <SubmitButton pending={pending}>{t('Send reset link')}</SubmitButton>
    </form>
  )
}

export function NewPasswordForm({
  redirectTo = '/dashboard',
  compact = false,
}: {
  redirectTo?: string | null
  compact?: boolean
}) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const form = useForm<z.input<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })
  return (
    <form
      noValidate
      className={
        compact
          ? 'flex max-w-sm flex-col gap-4'
          : 'bg-card flex flex-col gap-4 rounded-xl border p-6'
      }
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await updatePassword(values)
          if (!result.ok) {
            toast.error(t(result.error))
            return
          }
          toast.success(t('Password updated'))
          form.reset()
          if (redirectTo) router.replace(redirectTo)
        }),
      )}
    >
      <Field
        label={t('New password')}
        htmlFor="password"
        error={form.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
      </Field>
      <Field
        label={t('Confirm password')}
        htmlFor="confirm"
        error={form.formState.errors.confirm?.message}
      >
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          {...form.register('confirm')}
        />
      </Field>
      <SubmitButton pending={pending} className="self-start">
        {t('Update password')}
      </SubmitButton>
    </form>
  )
}
