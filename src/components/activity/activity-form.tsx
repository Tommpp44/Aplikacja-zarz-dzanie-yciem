'use client'

import { useState } from 'react'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SubmitButton } from '@/components/ui/submit-button'
import { useServerAction } from '@/hooks/use-server-action'
import type { ISODate } from '@/lib/dates'
import { distanceUnit, metersToDisplay, type Units } from '@/lib/units'
import { logActivity } from '@/lib/workouts/actions'
import { useT } from '@/lib/i18n/client'

type Record = {
  record_date: string
  steps: number | null
  distance_m: number | null
  active_minutes: number | null
  calories: number | null
}

export function ActivityForm({
  today,
  units,
  records,
}: {
  today: ISODate
  units: Units
  records: Record[]
}) {
  const t = useT()
  const find = (d: string) => records.find((r) => r.record_date === d)
  const toState = (d: string) => {
    const r = find(d)
    return {
      date: d,
      steps: r?.steps?.toString() ?? '',
      distance: r?.distance_m
        ? String(Math.round(metersToDisplay(Number(r.distance_m), units) * 100) / 100)
        : '',
      active: r?.active_minutes?.toString() ?? '',
      calories: r?.calories?.toString() ?? '',
    }
  }
  const [state, setState] = useState(() => toState(today))
  const [pending, run] = useServerAction()
  const n = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')))
  return (
    <form
      className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        run(
          () =>
            logActivity({
              record_date: state.date,
              steps: n(state.steps) === null ? null : Math.round(n(state.steps)!),
              distance: n(state.distance),
              active_minutes: n(state.active) === null ? null : Math.round(n(state.active)!),
              calories: n(state.calories) === null ? null : Math.round(n(state.calories)!),
            }),
          { success: t('Activity saved') },
        )
      }}
    >
      <Field label={t('Date')} htmlFor="act-date" className="col-span-2 sm:col-span-1">
        <Input
          id="act-date"
          type="date"
          max={today}
          value={state.date}
          onChange={(e) => setState(toState(e.target.value))}
        />
      </Field>
      <Field label={t('Steps')} htmlFor="act-steps">
        <Input
          id="act-steps"
          inputMode="numeric"
          value={state.steps}
          onChange={(e) => setState({ ...state, steps: e.target.value })}
        />
      </Field>
      <Field label={t('Distance ({unit})', { unit: distanceUnit(units) })} htmlFor="act-distance">
        <Input
          id="act-distance"
          inputMode="decimal"
          value={state.distance}
          onChange={(e) => setState({ ...state, distance: e.target.value })}
        />
      </Field>
      <Field label={t('Active min')} htmlFor="act-active">
        <Input
          id="act-active"
          inputMode="numeric"
          value={state.active}
          onChange={(e) => setState({ ...state, active: e.target.value })}
        />
      </Field>
      <Field label={t('Calories')} htmlFor="act-cal">
        <Input
          id="act-cal"
          inputMode="numeric"
          value={state.calories}
          onChange={(e) => setState({ ...state, calories: e.target.value })}
        />
      </Field>
      <SubmitButton pending={pending}>{t('Save')}</SubmitButton>
    </form>
  )
}
