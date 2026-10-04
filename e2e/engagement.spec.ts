import { expect, test } from '@playwright/test'
import { finishOnboarding, signUp, uniqueEmail } from './helpers'

test('new users get a setup checklist, keyboard shortcuts work', async ({ page }) => {
  await signUp(page, uniqueEmail('engage'))
  await finishOnboarding(page)

  const checklist = page.getByRole('heading', { name: 'Get set up in a few minutes' })
  await expect(checklist).toBeVisible()
  await expect(page.getByRole('link', { name: /Capture your first task/ })).toBeVisible()

  // "?" opens the shortcuts help; "g h" navigates to habits.
  await page.locator('body').press('?')
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.keyboard.press('g')
  await page.keyboard.press('h')
  await expect(page).toHaveURL(/\/habits/)

  // Hiding the checklist persists.
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Hide checklist' }).click()
  await expect(checklist).toHaveCount(0)
  await page.reload()
  await expect(page.getByText("Today's focus")).toBeVisible()
  await expect(checklist).toHaveCount(0)
})

test('the onboarding starter kit fills an empty account', async ({ page }) => {
  await signUp(page, uniqueEmail('starter'))
  await page.getByRole('button', { name: 'Everything' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  for (const pack of [
    'Three tiny habits',
    'A morning routine',
    'A first goal',
    'A weekly planning ritual',
  ])
    await expect(page.getByRole('checkbox', { name: new RegExp(pack) })).toBeChecked()
  await page.getByRole('button', { name: 'Go to dashboard' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/habits')
  await expect(page.getByText('Drink a glass of water').first()).toBeVisible()
  await expect(page.getByText('Read 10 minutes').first()).toBeVisible()
  await page.goto('/routines')
  await expect(page.getByText('Morning routine')).toBeVisible()
  await page.goto('/goals')
  await expect(page.getByText('Read 12 books this year')).toBeVisible()
  await page.goto('/tasks?view=today')
  await expect(page.getByText('Plan your week')).toBeVisible()
})
