'use client'

import { useCallback, useTransition } from 'react'
import { toast } from 'sonner'
import type { ActionResult } from '@/lib/action-types'

type Options<T> = {
  success?: string | ((data: T) => string)
  onSuccess?: (data: T) => void
  onError?: (result: Extract<ActionResult<T>, { ok: false }>) => void
  undo?: { label?: string; action: () => Promise<ActionResult<unknown>> }
}

/** Runs a server action inside a transition with consistent toasts and errors. */
export function useServerAction() {
  const [pending, startTransition] = useTransition()
  const run = useCallback(<T>(fn: () => Promise<ActionResult<T>>, options: Options<T> = {}) => {
    startTransition(async () => {
      let result: ActionResult<T>
      try {
        result = await fn()
      } catch {
        result = {
          ok: false,
          error: 'Connection problem. Please check your internet and try again.',
        }
      }
      if (!result.ok) {
        toast.error(result.error)
        options.onError?.(result)
        return
      }
      options.onSuccess?.(result.data)
      if (options.success) {
        const message =
          typeof options.success === 'function' ? options.success(result.data) : options.success
        const undo = options.undo
        toast.success(
          message,
          undo
            ? {
                action: {
                  label: undo.label ?? 'Undo',
                  onClick: () => void undo.action().then((r) => !r.ok && toast.error(r.error)),
                },
              }
            : undefined,
        )
      }
    })
  }, [])
  return [pending, run] as const
}
