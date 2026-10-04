'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { msg } from '@/lib/i18n/translate'
import { DataError } from '@/lib/db/errors'
import { sendTestDigest } from './digests'
import { emailConfigured } from './send'

export const sendTestEmail = authedAction(
  z.object({}),
  {
    name: 'sendTestEmail',
    revalidate: [],
    failureMessage: msg('We couldn’t send the e-mail. Check the SMTP settings and try again.'),
  },
  async (_input, { supabase, user }) => {
    if (!emailConfigured()) throw new DataError(msg('E-mail is not configured on this server.'))
    await sendTestDigest(supabase, user.id)
  },
)
