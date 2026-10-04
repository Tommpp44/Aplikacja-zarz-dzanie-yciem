import { Dumbbell, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BarsChart } from '@/components/charts/lazy'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { StartPlannedSession, StartWorkout } from '@/components/workouts/start-workout'
import { formatISODate, minutesToLabel, relativeDayLabel } from '@/lib/dates'
import { listGoalOptions } from '@/lib/goals/options'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { formatDistance, formatWeight, type Units } from '@/lib/units'
import { WORKOUT_TYPE_LABELS, type WorkoutType } from '@/lib/workouts/schemas'
import { getStrengthRecords, getTrainingOverview, listTemplates } from '@/lib/workouts/service'

export const metadata: Metadata = { title: 'Workouts' }

export default async function WorkoutsPage() {
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const units: Units = prefs.units === 'imperial' ? 'imperial' : 'metric'
  const [t, records, templates, goals] = await Promise.all([
    getTrainingOverview(supabase, user.id, today, prefs.week_start),
    getStrengthRecords(supabase, user.id),
    listTemplates(supabase, user.id),
    listGoalOptions(supabase, user.id),
  ])
  const lastType = (prefs.last_used.workout_type ?? 'running') as WorkoutType

  return (
    <>
      <PageHeader
        title="Workouts"
        description={
          t.thisWeek.target
            ? `${t.thisWeek.count} of ${t.thisWeek.target} planned workouts this week`
            : `${t.thisWeek.count} workouts this week`
        }
        actions={
          <StartWorkout
            templates={templates}
            today={today}
            units={units}
            goals={goals}
            defaultLogType={lastType}
          />
        }
      />
      {t.inProgress && (
        <Link
          href={`/workouts/${t.inProgress.id}`}
          className="border-warning/40 bg-warning-soft mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm"
        >
          <span>
            <strong>{t.inProgress.name}</strong> is in progress
          </span>
          <span className="font-medium">Continue →</span>
        </Link>
      )}

      <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-4">
        <Stat
          label="This week"
          value={
            t.thisWeek.target ? `${t.thisWeek.count} / ${t.thisWeek.target}` : t.thisWeek.count
          }
          hint="workouts"
          size="lg"
        />
        <Stat label="Training time" value={minutesToLabel(t.thisWeek.minutes)} hint="this week" />
        <Stat
          label="Distance"
          value={formatDistance(t.thisWeek.distance, units)}
          hint="this week"
        />
        <Stat label="Personal records" value={records.prs.length} hint="exercises tracked" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {t.todaysSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Planned today</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y">
                {t.todaysSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {s.planName} · week {s.week}
                        {s.target_duration_minutes ? ` · ${s.target_duration_minutes} min` : ''}
                      </p>
                    </div>
                    {s.workout_type === 'rest' ? (
                      <Badge variant="secondary">Rest day</Badge>
                    ) : s.done ? (
                      <Badge variant="success">Done</Badge>
                    ) : (
                      <StartPlannedSession sessionId={s.id} type={s.workout_type as WorkoutType} />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Weekly frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <BarsChart
                ariaLabel="Workouts per week"
                height={180}
                data={t.weekly.map((w) => ({
                  label: formatISODate(w.weekStart, 'd MMM'),
                  workouts: w.count,
                  minutes: w.minutes,
                }))}
                series={[{ key: 'workouts', label: 'Workouts' }]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {t.workouts.length === 0 ? (
                <EmptyState
                  compact
                  icon={Dumbbell}
                  title="No workouts yet"
                  description="Start a session or log one you already did."
                />
              ) : (
                <ul className="flex flex-col divide-y">
                  {t.workouts.slice(0, 15).map((w) => (
                    <li key={w.id}>
                      <Link
                        href={`/workouts/${w.id}`}
                        className="hover:text-primary flex items-center justify-between gap-3 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{w.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {WORKOUT_TYPE_LABELS[w.workout_type as WorkoutType]} ·{' '}
                            {relativeDayLabel(w.performed_on, today)}
                          </span>
                        </span>
                        <span className="text-muted-foreground shrink-0 text-right text-xs">
                          {w.status !== 'completed' ? (
                            <Badge variant="warning">
                              {w.status === 'in_progress' ? 'In progress' : 'Planned'}
                            </Badge>
                          ) : (
                            [
                              w.duration_minutes ? minutesToLabel(w.duration_minutes) : null,
                              w.distance_m ? formatDistance(Number(w.distance_m), units) : null,
                              records.volumeByWorkout.get(w.id)
                                ? formatWeight(records.volumeByWorkout.get(w.id)!, units)
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Personal records</CardTitle>
          </CardHeader>
          <CardContent>
            {records.prs.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Log strength sets to track your best lifts and estimated 1RM.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {records.prs.slice(0, 10).map((p) => (
                  <li key={p.exerciseId} className="flex items-start gap-2 text-sm">
                    <Trophy className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatWeight(p.bestWeight, units)} × {p.bestWeightReps} · e1RM{' '}
                        {formatWeight(Math.round(p.bestE1RM * 10) / 10, units)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
