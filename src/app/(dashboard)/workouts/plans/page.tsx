import { CalendarRange, Copy } from 'lucide-react'
import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import {
  DeleteTemplateButton,
  NewPlanButton,
  NewTemplateButton,
  PlanControls,
} from '@/components/workouts/plan-editors'
import { addDaysISO, diffDaysISO, formatISODate, orderedWeekdays, WEEKDAY_SHORT } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatWeight, type Units } from '@/lib/units'
import { listExercises, listPlans, listTemplates } from '@/lib/workouts/repository'
import { WORKOUT_TYPE_LABELS, type WorkoutType } from '@/lib/workouts/schemas'

export const metadata: Metadata = { title: 'Plans & templates' }

export default async function PlansPage() {
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
        title="Plans & templates"
        description="Structure your training: weekly plans and reusable sessions."
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
            Training plans
          </h2>
          {plans.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="No training plans"
              description="Create a plan like “Half Marathon — 12 weeks” and see today's session on your dashboard."
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
                          {formatISODate(p.start_date, 'd MMM yyyy')} · {p.weeks} weeks
                          {today < p.start_date
                            ? ' · starts soon'
                            : ended
                              ? ' · finished'
                              : ` · week ${week} of ${p.weeks}`}
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
                              <span className="font-semibold">{WEEKDAY_SHORT[d]}</span>
                              <span className="line-clamp-2">{rest ? 'Rest' : s!.title}</span>
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
            Templates
          </h2>
          {templates.length === 0 ? (
            <EmptyState
              icon={Copy}
              title="No templates"
              description="Create one here or use “Save as template” on any finished workout."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardHeader>
                    <div>
                      <CardTitle>{t.name}</CardTitle>
                      <p className="text-muted-foreground text-xs">
                        {WORKOUT_TYPE_LABELS[t.workout_type as WorkoutType]}
                      </p>
                    </div>
                    <DeleteTemplateButton id={t.id} name={t.name} />
                  </CardHeader>
                  <CardContent>
                    {t.exercises.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No exercises.</p>
                    ) : (
                      <ul className="flex flex-col gap-1 text-sm">
                        {[...t.exercises]
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
