import 'server-only'
import { unwrap } from '@/lib/db/errors'
import type { DB, InsertRow, UpdateRow } from '@/lib/db/types'
import { getAccountBalances } from './balances'

export async function listAccounts(db: DB, userId: string, includeInactive = false) {
  let q = db.from('accounts').select('*').eq('user_id', userId)
  if (!includeInactive) q = q.eq('active', true)
  const [accounts, balances] = await Promise.all([
    q
      .order('position')
      .order('created_at')
      .then((r) => unwrap(r, 'load accounts')),
    getAccountBalances(db, userId),
  ])
  return accounts.map((a) => ({
    ...a,
    balance_minor: balances.get(a.id)?.balance ?? a.opening_balance_minor,
  }))
}

export type AccountWithBalance = Awaited<ReturnType<typeof listAccounts>>[number]

export async function listAccountOptions(db: DB, userId: string) {
  return unwrap(
    await db
      .from('accounts')
      .select('id, name, currency, account_type')
      .eq('user_id', userId)
      .eq('active', true)
      .order('position')
      .order('created_at'),
    'load accounts',
  )
}

export async function insertAccount(
  db: DB,
  userId: string,
  values: Omit<InsertRow<'accounts'>, 'user_id'>,
) {
  return unwrap(
    await db
      .from('accounts')
      .insert({ ...values, user_id: userId })
      .select('*')
      .single(),
    'save this account',
  )
}

export async function updateAccount(
  db: DB,
  userId: string,
  id: string,
  values: UpdateRow<'accounts'>,
) {
  const { user_id: _u, id: _i, ...safe } = values
  return unwrap(
    await db.from('accounts').update(safe).eq('user_id', userId).eq('id', id).select('*').single(),
    'update this account',
  )
}
