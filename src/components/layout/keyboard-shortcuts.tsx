'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { useUIStore } from '@/hooks/use-ui-store'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'
import { GOTO_SHORTCUTS, gotoHref, isTypingTarget } from '@/lib/shortcuts'

const GENERAL: { keys: string[]; label: string }[] = [
  { keys: ['⌘', 'K'], label: msg('Search and commands') },
  { keys: ['/'], label: msg('Search') },
  { keys: ['c'], label: msg('Quick capture') },
  { keys: ['?'], label: msg('Show keyboard shortcuts') },
  { keys: ['Esc'], label: msg('Close dialog') },
]

/** Global "?" help and "g + key" navigation. Ignored while typing or in dialogs. */
export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  const t = useT()
  const router = useRouter()
  const pendingG = useRef<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return

      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current)
        pendingG.current = null
        const href = gotoHref(e.key)
        if (href) {
          e.preventDefault()
          router.push(href)
        }
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === '/') {
        e.preventDefault()
        useUIStore.getState().setCommandOpen(true)
      } else if (e.key === 'g') {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 1500)
      }
    }
    const show = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('lifeos:shortcuts', show)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('lifeos:shortcuts', show)
    }
  }, [router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Keyboard shortcuts')}</DialogTitle>
          <DialogDescription>
            {t('Move around LifeOS without touching the mouse.')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
              {t('General')}
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              {GENERAL.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3">
                  <span>{t(s.label)}</span>
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
              {t('Go to')}
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              {GOTO_SHORTCUTS.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-3">
                  <span>{t(s.label)}</span>
                  <span className="flex gap-1">
                    <Kbd>g</Kbd>
                    <Kbd>{s.key}</Kbd>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
