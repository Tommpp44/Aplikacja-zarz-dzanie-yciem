import 'server-only'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSession, type SessionContext } from '@/lib/auth/session'
import { DataError } from '@/lib/db/errors'
import { logger } from '@/lib/logger'
import type { ActionResult } from '@/lib/action-types'

export type { ActionResult } from '@/lib/action-types'

type Options = {
  /** Used in technical logs and generic error messages ("We couldn't save this task"). */
  name: string
  failureMessage?: string
  /**
   * Layouts to revalidate after a successful mutation. Defaults to the whole app:
   * LifeOS modules are interconnected (a transaction moves a goal, a habit log
   * changes the dashboard), so a mutation usually affects several screens.
   * Set to [] for mutations with no visible effect.
   */
  revalidate?: readonly string[]
}

/**
 * Wraps a server action with: authentication, server-side validation (Zod),
 * error translation into human-readable messages, safe logging and cache
 * revalidation. The client never supplies user ids — they come from the session.
 */
export function authedAction<S extends z.ZodType, R>(
  schema: S,
  options: Options,
  handler: (input: z.output<S>, ctx: SessionContext) => Promise<R>,
): (input: z.input<S>) => Promise<ActionResult<R>> {
  return async (rawInput) => {
    const session = await getSession()
    if (!session) return { ok: false, error: 'Your session has expired. Please sign in again.' }

    const parsed = schema.safeParse(rawInput)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_'
        fieldErrors[key] ??= issue.message
      }
      return { ok: false, error: 'Please check the highlighted fields.', fieldErrors }
    }

    try {
      const data = await handler(parsed.data, session)
      for (const path of options.revalidate ?? ['/']) revalidatePath(path, 'layout')
      return { ok: true, data }
    } catch (error) {
      if (error instanceof DataError) {
        logger.warn(
          'action failed',
          { action: options.name, code: error.code, userId: session.user.id },
          error,
        )
        return { ok: false, error: error.message }
      }
      logger.error('action crashed', { action: options.name, userId: session.user.id }, error)
      return {
        ok: false,
        error: options.failureMessage ?? `We couldn't complete this action. Please try again.`,
      }
    }
  }
}

export const idSchema = z.object({ id: z.uuid() })
