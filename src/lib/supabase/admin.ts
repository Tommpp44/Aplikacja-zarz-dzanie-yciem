import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import type { Database } from '@/lib/db/types'

/**
 * Service-role client. Bypasses RLS — only for trusted server code (account
 * deletion, scheduled jobs). Never pass user-controlled ids without checks.
 */
export function createAdminClient() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )
}

export function hasAdminClient() {
  return Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY)
}
