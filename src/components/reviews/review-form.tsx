'use client'

import { useState } from 'react'
import { Field } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { Textarea } from '@/components/ui/textarea'
import { useServerAction } from '@/hooks/use-server-action'
import { saveReview } from '@/lib/reviews/actions'
import type { ReviewType } from '@/lib/reviews/period'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'

const PROMPTS: Record<ReviewType, { key: 'a' | 'b' | 'c'; label: string; placeholder: string }[]> =
  {
    daily: [
      {
        key: 'a',
        label: msg('Highlights'),
        placeholder: msg('What did you accomplish? What made you proud?'),
      },
      { key: 'b', label: msg('Notes'), placeholder: msg('Anything to carry over to tomorrow?') },
    ],
    weekly: [
      { key: 'a', label: msg('Wins'), placeholder: msg('What went well this week?') },
      { key: 'b', label: msg("What didn't go well?"), placeholder: msg('What got in the way?') },
      {
        key: 'c',
        label: msg("Next week's priorities"),
        placeholder: msg('The 3 things that matter most next week.'),
      },
    ],
    monthly: [
      { key: 'a', label: msg('Wins'), placeholder: msg('What improved this month?') },
      { key: 'b', label: msg('What declined?'), placeholder: msg('What needs attention?') },
      { key: 'c', label: msg('Focus for next month'), placeholder: msg('What matters next?') },
    ],
  }

export function ReviewForm({
  type,
  date,
  initial,
}: {
  type: ReviewType
  date: string
  initial: { a?: string | null; b?: string | null; c?: string | null }
}) {
  const t = useT()
  const [values, setValues] = useState({
    a: initial.a ?? '',
    b: initial.b ?? '',
    c: initial.c ?? '',
  })
  const [pending, run] = useServerAction()
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => saveReview({ type, date, ...values }), { success: t('Review saved') })
      }}
    >
      {PROMPTS[type].map((p) => (
        <Field key={p.key} label={t(p.label)} htmlFor={`review-${p.key}`}>
          <Textarea
            id={`review-${p.key}`}
            rows={3}
            placeholder={p.placeholder && t(p.placeholder)}
            value={values[p.key]}
            onChange={(e) => setValues({ ...values, [p.key]: e.target.value })}
          />
        </Field>
      ))}
      <SubmitButton pending={pending} className="self-end">
        {t('Save review')}
      </SubmitButton>
    </form>
  )
}
