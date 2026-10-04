'use client'

import { Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useServerAction } from '@/hooks/use-server-action'
import { chooseLocale } from '@/lib/i18n/actions'
import { useLocale, useT } from '@/lib/i18n/client'
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n/config'
import { updateLanguage } from '@/lib/settings/actions'
import { cn } from '@/lib/utils'

/** Segmented EN/PL switch. `persist` saves it to the signed-in user's preferences. */
export function LanguagePicker({
  persist = false,
  className,
}: {
  persist?: boolean
  className?: string
}) {
  const locale = useLocale()
  const t = useT()
  const router = useRouter()
  const [pendingCookie, startTransition] = useTransition()
  const [pendingSave, run] = useServerAction()
  const pending = pendingCookie || pendingSave

  const choose = (next: Locale) => {
    if (next === locale) return
    if (persist)
      run(() => updateLanguage({ language: next }), { onSuccess: () => router.refresh() })
    else
      startTransition(async () => {
        await chooseLocale(next)
        router.refresh()
      })
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('Language')}
      className={cn('bg-muted inline-flex items-center gap-0.5 rounded-lg p-[3px]', className)}
    >
      <Languages className="text-muted-foreground mx-1.5 size-4" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === locale}
          disabled={pending}
          lang={l}
          onClick={() => choose(l)}
          className={cn(
            'text-muted-foreground hover:text-foreground h-7 rounded-md px-3 text-[13px] font-medium transition-colors',
            l === locale && 'bg-card text-foreground shadow-xs',
          )}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  )
}
