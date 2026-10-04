import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { JournalForm } from '@/components/journal/journal-form'
import { PeriodSummaryView } from '@/components/reviews/period-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { addDaysISO, formatISODate, isISODate, relativeDayLabel } from '@/lib/dates'
import { getPeriodSummary } from '@/lib/reviews/summary'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Journal' }

const MOOD = ['', '😞', '😕', '😐', '🙂', '😄']

export default async function JournalPage({ searchParams }: PageProps<'/journal'>) {
  const sp = await searchParams
  const { supabase, user, today, timezone, currency } = await getOnboardedUserContext()
  const date =
    typeof sp.date === 'string' && isISODate(sp.date) && sp.date <= today ? sp.date : today
  const [entry, recent, summary] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', date)
      .maybeSingle(),
    supabase
      .from('journal_entries')
      .select('id, entry_date, mood, today_text')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(10),
    getPeriodSummary(supabase, user.id, date, date, timezone, currency, today),
  ])
  return (
    <>
      <PageHeader
        title="Journal"
        description="Optional, private reflection. A few lines a day are enough."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/journal?date=${addDaysISO(date, -1)}`} aria-label="Previous day">
                  <ChevronLeft />
                </Link>
              </Button>
              <CardTitle className="text-base">{formatISODate(date, 'EEEE, d MMMM')}</CardTitle>
              {date < today && (
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link href={`/journal?date=${addDaysISO(date, 1)}`} aria-label="Next day">
                    <ChevronRight />
                  </Link>
                </Button>
              )}
            </div>
            {date !== today && (
              <Link href="/journal" className="text-primary text-xs hover:underline">
                Today
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <JournalForm key={date} date={date} entry={entry.data} />
          </CardContent>
        </Card>
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your day in numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <PeriodSummaryView summary={summary} compact />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent entries</CardTitle>
            </CardHeader>
            <CardContent>
              {(recent.data ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">No entries yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {(recent.data ?? []).map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/journal?date=${e.entry_date}`}
                        className="hover:bg-accent flex items-center gap-2 rounded-md p-1.5 text-sm"
                      >
                        <span aria-hidden>{e.mood ? MOOD[e.mood] : '📝'}</span>
                        <span className="text-muted-foreground w-24 shrink-0">
                          {relativeDayLabel(e.entry_date, today)}
                        </span>
                        <span className="truncate">{e.today_text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
