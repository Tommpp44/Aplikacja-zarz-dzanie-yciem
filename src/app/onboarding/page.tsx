import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { Logo } from '@/components/layout/logo'
import { getUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Welcome' }

export default async function OnboardingPage() {
  const { profile, prefs } = await getUserContext()
  if (profile.onboarded_at) redirect('/dashboard')
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-10">
      <Logo className="mb-10" />
      <OnboardingFlow
        name={profile.display_name ?? ''}
        defaults={{
          currency: prefs.currency,
          timezone: prefs.timezone,
          week_start: prefs.week_start,
          units: prefs.units as 'metric' | 'imperial',
        }}
      />
    </main>
  )
}
