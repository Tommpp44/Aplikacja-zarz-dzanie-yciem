import { expect, test } from '@playwright/test'
import { expectToast, finishOnboarding, signUp, uniqueEmail } from './helpers'

/**
 * The minimum end-to-end journey from the product spec:
 * signup, create & complete task, create goal, create & log habit,
 * create account, create expense, check dashboard, logout.
 */
test.describe.configure({ mode: 'serial' })

test('core LifeOS journey', async ({ page }) => {
  test.setTimeout(180_000)
  await signUp(page, uniqueEmail('core'), 'Core Tester')
  await finishOnboarding(page)

  // --- Tasks -----------------------------------------------------------
  await page.goto('/tasks?view=today')
  const quickAdd = page.getByLabel('Quick add task')
  await quickAdd.fill('Prepare report today at 13:00 p1')
  await expect(page.getByText('Today 13:00')).toBeVisible()
  await quickAdd.press('Enter')
  await expect(page.getByRole('button', { name: /Prepare report/ })).toBeVisible()

  await page.getByRole('checkbox', { name: 'Complete "Prepare report"' }).click()
  await expectToast(page, 'Task completed')
  await page.goto('/tasks?view=completed')
  await expect(page.getByText('Prepare report')).toBeVisible()

  // --- Goal ------------------------------------------------------------
  await page.goto('/goals')
  await page.getByRole('button', { name: 'New goal' }).click()
  await page.getByLabel('Goal', { exact: true }).fill('Read 24 books')
  await page.getByLabel('Category').selectOption('learning')
  await page.getByLabel('Target', { exact: true }).fill('24')
  await page.getByLabel('Unit (optional)').fill('books')
  await page.getByLabel('Current value').fill('6')
  await page.getByRole('dialog').getByRole('button', { name: 'Create goal' }).click()
  await expect(page).toHaveURL(/\/goals\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { name: 'Read 24 books' })).toBeVisible()
  await expect(page.getByText('25.0%')).toBeVisible()

  // --- Habit -------------------------------------------------------------
  await page.goto('/habits')
  await page.getByRole('button', { name: 'New habit' }).first().click()
  await page.getByLabel('Habit', { exact: true }).fill('Meditate')
  await page.getByRole('dialog').getByRole('button', { name: 'Create habit' }).click()
  await expectToast(page, 'Habit created')
  const saved = page.waitForResponse((r) => r.request().method() === 'POST' && r.ok())
  await page.getByRole('button', { name: 'Mark Meditate as done' }).click()
  await expect(page.getByRole('button', { name: 'Undo Meditate' })).toBeVisible()
  await saved
  await page.reload()
  await expect(page.getByText('1 / 1')).toBeVisible()

  // --- Finances: account + expense --------------------------------------------
  await page.goto('/finances/accounts?new=1')
  await page.getByLabel('Name').fill('Main Bank Account')
  await page.getByLabel('Current balance').fill('1000')
  await page.getByRole('dialog').getByRole('button', { name: 'Create account' }).click()
  await expectToast(page, 'Account created')
  await expect(page.getByText('1000,00 zł').first()).toBeVisible()

  await page.goto('/finances')
  await page.getByRole('button', { name: 'Add transaction' }).click()
  await page.getByLabel(/^Amount/).fill('54,50')
  await page.getByRole('button', { name: 'Food' }).click()
  await page.getByLabel('Merchant (optional)').fill('Lidl')
  await page.getByRole('dialog').getByRole('button', { name: 'Save expense' }).click()
  await expectToast(page, 'Transaction saved')
  await expect(page.getByText('945,50 zł').first()).toBeVisible()

  // --- Dashboard reflects every module ----------------------------------------
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Core Tester')
  await expect(page.getByText('1 / 1')).toBeVisible()
  await expect(page.getByText('Read 24 books').first()).toBeVisible()
  await expect(page.getByText('945,50 zł').first()).toBeVisible()

  // --- Logout ---------------------------------------------------------------
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
})
