import { BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { BarsChart, TrendChart } from '@/components/charts/lazy'
import { GoalProgressBar } from '@/components/goals/goal-progress-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
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
import { getT, pageTitle } from '@/lib/i18n/server'
import { msg } from '@/lib/i18n/translate'

export const generateMetadata = pageTitle('Analytics')

const SECTIONS = ['finance', 'productivity', 'habits', 'fitness', 'goals', 'time'] as const
type Section = (typeof SECTIONS)[number]
const SECTION_LABELS: Record<Section, string> = {
  finance: msg('Finance'),
  productivity: msg('Productivity'),
  habits: msg('Habits'),
  fitness: msg('Fitness'),
  goals: msg('Goals'),
  time: msg('Time spent'),
}

export default async function AnalyticsPage({ searchParams }: PageProps<'/analytics'>) {
  const t = await getT()
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
        title={t('Analytics')}
        description={`${formatISODate(a.from, 'd MMM yyyy')} – ${formatISODate(a.to, 'd MMM yyyy')}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedLinks
            label={t('Analytics section')}
            active={section}
            items={SECTIONS.map((s) => ({
              value: s,
              label: t(SECTION_LABELS[s]),
              href: href(s, range),
            }))}
          />
          <SegmentedLinks
            label={t('Range')}
            active={range}
            items={ANALYTICS_RANGES.map((r) => ({
              value: r,
              label: r === 'ALL' ? t('ALL') : r,
              href: href(section, r),
            }))}
          />
        </div>
      </PageHeader>

      {section === 'productivity' && (
        <Section
          stats={[
            [t('Tasks completed'), a.productivity.completed],
            [
              t('Completion rate'),
              a.productivity.completionRate === null
                ? '—'
                : `${Math.round(a.productivity.completionRate)}%`,
              t('of tasks due in range'),
            ],
            [t('Overdue now'), a.productivity.overdue],
            [
              t('Focus time'),
              minutesToLabel(a.productivity.focusMinutes),
              t('estimated from completed tasks'),
            ],
            [t('Projects completed'), a.productivity.projectsCompleted],
          ]}
          chart={
            <BarsChart
              ariaLabel={t('Tasks completed')}
              data={a.productivity.series.map((p) => ({ label: label(p.key), completed: p.value }))}
              series={[{ key: 'completed', label: t('Tasks completed') }]}
            />
          }
          chartTitle={t('Tasks completed')}
          empty={
            allZero(a.productivity.series) && {
              description: t('Complete a few tasks and your productivity trend appears here.'),
              href: '/tasks',
              cta: t('Open tasks'),
            }
          }
        />
      )}

      {section === 'habits' && (
        <>
          <Section
            stats={[
              [
                t('Completion rate'),
                `${Math.round(a.habits.rate)}%`,
                `${a.habits.done}/${a.habits.due}`,
              ],
              [
                t('Consistency'),
                `${Math.round(a.habits.consistency)}%`,
                t('average, last 30 days'),
              ],
              [t('Check-ins'), a.habits.series.reduce((s, p) => s + p.value, 0)],
            ]}
            chart={
              <BarsChart
                ariaLabel={t('Habit check-ins')}
                data={a.habits.series.map((p) => ({ label: label(p.key), checkins: p.value }))}
                series={[{ key: 'checkins', label: t('Check-ins') }]}
              />
            }
            chartTitle={t('Check-ins')}
            empty={
              allZero(a.habits.series) && {
                description: t('Check in on a habit and your consistency builds up here.'),
                href: '/habits?new=1',
                cta: t('Create a habit'),
              }
            }
          />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {(
              [
                [t('Best habits'), a.habits.best],
                [t('Weakest habits'), a.habits.weakest],
              ] as const
            ).map(([title, list]) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {list.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('No habits yet.')}</p>
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
            [t('Workouts'), a.fitness.workouts],
            [t('Training time'), minutesToLabel(a.fitness.minutes)],
            [t('Distance'), formatDistance(a.fitness.distance, units)],
            [t('Volume'), formatWeight(Math.round(a.fitness.volume), units)],
            [t('New PRs'), a.fitness.newPRs],
          ]}
          chart={
            <BarsChart
              ariaLabel={t('Workouts')}
              data={a.fitness.series.map((p) => ({ label: label(p.key), workouts: p.value }))}
              series={[{ key: 'workouts', label: t('Workouts') }]}
            />
          }
          chartTitle={t('Workouts')}
          empty={
            allZero(a.fitness.series) && {
              description: t('Log a workout — even a walk — to start your training history.'),
              href: '/workouts',
              cta: t('Log a workout'),
            }
          }
        />
      )}

      {section === 'finance' && (
        <>
          <Section
            stats={[
              [t('Income'), formatMoney(a.finance.income, cur)],
              [t('Expenses'), formatMoney(a.finance.expenses, cur)],
              [t('Savings'), formatMoney(a.finance.savings, cur)],
              [t('Savings rate'), `${Math.round(a.finance.savingsRate)}%`],
              [t('Net worth'), formatMoney(a.finance.netWorth, cur)],
            ]}
            chart={
              <TrendChart
                ariaLabel={t('Net worth')}
                format={`money:${cur}`}
                data={a.finance.netWorthSeries.map((p) => ({
                  label: label(p.key),
                  value: p.value,
                }))}
              />
            }
            chartTitle={t('Net worth')}
            empty={
              allZero(a.finance.netWorthSeries) && {
                description: t('Add an account to see how your net worth develops.'),
                href: '/finances/accounts?new=1',
                cta: t('Add account'),
              }
            }
          />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('Spending')}</CardTitle>
              <Link href="/finances/analytics" className="text-primary text-xs hover:underline">
                {t('Detailed financial analytics')}
              </Link>
            </CardHeader>
            <CardContent>
              <BarsChart
                ariaLabel={t('Spending')}
                format={`money:${cur}`}
                data={a.finance.expenseSeries.map((p) => ({
                  label: label(p.key),
                  spending: Math.round(p.value),
                }))}
                series={[{ key: 'spending', label: t('Spending'), color: 'var(--chart-4)' }]}
              />
            </CardContent>
          </Card>
        </>
      )}

      {section === 'goals' && (
        <>
          <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-5">
            <Stat label={t('Active goals')} value={a.goals.active} />
            <Stat label={t('Average progress')} value={`${Math.round(a.goals.avgProgress)}%`} />
            <Stat label={t('On track')} value={a.goals.onTrack} tone="positive" />
            <Stat
              label={t('Behind')}
              value={a.goals.behind}
              tone={a.goals.behind ? 'warning' : undefined}
            />
            <Stat label={t('Completed')} value={a.goals.completed} hint={t('in range')} />
          </div>
          <Card>
            <CardContent className="flex flex-col gap-4 pt-4">
              {a.goals.list.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('No active goals.')}</p>
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
            [t('Scheduled events'), minutesToLabel(a.time.eventMinutes)],
            [t('Training'), minutesToLabel(a.time.trainingMinutes)],
            [
              t('Focused task work'),
              minutesToLabel(a.time.focusMinutes),
              t('tasks with a duration'),
            ],
          ]}
          chart={
            <BarsChart
              ariaLabel={t('Time allocation')}
              format="minutes"
              data={[
                { label: t('Events'), minutes: a.time.eventMinutes },
                { label: t('Training'), minutes: a.time.trainingMinutes },
                { label: t('Tasks'), minutes: a.time.focusMinutes },
              ]}
              series={[{ key: 'minutes', label: t('Time spent') }]}
            />
          }
          chartTitle={t('Where your time went')}
          empty={
            !a.time.eventMinutes &&
            !a.time.trainingMinutes &&
            !a.time.focusMinutes && {
              description: t(
                'Plan events, log workouts or give tasks a duration to see your time split.',
              ),
              href: '/calendar?view=week',
              cta: t('Open calendar'),
            }
          }
        />
      )}
    </>
  )
}

async function Section({
  stats,
  chart,
  chartTitle,
  empty,
}: {
  stats: [string, React.ReactNode, string?][]
  chart: React.ReactNode
  chartTitle: string
  /** Shown instead of a flat chart when there is nothing to plot yet. */
  empty?: { description: string; href: string; cta: string } | false
}) {
  const t = await getT()
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
        <CardContent>
          {empty ? (
            <EmptyState
              compact
              icon={BarChart3}
              title={t('Nothing to chart yet')}
              description={empty.description}
              action={
                <Button asChild size="sm">
                  <Link href={empty.href}>{empty.cta}</Link>
                </Button>
              }
            />
          ) : (
            chart
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const allZero = (series: { value: number }[]) => series.every((p) => !p.value)
