import { Download, Upload } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NewPasswordForm } from '@/components/auth/password-forms'
import {
  AppearanceForm,
  DeleteAccountSection,
  NotificationsForm,
  PreferencesForm,
  ProfileForm,
  SignOutEverywhereButton,
} from '@/components/settings/settings-forms'
import { LanguagePicker } from '@/components/shared/language-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SETTINGS_SECTIONS, type SettingsSectionId } from '@/lib/settings/sections'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { getT, pageTitle } from '@/lib/i18n/server'
import { msg } from '@/lib/i18n/translate'

export const generateMetadata = pageTitle('Settings')

const INTEGRATIONS = [
  { name: 'Google Calendar', area: msg('Calendar') },
  { name: 'Outlook Calendar', area: msg('Calendar') },
  { name: 'Apple Calendar', area: msg('Calendar') },
  { name: 'Apple Health', area: msg('Activity') },
  { name: 'Google Fit / Health Connect', area: msg('Activity') },
  { name: 'Garmin', area: msg('Workouts') },
  { name: 'Strava', area: msg('Workouts') },
  { name: 'Fitbit', area: msg('Activity') },
  { name: 'Open Banking', area: msg('Finances') },
]

export default async function SettingsSectionPage({ params }: PageProps<'/settings/[section]'>) {
  const t = await getT()
  const { section } = await params
  const meta = SETTINGS_SECTIONS.find((s) => s.id === section)
  if (!meta) notFound()
  const { profile, prefs, user } = await getOnboardedUserContext()
  const id = section as SettingsSectionId

  return (
    <section aria-labelledby="section-title" className="flex flex-col gap-6">
      <div>
        <h2 id="section-title" className="text-lg font-semibold">
          {t(meta.label)}
        </h2>
        <p className="text-muted-foreground text-sm">{t(meta.description)}</p>
      </div>

      {id === 'profile' && (
        <ProfileForm displayName={profile.display_name ?? ''} email={user.email} />
      )}
      {id === 'preferences' && (
        <PreferencesForm
          initial={{
            currency: prefs.currency,
            timezone: prefs.timezone,
            week_start: prefs.week_start,
            date_format: prefs.date_format,
            units: prefs.units as 'metric' | 'imperial',
          }}
        />
      )}
      {id === 'appearance' && (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t('Language')}</legend>
            <LanguagePicker persist />
          </fieldset>
          <AppearanceForm
            theme={prefs.theme as 'light' | 'dark' | 'system'}
            accent={prefs.accent}
          />
        </>
      )}
      {id === 'notifications' && <NotificationsForm initial={prefs.notification_settings} />}
      {id === 'privacy' && (
        <>
          <div className="bg-card flex max-w-xl flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">{t('Export your data')}</h3>
            <p className="text-muted-foreground text-sm">
              {t(
                'Download everything LifeOS stores about you as JSON (all modules), or your transactions as CSV.',
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href="/api/export" download>
                  <Download /> {t('Export all data (JSON)')}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/finances/transactions/export" download>
                  <Download /> {t('Transactions (CSV)')}
                </a>
              </Button>
            </div>
          </div>
          <div className="bg-card flex max-w-xl flex-col gap-2 rounded-xl border p-5 text-sm">
            <h3 className="font-medium">{t('Delete individual records')}</h3>
            <p className="text-muted-foreground">
              {t(
                'Every task, transaction, note, habit, goal and workout can be deleted from its own screen. Deleted transactions are excluded from balances immediately.',
              )}
            </p>
          </div>
          <DeleteAccountSection />
        </>
      )}
      {id === 'security' && (
        <>
          <div className="bg-card flex max-w-xl flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">{t('Change password')}</h3>
            <NewPasswordForm redirectTo={null} compact />
          </div>
          <div className="bg-card flex max-w-xl flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">{t('Sessions')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('Signed in as {email}. Signing out everywhere ends the session on every device.', {
                email: user.email ?? '',
              })}
            </p>
            <div>
              <SignOutEverywhereButton />
            </div>
          </div>
        </>
      )}
      {id === 'data' && (
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="bg-card flex flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">{t('Import')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('Import bank transactions from CSV (most Polish and EU bank exports work).')}
            </p>
            <Button variant="outline" asChild className="self-start">
              <Link href="/finances/transactions">
                <Upload /> {t('Import transactions')}
              </Link>
            </Button>
          </div>
          <div className="bg-card flex flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">{t('Export')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('Take your data anywhere — JSON for everything, CSV for transactions.')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/api/export" download>
                  {t('JSON')}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/finances/transactions/export" download>
                  {t('CSV')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
      {id === 'integrations' && (
        <>
          <p className="text-muted-foreground max-w-xl text-sm">
            {t(
              'Integrations are on the roadmap. LifeOS already stores the source of every imported record, so connected data will appear next to your manual entries without duplicates.',
            )}
          </p>
          <ul className="grid max-w-2xl gap-2 sm:grid-cols-2">
            {INTEGRATIONS.map((i) => (
              <li
                key={i.name}
                className="bg-card flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
              >
                <span>
                  <span className="block font-medium">{i.name}</span>
                  <span className="text-muted-foreground text-xs">{t(i.area)}</span>
                </span>
                <Badge variant="secondary">{t('Planned')}</Badge>
              </li>
            ))}
          </ul>
        </>
      )}
      {id === 'billing' && (
        <div className="bg-card flex max-w-xl flex-col gap-2 rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{t('Current plan')}</h3>
            <Badge>{profile.plan === 'pro' ? t('Pro') : t('Free')}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {t(
              'Every feature is available during the early access period. Paid plans may be introduced later — you will be told well in advance.',
            )}
          </p>
        </div>
      )}
    </section>
  )
}
