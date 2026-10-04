import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { safeRedirectPath } from '@/lib/auth/access'
import { enabledOAuthProviders } from '@/lib/env'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Sign in')

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const t = await getT()
  const params = await searchParams
  const next = typeof params.next === 'string' ? safeRedirectPath(params.next) : undefined
  const linkError =
    params.error === 'link'
      ? t('That sign-in link is invalid or has expired. Please request a new one.')
      : undefined
  return (
    <div className="flex flex-col gap-4">
      <LoginForm next={next} initialError={linkError} />
      <OAuthButtons providers={enabledOAuthProviders()} next={next} />
      <p className="text-muted-foreground text-center text-sm">
        {t('New to LifeOS?')}{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          {t('Create an account')}
        </Link>
      </p>
    </div>
  )
}
