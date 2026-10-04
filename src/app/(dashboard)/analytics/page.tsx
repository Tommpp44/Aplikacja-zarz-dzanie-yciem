import type { Metadata } from 'next'
import Link from 'next/link'
import { BarsChart, TrendChart } from '@/components/charts/lazy'
import { GoalProgressBar } from '@/components/goals/goal-progress-bar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Progress } from '@/components/ui/progress'
import { SegmentedLinks } from '@/components/ui/segmented'
import { Stat } from '@/components/ui/stat'
import { ANALYTICS_RANGES, type AnalyticsRange } from '@/lib/analytics/engine'
import { getAnalytics } from '@/lib/analytics/service'
import { formatISODate, minutesToLabel } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatDistance, formatWeight, type Units } from '@/lib/units'

export const metadata: Metadata = { title: 'Analytics' }

const SECTIONS = ['finance', 'productivity', 'habits', 'fitness', 'goals', 'time'] as const
type Section = (typeof SECTIONS)[number]

export default async function AnalyticsPage({ searchParams }: PageProps<'/analytics'>) {
  const sp = await searchParams
  const range: AnalyticsRange = ANALYTICS_RANGES.includes(sp.range as AnalyticsRange)
    ? (sp.range as AnalyticsRange)
    : '30D'
  const section: Section = SECTIONS.includes(sp.section as Section)
    ? (sp.section as Section)
    : 'productivity'
  const ctx = await getOnboardedUserContext()
  const units: Units = ctx.prefs.units === 'imperial' ? 'imperial' : 'metric'
  const a = await getAnalytics(ctx, range)
  const label = (key: string) => formatISODate(key, a.bucket === 'month' ? 'MMM yy' : 'd MMM')
  const cur = ctx.currency
  const href = (s: Section, r: AnalyticsRange) => `/analytics?section=${s}&range=${r}`

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`${formatISODate(a.from, 'd MMM yyyy')} – ${formatISODate(a.to, 'd MMM yyyy')}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedLinks
            label="Analytics section"
            active={section}
            items={SECTIONS.map((s) => ({
              value: s,
              label: s[0]!.toUpperCase() + s.slice(1),
              href: href(s, range),
            }))}
          />
          <SegmentedLinks
            label="Range"
            active={range}
            items={ANALYTICS_RANGES.map((r) => ({ value: r, label: r, href: href(section, r) }))}
          />
        </div>
      </PageHeader>

      {section === 'productivity' && (
        <Section
          stats={[
            ['Tasks completed', a.productivity.completed],
            [
              'Completion rate',
              a.productivity.completionRate === null
                ? '—'
                : `${Math.round(a.productivity.completionRate)}%`,
              'of tasks due in range',
            ],
            ['Overdue now', a.productivity.overdue],
            [
              'Focus time',
              minutesToLabel(a.productivity.focusMinutes),
              'estimated from completed tasks',
            ],
            ['Projects completed', a.productivity.projectsCompleted],
          ]}
          chart={
            <BarsChart
              ariaLabel="Tasks completed"
              data={a.productivity.series.map((p) => ({ label: label(p.key), completed: p.value }))}
              series={[{ key: 'completed', label: 'Tasks completed' }]}
            />
          }
          chartTitle="Tasks completed"
        />
      )}

      {section === 'habits' && (
        <>
          <Section
            stats={[
              [
                'Completion rate',
                `${Math.round(a.habits.rate)}%`,
                `${a.habits.done}/${a.habits.due}`,
              ],
              ['Consistency', `${Math.round(a.habits.consistency)}%`, 'average, last 30 days'],
              ['Check-ins', a.habits.series.reduce((s, p) => s + p.value, 0)],
            ]}
            chart={
              <BarsChart
                ariaLabel="Habit check-ins"
                data={a.habits.series.map((p) => ({ label: label(p.key), checkins: p.value }))}
                series={[{ key: 'checkins', label: 'Check-ins' }]}
              />
            }
            chartTitle="Check-ins"
          />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {(
              [
                ['Best habits', a.habits.best],
                ['Weakest habits', a.habits.weakest],
              ] as const
            ).map(([title, list]) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {list.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No habits yet.</p>
                  ) : (
                    list.map((h) => (
                      <Link key={h.id} href={`/habits/${h.id}`} className="flex flex-col gap-1">
                        <span className="flex justify-between text-sm">
                          {h.name}{' '}
                          <span className="tabular">{Math.round(h.stats.completionRate)}%</span>
                        </span>
                        <Progress value={h.stats.completionRate} tone="success" label={h.name} />
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {section === 'fitness' && (
        <Section
          stats={[
            ['Workouts', a.fitness.workouts],
            ['Training time', minutesToLabel(a.fitness.minutes)],
            ['Distance', formatDistance(a.fitness.distance, units)],
            ['Volume', formatWeight(Math.round(a.fitness.volume), units)],
            ['New PRs', a.fitness.newPRs],
          ]}
          chart={
            <BarsChart
              ariaLabel="Workouts"
              data={a.fitness.series.map((p) => ({ label: label(p.key), workouts: p.value }))}
              series={[{ key: 'workouts', label: 'Workouts' }]}
            />
          }
          chartTitle="Workouts"
        />
      )}

      {section === 'finance' && (
        <>
          <Section
            stats={[
              ['Income', formatMoney(a.finance.income, cur)],
              ['Expenses', formatMoney(a.finance.expenses, cur)],
              ['Savings', formatMoney(a.finance.savings, cur)],
              ['Savings rate', `${Math.round(a.finance.savingsRate)}%`],
              ['Net worth', formatMoney(a.finance.netWorth, cur)],
            ]}
            chart={
              <TrendChart
                ariaLabel="Net worth"
                format={`money:${cur}`}
                data={a.finance.netWorthSeries.map((p) => ({
                  label: label(p.key),
                  value: p.value,
                }))}
              />
            }
            chartTitle="Net worth"
          />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Spending</CardTitle>
              <Link href="/finances/analytics" className="text-primary text-xs hover:underline">
                Detailed financial analytics
              </Link>
            </CardHeader>
            <CardContent>
              <BarsChart
                ariaLabel="Spending"
                format={`money:${cur}`}
                data={a.finance.expenseSeries.map((p) => ({
                  label: label(p.key),
                  spending: Math.round(p.value),
                }))}
                series={[{ key: 'spending', label: 'Spending', color: 'var(--chart-4)' }]}
              />
            </CardContent>
          </Card>
        </>
      )}

      {section === 'goals' && (
        <>
          <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-5">
            <Stat label="Active goals" value={a.goals.active} />
            <Stat label="Average progress" value={`${Math.round(a.goals.avgProgress)}%`} />
            <Stat label="On track" value={a.goals.onTrack} tone="positive" />
            <Stat
              label="Behind"
              value={a.goals.behind}
              tone={a.goals.behind ? 'warning' : undefined}
            />
            <Stat label="Completed" value={a.goals.completed} hint="in range" />
          </div>
          <Card>
            <CardContent className="flex flex-col gap-4 pt-4">
              {a.goals.list.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active goals.</p>
              ) : (
                a.goals.list.map((g) => (
                  <Link key={g.id} href={`/goals/${g.id}`} className="flex flex-col gap-1">
                    <span className="flex justify-between text-sm">
                      <span>
                        {g.title}{' '}
                        <span className="text-muted-foreground text-xs capitalize">
                          · {g.category}
                        </span>
                      </span>
                      <span className="tabular">{Math.round(g.progress.percent)}%</span>
                    </span>
                    <GoalProgressBar percent={g.progress.percent} pace={g.pace} label={g.title} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      {section === 'time' && (
        <Section
          stats={[
            ['Scheduled events', minutesToLabel(a.time.eventMinutes)],
            ['Training', minutesToLabel(a.time.trainingMinutes)],
            ['Focused task work', minutesToLabel(a.time.focusMinutes), 'tasks with a duration'],
          ]}
          chart={
            <BarsChart
              ariaLabel="Time allocation"
              format="minutes"
              data={[
                { label: 'Events', minutes: a.time.eventMinutes },
                { label: 'Training', minutes: a.time.trainingMinutes },
                { label: 'Tasks', minutes: a.time.focusMinutes },
              ]}
              series={[{ key: 'minutes', label: 'Time' }]}
            />
          }
          chartTitle="Where your time went"
        />
      )}
    </>
  )
}

function Section({
  stats,
  chart,
  chartTitle,
}: {
  stats: [string, React.ReactNode, string?][]
  chart: React.ReactNode
  chartTitle: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-5">
        {stats.map(([label, value, hint]) => (
          <Stat key={label} label={label} value={value} hint={hint} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{chartTitle}</CardTitle>
        </CardHeader>
        <CardContent>{chart}</CardContent>
      </Card>
    </div>
  )
}
