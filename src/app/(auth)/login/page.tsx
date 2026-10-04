import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { safeRedirectPath } from '@/lib/auth/access'
import { enabledOAuthProviders } from '@/lib/env'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams
  const next = typeof params.next === 'string' ? safeRedirectPath(params.next) : undefined
  const linkError =
    params.error === 'link'
      ? 'That sign-in link is invalid or has expired. Please request a new one.'
      : undefined
  return (
    <div className="flex flex-col gap-4">
      <LoginForm next={next} initialError={linkError} />
      <OAuthButtons providers={enabledOAuthProviders()} next={next} />
      <p className="text-muted-foreground text-center text-sm">
        New to LifeOS?{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
