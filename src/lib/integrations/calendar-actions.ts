'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { DataError, unwrap } from '@/lib/db/errors'
import { msg } from '@/lib/i18n/translate'
import { importIcsText, syncSubscription } from './calendar-import'
import { normalizeFeedUrl } from './safe-fetch'

const color = z.string().max(32).default('blue')

export const importCalendarFile = authedAction(
  z.object({ text: z.string().min(10).max(5_000_000), color }),
  { name: 'importCalendarFile' },
  async ({ text, color }, { supabase, user }) => {
    if (!/BEGIN:VCALENDAR/i.test(text))
      throw new DataError(msg('This is not an .ics calendar file.'))
    return importIcsText(supabase, user.id, text, { sourceKey: 'file', color, replace: false })
  },
)

export const addCalendarSubscription = authedAction(
  z.object({
    url: z.string().trim().min(10).max(2000),
    name: z.string().trim().min(1).max(80),
    color,
  }),
  { name: 'addCalendarSubscription' },
  async ({ url, name, color }, { supabase, user }) => {
    let normalized: string
    try {
      normalized = normalizeFeedUrl(url).toString()
    } catch {
      throw new DataError(msg('Paste an https:// or webcal:// calendar link.'))
    }
    const sub = unwrap(
      await supabase
        .from('calendar_subscriptions')
        .insert({ user_id: user.id, url: normalized, name, color })
        .select('id, user_id, url, color')
        .single(),
      'add the calendar',
    )
    const result = await syncSubscription(supabase, sub)
    if (!result.ok) {
      await supabase.from('calendar_subscriptions').delete().eq('id', sub.id)
      throw new DataError(
        result.error && /not allowed|https|redirect|large/i.test(result.error)
          ? msg('This link cannot be used. Use the public or secret iCal address of the calendar.')
          : msg('We couldn’t read this calendar. Check that the link is the iCal (.ics) address.'),
      )
    }
    return { imported: result.imported }
  },
)

export const syncCalendarSubscription = authedAction(
  idSchema,
  { name: 'syncCalendarSubscription' },
  async ({ id }, { supabase }) => {
    const sub = unwrap(
      await supabase
        .from('calendar_subscriptions')
        .select('id, user_id, url, color')
        .eq('id', id)
        .single(),
      'load the calendar',
    )
    const result = await syncSubscription(supabase, sub)
    if (!result.ok)
      throw new DataError(
        msg('We couldn’t read this calendar. Check that the link is the iCal (.ics) address.'),
      )
    return { imported: result.imported }
  },
)

export const deleteCalendarSubscription = authedAction(
  idSchema,
  { name: 'deleteCalendarSubscription' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id)
        .eq('external_provider', 'ics')
        .like('external_id', `${id}:%`),
      'remove imported events',
    )
    unwrap(
      await supabase.from('calendar_subscriptions').delete().eq('id', id),
      'remove the calendar',
    )
  },
)
