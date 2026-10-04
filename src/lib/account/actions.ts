'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { DataError } from '@/lib/db/errors'
import { logger } from '@/lib/logger'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Permanently deletes the account. All user data is removed by ON DELETE
 * CASCADE from auth.users. Requires typing "DELETE" (checked server-side).
 */
export const deleteAccount = authedAction(
  z.object({ confirmation: z.literal('DELETE', 'Type DELETE to confirm') }),
  { name: 'deleteAccount', revalidate: [] },
  async (_input, { user }) => {
    if (!hasAdminClient())
      throw new DataError(
        'Account deletion is not configured on this server. Please contact support.',
      )
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      logger.error('account deletion failed', {
        action: 'deleteAccount',
        userId: user.id,
        code: error.code,
      })
      throw new DataError("We couldn't delete your account. Please try again.")
    }
    logger.info('account deleted', { action: 'deleteAccount', userId: user.id })
    const supabase = await createClient()
    await supabase.auth.signOut({ scope: 'local' })
  },
)

export async function signOutEverywhere() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
  redirect('/login')
}
