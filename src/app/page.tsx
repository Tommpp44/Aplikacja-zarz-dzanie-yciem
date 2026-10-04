import {
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  Dumbbell,
  Flame,
  Languages,
  NotebookPen,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/layout/logo'
import { LanguagePicker } from '@/components/shared/language-picker'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'
import { msg } from '@/lib/i18n/translate'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: { absolute: `LifeOS — ${t('Your life, in one calm place')}` },
    description: t(
      'Tasks, goals, habits, money, calendar and training — connected, so every day moves you towards the life you want.',
    ),
  }
}

const MODULES = [
  {
    icon: CheckCircle2,
    title: msg('Tasks & projects'),
    body: msg('Quick add in plain language, priorities, recurring tasks and a clear Today list.'),
  },
  {
    icon: Target,
    title: msg('Goals with a pace'),
    body: msg(
      'Milestones, linked habits and savings — and an honest forecast of when you’ll get there.',
    ),
  },
  {
    icon: Flame,
    title: msg('Habits & routines'),
    body: msg('One tap to check in, streaks, heatmaps and morning or evening routines.'),
  },
  {
    icon: Wallet,
    title: msg('Money'),
    body: msg('Accounts, budgets, recurring bills, net worth and a forecast for the month.'),
  },
  {
    icon: CalendarDays,
    title: msg('Calendar'),
    body: msg('Events and tasks on one timeline, with your Google, Outlook or iCloud calendars.'),
  },
  {
    icon: Dumbbell,
    title: msg('Training'),
    body: msg('Live workouts, plans, personal records, steps — plus Strava and Apple Health.'),
  },
  {
    icon: NotebookPen,
    title: msg('Notes & journal'),
    body: msg('Ideas linked to projects and goals, and a journal that summarises your day.'),
  },
  {
    icon: Sparkles,
    title: msg('Reviews & insights'),
    body: msg('Daily, weekly and monthly reviews written from what you actually did.'),
  },
]

const STEPS = [
  {
    title: msg('Tell LifeOS what matters'),
    body: msg(
      'Pick your areas and a starter kit — goals, habits and a budget are ready in a minute.',
    ),
  },
  {
    title: msg('Open Today every morning'),
    body: msg('Your focus, tasks, events and habits on one screen. Nothing to assemble.'),
  },
  {
    title: msg('Review and adjust'),
    body: msg('A weekly review shows what worked, and your goals tell you if you’re on pace.'),
  },
]

const PERKS = [
  { icon: ShieldCheck, text: msg('Private by design — your data is visible only to you') },
  { icon: Smartphone, text: msg('Installs on your phone and works offline') },
  { icon: BellRing, text: msg('Reminders by push and morning e-mail') },
  { icon: RefreshCcw, text: msg('Import from CSV, calendars, Apple Health and Strava') },
  { icon: Languages, text: msg('In English and Polish') },
]

