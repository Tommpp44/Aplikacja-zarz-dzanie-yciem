import { expect, test } from '@playwright/test'
import { finishOnboarding, signUp, uniqueEmail } from './helpers'

test('switching the interface language to Polish and back', async ({ page }) => {
  await signUp(page, uniqueEmail('lang'))
  await finishOnboarding(page)

  await page.goto('/settings/appearance')
  await page.getByRole('radio', { name: 'Polski' }).click()
  await expect(page.getByRole('link', { name: 'Zadania' }).first()).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl')

  // The preference sticks across navigation and dates follow the language.
  await page.goto('/dashboard')
  await expect(page.getByText('Jak Ci dziś idzie?')).toBeVisible()

  await page.goto('/settings/appearance')
  await page.getByRole('radio', { name: 'English' }).click()
  await expect(page.getByRole('link', { name: 'Tasks' }).first()).toBeVisible()
})

test('sign-in page follows the browser language and can be switched', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'pl-PL' })
  const page = await context.newPage()
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Witaj ponownie' })).toBeVisible()
  await page.getByRole('radio', { name: 'English' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await context.close()
})
