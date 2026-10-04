export default async (page) => {
  await page.getByRole('button', { name: 'New project' }).click()
  await page.fill('#project-name', 'Move to Berlin')
  await page.click('[role=dialog] button:has-text("Create project")')
  await page.waitForURL(/\/projects\/[0-9a-f-]+$/, { timeout: 30000 })
  await page.fill('input[aria-label="Quick add task"]', 'Find apartment p1')
  await page.keyboard.press('Enter')
  await page.waitForSelector('text=Find apartment', { timeout: 20000 })
}
