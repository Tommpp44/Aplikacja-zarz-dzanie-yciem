import Link from 'next/link'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { SignupForm } from '@/components/auth/signup-form'
import { enabledOAuthProviders } from '@/lib/env'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Create account')

export default async function SignupPage() {
  const t = await getT()
  return (
    <div className="flex flex-col gap-4">
      <SignupForm />
      <OAuthButtons providers={enabledOAuthProviders()} next="/onboarding" />
      <p className="text-muted-foreground text-center text-sm">
        {t('Already have an account?')}{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          {t('Sign in')}
        </Link>
      </p>
    </div>
  )
}
