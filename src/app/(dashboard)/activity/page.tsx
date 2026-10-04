import { ActivityForm } from '@/components/activity/activity-form'
import { BarsChart } from '@/components/charts/lazy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { addDaysISO, eachDayISO, formatISODate, minutesToLabel } from '@/lib/dates'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatDistance, type Units } from '@/lib/units'
import { getTrainingOverview } from '@/lib/workouts/service'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Activity')

const INTEGRATIONS = ['Apple Health', 'Google Fit / Health Connect', 'Garmin', 'Strava', 'Fitbit']

export default async function ActivityPage() {
  const t = await getT()
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const units: Units = prefs.units === 'imperial' ? 'imperial' : 'metric'
  const tr = await getTrainingOverview(supabase, user.id, today, prefs.week_start)
  const last7 = tr.activity.filter((a) => a.record_date > addDaysISO(today, -7))
  const avgSteps = last7.length
    ? Math.round(last7.reduce((s, a) => s + (a.steps ?? 0), 0) / last7.length)
    : 0
  const a = tr.activityToday
  const byDate = new Map(tr.activity.map((r) => [r.record_date, r]))
  const chart = eachDayISO(addDaysISO(today, -29), today).map((d) => ({
    label: formatISODate(d, 'd MMM'),
    steps: byDate.get(d)?.steps ?? 0,
  }))

  return (
    <>
      <PageHeader
        title={t('Activity')}
        description={t('Daily movement alongside your workouts.')}
      />
      <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-6">
        <Stat
          label={t('Steps today')}
          value={(a?.steps ?? 0).toLocaleString('pl-PL')}
          hint={t('7-day avg {n}', { n: avgSteps.toLocaleString('pl-PL') })}
          size="lg"
          className="col-span-2"
        />
        <Stat label={t('Distance')} value={formatDistance(Number(a?.distance_m ?? 0), units)} />
        <Stat label={t('Active minutes')} value={a?.active_minutes ?? 0} />
        <Stat label={t('Workouts')} value={tr.thisWeek.count} hint={t('this week')} />
        <Stat
          label={t('Training time')}
          value={minutesToLabel(tr.thisWeek.minutes)}
          hint={t('this week')}
        />
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Log activity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityForm today={today} units={units} records={tr.activity} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('Steps — last 30 days')}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarsChart
              ariaLabel={t('Daily steps')}
              data={chart}
              series={[{ key: 'steps', label: t('Steps') }]}
              height={200}
            />
          </CardContent>
        </Card>
        <p className="text-muted-foreground text-xs">
          {t(
            'Automatic sync with {services} is planned. The data model already stores the source of every record, so imported data will sit next to manual entries.',
            { services: INTEGRATIONS.join(', ') },
          )}
        </p>
      </div>
    </>
  )
}
