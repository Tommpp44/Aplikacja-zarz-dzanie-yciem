/**
 * Development seed: creates a demo user with realistic data across all modules.
 *
 *   npm run db:seed            (local Supabase only)
 *   npm run db:seed -- --lang pl  (demo account and data in Polish)
 *   npm run db:seed -- --force (allow a non-local URL — never use on production)
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Re-running deletes and recreates the demo user, so it is idempotent.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const DEMO_EMAIL = 'demo@lifeos.app'
const DEMO_PASSWORD = 'lifeos-demo-2026'
const TIMEZONE = 'Europe/Warsaw'
/** `npm run db:seed -- --lang pl` creates the demo account in Polish. */
const LANG: 'en' | 'pl' =
  process.argv.includes('--lang=pl') || process.argv[process.argv.indexOf('--lang') + 1] === 'pl'
    ? 'pl'
    : 'en'
// Loaded dynamically: tsc rejects `.mts` import paths, Node's type stripping requires them.
const { PL }: { PL: Record<string, string> } = await import(
  new URL('./seed-pl.mts', import.meta.url).href
)
const L = (text: string) => (LANG === 'pl' ? (PL[text] ?? text) : text)

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!.trim()
    }
  }
}
loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key)
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
if (!/127\.0\.0\.1|localhost/.test(url) && !process.argv.includes('--force')) {
  throw new Error(
    `Refusing to seed a non-local database (${url}). Seed data is for development only.`,
  )
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

// ---------------------------------------------------------------------------
// Date helpers (local calendar dates in the demo timezone)
// ---------------------------------------------------------------------------
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())
const pad = (n: number) => String(n).padStart(2, '0')
function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y!, m! - 1, d! + days))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}
function weekday(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
}
/** Local time in Warsaw -> ISO instant (CET/CEST handled via Intl offset). */
function instant(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00Z`)
  const offset = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, timeZoneName: 'shortOffset' })
      .formatToParts(guess)
      .find((p) => p.type === 'timeZoneName')!
      .value.replace('GMT', '') || 0,
  )
  return new Date(guess.getTime() - offset * 3600_000).toISOString()
}
let seed = 42
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

async function must<T>(
  p: PromiseLike<{ data: T; error: { message: string } | null }>,
  what: string,
): Promise<NonNullable<T>> {
  const { data, error } = await p
  if (error) throw new Error(`${what}: ${error.message}`)
  return data as NonNullable<T>
}

async function main() {
  // Recreate the demo user (cascade removes all previous demo data).
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users.find((u) => u.email === DEMO_EMAIL)
  if (existing) await db.auth.admin.deleteUser(existing.id)
  const { data: created, error } = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: LANG === 'pl' ? 'Ola' : 'Alex',
      timezone: TIMEZONE,
      language: LANG,
    },
  })
  if (error || !created.user) throw new Error(`create user: ${error?.message}`)
  const uid = created.user.id
  const own = <T extends object>(rows: T[]) => rows.map((r) => ({ ...r, user_id: uid }))

  await must(
    db.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', uid),
    'profile',
  )
  await must(
    db
      .from('user_preferences')
      .update({ interests: ['everything'], currency: 'PLN', timezone: TIMEZONE })
      .eq('user_id', uid),
    'prefs',
  )

  const cats = await must(
    db.from('transaction_categories').select('id, name, kind').eq('user_id', uid),
    'categories',
  )
  const cat = (name: string) => cats.find((c) => c.name === L(name))!.id

  // --- Accounts (5) ---------------------------------------------------------
  const accounts = await must(
    db
      .from('accounts')
      .insert(
        own([
          {
            name: L('Main Bank Account'),
            account_type: 'checking',
            currency: 'PLN',
            opening_balance_minor: 845_000,
            institution: 'mBank',
            color: 'blue',
            position: 0,
          },
          {
            name: L('Savings'),
            account_type: 'savings',
            currency: 'PLN',
            opening_balance_minor: 1_650_000,
            institution: 'mBank',
            color: 'emerald',
            position: 1,
          },
          {
            name: L('Cash'),
            account_type: 'cash',
            currency: 'PLN',
            opening_balance_minor: 42_000,
            color: 'amber',
            position: 2,
          },
          {
            name: L('Credit Card'),
            account_type: 'credit_card',
            currency: 'PLN',
            opening_balance_minor: -120_000,
            institution: 'Revolut',
            color: 'rose',
            position: 3,
          },
          {
            name: L('ETF Portfolio'),
            account_type: 'investment',
            currency: 'PLN',
            opening_balance_minor: 3_210_000,
            institution: 'XTB',
            color: 'violet',
            position: 4,
          },
        ]),
        { defaultToNull: false },
      )
      .select('id, name'),
    'accounts',
  )
  const acc = (name: string) => accounts.find((a) => a.name === L(name))!.id

  // --- Recurring transactions ----------------------------------------------------
  const nextMonthly = (day: number) => {
    const thisMonth = `${today.slice(0, 7)}-${pad(day)}`
    return thisMonth > today
      ? thisMonth
      : addDays(`${today.slice(0, 7)}-01`, 31).slice(0, 8) + pad(day)
  }
  const recurring = await must(
    db
      .from('recurring_transactions')
      .insert(
        own([
          {
            account_id: acc('Main Bank Account'),
            txn_type: 'income',
            amount_minor: 1_045_000,
            category_id: cat('Salary'),
            merchant: L('ACME Sp. z o.o.'),
            repeat_rule: { freq: 'monthly', interval: 1, monthDay: 10 },
            next_date: nextMonthly(10),
          },
          {
            account_id: acc('Main Bank Account'),
            txn_type: 'expense',
            amount_minor: 280_000,
            category_id: cat('Housing'),
            merchant: L('Rent'),
            repeat_rule: { freq: 'monthly', interval: 1, monthDay: 1 },
            next_date: nextMonthly(1),
          },
          {
            account_id: acc('Main Bank Account'),
            txn_type: 'expense',
            amount_minor: 6_900,
            category_id: cat('Utilities'),
            merchant: L('Orange Internet'),
            repeat_rule: { freq: 'monthly', interval: 1, monthDay: 15 },
            next_date: nextMonthly(15),
          },
          {
            account_id: acc('Credit Card'),
            txn_type: 'expense',
            amount_minor: 4_900,
            category_id: cat('Subscriptions'),
            merchant: L('Netflix'),
            repeat_rule: { freq: 'monthly', interval: 1, monthDay: 20 },
            next_date: nextMonthly(20),
          },
          {
            account_id: acc('Main Bank Account'),
            txn_type: 'transfer',
            amount_minor: 150_000,
            transfer_account_id: acc('Savings'),
            merchant: L('Monthly savings'),
            repeat_rule: { freq: 'monthly', interval: 1, monthDay: 11 },
            next_date: nextMonthly(11),
          },
        ]),
        { defaultToNull: false },
      )
      .select('id, merchant'),
    'recurring',
  )
  const rec = (m: string) => recurring.find((r) => r.merchant === L(m))!.id

  // --- Transactions (~90 over 3 months) ---------------------------------------------
  const txns: Record<string, unknown>[] = []
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const [cy, cm] = today.split('-').map(Number)
    const monthDate = new Date(Date.UTC(cy!, cm! - 1 - monthOffset, 1))
    const base = `${monthDate.getUTCFullYear()}-${pad(monthDate.getUTCMonth() + 1)}-`
    const day = (d: number) => `${base}${pad(d)}`
    const push = (t: Record<string, unknown>) => {
      if ((t.occurred_on as string) <= today) txns.push(t)
    }
    push({
      account_id: acc('Main Bank Account'),
      txn_type: 'income',
      amount_minor: 1_045_000,
      category_id: cat('Salary'),
      merchant: L('ACME Sp. z o.o.'),
      occurred_on: day(10),
      recurring_id: rec('ACME Sp. z o.o.'),
      source: 'recurring',
    })
    push({
      account_id: acc('Main Bank Account'),
      txn_type: 'expense',
      amount_minor: 280_000,
      category_id: cat('Housing'),
      merchant: L('Rent'),
      occurred_on: day(1),
      recurring_id: rec('Rent'),
      source: 'recurring',
    })
    push({
      account_id: acc('Main Bank Account'),
      txn_type: 'expense',
      amount_minor: 6_900,
      category_id: cat('Utilities'),
      merchant: L('Orange Internet'),
      occurred_on: day(15),
      recurring_id: rec('Orange Internet'),
      source: 'recurring',
    })
    push({
      account_id: acc('Credit Card'),
      txn_type: 'expense',
      amount_minor: 4_900,
      category_id: cat('Subscriptions'),
      merchant: L('Netflix'),
      occurred_on: day(20),
      recurring_id: rec('Netflix'),
      source: 'recurring',
    })
    push({
      account_id: acc('Main Bank Account'),
      txn_type: 'transfer',
      amount_minor: 150_000,
      transfer_account_id: acc('Savings'),
      merchant: L('Monthly savings'),
      occurred_on: day(11),
      recurring_id: rec('Monthly savings'),
      source: 'recurring',
    })
    if (monthOffset === 1)
      push({
        account_id: acc('Main Bank Account'),
        txn_type: 'income',
        amount_minor: 180_000,
        category_id: cat('Freelance'),
        merchant: L('Design project'),
        occurred_on: day(22),
      })
    const merchants: [string, string, number, number][] = [
      ['Lidl', 'Food', 4_000, 16_000],
      ['Biedronka', 'Food', 2_500, 12_000],
      ['Żabka', 'Food', 1_200, 4_500],
      ['Uber', 'Transport', 1_800, 5_500],
      ['Orlen', 'Transport', 18_000, 32_000],
      ['Cinema City', 'Entertainment', 3_500, 9_000],
      ['Apteka', 'Health', 2_000, 9_000],
      ['Zalando', 'Shopping', 9_000, 35_000],
      ['Restauracja Ogień', 'Food', 8_000, 22_000],
    ]
    for (let i = 0; i < 9; i++) {
      const [merchant, category, min, max] = merchants[Math.floor(rand() * merchants.length)]!
      push({
        account_id: rand() > 0.3 ? acc('Main Bank Account') : acc('Credit Card'),
        txn_type: 'expense',
        amount_minor: Math.round(min + rand() * (max - min)),
        category_id: cat(category),
        merchant,
        occurred_on: day(1 + Math.floor(rand() * 27)),
      })
    }
  }
  // A few recent ones so "this week" has data.
  for (const [d, m, c, a] of [
    [0, 'Lidl', 'Food', 5_400],
    [-1, 'Uber', 'Transport', 2_350],
    [-2, 'Żabka', 'Food', 1_890],
    [-3, 'Restauracja Ogień', 'Food', 12_400],
  ] as const) {
    txns.push({
      account_id: acc('Main Bank Account'),
      txn_type: 'expense',
      amount_minor: a,
      category_id: cat(c),
      merchant: m,
      occurred_on: addDays(today, d),
    })
  }
  txns.push({
    account_id: acc('Cash'),
    txn_type: 'expense',
    amount_minor: 1_500,
    category_id: cat('Food'),
    merchant: L('Bakery'),
    occurred_on: addDays(today, -4),
  })
  txns.push({
    account_id: acc('ETF Portfolio'),
    txn_type: 'adjustment',
    amount_minor: 85_000,
    description: L('Market value update'),
    occurred_on: addDays(today, -6),
  })
  await must(db.from('transactions').insert(own(txns), { defaultToNull: false }), 'transactions')

  // --- Budgets ------------------------------------------------------------------
  for (const [name, amount, categories] of [
    ['Food', 180_000, ['Food']],
    ['Transport', 60_000, ['Transport']],
    ['Fun & shopping', 80_000, ['Entertainment', 'Shopping']],
  ] as const) {
    const [budget] = await must(
      db
        .from('budgets')
        .insert(own([{ name: L(name), amount_minor: amount, currency: 'PLN' }]), {
          defaultToNull: false,
        })
        .select('id'),
      'budget',
    )
    await must(
      db
        .from('budget_categories')
        .insert(own(categories.map((c) => ({ budget_id: budget!.id, category_id: cat(c) }))), {
          defaultToNull: false,
        }),
      'budget categories',
    )
  }

  // --- Goals (5) -------------------------------------------------------------------
  const yearEnd = `${today.slice(0, 4)}-12-31`
  const goals = await must(
    db
      .from('goals')
      .insert(
        own([
          {
            title: L('Build emergency fund'),
            category: 'finance',
            target_type: 'numeric',
            progress_source: 'account',
            linked_account_id: acc('Savings'),
            target_value: 30000,
            unit: 'PLN',
            start_date: addDays(today, -90),
            deadline: yearEnd,
          },
          {
            title: L('Run a half marathon'),
            category: 'fitness',
            target_type: 'numeric',
            progress_source: 'milestones',
            start_date: addDays(today, -40),
            deadline: addDays(today, 60),
          },
          {
            title: L('Read 24 books'),
            category: 'learning',
            target_type: 'numeric',
            progress_source: 'manual',
            start_value: 0,
            target_value: 24,
            current_value: 15,
            unit: L('books'),
            start_date: `${today.slice(0, 4)}-01-01`,
            deadline: yearEnd,
          },
          {
            title: L('Move to Berlin'),
            category: 'lifestyle',
            target_type: 'numeric',
            progress_source: 'tasks',
            start_date: addDays(today, -20),
            deadline: addDays(today, 120),
          },
          {
            title: L('Get AWS certification'),
            category: 'career',
            target_type: 'percentage',
            progress_source: 'manual',
            target_value: 100,
            current_value: 35,
            start_date: addDays(today, -30),
            deadline: addDays(today, 75),
          },
        ]),
        { defaultToNull: false },
      )
      .select('id, title'),
    'goals',
  )
  const goal = (t: string) => goals.find((g) => g.title === L(t))!.id
  await must(
    db.from('goal_milestones').insert(
      own([
        {
          goal_id: goal('Run a half marathon'),
          title: L('Run 5 km without stopping'),
          completed_at: addDays(today, -30) + 'T18:00:00Z',
          position: 0,
        },
        {
          goal_id: goal('Run a half marathon'),
          title: L('Run 10 km'),
          completed_at: addDays(today, -10) + 'T18:00:00Z',
          position: 1,
        },
        {
          goal_id: goal('Run a half marathon'),
          title: L('Run 15 km'),
          due_date: addDays(today, 20),
          position: 2,
        },
        {
          goal_id: goal('Run a half marathon'),
          title: L('Race day — 21.1 km'),
          due_date: addDays(today, 60),
          position: 3,
        },
      ]),
      { defaultToNull: false },
    ),
    'milestones',
  )
  await must(
    db.from('goal_progress_logs').insert(
      own(
        [10, 12, 13].map((v, i) => ({
          goal_id: goal('Read 24 books'),
          value: v,
          logged_at: addDays(today, -60 + i * 20) + 'T12:00:00Z',
        })),
      ),
      { defaultToNull: false },
    ),
    'progress logs',
  )

  // --- Projects (3) & tasks (20) -------------------------------------------------------
  const projects = await must(
    db
      .from('projects')
      .insert(
        own([
          {
            name: L('Move to Berlin'),
            description: L('Find a flat, sort out paperwork and move by spring.'),
            status: 'active',
            priority: 1,
            deadline: addDays(today, 120),
            color: 'violet',
            goal_id: goal('Move to Berlin'),
          },
          {
            name: L('Website redesign'),
            description: L('New portfolio site with case studies.'),
            status: 'active',
            priority: 2,
            deadline: addDays(today, 30),
            color: 'blue',
          },
          { name: L('Home office setup'), status: 'planning', priority: 3, color: 'amber' },
        ]),
        { defaultToNull: false },
      )
      .select('id, name'),
    'projects',
  )
  const proj = (n: string) => projects.find((p) => p.name === L(n))!.id
  const tasks = [
    {
      title: L('Find apartment'),
      project_id: proj('Move to Berlin'),
      goal_id: goal('Move to Berlin'),
      priority: 1,
      due_date: addDays(today, 3),
    },
    {
      title: L('Compare neighborhoods'),
      project_id: proj('Move to Berlin'),
      goal_id: goal('Move to Berlin'),
      priority: 2,
      due_date: today,
      due_time: '19:00',
    },
    {
      title: L('Prepare documents'),
      project_id: proj('Move to Berlin'),
      goal_id: goal('Move to Berlin'),
      priority: 2,
      due_date: addDays(today, 7),
    },
    {
      title: L('Book transport'),
      project_id: proj('Move to Berlin'),
      goal_id: goal('Move to Berlin'),
      priority: 3,
    },
    {
      title: L('Cancel current rental'),
      project_id: proj('Move to Berlin'),
      goal_id: goal('Move to Berlin'),
      priority: 3,
      due_date: addDays(today, 30),
    },
    {
      title: L('Research Berlin neighborhoods'),
      project_id: proj('Move to Berlin'),
      goal_id: goal('Move to Berlin'),
      status: 'completed',
      completed_at: addDays(today, -5) + 'T10:00:00Z',
    },
    {
      title: L('Write case study: banking app'),
      project_id: proj('Website redesign'),
      priority: 2,
      due_date: addDays(today, 2),
    },
    {
      title: L('Prepare report'),
      priority: 1,
      due_date: today,
      due_time: '13:00',
      duration_minutes: 90,
    },
    {
      title: L('Finish project presentation'),
      priority: 1,
      due_date: today,
      due_time: '16:00',
      duration_minutes: 60,
    },
    { title: L('Buy groceries'), priority: 3, due_date: today, due_time: '18:00' },
    { title: L('Call the dentist'), priority: 2, due_date: addDays(today, -1) },
    { title: L('Pay electricity bill'), priority: 2, due_date: addDays(today, 1) },
    {
      title: L('Water the plants'),
      priority: 4,
      due_date: today,
      repeat_rule: { freq: 'daily', interval: 3 },
    },
    {
      title: L('Weekly planning'),
      priority: 2,
      due_date: addDays(today, (7 - weekday(today)) % 7),
      repeat_rule: { freq: 'weekly', interval: 1, weekdays: [0] },
    },
    {
      title: L('Study for AWS exam — module 4'),
      goal_id: goal('Get AWS certification'),
      priority: 2,
      due_date: addDays(today, 2),
      duration_minutes: 120,
    },
    { title: L('Pick a standing desk'), project_id: proj('Home office setup'), priority: 4 },
    { title: L('Learn Spanish basics'), is_someday: true },
    { title: L('Plan a trip to Lisbon'), is_someday: true },
    {
      title: L('Read “Atomic Habits”'),
      goal_id: goal('Read 24 books'),
      status: 'completed',
      completed_at: addDays(today, -2) + 'T21:00:00Z',
    },
    { title: L('Renew passport'), priority: 2 },
  ]
  await must(db.from('tasks').insert(own(tasks), { defaultToNull: false }), 'tasks')

  // --- Habits (8) with history ---------------------------------------------------------
  const habits = await must(
    db
      .from('habits')
      .insert(
        own([
          {
            name: L('Read 20 minutes'),
            habit_type: 'boolean',
            target: 1,
            frequency: 'daily',
            color: 'violet',
            goal_id: goal('Read 24 books'),
            position: 0,
          },
          {
            name: L('Drink water'),
            habit_type: 'numeric',
            target: 2,
            unit: 'L',
            frequency: 'daily',
            color: 'cyan',
            position: 1,
          },
          {
            name: L('Meditate'),
            habit_type: 'duration',
            target: 10,
            unit: L('min'),
            frequency: 'daily',
            color: 'emerald',
            reminder_time: '07:30',
            position: 2,
          },
          {
            name: L('10k steps'),
            habit_type: 'boolean',
            target: 1,
            frequency: 'daily',
            color: 'orange',
            position: 3,
          },
          {
            name: L('Push-ups'),
            habit_type: 'count',
            target: 50,
            unit: L('reps'),
            frequency: 'weekdays',
            weekdays: [1, 3, 5],
            color: 'rose',
            position: 4,
          },
          {
            name: L('Gym'),
            habit_type: 'boolean',
            target: 1,
            frequency: 'times_per_week',
            times_per_week: 3,
            color: 'indigo',
            goal_id: goal('Run a half marathon'),
            position: 5,
          },
          {
            name: L('No sugar'),
            habit_type: 'boolean',
            target: 1,
            frequency: 'daily',
            color: 'amber',
            position: 6,
          },
          {
            name: L('Journal'),
            habit_type: 'boolean',
            target: 1,
            frequency: 'daily',
            color: 'slate',
            position: 7,
          },
        ]).map((h) => ({ ...h, start_date: addDays(today, -60) })),
        { defaultToNull: false },
      )
      .select('id, name, target'),
    'habits',
  )
  const logs: Record<string, unknown>[] = []
  const reliability: Record<string, number> = {
    'Read 20 minutes': 0.85,
    'Drink water': 0.7,
    Meditate: 0.6,
    '10k steps': 0.65,
    'Push-ups': 0.75,
    Gym: 0.45,
    'No sugar': 0.5,
    Journal: 0.55,
  }
  const reliabilityOf = (name: string) =>
    Object.entries(reliability).find(([k]) => L(k) === name)?.[1] ?? 0.5
  for (const h of habits) {
    for (let i = 60; i >= 1; i--) {
      const date = addDays(today, -i)
      if (h.name === L('Push-ups') && ![1, 3, 5].includes(weekday(date))) continue
      if (rand() < reliabilityOf(h.name))
        logs.push({ habit_id: h.id, log_date: date, value: Number(h.target) })
    }
  }
  const hab = (n: string) => habits.find((h) => h.name === L(n))!
  logs.push(
    { habit_id: hab('Read 20 minutes').id, log_date: today, value: 1 },
    { habit_id: hab('Drink water').id, log_date: today, value: 1.25 },
  )
  await must(db.from('habit_logs').insert(own(logs), { defaultToNull: false }), 'habit logs')

  // --- Routines --------------------------------------------------------------------
  const [morning] = await must(
    db
      .from('routines')
      .insert(
        own([
          { name: L('Morning routine'), routine_type: 'morning', start_time: '07:00', position: 0 },
        ]),
        { defaultToNull: false },
      )
      .select('id'),
    'routine',
  )
  await must(
    db.from('routine_items').insert(
      own([
        {
          routine_id: morning!.id,
          title: L('Wake up, no phone'),
          duration_minutes: 2,
          position: 0,
        },
        {
          routine_id: morning!.id,
          title: L('Drink a glass of water'),
          duration_minutes: 1,
          position: 1,
        },
        {
          routine_id: morning!.id,
          title: L('Meditate'),
          duration_minutes: 10,
          position: 2,
          habit_id: hab('Meditate').id,
        },
        { routine_id: morning!.id, title: L('Stretch'), duration_minutes: 10, position: 3 },
        { routine_id: morning!.id, title: L('Plan the day'), duration_minutes: 5, position: 4 },
      ]),
      { defaultToNull: false },
    ),
    'routine items',
  )
  const [evening] = await must(
    db
      .from('routines')
      .insert(
        own([
          {
            name: L('Evening shutdown'),
            routine_type: 'evening',
            start_time: '21:30',
            position: 1,
          },
        ]),
        { defaultToNull: false },
      )
      .select('id'),
    'routine',
  )
  await must(
    db.from('routine_items').insert(
      own([
        { routine_id: evening!.id, title: L('Review tomorrow'), duration_minutes: 5, position: 0 },
        {
          routine_id: evening!.id,
          title: L('Journal'),
          duration_minutes: 10,
          position: 1,
          habit_id: hab('Journal').id,
        },
        {
          routine_id: evening!.id,
          title: L('Read'),
          duration_minutes: 20,
          position: 2,
          habit_id: hab('Read 20 minutes').id,
        },
      ]),
      { defaultToNull: false },
    ),
    'routine items',
  )

  // --- Calendar (10 events) ----------------------------------------------------------
  const events = [
    {
      title: L('Team standup'),
      starts_at: instant(addDays(today, -7), '09:30'),
      ends_at: instant(addDays(today, -7), '09:45'),
      repeat_rule: { freq: 'weekly', interval: 1, weekdays: [1, 2, 3, 4, 5] },
      color: 'blue',
    },
    {
      title: L('Lunch with Kasia'),
      starts_at: instant(today, '12:30'),
      ends_at: instant(today, '13:30'),
      location: L('Bistro Mąka'),
      color: 'emerald',
    },
    {
      title: L('Dentist'),
      starts_at: instant(addDays(today, 2), '08:00'),
      ends_at: instant(addDays(today, 2), '08:45'),
      color: 'rose',
    },
    {
      title: L('Apartment viewing — Kreuzberg'),
      starts_at: instant(addDays(today, 5), '17:00'),
      ends_at: instant(addDays(today, 5), '18:00'),
      color: 'violet',
      project_id: proj('Move to Berlin'),
    },
    {
      title: L('Mom’s birthday'),
      starts_at: instant(addDays(today, 9), '00:00'),
      ends_at: instant(addDays(today, 10), '00:00'),
      all_day: true,
      repeat_rule: { freq: 'yearly', interval: 1 },
      color: 'pink',
    },
    {
      title: L('Client call'),
      starts_at: instant(addDays(today, 1), '15:00'),
      ends_at: instant(addDays(today, 1), '15:30'),
      color: 'blue',
    },
    {
      title: L('Padel with friends'),
      starts_at: instant(addDays(today, 3), '19:00'),
      ends_at: instant(addDays(today, 3), '20:30'),
      color: 'orange',
    },
    {
      title: L('Weekend in Kraków'),
      starts_at: instant(addDays(today, 12), '00:00'),
      ends_at: instant(addDays(today, 14), '00:00'),
      all_day: true,
      color: 'cyan',
    },
    {
      title: L('Portfolio review'),
      starts_at: instant(addDays(today, -2), '11:00'),
      ends_at: instant(addDays(today, -2), '12:00'),
      color: 'indigo',
    },
    {
      title: L('Car service'),
      starts_at: instant(addDays(today, 6), '08:30'),
      ends_at: instant(addDays(today, 6), '10:00'),
      location: L('ASO Toyota'),
      color: 'slate',
    },
  ]
  await must(db.from('calendar_events').insert(own(events), { defaultToNull: false }), 'events')

  // --- Workouts (5+) -----------------------------------------------------------------
  const exercises = await must(
    db.from('exercises').select('id, name').is('user_id', null),
    'exercises',
  )
  const ex = (n: string) => exercises.find((e) => e.name === n)!.id
  const [upper] = await must(
    db
      .from('workout_templates')
      .insert(own([{ name: L('Upper body A'), workout_type: 'strength' }]), {
        defaultToNull: false,
      })
      .select('id'),
    'template',
  )
  await must(
    db.from('workout_template_exercises').insert(
      own([
        {
          template_id: upper!.id,
          exercise_id: ex('Bench Press'),
          position: 0,
          target_sets: 3,
          target_reps: 10,
          target_weight_kg: 60,
        },
        {
          template_id: upper!.id,
          exercise_id: ex('Barbell Row'),
          position: 1,
          target_sets: 3,
          target_reps: 10,
          target_weight_kg: 50,
        },
        {
          template_id: upper!.id,
          exercise_id: ex('Overhead Press'),
          position: 2,
          target_sets: 3,
          target_reps: 8,
          target_weight_kg: 35,
        },
      ]),
      { defaultToNull: false },
    ),
    'template exercises',
  )
  const plan = await must(
    db
      .from('training_plans')
      .insert(
        own([
          {
            name: L('Half Marathon — 12 weeks'),
            start_date: addDays(today, -21),
            weeks: 12,
            goal_id: goal('Run a half marathon'),
          },
        ]),
        { defaultToNull: false },
      )
      .select('id'),
    'plan',
  )
  await must(
    db.from('training_plan_sessions').insert(
      own(
        [
          [1, 'Rest', 'rest'],
          [2, 'Intervals', 'running'],
          [3, 'Easy run', 'running'],
          [4, 'Strength', 'strength'],
          [5, 'Rest', 'rest'],
          [6, 'Long run', 'running'],
          [0, 'Mobility', 'mobility'],
        ].map(([weekday, title, workout_type]) => ({
          plan_id: plan[0]!.id,
          weekday,
          title: L(title as string),
          workout_type,
          template_id: workout_type === 'strength' ? upper!.id : null,
          target_duration_minutes: workout_type === 'rest' ? null : 45,
        })),
      ),
      { defaultToNull: false },
    ),
    'plan sessions',
  )
  const runs = [
    {
      name: L('Easy run'),
      workout_type: 'running',
      performed_on: addDays(today, -1),
      duration_minutes: 42,
      distance_m: 7200,
      calories: 520,
      avg_heart_rate: 142,
      goal_id: goal('Run a half marathon'),
    },
    {
      name: L('Long run'),
      workout_type: 'running',
      performed_on: addDays(today, -4),
      duration_minutes: 78,
      distance_m: 13100,
      calories: 980,
      avg_heart_rate: 151,
      elevation_m: 85,
      goal_id: goal('Run a half marathon'),
    },
    {
      name: L('Intervals 6×800 m'),
      workout_type: 'running',
      performed_on: addDays(today, -6),
      duration_minutes: 50,
      distance_m: 8400,
      calories: 640,
      goal_id: goal('Run a half marathon'),
    },
    {
      name: L('Padel'),
      workout_type: 'padel',
      performed_on: addDays(today, -9),
      duration_minutes: 90,
      calories: 700,
    },
  ]
  await must(db.from('workouts').insert(own(runs), { defaultToNull: false }), 'runs')
  for (const [offset, bench] of [
    [-12, [57.5, 57.5, 55]],
    [-5, [60, 60, 57.5]],
    [-2, [62.5, 60, 60]],
  ] as const) {
    const [w] = await must(
      db
        .from('workouts')
        .insert(
          own([
            {
              name: L('Upper body A'),
              workout_type: 'strength',
              performed_on: addDays(today, offset),
              duration_minutes: 55,
              template_id: upper!.id,
            },
          ]),
          { defaultToNull: false },
        )
        .select('id'),
      'strength workout',
    )
    const wes = await must(
      db
        .from('workout_exercises')
        .insert(
          own(
            [ex('Bench Press'), ex('Barbell Row'), ex('Overhead Press')].map(
              (exercise_id, position) => ({ workout_id: w!.id, exercise_id, position }),
            ),
          ),
          { defaultToNull: false },
        )
        .select('id, exercise_id'),
      'workout exercises',
    )
    const sets: Record<string, unknown>[] = []
    for (const we of wes) {
      const weights =
        we.exercise_id === ex('Bench Press')
          ? bench
          : we.exercise_id === ex('Barbell Row')
            ? [50, 50, 47.5]
            : [35, 35, 32.5]
      weights.forEach((weight_kg, i) =>
        sets.push({
          workout_exercise_id: we.id,
          set_number: i + 1,
          weight_kg,
          reps: [10, 9, 10][i],
          rpe: [7, 8, 8.5][i],
        }),
      )
    }
    await must(db.from('workout_sets').insert(own(sets), { defaultToNull: false }), 'sets')
  }

  // --- Activity -------------------------------------------------------------------------
  await must(
    db.from('activity_records').insert(
      own(
        Array.from({ length: 30 }, (_, i) => ({
          record_date: addDays(today, -i),
          steps: Math.round(5000 + rand() * 8000),
          active_minutes: Math.round(20 + rand() * 60),
          distance_m: Math.round(4000 + rand() * 6000),
          calories: Math.round(300 + rand() * 500),
        })),
      ).map((r, i) => (i === 0 ? { ...r, steps: 8423 } : r)),
      { defaultToNull: false },
    ),
    'activity',
  )

  // --- Notes, journal, shopping ---------------------------------------------------------------
  const notes = await must(
    db
      .from('notes')
      .insert(
        own([
          {
            title: L('Berlin budget'),
            content: L(
              '<p>Rent: ~1 400 EUR for 2 rooms in Kreuzberg / Neukölln.</p><ul><li><p>Deposit: 3 months</p></li><li><p>Anmeldung within 14 days</p></li></ul>',
            ),
            content_text: L(
              'Rent: ~1 400 EUR for 2 rooms in Kreuzberg / Neukölln. Deposit: 3 months. Anmeldung within 14 days',
            ),
            pinned: true,
          },
          {
            title: L('Half marathon pacing'),
            content: L('<p>Target pace 5:40/km. Negative split: first 10 km at 5:45.</p>'),
            content_text: L('Target pace 5:40/km. Negative split: first 10 km at 5:45.'),
          },
          {
            title: L('Book ideas'),
            content: '<ol><li><p>Deep Work</p></li><li><p>The Psychology of Money</p></li></ol>',
            content_text: L('Deep Work. The Psychology of Money'),
          },
        ]),
        { defaultToNull: false },
      )
      .select('id, title'),
    'notes',
  )
  await must(
    db.from('note_links').insert(
      own([
        {
          note_id: notes.find((n) => n.title === L('Berlin budget'))!.id,
          entity_type: 'project',
          entity_id: proj('Move to Berlin'),
        },
        {
          note_id: notes.find((n) => n.title === L('Half marathon pacing'))!.id,
          entity_type: 'goal',
          entity_id: goal('Run a half marathon'),
        },
      ]),
      { defaultToNull: false },
    ),
    'note links',
  )
  await must(
    db.from('journal_entries').insert(
      own([
        {
          entry_date: addDays(today, -1),
          mood: 4,
          today_text: L('Good long run and productive afternoon.'),
          went_well: L('Kept the pace for 13 km.'),
          could_be_better: L('Went to bed too late.'),
          tomorrow_text: L('Finish the report before lunch.'),
        },
        {
          entry_date: addDays(today, -2),
          mood: 3,
          today_text: L('Busy day of meetings.'),
          went_well: L('Gym session felt strong.'),
          could_be_better: L('Too much coffee.'),
        },
      ]),
      { defaultToNull: false },
    ),
    'journal',
  )
  const [groceries] = await must(
    db
      .from('shopping_lists')
      .insert(own([{ name: L('Groceries') }]), { defaultToNull: false })
      .select('id'),
    'list',
  )
  await must(
    db.from('shopping_items').insert(
      own([
        {
          list_id: groceries!.id,
          name: L('Milk'),
          quantity: 2,
          unit: 'l',
          category: L('Dairy'),
          position: 0,
        },
        {
          list_id: groceries!.id,
          name: L('Eggs'),
          quantity: 10,
          category: L('Dairy'),
          position: 1,
        },
        {
          list_id: groceries!.id,
          name: L('Chicken'),
          quantity: 1,
          unit: L('kg'),
          category: L('Meat & fish'),
          position: 2,
        },
        { list_id: groceries!.id, name: L('Vegetables'), category: L('Produce'), position: 3 },
        {
          list_id: groceries!.id,
          name: L('Toilet paper'),
          category: L('Household'),
          position: 4,
          purchased: true,
          purchased_at: new Date().toISOString(),
        },
      ]),
      { defaultToNull: false },
    ),
    'shopping items',
  )
  await must(
    db
      .from('user_preferences')
      .update({ focus_text: L('Finish project presentation'), focus_date: today })
      .eq('user_id', uid),
    'focus',
  )

  console.log(
    `Seeded demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${txns.length} transactions, ${tasks.length} tasks, ${logs.length} habit logs).`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
