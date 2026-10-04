'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center"
    >
      <AlertTriangle className="text-warning size-8" aria-hidden />
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        We couldn&apos;t load this page. Your data is safe — please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
