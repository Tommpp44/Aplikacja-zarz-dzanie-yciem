'use client'

import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServerAction } from '@/hooks/use-server-action'
import { sendTestEmail } from '@/lib/email/actions'
import { useT } from '@/lib/i18n/client'

export function SendTestEmailButton() {
  const t = useT()
  const [pending, run] = useServerAction()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        run(() => sendTestEmail({}), { success: t("Sent — check your inbox for today's agenda.") })
      }
    >
      <Mail /> {t('Send a test e-mail')}
    </Button>
  )
}
