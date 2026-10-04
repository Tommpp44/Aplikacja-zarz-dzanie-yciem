import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/password-forms'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Reset password')

export default async function ForgotPasswordPage() {
  const t = await getT()
  return (
    <div className="flex flex-col gap-4">
      <ForgotPasswordForm />
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground text-center text-sm"
      >
        {t('Back to sign in')}
      </Link>
    </div>
  )
}
