'use client'

import { NativeSelect } from '@/components/ui/native-select'
import { Input } from '@/components/ui/input'
import { weekdayShort, orderedWeekdays } from '@/lib/dates'
import type { RepeatRule } from '@/lib/recurrence'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'

type Props = {
  id?: string
  value: RepeatRule | null
  onChange: (rule: RepeatRule | null) => void
  allowNone?: boolean
  weekStartsOn?: 0 | 1
}

/** Compact editor for RepeatRule (daily/weekly/monthly/yearly with interval and weekdays). */
export function RepeatRulePicker({
  id,
  value,
  onChange,
  allowNone = true,
  weekStartsOn = 1,
}: Props) {
  const t = useT()
  const freq = value?.freq ?? 'none'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <NativeSelect
          id={id}
          className="flex-1"
          value={freq}
          onChange={(e) => {
            const f = e.target.value
            if (f === 'none') onChange(null)
            else onChange({ freq: f as RepeatRule['freq'], interval: value?.interval ?? 1 })
          }}
        >
          {allowNone && <option value="none">{t('Does not repeat')}</option>}
          <option value="daily">{t('Daily')}</option>
          <option value="weekly">{t('Weekly')}</option>
          <option value="monthly">{t('Monthly')}</option>
          <option value="yearly">{t('Yearly')}</option>
        </NativeSelect>
        {value && (
          <label className="text-muted-foreground flex items-center gap-2 text-[13px]">
            every
            <Input
              type="number"
              min={1}
              max={365}
              aria-label={t('Repeat interval')}
              className="w-16"
              value={value.interval}
              onChange={(e) =>
                onChange({
                  ...value,
                  interval: Math.max(1, Math.min(365, Number(e.target.value) || 1)),
                })
              }
            />
          </label>
        )}
      </div>
      {value?.freq === 'weekly' && (
        <div className="flex flex-wrap gap-1" role="group" aria-label={t('Weekdays')}>
          {orderedWeekdays(weekStartsOn).map((d) => {
            const active = value.weekdays?.includes(d) ?? false
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  const set = new Set(value.weekdays ?? [])
                  if (active) set.delete(d)
                  else set.add(d)
                  onChange({ ...value, weekdays: [...set].sort() })
                }}
                className={cn(
                  'h-7 min-w-10 rounded-md border px-2 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {weekdayShort(d, t.locale)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
