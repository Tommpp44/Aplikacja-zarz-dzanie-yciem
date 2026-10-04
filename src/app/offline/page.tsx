import { WifiOff } from 'lucide-react'
import { Logo } from '@/components/layout/logo'
import { ReloadButton } from '@/components/pwa/reload-button'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Offline')
export const dynamic = 'force-static'

export default async function OfflinePage() {
  const t = await getT()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo className="mb-4" />
      <WifiOff className="text-muted-foreground size-8" aria-hidden />
      <h1 className="text-xl font-semibold">{t("You're offline")}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        {t(
          'Pages you visited recently are still available. Changes need a connection — reconnect and try again.',
        )}
      </p>
      <ReloadButton />
    </main>
  )
}
