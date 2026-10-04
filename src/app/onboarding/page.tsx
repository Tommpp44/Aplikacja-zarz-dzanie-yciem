import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { Logo } from '@/components/layout/logo'
import { LanguagePicker } from '@/components/shared/language-picker'
import { I18nProvider } from '@/lib/i18n/client'
import { pageTitle } from '@/lib/i18n/server'
import { getUserContext } from '@/lib/settings/service'

export const generateMetadata = pageTitle('Welcome')

export default async function OnboardingPage() {
  const { profile, prefs, locale } = await getUserContext()
  if (profile.onboarded_at) redirect('/dashboard')
  return (
    <I18nProvider locale={locale}>
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-10">
        <div className="mb-10 flex items-center justify-between gap-3">
          <Logo />
          <LanguagePicker persist />
        </div>
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
    </I18nProvider>
  )
}
