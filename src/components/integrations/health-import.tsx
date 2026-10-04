'use client'

import { Unzip, UnzipInflate } from 'fflate'
import { HeartPulse, MapPinned } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLocale, useT } from '@/lib/i18n/client'
import { AppleHealthParser, type ImportedWorkout } from '@/lib/integrations/apple-health'
import { parseGpx } from '@/lib/integrations/gpx'
import { importActivityDays, importWorkouts } from '@/lib/integrations/health-actions'
import { useRouter } from 'next/navigation'

const EXPORT_XML = /(^|\/)(e?ksport|export)\.xml$/i

async function parseAppleHealth(file: File, since: string, onProgress: (p: number) => void) {
  const parser = new AppleHealthParser({ since })
  const decoder = new TextDecoder()
  let read = 0
  const reader = file.stream().getReader()
  if (/\.xml$/i.test(file.name)) {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      read += value.byteLength
      parser.feed(decoder.decode(value, { stream: true }))
      onProgress(read / file.size)
    }
    return parser.result()
  }
  let found = false
  const unzip = new Unzip((entry) => {
    if (!EXPORT_XML.test(entry.name) || found) return
    found = true
    entry.ondata = (err, data) => {
      if (err) throw err
      parser.feed(decoder.decode(data, { stream: true }))
    }
    entry.start()
  })
  unzip.register(UnzipInflate)
  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      unzip.push(new Uint8Array(0), true)
      break
    }
    read += value.byteLength
    unzip.push(value)
    onProgress(read / file.size)
  }
  if (!found) throw new Error('export.xml not found')
  return parser.result()
}

async function uploadWorkouts(source: 'apple_health' | 'import', workouts: ImportedWorkout[]) {
  let imported = 0
  for (let i = 0; i < workouts.length; i += 500) {
    const r = await importWorkouts({ source, workouts: workouts.slice(i, i + 500) })
    if (!r.ok) throw new Error(r.error)
    imported += r.data.imported
  }
  return imported
}

export function HealthImport({ today }: { today: string }) {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const healthRef = useRef<HTMLInputElement>(null)
  const gpxRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const importHealth = async (file: File) => {
    setProgress(0)
    try {
      const since = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`
      const { days, workouts } = await parseAppleHealth(file, since, setProgress)
      for (let i = 0; i < days.length; i += 1000) {
        const r = await importActivityDays({
          source: 'apple_health',
          days: days.slice(i, i + 1000),
        })
        if (!r.ok) throw new Error(r.error)
      }
      const imported = await uploadWorkouts('apple_health', workouts)
      toast.success(
        t('Imported {days} days of activity and {workouts} workouts', {
          days: days.length,
          workouts: imported,
        }),
      )
      router.refresh()
    } catch {
      toast.error(
        t('This file could not be read. Use export.zip or export.xml from the Health app.'),
      )
    } finally {
      setProgress(null)
    }
  }

  const importGpx = async (files: FileList) => {
    const workouts: ImportedWorkout[] = []
    for (const f of Array.from(files).slice(0, 100)) {
      if (f.size > 20_000_000) continue
      const w = parseGpx(await f.text(), f.name.replace(/\.gpx$/i, ''))
      if (w) workouts.push(w)
    }
    if (!workouts.length) return toast.error(t('No GPS tracks found in these files.'))
    try {
      const imported = await uploadWorkouts('import', workouts)
      toast.success(t('{n} workouts imported', { n: imported }))
      router.refresh()
    } catch {
      toast.error(t('Import failed. Please try again.'))
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2" lang={locale}>
      <div className="bg-card flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <HeartPulse className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Apple Health</p>
            <p className="text-muted-foreground text-xs">
              {t(
                'On iPhone: Health → your photo → Export All Health Data. Then pick the export.zip here. Steps, distance and workouts from the last year are imported; the file never leaves your device.',
              )}
            </p>
          </div>
        </div>
        {progress !== null ? (
          <Progress value={progress * 100} label={t('Reading the export')} />
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={() => healthRef.current?.click()}
          >
            {t('Choose export file')}
          </Button>
        )}
        <input
          ref={healthRef}
          type="file"
          accept=".zip,.xml,application/zip,text/xml"
          className="hidden"
          aria-label={t('Choose export file')}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importHealth(f)
            e.target.value = ''
          }}
        />
      </div>
      <div className="bg-card flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <MapPinned className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{t('GPX files')}</p>
            <p className="text-muted-foreground text-xs">
              {t(
                'Runs and rides exported from Strava, Garmin Connect, Komoot or any GPS watch. Distance, time and elevation are calculated automatically; duplicates are skipped.',
              )}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() => gpxRef.current?.click()}
        >
          {t('Choose GPX files')}
        </Button>
        <input
          ref={gpxRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          multiple
          className="hidden"
          aria-label={t('Choose GPX files')}
          onChange={(e) => {
            if (e.target.files?.length) void importGpx(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
