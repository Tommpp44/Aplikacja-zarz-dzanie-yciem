'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SubmitButton } from '@/components/ui/submit-button'
import { signUp } from '@/lib/auth/actions'
import { signUpSchema } from '@/lib/auth/schemas'

type Values = z.input<typeof signUpSchema>

export function SignupForm() {
  const [error, setError] = useState<string>()
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { display_name: '', email: '', password: '' },
  })

  if (confirmEmail) {
    return (
      <div className="bg-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
        <MailCheck className="text-primary size-8" aria-hidden />
        <h1 className="text-lg font-semibold">Confirm your email</h1>
        <p className="text-muted-foreground text-sm">
          We sent a confirmation link to <strong className="text-foreground">{confirmEmail}</strong>
          .
        </p>
      </div>
    )
  }

  return (
    <form
      noValidate
      className="bg-card flex flex-col gap-4 rounded-xl border p-6 shadow-xs"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
          const result = await signUp({ ...values, timezone })
          if (!result.ok) {
            setError(result.error)
            for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
              form.setError(key as keyof Values, { message })
            }
            return
          }
          if (result.data.needsConfirmation) return setConfirmEmail(values.email)
          router.replace('/onboarding')
          router.refresh()
        }),
      )}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Create your LifeOS</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          One place for your plans, habits, money and training.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="bg-destructive-soft text-destructive rounded-md px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <Field
        label="Name"
        htmlFor="display_name"
        error={form.formState.errors.display_name?.message}
      >
        <Input
          id="display_name"
          autoComplete="given-name"
          autoFocus
          {...form.register('display_name')}
        />
      </Field>
      <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={form.formState.errors.password?.message}
        hint="At least 8 characters."
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  )
}
