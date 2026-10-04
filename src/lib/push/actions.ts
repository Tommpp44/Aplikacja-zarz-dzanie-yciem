'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith('https://').max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
  user_agent: z.string().max(300).optional(),
})

export const savePushSubscription = authedAction(
  subscriptionSchema,
  { name: 'savePushSubscription', revalidate: [] },
  async (input, { supabase, user }) => {
    // One row per endpoint; re-subscribing replaces the keys.
    await supabase.from('push_subscriptions').delete().eq('endpoint', input.endpoint)
    unwrap(
      await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        user_agent: input.user_agent ?? null,
      }),
      'enable push notifications',
    )
  },
)

export const deletePushSubscription = authedAction(
  z.object({ endpoint: z.url().max(1000) }),
  { name: 'deletePushSubscription', revalidate: [] },
  async ({ endpoint }, { supabase }) => {
    unwrap(
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint),
      'disable push notifications',
    )
  },
)
