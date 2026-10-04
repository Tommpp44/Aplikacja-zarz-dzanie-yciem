'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { fireConfetti } from '@/lib/engagement/confetti'

/**
 * Fires a one-off celebration when `when` becomes true. `onceKey` makes it
 * fire at most once per key in this browser (e.g. once per day).
 */
export function Celebrate({
  when,
  onceKey,
  message,
}: {
  when: boolean
  onceKey: string
  message?: string
}) {
  useEffect(() => {
    if (!when) return
    const key = `lifeos-celebrated:${onceKey}`
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      // Storage unavailable (private mode): still celebrate, just not deduped.
    }
    fireConfetti()
    if (message) toast.success(message)
  }, [when, onceKey, message])
  return null
}
