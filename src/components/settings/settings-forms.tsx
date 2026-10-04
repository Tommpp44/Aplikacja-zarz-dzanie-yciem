'use client'

import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { SubmitButton } from '@/components/ui/submit-button'
import { Switch } from '@/components/ui/switch'
import { useServerAction } from '@/hooks/use-server-action'
import { deleteAccount, signOutEverywhere } from '@/lib/account/actions'
import { DATE_FORMATS } from '@/lib/dates'
import { COMMON_CURRENCIES } from '@/lib/money'
import {
  updateAppearance,
  updateNotificationSettings,
  updatePreferences,
  updateProfile,
} from '@/lib/settings/actions'
import {
  ACCENTS,
  NOTIFICATION_LABELS,
  type Accent,
  type NotificationSettings,
} from '@/lib/settings/schemas'
import { cn } from '@/lib/utils'

export function ProfileForm({ displayName, email }: { displayName: string; email: string | null }) {
  const [name, setName] = useState(displayName)
  const [error, setError] = useState<string>()
  const [pending, run] = useServerAction()
  return (
    <form
      className="flex max-w-md flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => updateProfile({ display_name: name }), {
          success: 'Profile saved',
          onError: (r) => setError(r.fieldErrors?.display_name),
        })
      }}
    >
      <Field
        label="Name"
        htmlFor="profile-name"
        error={error}
        hint="Used in greetings across the app."
      >
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </Field>
      <Field label="Email" htmlFor="profile-email" hint="Your sign-in email.">
        <Input id="profile-email" value={email ?? ''} disabled readOnly />
      </Field>
      <SubmitButton pending={pending} className="self-start">
        Save
      </SubmitButton>
    </form>
  )
}

type Prefs = {
  currency: string
  timezone: string
  week_start: 0 | 1
  date_format: (typeof DATE_FORMATS)[number]
  units: 'metric' | 'imperial'
}

