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
import { WEEKDAY_SHORT, orderedWeekdays, type ISODate } from '@/lib/dates'
import { weightUnit, type Units } from '@/lib/units'
import {
  createPlan,
  createTemplate,
  deletePlan,
  deleteTemplate,
  setPlanActive,
} from '@/lib/workouts/actions'
import { WORKOUT_TYPES, WORKOUT_TYPE_LABELS, type WorkoutType } from '@/lib/workouts/schemas'

type Exercise = { id: string; name: string }
type Template = { id: string; name: string; workout_type: string }

export function NewTemplateButton({ exercises, units }: { exercises: Exercise[]; units: Units }) {
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
        <Plus /> New template
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Workout template</DialogTitle>
            <DialogDescription>
              Reusable session — start it in one tap with sets pre-filled.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" htmlFor="tpl-name">
                <Input
                  id="tpl-name"
                  placeholder="Upper body A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Type" htmlFor="tpl-type">
                <NativeSelect
                  id="tpl-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as WorkoutType)}
                >
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {WORKOUT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {rows.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs">
                    <th className="text-left font-medium">Exercise</th>
                    <th className="font-medium">Sets</th>
                    <th className="font-medium">Reps</th>
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
                          aria-label="Remove"
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
                aria-label="Add exercise"
                className="flex-1"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">Add exercise…</option>
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
                Add
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
                    success: 'Template created',
                    onSuccess: () => {
                      setOpen(false)
                      setName('')
                      setRows([])
                    },
                  },
                )
              }
            >
              Create template
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DeleteTemplateButton({ id, name }: { id: string; name: string }) {
  const [, run] = useServerAction()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Delete ${name}`}
      onClick={() => run(() => deleteTemplate({ id }), { success: 'Template deleted' })}
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
        <Plus /> New plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Training plan</DialogTitle>
            <DialogDescription>
              A weekly schedule repeated for a number of weeks — e.g. “Half Marathon — 12 weeks”.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Name" htmlFor="plan-name" className="col-span-2">
                <Input
                  id="plan-name"
                  placeholder="Half Marathon — 12 weeks"
                  value={plan.name}
                  onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                />
              </Field>
              <Field label="Starts" htmlFor="plan-start">
                <Input
                  id="plan-start"
                  type="date"
                  value={plan.start_date}
                  onChange={(e) => setPlan({ ...plan, start_date: e.target.value })}
                />
              </Field>
              <Field label="Weeks" htmlFor="plan-weeks">
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
              <Field label="Linked goal" htmlFor="plan-goal" optional>
                <NativeSelect
                  id="plan-goal"
                  value={plan.goal_id}
                  onChange={(e) => setPlan({ ...plan, goal_id: e.target.value })}
                >
                  <option value="">None</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[13px] font-medium">Weekly schedule</legend>
              {sessions.map((s) => (
                <div
                  key={s.weekday}
                  className="grid grid-cols-[44px_1fr_1fr] items-center gap-2 sm:grid-cols-[44px_140px_1fr_90px]"
                >
                  <span className="text-sm font-medium">{WEEKDAY_SHORT[s.weekday]}</span>
                  <NativeSelect
                    aria-label={`${WEEKDAY_SHORT[s.weekday]} type`}
                    value={s.workout_type}
                    onChange={(e) =>
                      update(s.weekday, {
                        workout_type: e.target.value,
                        title:
                          s.title ||
                          (e.target.value === 'rest'
                            ? ''
                            : WORKOUT_TYPE_LABELS[e.target.value as WorkoutType]),
                      })
                    }
                  >
                    <option value="rest">Rest</option>
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {WORKOUT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </NativeSelect>
                  <Input
                    aria-label={`${WEEKDAY_SHORT[s.weekday]} session`}
                    disabled={s.workout_type === 'rest'}
                    placeholder="Intervals, Long run…"
                    value={s.title}
                    onChange={(e) => update(s.weekday, { title: e.target.value })}
                  />
                  <Input
                    aria-label={`${WEEKDAY_SHORT[s.weekday]} minutes`}
                    className="hidden sm:block"
                    disabled={s.workout_type === 'rest'}
                    placeholder="min"
                    inputMode="numeric"
                    value={s.target_duration_minutes}
                    onChange={(e) => update(s.weekday, { target_duration_minutes: e.target.value })}
                  />
                  {templates.length > 0 && s.workout_type === 'strength' && (
                    <NativeSelect
                      aria-label={`${WEEKDAY_SHORT[s.weekday]} template`}
                      className="col-span-2 col-start-2 sm:col-span-3"
                      value={s.template_id}
                      onChange={(e) => update(s.weekday, { template_id: e.target.value })}
                    >
                      <option value="">No template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
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
                            ? 'Rest'
                            : s.title || WORKOUT_TYPE_LABELS[s.workout_type as WorkoutType],
                        workout_type: s.workout_type as 'rest',
                        template_id: s.template_id || null,
                        target_duration_minutes: s.target_duration_minutes
                          ? Number(s.target_duration_minutes)
                          : null,
                      })),
                    }),
                  { success: 'Plan created', onSuccess: () => setOpen(false) },
                )
              }
            >
              Create plan
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PlanControls({ id, active, name }: { id: string; active: boolean; name: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, run] = useServerAction()
  return (
    <div className="flex items-center gap-1">
      {!active && <Badge variant="secondary">Paused</Badge>}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={active ? `Pause ${name}` : `Activate ${name}`}
        onClick={() =>
          run(() => setPlanActive({ id, active: !active }), {
            success: active ? 'Plan paused' : 'Plan activated',
          })
        }
      >
        {active ? <Pause /> : <Play />}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${name}`}
        onClick={() => setConfirming(true)}
      >
        <Trash2 />
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this plan?"
        description="Logged workouts are kept."
        onConfirm={() => run(() => deletePlan({ id }), { success: 'Plan deleted' })}
      />
    </div>
  )
}
