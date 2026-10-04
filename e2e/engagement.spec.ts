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
