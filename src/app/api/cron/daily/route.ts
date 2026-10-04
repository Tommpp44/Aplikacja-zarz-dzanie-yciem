import { NextResponse, type NextRequest } from 'next/server'
import { todayISO } from '@/lib/dates'
import { serverEnv } from '@/lib/env.server'
import { sendDigestsForUser } from '@/lib/email/digests'
import { syncSubscriptionsForUser } from '@/lib/integrations/calendar-import'
import { stravaConfigured, syncStrava } from '@/lib/integrations/strava-sync'
import { logger } from '@/lib/logger'
import { syncNotificationsForUser } from '@/lib/notifications/service'
import { nextOccurrenceAfter, parseRepeatRule } from '@/lib/recurrence'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'

/**
 * Scheduled job (e.g. Vercel Cron, hourly): records auto-post recurring
 * transactions that are due and refreshes notifications for every user.
 * Protected by CRON_SECRET (Authorization: Bearer <secret>).
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!serverEnv.CRON_SECRET || auth !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasAdminClient())
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const db = createAdminClient()
  const started = Date.now()
  let posted = 0
  let notified = 0

  const { data: prefs } = await db.from('user_preferences').select('user_id, timezone')
  const tz = new Map((prefs ?? []).map((p) => [p.user_id, p.timezone]))

  // 1. Auto-post due recurring transactions (each user's "today" in their timezone).
  const { data: recurring } = await db
    .from('recurring_transactions')
    .select('*')
    .eq('active', true)
    .eq('auto_post', true)
  for (const r of recurring ?? []) {
    const rule = parseRepeatRule(r.repeat_rule)
    if (!rule) continue
    const today = todayISO(tz.get(r.user_id) ?? 'UTC')
    let next: string | null = r.next_date
    let guard = 0
    while (next && next <= today && (!r.end_date || next <= r.end_date) && guard++ < 60) {
      const { error } = await db.from('transactions').insert({
        user_id: r.user_id,
        account_id: r.account_id,
        txn_type: r.txn_type,
        amount_minor: r.amount_minor,
        transfer_account_id: r.transfer_account_id,
        transfer_amount_minor: r.txn_type === 'transfer' ? r.amount_minor : null,
        category_id: r.category_id,
        merchant: r.merchant,
        description: r.description,
        occurred_on: next,
        recurring_id: r.id,
        source: 'recurring',
        created_by: null,
      })
      if (error) {
        logger.error('auto-post failed', { route: 'cron/daily', entityId: r.id, code: error.code })
        break
      }
      posted++
      next = nextOccurrenceAfter(rule, next, next)
    }
    if (next !== r.next_date) {
      const ended = !next || (r.end_date !== null && next > r.end_date)
      await db
        .from('recurring_transactions')
        .update(ended ? { active: false } : { next_date: next! })
        .eq('id', r.id)
    }
  }

  // 2. Notifications.
  for (const userId of tz.keys()) {
    try {
      notified += await syncNotificationsForUser(db, userId)
    } catch (error) {
      logger.error('notification sync failed', { route: 'cron/daily', userId }, error)
    }
  }

  // 3. Calendar subscriptions (iCal feeds).
  let calendars = 0
  for (const userId of tz.keys()) calendars += await syncSubscriptionsForUser(db, userId)

  // 4. Strava activities (users who connected Strava).
  let strava = 0
  if (stravaConfigured()) {
    const { data: connected } = await db
      .from('integration_tokens')
      .select('user_id')
      .eq('provider', 'strava')
    for (const row of connected ?? []) strava += await syncStrava(db, row.user_id, { days: 7 })
  }

  // 5. Morning agenda / weekly summary e-mails (opt-in, at most once per period).
  let emailed = 0
  for (const userId of tz.keys()) emailed += await sendDigestsForUser(db, userId)

  logger.info('cron completed', {
    route: 'cron/daily',
    count: posted,
    durationMs: Date.now() - started,
  })
  return NextResponse.json({ posted, notified, emailed, calendars, strava })
}
