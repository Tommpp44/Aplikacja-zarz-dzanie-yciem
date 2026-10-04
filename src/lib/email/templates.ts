import { formatDate, fromISODate, minutesToLabel, type ISODate } from '@/lib/dates'
import type { Locale } from '@/lib/i18n/config'
import { makeT } from '@/lib/i18n/translate'
import { formatMoney } from '@/lib/money'
import type { PeriodSummary } from '@/lib/reviews/summary'

export type Email = { subject: string; html: string; text: string }

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type Section = { title: string; lines: string[] }

function layout(opts: {
  heading: string
  intro: string
  sections: Section[]
  cta: { label: string; url: string }
  footer: string
  settingsUrl: string
  settingsLabel: string
}): { html: string; text: string } {
  const sectionsHtml = opts.sections
    .filter((s) => s.lines.length)
    .map(
      (s) => `
      <h2 style="font-size:14px;margin:24px 0 8px;color:#111827">${escapeHtml(s.title)}</h2>
      <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.6">
        ${s.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}
      </ul>`,
    )
    .join('')
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <p style="margin:0 0 16px;font-weight:600;color:#4f46e5">LifeOS</p>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 8px;color:#111827">${escapeHtml(opts.heading)}</h1>
      <p style="margin:0;color:#4b5563;font-size:14px">${escapeHtml(opts.intro)}</p>
      ${sectionsHtml}
      <p style="margin:28px 0 0"><a href="${escapeHtml(opts.cta.url)}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600">${escapeHtml(opts.cta.label)}</a></p>
    </div>
    <p style="margin:16px 0 0;color:#6b7280;font-size:12px">${escapeHtml(opts.footer)} <a href="${escapeHtml(opts.settingsUrl)}" style="color:#6b7280">${escapeHtml(opts.settingsLabel)}</a></p>
  </div></body></html>`
  const text = [
    opts.heading,
    opts.intro,
    ...opts.sections
      .filter((s) => s.lines.length)
      .flatMap((s) => ['', s.title, ...s.lines.map((l) => `• ${l}`)]),
    '',
    `${opts.cta.label}: ${opts.cta.url}`,
    '',
    `${opts.footer} ${opts.settingsUrl}`,
  ].join('\n')
  return { html, text }
}

export type AgendaData = {
  name: string
  today: ISODate
  tasks: { title: string; time: string | null; overdue: boolean }[]
  events: { title: string; time: string | null }[]
  habits: string[]
  focus: string | null
}

export function dailyAgendaEmail(d: AgendaData, locale: Locale, siteUrl: string): Email {
  const t = makeT(locale)
  const date = formatDate(fromISODate(d.today), 'EEEE, d MMMM', locale)
  const empty = !d.tasks.length && !d.events.length && !d.habits.length
  const sections: Section[] = [
    ...(d.focus ? [{ title: t("Today's focus"), lines: [d.focus] }] : []),
    {
      title: t('Events'),
      lines: d.events.map((e) => (e.time ? `${e.time} · ${e.title}` : e.title)),
    },
    {
      title: t('Tasks'),
      lines: d.tasks.map(
        (task) =>
          `${task.time ? `${task.time} · ` : ''}${task.title}${task.overdue ? ` (${t('Overdue').toLowerCase()})` : ''}`,
      ),
    },
    { title: t('Habits'), lines: d.habits },
  ]
  const { html, text } = layout({
    heading: t('Good morning, {name}', { name: d.name }),
    intro: empty
      ? t('Nothing planned yet — a calm day. Pick one thing that matters and start there.')
      : t('Here is your {date}.', { date }),
    sections,
    cta: { label: t('Open Today'), url: `${siteUrl}/today` },
    footer: t('You get this e-mail because the morning e-mail is on.'),
    settingsUrl: `${siteUrl}/settings/notifications`,
    settingsLabel: t('Change e-mail settings'),
  })
  return {
    subject: t('Your day: {tasks} tasks, {events} events', {
      tasks: d.tasks.length,
      events: d.events.length,
    }),
    html,
    text,
  }
}

export function weeklySummaryEmail(
  s: PeriodSummary,
  d: { name: string; nextPriorities: string[] },
  locale: Locale,
  siteUrl: string,
): Email {
  const t = makeT(locale)
  const range = `${formatDate(fromISODate(s.from), 'd MMM', locale)} – ${formatDate(fromISODate(s.to), 'd MMM', locale)}`
  const lines = [
    t('Tasks completed: {n}', { n: s.tasks.completed }),
    s.habits.due
      ? t('Habits: {done}/{due} ({rate}%)', {
          done: s.habits.done,
          due: s.habits.due,
          rate: Math.round(s.habits.rate),
        })
      : null,
    s.workouts.count
      ? t('Workouts: {n} ({time})', {
          n: s.workouts.count,
          time: minutesToLabel(s.workouts.minutes),
        })
      : null,
    t('Spent: {amount}', { amount: formatMoney(s.money.expenses, s.money.currency) }),
    s.goalsCompleted ? t('Goals achieved: {n}', { n: s.goalsCompleted }) : null,
  ].filter((l): l is string => Boolean(l))
  const { html, text } = layout({
    heading: t('Your week, {name}', { name: d.name }),
    intro: t('{range} — take ten minutes to look back and plan the next week.', { range }),
    sections: [
      { title: t('Highlights'), lines },
      { title: t('Done this week'), lines: s.tasks.completedTitles.slice(0, 8) },
      { title: t("Next week's priorities"), lines: d.nextPriorities },
    ],
    cta: { label: t('Start weekly review'), url: `${siteUrl}/reviews?type=weekly` },
    footer: t('You get this e-mail because the weekly summary is on.'),
    settingsUrl: `${siteUrl}/settings/notifications`,
    settingsLabel: t('Change e-mail settings'),
  })
  return { subject: t('Your week in LifeOS: {range}', { range }), html, text }
}
