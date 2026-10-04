import 'server-only'
import webpush from 'web-push'
import type { DB } from '@/lib/db/types'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'
import type { PushPayload } from './payload'

export function pushConfigured() {
  return Boolean(publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY && serverEnv.VAPID_PRIVATE_KEY)
}

let configured = false
function configure() {
  if (configured) return
  webpush.setVapidDetails(
    serverEnv.VAPID_SUBJECT,
    publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    serverEnv.VAPID_PRIVATE_KEY!,
  )
  configured = true
}

/**
 * Sends notifications to every subscribed device of a user. Expired
 * subscriptions (404/410) are removed. Never throws: push is best-effort.
 */
export async function sendPushToUser(db: DB, userId: string, payloads: PushPayload[]) {
  if (!pushConfigured() || payloads.length === 0) return 0
  configure()
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
  let sent = 0
  for (const sub of subs ?? []) {
    for (const payload of payloads.slice(0, 5)) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 12 },
        )
        sent++
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await db.from('push_subscriptions').delete().eq('id', sub.id)
          break
        }
        logger.warn('push failed', { userId, status })
      }
    }
  }
  return sent
}
