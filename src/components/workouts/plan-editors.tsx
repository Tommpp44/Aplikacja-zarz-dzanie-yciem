'use client'

import { Pause, Play, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { SubmitButton } from '@/components/ui/submit-button'
import { useServerAction } from '@/hooks/use-server-action'
import { weekdayShort, orderedWeekdays, type ISODate } from '@/lib/dates'
import { weightUnit, type Units } from '@/lib/units'
import {
  createPlan,
  createTemplate,
  deletePlan,
  deleteTemplate,
  setPlanActive,
} from '@/lib/workouts/actions'
import { WORKOUT_TYPES, WORKOUT_TYPE_LABELS, type WorkoutType } from '@/lib/workouts/schemas'
import { useT } from '@/lib/i18n/client'

type Exercise = { id: string; name: string }
type Template = { id: string; name: string; workout_type: string }

export function NewTemplateButton({ exercises, units }: { exercises: Exercise[]; units: Units }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<WorkoutType>('strength')
  const [rows, setRows] = useState<
    { exercise_id: string; target_sets: number; target_reps: number; target_weight: string }[]
  >([])
  const [pick, setPick] = useState('')
  const [pending, run] = useServerAction()
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus /> {t('New template')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('Workout template')}</DialogTitle>
            <DialogDescription>
              {t('Reusable session — start it in one tap with sets pre-filled.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Name')} htmlFor="tpl-name">
                <Input
                  id="tpl-name"
                  placeholder={t('Upper body A')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label={t('Type')} htmlFor="tpl-type">
                <NativeSelect
                  id="tpl-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as WorkoutType)}
                >
                  {WORKOUT_TYPES.map((it) => (
                    <option key={it} value={it}>
                      {t(WORKOUT_TYPE_LABELS[it])}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {rows.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs">
                    <th className="text-left font-medium">{t('Exercise')}</th>
                    <th className="font-medium">{t('Sets')}</th>
                    <th className="font-medium">{t('Reps')}</th>
                    <th className="font-medium">{weightUnit(units)}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-2">
                        {exercises.find((e) => e.id === r.exercise_id)?.name}
                      </td>
                      {(['target_sets', 'target_reps'] as const).map((k) => (
                        <td key={k} className="px-1 py-1">
                          <Input
                            aria-label={k}
                            className="h-8 w-16 text-center"
                            type="number"
                            min={1}
                            value={r[k]}
                            onChange={(e) =>
                              setRows(
                                rows.map((x, j) =>
                                  j === i ? { ...x, [k]: Number(e.target.value) } : x,
                                ),
                              )
                            }
                          />
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        <Input
                          aria-label="weight"
                          className="h-8 w-20 text-center"
                          inputMode="decimal"
                          value={r.target_weight}
                          onChange={(e) =>
                            setRows(
                              rows.map((x, j) =>
                                j === i ? { ...x, target_weight: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t('Remove')}
                          onClick={() => setRows(rows.filter((_, j) => j !== i))}
                        >
                          <X />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex gap-2">
              <NativeSelect
                aria-label={t('Add exercise')}
                className="flex-1"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">{t('Add exercise…')}</option>
                {exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </NativeSelect>
              <Button
                variant="outline"
                disabled={!pick}
                onClick={() => {
                  setRows([
                    ...rows,
                    { exercise_id: pick, target_sets: 3, target_reps: 10, target_weight: '' },
                  ])
                  setPick('')
                }}
              >
                {t('Add')}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <SubmitButton
              type="button"
              pending={pending}
              disabled={!name.trim()}
              onClick={() =>
                run(
                  () =>
                    createTemplate({
                      name,
                      workout_type: type,
                      exercises: rows.map((r) => ({
                        exercise_id: r.exercise_id,
                        target_sets: r.target_sets,
                        target_reps: r.target_reps,
                        target_weight: r.target_weight
                          ? Number(r.target_weight.replace(',', '.'))
                          : null,
                      })),
                    }),
                  {
                    success: t('Template created'),
                    onSuccess: () => {
                      setOpen(false)
                      setName('')
                      setRows([])
                    },
                  },
                )
              }
            >
              {t('Create template')}
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DeleteTemplateButton({ id, name }: { id: string; name: string }) {
  const t = useT()
  const [, run] = useServerAction()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t('Delete {name}', { name })}
      onClick={() => run(() => deleteTemplate({ id }), { success: t('Template deleted') })}
    >
      <Trash2 />
    </Button>
  )
}

type SessionDraft = {
  weekday: number
  title: string
  workout_type: string
  template_id: string
  target_duration_minutes: string
}

export function NewPlanButton({
  templates,
  goals,
  today,
  weekStartsOn,
}: {
  templates: Template[]
  goals: { id: string; title: string }[]
  today: ISODate
  weekStartsOn: 0 | 1
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState({ name: '', start_date: today, weeks: 12, goal_id: '' })
  const [sessions, setSessions] = useState<SessionDraft[]>(() =>
    orderedWeekdays(weekStartsOn).map((weekday) => ({
      weekday,
      title: '',
      workout_type: 'rest',
      template_id: '',
      target_duration_minutes: '',
    })),
  )
  const [pending, run] = useServerAction()
  const update = (weekday: number, patch: Partial<SessionDraft>) =>
    setSessions(sessions.map((s) => (s.weekday === weekday ? { ...s, ...patch } : s)))
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> {t('New plan')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Training plan')}</DialogTitle>
            <DialogDescription>
              {t(
                'A weekly schedule repeated for a number of weeks — e.g. “Half Marathon — 12 weeks”.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label={t('Name')} htmlFor="plan-name" className="col-span-2">
                <Input
                  id="plan-name"
                  placeholder={t('Half Marathon — 12 weeks')}
                  value={plan.name}
                  onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                />
              </Field>
              <Field label={t('Starts')} htmlFor="plan-start">
                <Input
                  id="plan-start"
                  type="date"
                  value={plan.start_date}
                  onChange={(e) => setPlan({ ...plan, start_date: e.target.value })}
                />
              </Field>
              <Field label={t('Weeks')} htmlFor="plan-weeks">
                <Input
                  id="plan-weeks"
                  type="number"
                  min={1}
                  max={52}
                  value={plan.weeks}
                  onChange={(e) => setPlan({ ...plan, weeks: Number(e.target.value) || 1 })}
                />
              </Field>
            </div>
            {goals.length > 0 && (
              <Field label={t('Linked goal')} htmlFor="plan-goal" optional>
                <NativeSelect
                  id="plan-goal"
                  value={plan.goal_id}
                  onChange={(e) => setPlan({ ...plan, goal_id: e.target.value })}
                >
                  <option value="">{t('None')}</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[13px] font-medium">{t('Weekly schedule')}</legend>
              {sessions.map((s) => (
                <div
                  key={s.weekday}
                  className="grid grid-cols-[44px_1fr_1fr] items-center gap-2 sm:grid-cols-[44px_140px_1fr_90px]"
                >
                  <span className="text-sm font-medium">{weekdayShort(s.weekday, t.locale)}</span>
                  <NativeSelect
                    aria-label={t('{day} type', { day: weekdayShort(s.weekday, t.locale) })}
                    value={s.workout_type}
                    onChange={(e) =>
                      update(s.weekday, {
                        workout_type: e.target.value,
                        title:
                          s.title ||
                          (e.target.value === 'rest'
                            ? ''
                            : t(WORKOUT_TYPE_LABELS[e.target.value as WorkoutType])),
                      })
                    }
                  >
                    <option value="rest">{t('Rest')}</option>
                    {WORKOUT_TYPES.map((it) => (
                      <option key={it} value={it}>
                        {t(WORKOUT_TYPE_LABELS[it])}
                      </option>
                    ))}
                  </NativeSelect>
                  <Input
                    aria-label={t('{day} session', { day: weekdayShort(s.weekday, t.locale) })}
                    disabled={s.workout_type === 'rest'}
                    placeholder={t('Intervals, Long run…')}
                    value={s.title}
                    onChange={(e) => update(s.weekday, { title: e.target.value })}
                  />
                  <Input
                    aria-label={t('{day} minutes', { day: weekdayShort(s.weekday, t.locale) })}
                    className="hidden sm:block"
                    disabled={s.workout_type === 'rest'}
                    placeholder={t('min')}
                    inputMode="numeric"
                    value={s.target_duration_minutes}
                    onChange={(e) => update(s.weekday, { target_duration_minutes: e.target.value })}
                  />
                  {templates.length > 0 && s.workout_type === 'strength' && (
                    <NativeSelect
                      aria-label={t('{day} template', { day: weekdayShort(s.weekday, t.locale) })}
                      className="col-span-2 col-start-2 sm:col-span-3"
                      value={s.template_id}
                      onChange={(e) => update(s.weekday, { template_id: e.target.value })}
                    >
                      <option value="">{t('No template')}</option>
                      {templates.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </div>
              ))}
            </fieldset>
          </div>
          <DialogFooter>
            <SubmitButton
              type="button"
              pending={pending}
              disabled={!plan.name.trim()}
              onClick={() =>
                run(
                  () =>
                    createPlan({
                      ...plan,
                      goal_id: plan.goal_id || null,
                      sessions: sessions.map((s) => ({
                        weekday: s.weekday,
                        week: null,
                        title:
                          s.workout_type === 'rest'
                            ? t('Rest')
                            : s.title || t(WORKOUT_TYPE_LABELS[s.workout_type as WorkoutType]),
                        workout_type: s.workout_type as 'rest',
                        template_id: s.template_id || null,
                        target_duration_minutes: s.target_duration_minutes
                          ? Number(s.target_duration_minutes)
                          : null,
                      })),
                    }),
                  { success: t('Plan created'), onSuccess: () => setOpen(false) },
                )
              }
            >
              {t('Create plan')}
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PlanControls({ id, active, name }: { id: string; active: boolean; name: string }) {
  const t = useT()
  const [confirming, setConfirming] = useState(false)
  const [pending, run] = useServerAction()
  return (
    <div className="flex items-center gap-1">
      {!active && <Badge variant="secondary">{t('Paused')}</Badge>}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={active ? t('Pause {name}', { name }) : t('Activate {name}', { name })}
        onClick={() =>
          run(() => setPlanActive({ id, active: !active }), {
            success: active ? t('Plan paused') : t('Plan activated'),
          })
        }
      >
        {active ? <Pause /> : <Play />}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('Delete {name}', { name })}
        onClick={() => setConfirming(true)}
      >
        <Trash2 />
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('Delete this plan?')}
        description={t('Logged workouts are kept.')}
        onConfirm={() => run(() => deletePlan({ id }), { success: t('Plan deleted') })}
      />
    </div>
  )
}
