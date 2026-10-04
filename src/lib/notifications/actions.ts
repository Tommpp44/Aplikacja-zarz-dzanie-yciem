'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { syncNotificationsForUser } from './service'

export const getNotifications = authedAction(
  z.object({ sync: z.boolean().default(false) }),
  { name: 'getNotifications', revalidate: [] },
  async ({ sync }, { supabase, user }) => {
    if (sync) await syncNotificationsForUser(supabase, user.id)
    const rows = unwrap(
      await supabase
        .from('notifications')
        .select('id, kind, title, body, href, read_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
      'load notifications',
    )
    return { items: rows, unread: rows.filter((r) => !r.read_at).length }
  },
)

export const markNotificationsRead = authedAction(
  z.object({ ids: z.array(z.uuid()).max(100).optional() }),
  { name: 'markNotificationsRead', revalidate: [] },
  async ({ ids }, { supabase, user }) => {
    let q = supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
    if (ids?.length) q = q.in('id', ids)
    unwrap(await q, 'update notifications')
  },
)
