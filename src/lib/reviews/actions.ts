'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { toJson } from '@/lib/db/types'
import { getUserContext } from '@/lib/settings/service'
import { reviewPeriod, REVIEW_TYPES } from './period'
import { getPeriodSummary } from './summary'

const text = z.string().trim().max(10000).optional()

/** Saves reflections together with a snapshot of the period's statistics. */
export const saveReview = authedAction(
  z.object({ type: z.enum(REVIEW_TYPES), date: z.iso.date(), a: text, b: text, c: text }),
  {
    name: 'saveReview',
    failureMessage: "We couldn't save your review. Your text is still here — please try again.",
  },
  async ({ type, date, a, b, c }, { supabase, user }) => {
    const { timezone, currency, today, prefs } = await getUserContext()
    const period = reviewPeriod(type, date, prefs.week_start)
    const stats = toJson(
      await getPeriodSummary(supabase, user.id, period.from, period.to, timezone, currency, today),
    )
    if (type === 'daily') {
      unwrap(
        await supabase.from('daily_reviews').upsert(
          {
            user_id: user.id,
            review_date: period.key,
            stats,
            highlights: a || null,
            notes: b || null,
          },
          { onConflict: 'user_id,review_date' },
        ),
        'save the review',
      )
    } else if (type === 'weekly') {
      unwrap(
        await supabase.from('weekly_reviews').upsert(
          {
            user_id: user.id,
            week_start: period.key,
            stats,
            wins: a || null,
            challenges: b || null,
            next_priorities: c || null,
          },
          { onConflict: 'user_id,week_start' },
        ),
        'save the review',
      )
    } else {
      unwrap(
        await supabase.from('monthly_reviews').upsert(
          {
            user_id: user.id,
            month_start: period.key,
            stats,
            wins: a || null,
            challenges: b || null,
            next_focus: c || null,
          },
          { onConflict: 'user_id,month_start' },
        ),
        'save the review',
      )
    }
  },
)
