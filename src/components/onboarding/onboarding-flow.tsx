'use client'

import {
  ArrowRight,
  Check,
  Flame,
  Footprints,
  Landmark,
  ListChecks,
  Target,
  Wallet,
  CalendarDays,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { NativeSelect } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import { COMMON_CURRENCIES } from '@/lib/money'
import { completeOnboarding } from '@/lib/settings/actions'
import { INTERESTS } from '@/lib/settings/schemas'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'

type Interest = (typeof INTERESTS)[number]
type Defaults = {
  currency: string
  timezone: string
  week_start: 0 | 1
  units: 'metric' | 'imperial'
}

const INTEREST_META: Record<Interest, { label: string; icon: typeof Wallet }> = {
  finances: { label: msg('Finances'), icon: Wallet },
  productivity: { label: msg('Productivity'), icon: ListChecks },
  habits: { label: msg('Habits'), icon: Flame },
  fitness: { label: msg('Fitness'), icon: Footprints },
  goals: { label: msg('Goals'), icon: Target },
  planning: { label: msg('Planning'), icon: CalendarDays },
  everything: { label: msg('Everything'), icon: Sparkles },
}

function timezones(current: string) {
  const list =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : ['UTC', 'Europe/Warsaw']
  return list.includes(current) ? list : [current, ...list]
}

export function OnboardingFlow({ name, defaults }: { name: string; defaults: Defaults }) {
  const t = useT()
  const [step, setStep] = useState(1)
  const [interests, setInterests] = useState<Interest[]>([])
  const [settings, setSettings] = useState(defaults)
  const [notify, setNotify] = useState({
    task_reminders: true,
    budget_warnings: true,
    habit_reminders: false,
  })
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Prefer the browser's timezone when the account still has the default.
  const goToSettings = () => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (settings.timezone === 'UTC' && browserTz)
      setSettings((s) => ({ ...s, timezone: browserTz }))
    setStep(2)
  }

  const toggle = (value: Interest) =>
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )

  const finish = (target: string) =>
    startTransition(async () => {
      const result = await completeOnboarding({ interests, ...settings, notifications: notify })
      if (!result.ok) {
        toast.error(t(result.error))
        return
      }
      router.replace(target)
      router.refresh()
    })

  return (
    <div className="flex flex-col gap-8">
      <ol className="flex gap-2" aria-label={t('Progress')}>
        {[1, 2, 3].map((n) => (
          <li key={n} className={cn('bg-muted h-1 flex-1 rounded-full', n <= step && 'bg-primary')}>
            <span className="sr-only">
              {t('Step {n}', { n })}
              {n === step ? ` (${t('current')})` : ''}
            </span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {name ? t('Welcome, {name}.', { name }) : t('Welcome.')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('What do you want to manage? Pick as many as you like.')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INTERESTS.map((value) => {
              const meta = INTEREST_META[value]
              const Icon = meta.icon
              const active = interests.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(value)}
                  className={cn(
                    'bg-card hover:border-primary/50 flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors',
                    active && 'border-primary bg-primary-soft text-primary',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {t(meta.label)}
                  {active && <Check className="ml-auto size-4" aria-hidden />}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={goToSettings}>
              {t('Skip')}
            </Button>
            <Button onClick={goToSettings}>
              Continue <ArrowRight />
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('The basics')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('You can change these anytime in Settings.')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Currency')} htmlFor="currency">
              <NativeSelect
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                {[...new Set([settings.currency, ...COMMON_CURRENCIES])].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('Timezone')} htmlFor="timezone">
              <NativeSelect
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              >
                {timezones(settings.timezone).map((tz) => (
                  <option key={tz}>{tz}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('First day of week')} htmlFor="week_start">
              <NativeSelect
                id="week_start"
                value={settings.week_start}
                onChange={(e) =>
                  setSettings({ ...settings, week_start: e.target.value === '0' ? 0 : 1 })
                }
              >
                <option value={1}>{t('Monday')}</option>
                <option value={0}>{t('Sunday')}</option>
              </NativeSelect>
            </Field>
            <Field label={t('Units')} htmlFor="units">
              <NativeSelect
                id="units"
                value={settings.units}
                onChange={(e) =>
                  setSettings({ ...settings, units: e.target.value as 'metric' | 'imperial' })
                }
              >
                <option value="metric">{t('Metric (kg, km)')}</option>
                <option value="imperial">{t('Imperial (lb, mi)')}</option>
              </NativeSelect>
            </Field>
          </div>
          <div className="bg-card flex flex-col gap-3 rounded-xl border p-4">
            <p className="text-sm font-medium">{t('Notifications')}</p>
            <p className="text-muted-foreground -mt-2 text-xs">
              {t('Fewer, more valuable notifications. Off by default for habits.')}
            </p>
            {(
              [
                ['task_reminders', msg('Tasks due and overdue')],
                ['budget_warnings', msg('Budget warnings')],
                ['habit_reminders', msg('Habit reminders')],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-sm">
                {t(label)}
                <Switch
                  checked={notify[key]}
                  onCheckedChange={(v) => setNotify({ ...notify, [key]: v })}
                />
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              {t('Back')}
            </Button>
            <Button onClick={() => setStep(3)}>
              Continue <ArrowRight />
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("You're ready")}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Start with one small step — or explore on your own.')}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: t('Add your first goal'), href: '/goals?new=1', icon: Target },
              { label: t('Create your first habit'), href: '/habits?new=1', icon: Flame },
              {
                label: t('Add your main financial account'),
                href: '/finances/accounts?new=1',
                icon: Landmark,
              },
              { label: t('Plan tomorrow'), href: '/tasks?view=upcoming', icon: CalendarDays },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  type="button"
                  disabled={pending}
                  onClick={() => finish(item.href)}
                  className="bg-card hover:border-primary/50 flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <Icon className="text-primary size-4" aria-hidden />
                  {t(item.label)}
                  <ArrowRight className="text-muted-foreground ml-auto size-4" aria-hidden />
                </button>
              )
            })}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              {t('Back')}
            </Button>
            <Button disabled={pending} onClick={() => finish('/dashboard')}>
              {t('Go to dashboard')}
            </Button>
          </div>
          <p className="text-muted-foreground text-center text-xs">
            {t('Changed your mind?')}{' '}
            <Link href="/settings" className="underline">
              {t('Settings')}
            </Link>{' '}
            {t('has everything.')}
          </p>
        </section>
      )}
    </div>
  )
}
