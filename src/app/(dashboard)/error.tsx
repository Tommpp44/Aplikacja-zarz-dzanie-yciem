'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n/client'

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center"
    >
      <AlertTriangle className="text-warning size-8" aria-hidden />
      <h1 className="text-lg font-semibold">{t('Something went wrong')}</h1>
      <p className="text-muted-foreground text-sm">
        {t("We couldn't load this page. Your data is safe — please try again.")}
      </p>
      <Button onClick={reset}>{t('Try again')}</Button>
    </div>
  )
}
