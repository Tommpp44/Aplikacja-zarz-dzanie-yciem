import { WifiOff } from 'lucide-react'
import type { Metadata } from 'next'
import { Logo } from '@/components/layout/logo'
import { ReloadButton } from '@/components/pwa/reload-button'

export const metadata: Metadata = { title: 'Offline' }
export const dynamic = 'force-static'

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo className="mb-4" />
      <WifiOff className="text-muted-foreground size-8" aria-hidden />
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Pages you visited recently are still available. Changes need a connection — reconnect and
        try again.
      </p>
      <ReloadButton />
    </main>
  )
}
