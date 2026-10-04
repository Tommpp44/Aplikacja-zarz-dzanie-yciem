import type { Metadata } from 'next'
import { ActivityForm } from '@/components/activity/activity-form'
import { BarsChart } from '@/components/charts/lazy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { addDaysISO, eachDayISO, formatISODate, minutesToLabel } from '@/lib/dates'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatDistance, type Units } from '@/lib/units'
import { getTrainingOverview } from '@/lib/workouts/service'

export const metadata: Metadata = { title: 'Activity' }

const INTEGRATIONS = ['Apple Health', 'Google Fit / Health Connect', 'Garmin', 'Strava', 'Fitbit']

export default async function ActivityPage() {
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const units: Units = prefs.units === 'imperial' ? 'imperial' : 'metric'
  const t = await getTrainingOverview(supabase, user.id, today, prefs.week_start)
  const last7 = t.activity.filter((a) => a.record_date > addDaysISO(today, -7))
  const avgSteps = last7.length
    ? Math.round(last7.reduce((s, a) => s + (a.steps ?? 0), 0) / last7.length)
    : 0
  const a = t.activityToday
  const byDate = new Map(t.activity.map((r) => [r.record_date, r]))
  const chart = eachDayISO(addDaysISO(today, -29), today).map((d) => ({
    label: formatISODate(d, 'd MMM'),
    steps: byDate.get(d)?.steps ?? 0,
  }))

  return (
    <>
      <PageHeader title="Activity" description="Daily movement alongside your workouts." />
      <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-6">
        <Stat
          label="Steps today"
          value={(a?.steps ?? 0).toLocaleString('pl-PL')}
          hint={`7-day avg ${avgSteps.toLocaleString('pl-PL')}`}
          size="lg"
          className="col-span-2"
        />
        <Stat label="Distance" value={formatDistance(Number(a?.distance_m ?? 0), units)} />
        <Stat label="Active minutes" value={a?.active_minutes ?? 0} />
        <Stat label="Workouts" value={t.thisWeek.count} hint="this week" />
        <Stat label="Training time" value={minutesToLabel(t.thisWeek.minutes)} hint="this week" />
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Log activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityForm today={today} units={units} records={t.activity} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Steps — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <BarsChart
              ariaLabel="Daily steps"
              data={chart}
              series={[{ key: 'steps', label: 'Steps' }]}
              height={200}
            />
          </CardContent>
        </Card>
        <p className="text-muted-foreground text-xs">
          Automatic sync with {INTEGRATIONS.join(', ')} is planned. The data model already stores
          the source of every record, so imported data will sit next to manual entries.
        </p>
      </div>
    </>
  )
}
