'use client'

import { useState } from 'react'
import { Field } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { Textarea } from '@/components/ui/textarea'
import { useServerAction } from '@/hooks/use-server-action'
import { saveReview } from '@/lib/reviews/actions'
import type { ReviewType } from '@/lib/reviews/period'

const PROMPTS: Record<ReviewType, { key: 'a' | 'b' | 'c'; label: string; placeholder: string }[]> =
  {
    daily: [
      {
        key: 'a',
        label: 'Highlights',
        placeholder: 'What did you accomplish? What made you proud?',
      },
      { key: 'b', label: 'Notes', placeholder: 'Anything to carry over to tomorrow?' },
    ],
    weekly: [
      { key: 'a', label: 'Wins', placeholder: 'What went well this week?' },
      { key: 'b', label: "What didn't go well?", placeholder: 'What got in the way?' },
      {
        key: 'c',
        label: "Next week's priorities",
        placeholder: 'The 3 things that matter most next week.',
      },
    ],
    monthly: [
      { key: 'a', label: 'Wins', placeholder: 'What improved this month?' },
      { key: 'b', label: 'What declined?', placeholder: 'What needs attention?' },
      { key: 'c', label: 'Focus for next month', placeholder: 'What matters next?' },
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
        run(() => saveReview({ type, date, ...values }), { success: 'Review saved' })
      }}
    >
      {PROMPTS[type].map((p) => (
        <Field key={p.key} label={p.label} htmlFor={`review-${p.key}`}>
          <Textarea
            id={`review-${p.key}`}
            rows={3}
            placeholder={p.placeholder}
            value={values[p.key]}
            onChange={(e) => setValues({ ...values, [p.key]: e.target.value })}
          />
        </Field>
      ))}
      <SubmitButton pending={pending} className="self-end">
        Save review
      </SubmitButton>
    </form>
  )
}
