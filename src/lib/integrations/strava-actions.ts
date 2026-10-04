'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { DataError } from '@/lib/db/errors'
import { msg } from '@/lib/i18n/translate'
import { createAdminClient } from '@/lib/supabase/admin'
import { disconnectStrava, stravaConfigured, syncStrava } from './strava-sync'

export const syncStravaNow = authedAction(
  z.object({}),
  { name: 'syncStravaNow' },
  async (_i, { user }) => {
    if (!stravaConfigured()) throw new DataError(msg('Strava is not configured on this server.'))
    return { imported: await syncStrava(createAdminClient(), user.id, { days: 30 }) }
  },
)

export const disconnectStravaAction = authedAction(
  z.object({}),
  { name: 'disconnectStrava' },
  async (_i, { user }) => {
    if (!stravaConfigured()) return
    await disconnectStrava(createAdminClient(), user.id)
  },
)
