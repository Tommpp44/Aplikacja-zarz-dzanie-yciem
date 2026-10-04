'use client'

import { CalendarPlus, FileUp, RefreshCw, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useServerAction } from '@/hooks/use-server-action'
import { useT } from '@/lib/i18n/client'
import {
  addCalendarSubscription,
  deleteCalendarSubscription,
  importCalendarFile,
  syncCalendarSubscription,
} from '@/lib/integrations/calendar-actions'
import { formatDate } from '@/lib/dates'

export type CalendarSubscription = {
  id: string
  name: string
  last_synced_at: string | null
  last_error: string | null
  event_count: number
}

export function CalendarSubscriptions({ items }: { items: CalendarSubscription[] }) {
  const t = useT()
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [pending, run] = useServerAction()
  const fileRef = useRef<HTMLInputElement>(null)

  const add = () =>
    run(() => addCalendarSubscription({ url, name: name || t('Calendar'), color: 'blue' }), {
      success: (d) => t('Calendar added — {n} events imported', { n: d.imported }),
      onSuccess: () => {
        setUrl('')
        setName('')
      },
    })

  const importFile = async (file: File) => {
    if (file.size > 5_000_000) return toast.error(t('File is larger than 5 MB.'))
    const text = await file.text()
    run(() => importCalendarFile({ text, color: 'violet' }), {
      success: (d) => t('{n} events imported', { n: d.imported }),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="bg-card flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{s.name}</span>
                <span className="text-muted-foreground block text-xs">
                  {s.last_error
                    ? t('Last sync failed: {error}', { error: s.last_error })
                    : s.last_synced_at
                      ? t('{n} events · synced {date}', {
                          n: s.event_count,
                          date: formatDate(new Date(s.last_synced_at), 'd MMM, HH:mm', t.locale),
                        })
                      : t('Not synced yet')}
                </span>
              </span>
              {s.last_error && <Badge variant="warning">{t('Error')}</Badge>}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('Sync {name} now', { name: s.name })}
                disabled={pending}
                onClick={() =>
                  run(() => syncCalendarSubscription({ id: s.id }), {
                    success: (d) => t('{n} events imported', { n: d.imported }),
                  })
                }
              >
                <RefreshCw />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('Remove {name}', { name: s.name })}
                disabled={pending}
                onClick={() =>
                  run(() => deleteCalendarSubscription({ id: s.id }), {
                    success: t('Calendar removed'),
                  })
                }
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="bg-card flex flex-col gap-3 rounded-lg border p-4"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <Field label={t('Calendar link (iCal)')} htmlFor="ics-url">
            <Input
              id="ics-url"
              inputMode="url"
              placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <Field label={t('Name')} htmlFor="ics-name" optional>
            <Input
              id="ics-name"
              placeholder={t('Work')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </div>
        <details className="text-muted-foreground text-xs">
          <summary className="cursor-pointer">{t('Where do I find the link?')}</summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4">
            <li>
              {t('Google Calendar: Settings → your calendar → “Secret address in iCal format”.')}
            </li>
            <li>
              {t(
                'Outlook: Settings → Calendar → Shared calendars → Publish a calendar → ICS link.',
              )}
            </li>
            <li>
              {t(
                'iCloud: Calendar → share icon next to the calendar → Public Calendar → copy link.',
              )}
            </li>
          </ul>
          <p className="mt-2">{t('Events are read-only copies and refresh every hour.')}</p>
        </details>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={pending || url.trim().length < 10}>
            <CalendarPlus /> {t('Add calendar')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp /> {t('Import .ics file')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".ics,text/calendar"
            className="hidden"
            aria-label={t('Import .ics file')}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ''
            }}
          />
        </div>
      </form>
    </div>
  )
}
