import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { GoalProgressBar } from '@/components/goals/goal-progress-bar'
import { PeriodSummaryView } from '@/components/reviews/period-summary'
import { ReviewForm } from '@/components/reviews/review-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented'
import { getAIProvider } from '@/lib/ai/provider'
import { formatISODate, isISODate } from '@/lib/dates'
import { listGoalsWithProgress } from '@/lib/goals/service'
import { reviewPeriod, REVIEW_TYPES, type ReviewType } from '@/lib/reviews/period'
import { getPeriodSummary } from '@/lib/reviews/summary'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Reviews')

export default async function ReviewsPage({ searchParams }: PageProps<'/reviews'>) {
  const t = await getT()
  const sp = await searchParams
  const type: ReviewType = REVIEW_TYPES.includes(sp.type as ReviewType)
    ? (sp.type as ReviewType)
    : 'weekly'
  const { supabase, user, today, timezone, currency, prefs } = await getOnboardedUserContext()
  const date = typeof sp.date === 'string' && isISODate(sp.date) ? sp.date : today
  const period = reviewPeriod(type, date, prefs.week_start)
  const prevPeriod = reviewPeriod(type, period.prev, prefs.week_start)

  const [summary, previous, saved, goals] = await Promise.all([
    getPeriodSummary(supabase, user.id, period.from, period.to, timezone, currency, today),
    type === 'daily'
      ? Promise.resolve(null)
      : getPeriodSummary(
          supabase,
          user.id,
          prevPeriod.from,
          prevPeriod.to,
          timezone,
          currency,
          today,
        ),
    type === 'daily'
      ? supabase
          .from('daily_reviews')
          .select('highlights, notes')
          .eq('user_id', user.id)
          .eq('review_date', period.key)
          .maybeSingle()
      : type === 'weekly'
        ? supabase
            .from('weekly_reviews')
            .select('wins, challenges, next_priorities')
            .eq('user_id', user.id)
            .eq('week_start', period.key)
            .maybeSingle()
        : supabase
            .from('monthly_reviews')
            .select('wins, challenges, next_focus')
            .eq('user_id', user.id)
            .eq('month_start', period.key)
            .maybeSingle(),
    type === 'monthly'
      ? listGoalsWithProgress(supabase, user.id, today, ['active', 'completed'])
      : Promise.resolve([]),
  ])
  const row = (saved.data ?? {}) as Record<string, string | null>
  const initial =
    type === 'daily'
      ? { a: row.highlights, b: row.notes }
      : type === 'weekly'
        ? { a: row.wins, b: row.challenges, c: row.next_priorities }
        : { a: row.wins, b: row.challenges, c: row.next_focus }
  const financeLine =
    type === 'monthly' && previous
      ? await getAIProvider().financeSummary(
          {
            currency,
            expenses: summary.money.expenses,
            previousExpenses: previous.money.expenses,
            topIncreases: [],
            savingsRate: summary.money.savingsRate,
          },
          t.locale,
        )
      : null
  const title =
    type === 'daily'
      ? formatISODate(period.from, 'EEEE, d MMMM yyyy')
      : type === 'weekly'
        ? t('Week of {from} – {to}', {
            from: formatISODate(period.from, 'd MMM'),
            to: formatISODate(period.to, 'd MMM yyyy'),
          })
        : formatISODate(period.from, 'MMMM yyyy')
  const delta = (cur: number, prev: number | undefined) => (prev === undefined ? null : cur - prev)

  return (
    <>
      <PageHeader
        title={t('Reviews')}
        description={t(
          'Look back to steer forward: what happened, what improved, what matters next.',
        )}
      >
        <SegmentedLinks
          label={t('Review type')}
          active={type}
          items={[
            { value: 'daily', label: t('Daily'), href: '/reviews?type=daily' },
            { value: 'weekly', label: t('Weekly'), href: '/reviews?type=weekly' },
            { value: 'monthly', label: t('Monthly'), href: '/reviews?type=monthly' },
          ]}
        />
      </PageHeader>
      <div className="mb-4 flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link
            href={`/reviews?type=${type}&date=${period.prev}`}
            aria-label={t('Previous period')}
          >
            <ChevronLeft />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">{title}</h2>
        {period.to < today && (
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/reviews?type=${type}&date=${period.next}`} aria-label={t('Next period')}>
              <ChevronRight />
            </Link>
          </Button>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {type === 'daily'
                  ? t('Day overview')
                  : type === 'weekly'
                    ? t('Week overview')
                    : t('Month overview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <PeriodSummaryView summary={summary} />
              {previous && (
                <p className="text-muted-foreground text-xs">
                  {(() => {
                    const vars = {
                      tasks: fmtDelta(delta(summary.tasks.completed, previous.tasks.completed)),
                      workouts: fmtDelta(delta(summary.workouts.count, previous.workouts.count)),
                      habits: fmtDelta(
                        previous.habits.due
                          ? Math.round(summary.habits.rate - previous.habits.rate)
                          : null,
                        '%',
                      ),
                    }
                    return type === 'weekly'
                      ? t(
                          'vs previous week: tasks {tasks}, workouts {workouts}, habits {habits}',
                          vars,
                        )
                      : t(
                          'vs previous month: tasks {tasks}, workouts {workouts}, habits {habits}',
                          vars,
                        )
                  })()}
                </p>
              )}
              {financeLine && <p className="text-sm">{financeLine}</p>}
              {(summary.projectsCompleted > 0 || summary.goalsCompleted > 0) && (
                <p className="text-sm">
                  🎉{' '}
                  {t('{goals} goal(s) and {projects} project(s) completed.', {
                    goals: summary.goalsCompleted,
                    projects: summary.projectsCompleted,
                  })}
                </p>
              )}
            </CardContent>
          </Card>
          {type === 'monthly' && goals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('Goals')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {goals.map((g) => (
                  <div key={g.id} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <Link href={`/goals/${g.id}`} className="hover:underline">
                        {g.title}
                      </Link>
                      <span className="tabular">{Math.round(g.progress.percent)}%</span>
                    </div>
                    <GoalProgressBar percent={g.progress.percent} pace={g.pace} label={g.title} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('Reflection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm
              key={`${type}:${period.key}`}
              type={type}
              date={period.key}
              initial={initial}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function fmtDelta(d: number | null, suffix = '') {
  if (d === null) return '—'
  return `${d > 0 ? '+' : ''}${d}${suffix}`
}
