'use client'

import { useState } from 'react'
import { Field } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { Textarea } from '@/components/ui/textarea'
import { useServerAction } from '@/hooks/use-server-action'
import { saveJournalEntry } from '@/lib/journal/actions'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'

const MOODS = [
  { value: 1, label: msg('Rough'), emoji: '😞' },
  { value: 2, label: msg('Meh'), emoji: '😕' },
  { value: 3, label: msg('Okay'), emoji: '😐' },
  { value: 4, label: msg('Good'), emoji: '🙂' },
  { value: 5, label: msg('Great'), emoji: '😄' },
]

type Entry = {
  mood: number | null
  today_text: string | null
  tomorrow_text: string | null
  went_well: string | null
  could_be_better: string | null
}

export function JournalForm({ date, entry }: { date: string; entry: Entry | null }) {
  const t = useT()
  const [state, setState] = useState({
    mood: entry?.mood ?? null,
    today_text: entry?.today_text ?? '',
    tomorrow_text: entry?.tomorrow_text ?? '',
    went_well: entry?.went_well ?? '',
    could_be_better: entry?.could_be_better ?? '',
  })
  const [pending, run] = useServerAction()
  const fields: { key: keyof Omit<typeof state, 'mood'>; label: string; placeholder: string }[] = [
    { key: 'today_text', label: t('Today I…'), placeholder: t('What happened today?') },
    { key: 'went_well', label: t('What went well?'), placeholder: t('Small wins count.') },
    {
      key: 'could_be_better',
      label: t('What could be better?'),
      placeholder: t('Be kind and specific.'),
    },
    {
      key: 'tomorrow_text',
      label: t('Tomorrow I…'),
      placeholder: t('One intention for tomorrow.'),
    },
  ]
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => saveJournalEntry({ entry_date: date, ...state }), { success: t('Journal saved') })
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t('How was your day?')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('Mood')}>
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={state.mood === m.value}
              onClick={() => setState({ ...state, mood: state.mood === m.value ? null : m.value })}
              className={cn(
                'bg-card hover:border-primary/40 flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 text-xs transition-colors',
                state.mood === m.value && 'border-primary bg-primary-soft text-primary',
              )}
            >
              <span className="text-xl" aria-hidden>
                {m.emoji}
              </span>
              {t(m.label)}
            </button>
          ))}
        </div>
      </fieldset>
      {fields.map((f) => (
        <Field key={f.key} label={t(f.label)} htmlFor={`j-${f.key}`}>
          <Textarea
            id={`j-${f.key}`}
            rows={3}
            placeholder={f.placeholder && t(f.placeholder)}
            value={state[f.key]}
            onChange={(e) => setState({ ...state, [f.key]: e.target.value })}
          />
        </Field>
      ))}
      <SubmitButton pending={pending} className="self-end">
        {t('Save entry')}
      </SubmitButton>
    </form>
  )
}
