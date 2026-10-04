import { redirect } from 'next/navigation'
import { NewPasswordForm } from '@/components/auth/password-forms'
import { Logo } from '@/components/layout/logo'
import { getSession } from '@/lib/auth/session'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Choose a new password')

export default async function ResetPasswordPage() {
  const t = await getT()
  if (!(await getSession())) redirect('/login?error=link')
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4">
      <Logo className="mb-8 text-lg" />
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">{t('Choose a new password')}</h1>
        <NewPasswordForm />
      </div>
    </main>
  )
}
