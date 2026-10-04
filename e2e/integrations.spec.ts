import { expect, test } from '@playwright/test'
import { strToU8, zipSync } from 'fflate'
import { expectToast, finishOnboarding, signUp, uniqueEmail } from './helpers'

const today = new Date().toISOString().slice(0, 10)
const compact = today.replace(/-/g, '')

const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'UID:e2e-dentist@example.com',
  `DTSTART:${compact}T230000Z`,
  `DTEND:${compact}T233000Z`,
  'SUMMARY:Imported dentist',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

const HEALTH = `<?xml version="1.0"?><HealthData>
<Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="${today} 08:00:00 +0000" endDate="${today} 09:00:00 +0000" value="8765"/>
<Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="25" durationUnit="min" totalDistance="5" totalDistanceUnit="km" startDate="${today} 06:00:00 +0000" endDate="${today} 06:25:00 +0000"/>
</HealthData>`

const GPX = `<?xml version="1.0"?><gpx><trk><name>Bike to work</name><type>cycling</type><trkseg>
<trkpt lat="52.20" lon="21.00"><time>${today}T07:00:00Z</time></trkpt>
<trkpt lat="52.25" lon="21.00"><time>${today}T07:20:00Z</time></trkpt>
</trkseg></trk></gpx>`

test('imports calendars, Apple Health and GPX; rejects private links', async ({ page }) => {
  test.setTimeout(120_000)
  await signUp(page, uniqueEmail('integrations'))
  await finishOnboarding(page)
  await page.goto('/settings/integrations')

  // SSRF guard: local addresses are refused.
  await page.getByLabel('Calendar link (iCal)').fill('https://127.0.0.1/calendar.ics')
  await page.getByRole('button', { name: 'Add calendar' }).click()
  await expectToast(page, 'This link cannot be used')

  await page.getByLabel('Import .ics file').setInputFiles({
    name: 'calendar.ics',
    mimeType: 'text/calendar',
    buffer: Buffer.from(ICS),
  })
  await expectToast(page, '1 events imported')

  const zip = zipSync({ 'apple_health_export/export.xml': strToU8(HEALTH) })
  await page.getByLabel('Choose export file').setInputFiles({
    name: 'export.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from(zip),
  })
  await expectToast(page, 'Imported 1 days of activity and 1 workouts')

  await page.getByLabel('Choose GPX files').setInputFiles({
    name: 'ride.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(GPX),
  })
  await expectToast(page, '1 workouts imported')

  // Importing the same files again does not create duplicates.
  await page.getByLabel('Choose GPX files').setInputFiles({
    name: 'ride.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(GPX),
  })
  await expectToast(page, '0 workouts imported')

  await page.goto('/calendar?view=agenda')
  await expect(page.getByText('Imported dentist')).toBeVisible()
  await page.goto('/workouts')
  await expect(page.getByText('Bike to work')).toBeVisible()
  await expect(page.getByText('Running').first()).toBeVisible()
  await page.goto('/activity')
  await expect(page.getByText(/8\s?765/).first()).toBeVisible()
})
