import 'server-only'
import { addDaysISO, safeTimeZone, todayISO, zonedToUtc } from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import { toJson } from '@/lib/db/types'
import { logger } from '@/lib/logger'
import { parseIcs, type IcsEvent } from './ics'
import { safeFetchText } from './safe-fetch'

const MAX_EVENTS = 3000

export function icsEventToRow(
  ev: IcsEvent,
  opts: { userId: string; userTimeZone: string; sourceKey: string; color: string },
) {
  const tz = ev.timeZone ?? opts.userTimeZone
  const starts = ev.allDay
    ? zonedToUtc(ev.startDate, '00:00', opts.userTimeZone)
    : zonedToUtc(ev.startDate, ev.startTime, tz)
  const ends = ev.allDay
    ? zonedToUtc(addDaysISO(ev.endDate, 1), '00:00', opts.userTimeZone)
    : zonedToUtc(ev.endDate, ev.endTime, tz)
  return {
    user_id: opts.userId,
    title: ev.title,
    description: ev.description,
    location: ev.location,
    all_day: ev.allDay,
    starts_at: starts.toISOString(),
    ends_at: (ends < starts ? starts : ends).toISOString(),
    repeat_rule: ev.repeatRule ? toJson(ev.repeatRule) : null,
    repeat_until: ev.repeatRule ? ev.repeatUntil : null,
    color: opts.color,
    external_provider: 'ics' as const,
    external_id: `${opts.sourceKey}:${ev.uid}`.slice(0, 250),
  }
}

/** Keeps the import focused: recurring events plus one year back / two years ahead. */
export function relevantEvents(events: IcsEvent[], today: string) {
  const from = addDaysISO(today, -365)
  const to = addDaysISO(today, 730)
  const seen = new Set<string>()
  return events
    .filter((e) =>
      e.repeatRule
        ? !e.repeatUntil || e.repeatUntil >= from
        : e.endDate >= from && e.startDate <= to,
    )
    .filter((e) => (seen.has(e.uid) ? false : (seen.add(e.uid), true)))
    .slice(0, MAX_EVENTS)
}

/** Upserts events by UID; with `replace`, events that left the feed are removed. */
export async function importIcsText(
  db: DB,
  userId: string,
  text: string,
  opts: { sourceKey: string; color: string; replace: boolean },
) {
  const { data: prefs } = await db
    .from('user_preferences')
    .select('timezone')
    .eq('user_id', userId)
    .single()
  const userTimeZone = safeTimeZone(prefs?.timezone)
  const events = relevantEvents(parseIcs(text), todayISO(userTimeZone))
  const rows = events.map((ev) =>
    icsEventToRow(ev, { userId, userTimeZone, sourceKey: opts.sourceKey, color: opts.color }),
  )
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db
      .from('calendar_events')
      .upsert(rows.slice(i, i + 500), { onConflict: 'user_id,external_provider,external_id' })
    if (error) throw error
  }
  let removed = 0
  if (opts.replace) {
    const keep = new Set(rows.map((r) => r.external_id))
    const { data: existing } = await db
      .from('calendar_events')
      .select('id, external_id')
      .eq('user_id', userId)
      .eq('external_provider', 'ics')
      .like('external_id', `${opts.sourceKey}:%`)
    const stale = (existing ?? []).filter((e) => !keep.has(e.external_id ?? '')).map((e) => e.id)
    for (let i = 0; i < stale.length; i += 200) {
      await db
        .from('calendar_events')
        .delete()
        .in('id', stale.slice(i, i + 200))
    }
    removed = stale.length
  }
  return { imported: rows.length, removed }
}

export async function syncSubscription(
  db: DB,
  sub: { id: string; user_id: string; url: string; color: string },
) {
  try {
    const text = await safeFetchText(sub.url)
    if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error('Not an iCalendar feed')
    const result = await importIcsText(db, sub.user_id, text, {
      sourceKey: sub.id,
      color: sub.color,
      replace: true,
    })
    await db
      .from('calendar_subscriptions')
      .update({
        last_synced_at: new Date().toISOString(),
        last_error: null,
        event_count: result.imported,
      })
      .eq('id', sub.id)
    return { ok: true as const, ...result }
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : 'Sync failed'
    logger.warn('calendar sync failed', { entityId: sub.id, userId: sub.user_id })
    await db.from('calendar_subscriptions').update({ last_error: message }).eq('id', sub.id)
    return { ok: false as const, error: message }
  }
}

/** Cron: refresh every subscription of a user (at most every ~hour). */
export async function syncSubscriptionsForUser(db: DB, userId: string) {
  const { data: subs } = await db
    .from('calendar_subscriptions')
    .select('id, user_id, url, color')
    .eq('user_id', userId)
  let synced = 0
  for (const sub of subs ?? []) if ((await syncSubscription(db, sub)).ok) synced++
  return synced
}