export function PreferencesForm({ initial }: { initial: Prefs }) {
  const [v, setV] = useState(initial)
  const [pending, run] = useServerAction()
  const zones =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [initial.timezone]
  return (
    <form
      className="grid max-w-xl gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => updatePreferences(v), { success: 'Preferences saved' })
      }}
    >
      <Field
        label="Currency"
        htmlFor="pref-currency"
        hint="Used for budgets, totals and net worth."
      >
        <NativeSelect
          id="pref-currency"
          value={v.currency}
          onChange={(e) => setV({ ...v, currency: e.target.value })}
        >
          {[...new Set([v.currency, ...COMMON_CURRENCIES])].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </NativeSelect>
      </Field>
      <Field
        label="Timezone"
        htmlFor="pref-tz"
        hint="Defines “today” for tasks, habits and reviews."
      >
        <NativeSelect
          id="pref-tz"
          value={v.timezone}
          onChange={(e) => setV({ ...v, timezone: e.target.value })}
        >
          {(zones.includes(v.timezone) ? zones : [v.timezone, ...zones]).map((z) => (
            <option key={z}>{z}</option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Week starts on" htmlFor="pref-week">
        <NativeSelect
          id="pref-week"
          value={v.week_start}
          onChange={(e) => setV({ ...v, week_start: e.target.value === '0' ? 0 : 1 })}
        >
          <option value={1}>Monday</option>
          <option value={0}>Sunday</option>
        </NativeSelect>
      </Field>
      <Field label="Date format" htmlFor="pref-date">
        <NativeSelect
          id="pref-date"
          value={v.date_format}
          onChange={(e) => setV({ ...v, date_format: e.target.value as Prefs['date_format'] })}
        >
          {DATE_FORMATS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Units" htmlFor="pref-units">
        <NativeSelect
          id="pref-units"
          value={v.units}
          onChange={(e) => setV({ ...v, units: e.target.value as Prefs['units'] })}
        >
          <option value="metric">Metric (kg, km)</option>
          <option value="imperial">Imperial (lb, mi)</option>
        </NativeSelect>
      </Field>
      <div className="flex items-end">
        <Button
          variant="outline"
          type="button"
          onClick={() => setV({ ...v, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
        >
          Use this device&apos;s timezone
        </Button>
      </div>
      <SubmitButton pending={pending} className="self-start sm:col-span-2">
        Save preferences
      </SubmitButton>
    </form>
  )
}

/** Applies the accent immediately (outside React state, like next-themes does for the theme). */
function applyAccent(accent: Accent) {
  document.documentElement.dataset.accent = accent
}

const ACCENT_SWATCH: Record<Accent, string> = {
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-700',
}

export function AppearanceForm({
  theme: initialTheme,
  accent: initialAccent,
}: {
  theme: 'light' | 'dark' | 'system'
  accent: Accent
}) {
  const { setTheme } = useTheme()
  const [theme, setLocalTheme] = useState(initialTheme)
  const [accent, setAccent] = useState(initialAccent)
  const [, run] = useServerAction()
  const save = (t: typeof theme, a: Accent) => {
    setLocalTheme(t)
    setAccent(a)
    setTheme(t)
    applyAccent(a)
    run(() => updateAppearance({ theme: t, accent: a }), { success: 'Appearance updated' })
  }
  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Theme</legend>
        <div role="radiogroup" aria-label="Theme" className="grid max-w-md grid-cols-3 gap-2">
          {(
            [
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
              ['system', 'System', Monitor],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => save(value, accent)}
              className={cn(
                'bg-card flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium',
                theme === value && 'border-primary ring-primary/20 ring-2',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Accent color</legend>
        <div role="radiogroup" aria-label="Accent color" className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={accent === a}
              aria-label={a}
              onClick={() => save(theme, a)}
              className={cn(
                'ring-offset-background flex size-9 items-center justify-center rounded-full text-white ring-offset-2',
                ACCENT_SWATCH[a],
                accent === a && 'ring-ring ring-2',
              )}
            >
              {accent === a && <Check className="size-4" />}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

export function NotificationsForm({ initial }: { initial: NotificationSettings }) {
  const [v, setV] = useState(initial)
  const [pending, run] = useServerAction()
  return (
    <form
      className="flex max-w-xl flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => updateNotificationSettings(v), { success: 'Notification settings saved' })
      }}
    >
      <p className="text-muted-foreground mb-2 text-sm">
        Fewer, more valuable notifications. Each topic is sent at most once per day.
      </p>
      {(Object.keys(NOTIFICATION_LABELS) as (keyof NotificationSettings)[]).map((key) => (
        <label
          key={key}
          className="bg-card flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
        >
          <span>
            <span className="block text-sm font-medium">{NOTIFICATION_LABELS[key].label}</span>
            <span className="text-muted-foreground block text-xs">
              {NOTIFICATION_LABELS[key].description}
            </span>
          </span>
          <Switch checked={v[key]} onCheckedChange={(c) => setV({ ...v, [key]: c })} />
        </label>
      ))}
      <SubmitButton pending={pending} className="mt-2 self-start">
        Save
      </SubmitButton>
    </form>
  )
}

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [, run] = useServerAction()
  const router = useRouter()
  return (
    <div className="border-destructive/30 bg-destructive-soft/40 flex max-w-xl flex-col gap-3 rounded-xl border p-5">
      <h3 className="text-destructive font-medium">Delete account</h3>
      <p className="text-muted-foreground text-sm">
        Permanently deletes your account and all of your data: tasks, goals, habits, finances,
        workouts, notes and journal. This cannot be undone. Export your data first if you want to
        keep a copy.
      </p>
      <Button variant="destructive" className="self-start" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setText('')
        }}
        title="Delete your account permanently?"
        description="All data will be erased immediately. Type DELETE to confirm."
        confirmLabel="Delete account"
        confirmDisabled={text !== 'DELETE'}
        onConfirm={() =>
          run(() => deleteAccount({ confirmation: 'DELETE' }), {
            onSuccess: () => {
              router.replace('/login')
              router.refresh()
            },
          })
        }
      >
        <Input
          aria-label="Type DELETE to confirm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="DELETE"
        />
      </ConfirmDialog>
    </div>
  )
}

export function SignOutEverywhereButton() {
  const [pending, setPending] = useState(false)
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        setPending(true)
        void signOutEverywhere()
      }}
    >
      Sign out of all devices
    </Button>
  )
}
