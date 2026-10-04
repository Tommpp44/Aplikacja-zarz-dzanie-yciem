import { expect, test } from '@playwright/test'
import { finishOnboarding, PASSWORD, signIn, signUp, uniqueEmail } from './helpers'

test.describe('authentication', () => {
  test('protected pages redirect anonymous visitors to login', async ({ page }) => {
    await page.goto('/finances')
    await expect(page).toHaveURL(/\/login\?next=%2Ffinances/)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('rejects a wrong password with a human message', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.locator('input').and(page.getByLabel('Password')).fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Incorrect email or password.' }),
    ).toBeVisible()
  })

  test('validates the signup form on the client', async ({ page }) => {
    await page.goto('/signup')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Enter your name')).toBeVisible()
    await expect(page.getByText('Use at least 8 characters')).toBeVisible()
  })

  test('signup → onboarding → logout → login', async ({ page }) => {
    const email = uniqueEmail('auth')
    await signUp(page, email)
    await finishOnboarding(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('E2E Tester')

    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)

    await signIn(page, email)
    void PASSWORD
  })
})
