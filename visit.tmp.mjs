// usage: node visit.mjs <path> [shot] ; logs in as dev@lifeos.test, runs optional steps file
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const [, , path = '/dashboard', shot = '/tmp/shot.png', steps] = process.argv
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message))
const base = process.env.BASE || 'http://localhost:3000'
await page.goto(base + '/login')
await page.fill('#email', 'dev@lifeos.test')
await page.fill('#password', 'password123')
await page.click('button[type=submit]')
await page.waitForURL('**/dashboard', { timeout: 60000 })
await page.goto(base + path, { waitUntil: 'networkidle', timeout: 90000 })
if (steps) { const fn = (await import(steps)).default; await fn(page) }
await page.waitForTimeout(500)
await page.screenshot({ path: shot, fullPage: true })
console.log('TITLE', await page.title())
console.log('ERRORS', JSON.stringify(errors.slice(0, 10)))
await browser.close()
