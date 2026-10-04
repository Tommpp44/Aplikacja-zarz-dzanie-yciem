import { expect, test } from '@playwright/test'
import { finishOnboarding, signUp, uniqueEmail } from './helpers'
test('mail', async ({ page, request }) => {
  const email = uniqueEmail('mail')
  await signUp(page, email)
  await finishOnboarding(page)
  await page.goto('/settings/notifications')
  await page.getByRole('switch', { name: /Weekly e-mail summary/ }).click().catch(async () => {
    await page.locator('label', { hasText: 'Weekly e-mail summary' }).getByRole('switch').click()
  })
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Send a test e-mail' }).click()
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: 'Sent' })).toBeVisible()
  const secret = process.env.CRON_SECRET
  const r = await request.get('/api/cron/daily', { headers: { authorization: `Bearer ${secret}` } })
  console.log('cron', r.status(), await r.text())
  await page.waitForTimeout(1500)
  const list = await (await request.get(`http://127.0.0.1:54324/api/v1/search?query=to:${encodeURIComponent(email)}`)).json()
  console.log('messages', list.messages.map((m: { Subject: string }) => m.Subject))
})
