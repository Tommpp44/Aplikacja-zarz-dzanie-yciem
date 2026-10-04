'use client'

import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useT } from '@/lib/i18n/client'

type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const KEY = 'lifeos-install-dismissed'

function readDismissed() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Offers "Install LifeOS" where the browser supports it (Chromium), and a short
 * Add-to-Home-Screen hint on iOS Safari. Hidden once installed or dismissed.
 */
export function InstallPrompt() {
  const t = useT()
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone || readDismissed()) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as InstallEvent)
      setHidden(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    // iOS Safari never fires beforeinstallprompt; show a manual hint on phones.
    const timer = window.setTimeout(() => {
      if (/iPhone|iPad|iPod/.test(navigator.userAgent) && window.innerWidth < 1024) {
        setIos(true)
        setHidden(false)
      }
    }, 0)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // ignore
    }
  }

  if (hidden || (!event && !ios)) return null
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-4">
        <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
          <Download className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t('Install LifeOS')}</p>
          <p className="text-muted-foreground text-sm">
            {ios ? (
              <>
                {t('Tap')} <Share className="inline size-3.5" aria-label={t('Share')} />{' '}
                {t('then “Add to Home Screen” for one-tap access.')}
              </>
            ) : (
              t('One tap from your home screen or dock, works offline.')
            )}
          </p>
        </div>
        {event && (
          <Button
            size="sm"
            onClick={async () => {
              await event.prompt()
              const { outcome } = await event.userChoice
              if (outcome === 'accepted') dismiss()
              setEvent(null)
            }}
          >
            {t('Install')}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('Dismiss install hint')}
          onClick={dismiss}
        >
          <X />
        </Button>
      </CardContent>
    </Card>
  )
}