export default async function LandingPage() {
  const t = await getT()
  return (
    <div className="bg-background text-foreground min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" aria-label={t('LifeOS home')}>
          <Logo className="text-lg" />
        </Link>
        <nav className="flex items-center gap-2" aria-label={t('Account')}>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t('Log in')}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">{t('Get started')}</Link>
          </Button>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="bg-primary/15 absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-24">
            <div>
              <p className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                <Sparkles className="size-3.5" aria-hidden />
                {t('Your personal operating system')}
              </p>
              <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
                {t('Your life, in one calm place')}
              </h1>
              <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
                {t(
                  'Tasks, goals, habits, money, calendar and training — connected, so every day moves you towards the life you want.',
                )}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">
                    {t('Start for free')} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">{t('See what’s inside')}</Link>
                </Button>
              </div>
              <ul className="text-muted-foreground mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {[t('Set up in 2 minutes'), t('No credit card'), t('Export your data anytime')].map(
                  (item) => (
                    <li key={item} className="inline-flex items-center gap-1.5">
                      <Check className="text-success size-4" aria-hidden /> {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <AppPreview t={t} />
          </div>
        </section>

        <section className="bg-muted/40 border-y py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-sm font-medium">
              {t('Three questions, answered every day')}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                [t('Now'), t('What is happening today?')],
                [t('Next'), t('What should I do next?')],
                [t('Long term'), t('Am I moving towards the life I want?')],
              ].map(([label, question]) => (
                <div key={label} className="bg-card rounded-xl border p-5">
                  <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                    {label}
                  </p>
                  <p className="mt-1.5 font-medium">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {t('Everything you juggle — finally talking to each other')}
            </h2>
            <p className="text-muted-foreground mt-3 text-pretty">
              {t(
                'A savings goal follows your account balance. A half-marathon goal collects your runs. Routines tick off habits. You stop copying things between apps.',
              )}
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="bg-card rounded-xl border p-5 shadow-xs">
                <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-lg">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{t(title)}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm">{t(body)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-muted/40 border-y py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">{t('How it works')}</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ title, body }, i) => (
                <li key={title} className="flex gap-4">
                  <span className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold">
                    {i + 1}
                  </span>
                  <span>
                    <h3 className="font-semibold">{t(title)}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{t(body)}</p>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
                <span>{t(text)}</span>
              </li>
            ))}
          </ul>
          <div className="from-primary/90 to-primary relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br px-6 py-12 text-center text-white sm:px-12">
            <div
              aria-hidden
              className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10 blur-3xl"
            />
            <h2 className="relative text-3xl font-semibold tracking-tight text-balance">
              {t('Start with today. The rest follows.')}
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/85">
              {t('Create your account and get a ready-made plan for your first week.')}
            </p>
            <Button asChild size="lg" variant="secondary" className="relative mt-8">
              <Link href="/signup">
                {t('Create your free account')} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm sm:px-6">
          <Logo withText />
          <LanguagePicker />
          <Link href="/login" className="hover:text-foreground">
            {t('Log in')}
          </Link>
        </div>
      </footer>
    </div>
  )
}

/** Static, decorative mock of the Today screen. */
function AppPreview({ t }: { t: Awaited<ReturnType<typeof getT>> }) {
  const tasks = [
    { title: t('Finish project presentation'), done: true, tag: 'P1' },
    { title: t('Run 8 km — easy pace'), done: true, tag: t('Training') },
    { title: t('Pay electricity bill'), done: false, tag: t('Money') },
    { title: t('Call the dentist'), done: false, tag: 'P2' },
  ]
  return (
    <div aria-hidden className="relative">
      <div className="bg-card rotate-1 rounded-2xl border p-5 shadow-xl sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">{t('Today')}</p>
            <p className="text-lg font-semibold">{t('Good morning, Alex')}</p>
          </div>
          <span className="bg-success/15 text-success rounded-full px-2.5 py-1 text-xs font-medium">
            {t('On track')}
          </span>
        </div>
        <div className="bg-primary/10 mt-4 rounded-xl p-3">
          <p className="text-primary text-xs font-medium">{t('Focus of the day')}</p>
          <p className="mt-0.5 text-sm font-medium">{t('Finish project presentation')}</p>
        </div>
        <ul className="mt-4 flex flex-col gap-2.5">
          {tasks.map((task) => (
            <li key={task.title} className="flex items-center gap-3 text-sm">
              <span
                className={
                  task.done
                    ? 'bg-primary text-primary-foreground grid size-5 place-items-center rounded-full'
                    : 'size-5 rounded-full border-2'
                }
              >
                {task.done && <Check className="size-3" />}
              </span>
              <span className={task.done ? 'text-muted-foreground flex-1 line-through' : 'flex-1'}>
                {task.title}
              </span>
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                {task.tag}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4">
          <PreviewStat label={t('Habits')} value="4/6" percent={66} />
          <PreviewStat label={t('Budget')} value="62%" percent={62} />
          <PreviewStat label={t('Half marathon')} value="50%" percent={50} />
        </div>
      </div>
      <div className="bg-card absolute -bottom-6 -left-4 hidden -rotate-2 items-center gap-3 rounded-xl border px-4 py-3 shadow-lg sm:flex">
        <Flame className="size-5 text-orange-500" />
        <div>
          <p className="text-sm font-semibold">{t('18-day streak')}</p>
          <p className="text-muted-foreground text-xs">{t('Read 20 minutes')}</p>
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div>
      <p className="text-muted-foreground truncate text-[11px]">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
      <div className="bg-muted mt-1.5 h-1.5 rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
