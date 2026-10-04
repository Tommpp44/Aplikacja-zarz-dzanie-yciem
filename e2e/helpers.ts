import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'e2e-password-123'

/** Every run uses a brand-new account, so tests never touch existing data. */
export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
}

export async function signUp(page: Page, email: string, name = 'E2E Tester') {
  await page.goto('/signup')
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/onboarding/)
}

export async function finishOnboarding(page: Page) {
  await page.getByRole('button', { name: 'Finances' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Go to dashboard' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

export async function signIn(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/** Waits for a toast message (confirmation after a successful action). */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: text }).first()).toBeVisible()
}
