import { CalendarRange, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import {
  DeleteTemplateButton,
  NewPlanButton,
  NewTemplateButton,
  PlanControls,
} from '@/components/workouts/plan-editors'
import { addDaysISO, diffDaysISO, formatISODate, orderedWeekdays, weekdayShort } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatWeight, type Units } from '@/lib/units'
import { listExercises, listPlans, listTemplates } from '@/lib/workouts/repository'
import { WORKOUT_TYPE_LABELS, type WorkoutType } from '@/lib/workouts/schemas'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Plans & templates')

export default async function PlansPage() {
  const t = await getT()
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const units: Units = prefs.units === 'imperial' ? 'imperial' : 'metric'
  const [plans, templates, exercises, goals] = await Promise.all([
    listPlans(supabase, user.id),
    listTemplates(supabase, user.id),
    listExercises(supabase, user.id),
    listGoalOptions(supabase, user.id),
  ])
  return (
    <>
      <PageHeader
        title={t('Plans & templates')}
        description={t('Structure your training: weekly plans and reusable sessions.')}
        actions={
          <>
            <NewTemplateButton
              exercises={exercises.map((e) => ({ id: e.id, name: e.name }))}
              units={units}
            />
            <NewPlanButton
              templates={templates}
              goals={goals}
              today={today}
              weekStartsOn={prefs.week_start}
            />
          </>
        }
      />
      <div className="flex flex-col gap-8">
        <section aria-labelledby="plans">
          <h2 id="plans" className="text-muted-foreground mb-3 text-sm font-semibold">
            {t('Training plans')}
          </h2>
          {plans.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title={t('No training plans')}
              description={t(
                "Create a plan like “Half Marathon — 12 weeks” and see today's session on your dashboard.",
              )}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((p) => {
                const week = Math.floor(diffDaysISO(today, p.start_date) / 7) + 1
                const ended = today >= addDaysISO(p.start_date, p.weeks * 7)
                return (
                  <Card key={p.id}>
                    <CardHeader>
                      <div>
                        <CardTitle>{p.name}</CardTitle>
                        <p className="text-muted-foreground text-xs">
                          {formatISODate(p.start_date, 'd MMM yyyy')} ·{' '}
                          {t.plural(p.weeks, '{n} week', '{n} weeks')}
                          {' · '}
                          {today < p.start_date
                            ? t('starts soon')
                            : ended
                              ? t('finished')
                              : t('week {week} of {weeks}', { week, weeks: p.weeks })}
                        </p>
                      </div>
                      <PlanControls id={p.id} active={p.active} name={p.name} />
                    </CardHeader>
                    <CardContent>
                      <ul className="grid grid-cols-7 gap-1 text-center">
                        {orderedWeekdays(prefs.week_start).map((d) => {
                          const s = p.sessions.find((x) => x.weekday === d && x.week === null)
                          const rest = !s || s.workout_type === 'rest'
                          return (
                            <li
                              key={d}
                              className={`flex flex-col gap-0.5 rounded-md p-1.5 text-[11px] ${rest ? 'bg-muted/50 text-muted-foreground' : 'bg-primary-soft text-primary'}`}
                            >
                              <span className="font-semibold">{weekdayShort(d)}</span>
                              <span className="line-clamp-2">{rest ? t('Rest') : s!.title}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
        <section aria-labelledby="templates">
          <h2 id="templates" className="text-muted-foreground mb-3 text-sm font-semibold">
            {t('Templates')}
          </h2>
          {templates.length === 0 ? (
            <EmptyState
              icon={Copy}
              title={t('No templates')}
              description={t('Create one here or use “Save as template” on any finished workout.')}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((tpl) => (
                <Card key={tpl.id}>
                  <CardHeader>
                    <div>
                      <CardTitle>{tpl.name}</CardTitle>
                      <p className="text-muted-foreground text-xs">
                        {t(WORKOUT_TYPE_LABELS[tpl.workout_type as WorkoutType])}
                      </p>
                    </div>
                    <DeleteTemplateButton id={tpl.id} name={tpl.name} />
                  </CardHeader>
                  <CardContent>
                    {tpl.exercises.length === 0 ? (
                      <p className="text-muted-foreground text-sm">{t('No exercises.')}</p>
                    ) : (
                      <ul className="flex flex-col gap-1 text-sm">
                        {[...tpl.exercises]
                          .sort((a, b) => a.position - b.position)
                          .map((e) => (
                            <li key={e.id} className="flex justify-between gap-2">
                              <span className="truncate">{e.exercise?.name}</span>
                              <span className="text-muted-foreground tabular text-xs">
                                {e.target_sets ?? '–'} × {e.target_reps ?? '–'}
                                {e.target_weight_kg
                                  ? ` @ ${formatWeight(Number(e.target_weight_kg), units)}`
                                  : ''}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
