'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { enabledOAuthProviders, publicEnv, type OAuthProvider } from '@/lib/env'
import type { ActionResult } from '@/lib/action-types'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { isValidTimeZone } from '@/lib/dates'
import { safeRedirectPath } from './access'
import {
  magicLinkSchema,
  newPasswordSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
} from './schemas'

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const issue of error.issues) out[issue.path.join('.') || '_'] ??= issue.message
  return out
}

const callbackUrl = (next?: string) =>
  `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(safeRedirectPath(next))}`

export async function signIn(
  input: z.input<typeof signInSchema>,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: 'Please check the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })
  if (error) {
    logger.warn('sign in failed', { action: 'signIn', code: error.code })
    return { ok: false, error: 'Incorrect email or password.' }
  }
  return { ok: true, data: { redirectTo: safeRedirectPath(parsed.data.next) } }
}

export async function signUp(
  input: z.input<typeof signUpSchema>,
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: 'Please check the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    }
  const { email, password, display_name, timezone } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl('/onboarding'),
      data: {
        display_name,
        timezone: timezone && isValidTimeZone(timezone) ? timezone : undefined,
      },
    },
  })
  if (error) {
    logger.warn('sign up failed', { action: 'signUp', code: error.code })
    if (error.code === 'user_already_exists')
      return { ok: false, error: 'An account with this email already exists.' }
    if (error.code === 'weak_password')
      return { ok: false, error: 'Please choose a stronger password.' }
    return { ok: false, error: "We couldn't create your account. Please try again." }
  }
  return { ok: true, data: { needsConfirmation: !data.session } }
}

export async function sendMagicLink(
  input: z.input<typeof magicLinkSchema>,
): Promise<ActionResult<null>> {
  const parsed = magicLinkSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: 'Please check the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl(parsed.data.next), shouldCreateUser: true },
  })
  if (error) {
    logger.warn('magic link failed', { action: 'sendMagicLink', code: error.code })
    return { ok: false, error: "We couldn't send the link. Please wait a moment and try again." }
  }
  return { ok: true, data: null }
}

export async function signInWithOAuth(provider: OAuthProvider, next?: string) {
  if (!enabledOAuthProviders().includes(provider))
    return { ok: false, error: 'This sign-in method is not enabled.' } as const
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callbackUrl(next) },
  })
  if (error || !data.url)
    return { ok: false, error: "We couldn't start sign in. Please try again." } as const
  redirect(data.url)
}

export async function requestPasswordReset(
  input: z.input<typeof resetRequestSchema>,
): Promise<ActionResult<null>> {
  const parsed = resetRequestSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: 'Please check the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    }
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl('/auth/reset-password'),
  })
  // Same response whether or not the account exists (no account enumeration).
  if (error)
    logger.warn('password reset failed', { action: 'requestPasswordReset', code: error.code })
  return { ok: true, data: null }
}

export async function updatePassword(
  input: z.input<typeof newPasswordSchema>,
): Promise<ActionResult<null>> {
  const parsed = newPasswordSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: 'Please check the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    logger.warn('password update failed', { action: 'updatePassword', code: error.code })
    if (error.code === 'same_password')
      return { ok: false, error: 'Choose a password different from the current one.' }
    return { ok: false, error: "We couldn't update your password. Please sign in again and retry." }
  }
  return { ok: true, data: null }
}

export async function signOut(scope: 'local' | 'global' = 'local') {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope })
  redirect('/login')
}
