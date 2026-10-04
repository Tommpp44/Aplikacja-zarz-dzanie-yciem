import 'server-only'
import { unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'
import { minorToMajor } from '@/lib/money'

/** Current balances in minor units from the account_balances view (source of truth). */
export async function getAccountBalances(db: DB, userId: string) {
  const rows = unwrap(
    await db
      .from('account_balances')
      .select('account_id, balance_minor, currency')
      .eq('user_id', userId),
    'load balances',
  )
  return new Map(
    rows.map((r) => [
      r.account_id!,
      { balance: r.balance_minor ?? 0, currency: r.currency ?? 'PLN' },
    ]),
  )
}

export async function getAccountBalancesMajor(db: DB, userId: string) {
  const balances = await getAccountBalances(db, userId)
  return new Map([...balances].map(([id, b]) => [id, minorToMajor(b.balance, b.currency)]))
}
