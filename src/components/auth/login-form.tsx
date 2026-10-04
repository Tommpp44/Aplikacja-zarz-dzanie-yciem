'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SubmitButton } from '@/components/ui/submit-button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sendMagicLink, signIn } from '@/lib/auth/actions'
import { emailSchema } from '@/lib/auth/schemas'

const passwordForm = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
})
const magicForm = z.object({ email: emailSchema })

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [error, setError] = useState<string | undefined>(initialError)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const pw = useForm<z.infer<typeof passwordForm>>({
    resolver: zodResolver(passwordForm),
    defaultValues: { email: '', password: '' },
  })
  const magic = useForm<z.infer<typeof magicForm>>({
    resolver: zodResolver(magicForm),
    defaultValues: { email: '' },
  })

  if (sentTo) {
    return (
      <div className="bg-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
        <MailCheck className="text-primary size-8" aria-hidden />
        <h1 className="text-lg font-semibold">Check your inbox</h1>
        <p className="text-muted-foreground text-sm">
          We sent a sign-in link to <strong className="text-foreground">{sentTo}</strong>. It
          expires in one hour.
        </p>
        <button className="text-primary text-sm hover:underline" onClick={() => setSentTo(null)}>
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card flex flex-col gap-5 rounded-xl border p-6 shadow-xs">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">Sign in to see what matters today.</p>
      </div>
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as 'password' | 'magic')
          setError(undefined)
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="password" className="flex-1">
            Password
          </TabsTrigger>
          <TabsTrigger value="magic" className="flex-1">
            Magic link
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <p
          role="alert"
          className="bg-destructive-soft text-destructive rounded-md px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      {mode === 'password' ? (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={pw.handleSubmit((values) =>
            startTransition(async () => {
              const result = await signIn({ ...values, next })
              if (!result.ok) return setError(result.error)
              router.replace(result.data.redirectTo)
              router.refresh()
            }),
          )}
        >
          <Field label="Email" htmlFor="email" error={pw.formState.errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...pw.register('email')}
            />
          </Field>
          <Field label="Password" htmlFor="password" error={pw.formState.errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...pw.register('password')}
            />
          </Field>
          <div className="-mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Forgot password?
            </Link>
          </div>
          <SubmitButton pending={pending} pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={magic.handleSubmit((values) =>
            startTransition(async () => {
              const result = await sendMagicLink({ ...values, next })
              if (!result.ok) return setError(result.error)
              setSentTo(values.email)
            }),
          )}
        >
          <Field
            label="Email"
            htmlFor="magic-email"
            error={magic.formState.errors.email?.message}
            hint="We'll email you a one-time sign-in link."
          >
            <Input
              id="magic-email"
              type="email"
              autoComplete="email"
              {...magic.register('email')}
            />
          </Field>
          <SubmitButton pending={pending} pendingLabel="Sending…">
            Send magic link
          </SubmitButton>
        </form>
      )}
    </div>
  )
}
