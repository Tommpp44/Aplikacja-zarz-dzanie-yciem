import { Download, Upload } from 'lucide-react'
import type { Metadata } from 'next'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SETTINGS_SECTIONS, type SettingsSectionId } from '@/lib/settings/sections'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Settings' }

const INTEGRATIONS = [
  { name: 'Google Calendar', area: 'Calendar' },
  { name: 'Outlook Calendar', area: 'Calendar' },
  { name: 'Apple Calendar', area: 'Calendar' },
  { name: 'Apple Health', area: 'Activity' },
  { name: 'Google Fit / Health Connect', area: 'Activity' },
  { name: 'Garmin', area: 'Workouts' },
  { name: 'Strava', area: 'Workouts' },
  { name: 'Fitbit', area: 'Activity' },
  { name: 'Open Banking', area: 'Finances' },
]

export default async function SettingsSectionPage({ params }: PageProps<'/settings/[section]'>) {
  const { section } = await params
  const meta = SETTINGS_SECTIONS.find((s) => s.id === section)
  if (!meta) notFound()
  const { profile, prefs, user } = await getOnboardedUserContext()
  const id = section as SettingsSectionId

  return (
    <section aria-labelledby="section-title" className="flex flex-col gap-6">
      <div>
        <h2 id="section-title" className="text-lg font-semibold">
          {meta.label}
        </h2>
        <p className="text-muted-foreground text-sm">{meta.description}</p>
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
        <AppearanceForm theme={prefs.theme as 'light' | 'dark' | 'system'} accent={prefs.accent} />
      )}
      {id === 'notifications' && <NotificationsForm initial={prefs.notification_settings} />}
      {id === 'privacy' && (
        <>
          <div className="bg-card flex max-w-xl flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">Export your data</h3>
            <p className="text-muted-foreground text-sm">
              Download everything LifeOS stores about you as JSON (all modules), or your
              transactions as CSV.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href="/api/export" download>
                  <Download /> Export all data (JSON)
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/finances/transactions/export" download>
                  <Download /> Transactions (CSV)
                </a>
              </Button>
            </div>
          </div>
          <div className="bg-card flex max-w-xl flex-col gap-2 rounded-xl border p-5 text-sm">
            <h3 className="font-medium">Delete individual records</h3>
            <p className="text-muted-foreground">
              Every task, transaction, note, habit, goal and workout can be deleted from its own
              screen. Deleted transactions are excluded from balances immediately.
            </p>
          </div>
          <DeleteAccountSection />
        </>
      )}
      {id === 'security' && (
        <>
          <div className="bg-card flex max-w-xl flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">Change password</h3>
            <NewPasswordForm redirectTo={null} compact />
          </div>
          <div className="bg-card flex max-w-xl flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">Sessions</h3>
            <p className="text-muted-foreground text-sm">
              Signed in as {user.email}. Signing out everywhere ends the session on every device.
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
            <h3 className="font-medium">Import</h3>
            <p className="text-muted-foreground text-sm">
              Import bank transactions from CSV (most Polish and EU bank exports work).
            </p>
            <Button variant="outline" asChild className="self-start">
              <Link href="/finances/transactions">
                <Upload /> Import transactions
              </Link>
            </Button>
          </div>
          <div className="bg-card flex flex-col gap-3 rounded-xl border p-5">
            <h3 className="font-medium">Export</h3>
            <p className="text-muted-foreground text-sm">
              Take your data anywhere — JSON for everything, CSV for transactions.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/api/export" download>
                  JSON
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/finances/transactions/export" download>
                  CSV
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
      {id === 'integrations' && (
        <>
          <p className="text-muted-foreground max-w-xl text-sm">
            Integrations are on the roadmap. LifeOS already stores the source of every imported
            record, so connected data will appear next to your manual entries without duplicates.
          </p>
          <ul className="grid max-w-2xl gap-2 sm:grid-cols-2">
            {INTEGRATIONS.map((i) => (
              <li
                key={i.name}
                className="bg-card flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
              >
                <span>
                  <span className="block font-medium">{i.name}</span>
                  <span className="text-muted-foreground text-xs">{i.area}</span>
                </span>
                <Badge variant="secondary">Planned</Badge>
              </li>
            ))}
          </ul>
        </>
      )}
      {id === 'billing' && (
        <div className="bg-card flex max-w-xl flex-col gap-2 rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Current plan</h3>
            <Badge>{profile.plan === 'pro' ? 'Pro' : 'Free'}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Every feature is available during the early access period. Paid plans may be introduced
            later — you will be told well in advance.
          </p>
        </div>
      )}
    </section>
  )
}
