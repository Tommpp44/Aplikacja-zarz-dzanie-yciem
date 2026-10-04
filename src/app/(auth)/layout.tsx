import { CheckCircle2, Flame, ShieldCheck, Target, Wallet } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/layout/logo'
import { LanguagePicker } from '@/components/shared/language-picker'
import { getT } from '@/lib/i18n/server'
import { msg } from '@/lib/i18n/translate'

const FEATURES = [
  {
    icon: CheckCircle2,
    title: msg('One calm place for your day'),
    body: msg('Tasks, calendar, habits and routines on a single Today screen.'),
  },
  {
    icon: Target,
    title: msg('Goals that actually move'),
    body: msg('Link habits, projects and savings to goals and see your pace.'),
  },
  {
    icon: Wallet,
    title: msg('Money without spreadsheets'),
    body: msg('Accounts, budgets and recurring bills with honest balances.'),
  },
  {
    icon: Flame,
    title: msg('Momentum you can see'),
    body: msg('Streaks, weekly reviews and gentle nudges keep you on track.'),
  },
]

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getT()
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <main className="flex flex-col items-center justify-center px-4 py-10">
        <Link href="/" className="mb-8" aria-label={t('LifeOS home')}>
          <Logo className="text-lg" />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
        <p className="text-muted-foreground mt-10 flex max-w-sm items-center gap-1.5 text-center text-xs">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          {t('Your data is private to your account and protected by row-level security.')}
        </p>
        <LanguagePicker className="mt-4" />
      </main>
      <aside
        aria-label={t('About LifeOS')}
        className="from-primary/90 to-primary relative hidden overflow-hidden bg-gradient-to-br text-white lg:flex lg:flex-col lg:justify-center lg:px-14"
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            {t('Run your life like a calm, well-planned week.')}
          </h2>
          <p className="mt-3 text-white/80">
            {t(
              'LifeOS brings your plans, habits, money, training and notes together — so you always know what matters next.',
            )}
          </p>
          <ul className="mt-10 flex flex-col gap-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium">{t(title)}</span>
                  <span className="block text-sm text-white/75">{t(body)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
