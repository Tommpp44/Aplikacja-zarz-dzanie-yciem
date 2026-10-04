import { Landmark } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'
import { stravaConfigured } from '@/lib/integrations/strava-sync'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { CalendarSubscriptions } from './calendar-subscriptions'
import { HealthImport } from './health-import'
import { StravaCard } from './strava-card'

export async function IntegrationsSection() {
  const t = await getT()
  const { supabase, user, today } = await getOnboardedUserContext()
  const [subs, strava] = await Promise.all([
    supabase
      .from('calendar_subscriptions')
      .select('id, name, last_synced_at, last_error, event_count')
      .eq('user_id', user.id)
      .order('created_at'),
    supabase
      .from('integrations')
      .select('status')
      .eq('user_id', user.id)
      .eq('provider', 'strava')
      .maybeSingle(),
  ])
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="font-medium">{t('Calendars')}</h3>
          <p className="text-muted-foreground text-sm">
            {t(
              'Show Google, Outlook or iCloud events next to your plans — paste the calendar’s iCal link or import an .ics file.',
            )}
          </p>
        </div>
        <CalendarSubscriptions items={subs.data ?? []} />
      </section>
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="font-medium">{t('Health and training')}</h3>
          <p className="text-muted-foreground text-sm">
            {t(
              'Bring in steps and workouts. Imported records are marked with their source and never duplicated.',
            )}
          </p>
        </div>
        <HealthImport today={today} />
        <Suspense>
          <StravaCard
            configured={stravaConfigured()}
            status={
              (strava.data?.status as 'connected' | 'disconnected' | 'error' | undefined) ?? null
            }
          />
        </Suspense>
      </section>
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="font-medium">{t('Bank')}</h3>
          <p className="text-muted-foreground text-sm">
            {t(
              'Import transactions from your bank’s CSV export (most Polish and EU banks work). Direct bank connections need a licensed provider and are not available yet.',
            )}
          </p>
        </div>
        <div className="bg-card flex items-center justify-between gap-3 rounded-lg border p-4 text-sm">
          <span className="flex items-center gap-3">
            <Landmark className="text-primary size-5" aria-hidden /> {t('CSV import')}
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href="/finances/transactions">{t('Open transactions')}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
