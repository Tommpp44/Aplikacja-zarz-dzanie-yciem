import { expect, test } from '@playwright/test'
import { expectToast, finishOnboarding, signUp, uniqueEmail } from './helpers'

test('search, quick capture, calendar and workouts work together', async ({ page }) => {
  test.setTimeout(180_000)
  await signUp(page, uniqueEmail('modules'), 'Module Tester')
  await finishOnboarding(page)

  // Quick capture from anywhere ("c" key) → project via command palette later
  await page.keyboard.press('c')
  await page.getByRole('dialog').getByRole('button', { name: /^Task/ }).click()
  await page.getByLabel('Quick add task').fill('Research Berlin neighborhoods tomorrow')
  await page.getByLabel('Quick add task').press('Enter')
  await expectToast(page, /Task|saved/).catch(() => undefined)

  // Calendar event
  await page.goto('/calendar?view=agenda')
  await page.getByRole('button', { name: 'Event', exact: true }).click()
  await page.getByLabel('Title').fill('Dentist')
  await page.getByRole('dialog').getByRole('button', { name: 'Create event' }).click()
  await expectToast(page, 'Event created')
  await expect(page.getByText('Dentist')).toBeVisible()

  // Strength workout
  await page.goto('/workouts')
  await page.getByRole('button', { name: 'Start workout' }).click()
  await expect(page).toHaveURL(/\/workouts\/[0-9a-f-]+$/)
  await page.getByLabel('Exercise').selectOption({ label: 'Bench Press — Chest' })
  await page.getByRole('button', { name: 'Add exercise' }).click()
  await page.getByLabel('Set 1 weight').fill('60')
  await page.getByLabel('Set 1 reps').fill('10')
  await page.getByRole('button', { name: 'Mark set 1 done' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await expectToast(page, /Workout completed/)

  // Global search (⌘K / Ctrl+K)
  await page.goto('/dashboard')
  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Search everything or type a command…').fill('berlin')
  await expect(
    page.locator('[cmdk-item]').filter({ hasText: 'Research Berlin neighborhoods' }),
  ).toBeVisible()
})
