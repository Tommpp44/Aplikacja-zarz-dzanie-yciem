'use client'

import { Activity, RefreshCw, Unplug } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useServerAction } from '@/hooks/use-server-action'
import { useT } from '@/lib/i18n/client'
import { disconnectStravaAction, syncStravaNow } from '@/lib/integrations/strava-actions'

export function StravaCard({
  configured,
  status,
}: {
  configured: boolean
  status: 'connected' | 'disconnected' | 'error' | null
}) {
  const t = useT()
  const router = useRouter()
  const params = useSearchParams()
  const [pending, run] = useServerAction()

  useEffect(() => {
    const result = params.get('strava')
    if (!result) return
    if (result === 'connected')
      toast.success(t('Strava connected — your recent activities are imported.'))
    else if (result === 'cancelled') toast.message(t('Strava connection cancelled.'))
    else toast.error(t('Could not connect Strava. Please try again.'))
    router.replace('/settings/integrations', { scroll: false })
  }, [params, router, t])

  const connected = status === 'connected' || status === 'error'
  return (
    <div className="bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Activity className="mt-0.5 size-5 shrink-0 text-orange-600" aria-hidden />
        <div className="flex-1">
          <p className="flex items-center gap-2 font-medium">
            Strava
            {status === 'connected' && <Badge variant="success">{t('Connected')}</Badge>}
            {status === 'error' && <Badge variant="warning">{t('Needs attention')}</Badge>}
          </p>
          <p className="text-muted-foreground text-xs">
            {configured
              ? t('Runs, rides and swims are imported automatically every hour.')
              : t(
                  'Automatic Strava sync is not set up on this server — export GPX files from Strava and import them above.',
                )}
          </p>
        </div>
      </div>
      {configured && (
        <div className="flex flex-wrap gap-2">
          {connected ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(() => syncStravaNow({}), {
                    success: (d) => t('{n} activities checked', { n: d.imported }),
                  })
                }
              >
                <RefreshCw /> {t('Sync now')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  run(() => disconnectStravaAction({}), { success: t('Strava disconnected') })
                }
              >
                <Unplug /> {t('Disconnect')}
              </Button>
            </>
          ) : (
            <Button size="sm" asChild className="bg-orange-700 text-white hover:bg-orange-800">
              <a href="/api/integrations/strava/connect">{t('Connect with Strava')}</a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
