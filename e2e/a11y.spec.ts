import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { finishOnboarding, signUp, uniqueEmail } from './helpers'

const PAGES = [
  '/dashboard',
  '/today',
  '/tasks',
  '/projects',
  '/goals',
  '/habits',
  '/routines',
  '/finances',
  '/finances/transactions',
  '/calendar',
  '/workouts',
  '/workouts/exercises',
  '/activity',
  '/notes',
  '/journal',
  '/shopping',
  '/reviews',
  '/analytics',
  '/settings/profile',
  '/settings/notifications',
  '/settings/integrations',
  '/settings/appearance',
]

async function audit(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }))
}

test('auth pages have no WCAG A/AA violations', async ({ page }) => {
  for (const path of ['/', '/login', '/signup']) {
    await page.goto(path)
    expect.soft(await audit(page), path).toEqual([])
  }
})

test('app pages have no WCAG A/AA violations', async ({ page }) => {
  test.setTimeout(180_000)
  await signUp(page, uniqueEmail('a11y'))
  await finishOnboarding(page)
  for (const path of PAGES) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect.soft(await audit(page), path).toEqual([])
  }
})

test('dark mode keeps sufficient contrast', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ colorScheme: 'dark' })
  await signUp(page, uniqueEmail('a11y-dark'))
  await finishOnboarding(page)
  for (const path of ['/dashboard', '/tasks', '/habits', '/finances', '/calendar', '/goals']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect.soft(await audit(page), `${path} (dark)`).toEqual([])
  }
})
