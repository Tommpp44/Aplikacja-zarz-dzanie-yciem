import type { Metadata } from 'next'
import Link from 'next/link'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { SignupForm } from '@/components/auth/signup-form'
import { enabledOAuthProviders } from '@/lib/env'

export const metadata: Metadata = { title: 'Create account' }

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-4">
      <SignupForm />
      <OAuthButtons providers={enabledOAuthProviders()} next="/onboarding" />
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
