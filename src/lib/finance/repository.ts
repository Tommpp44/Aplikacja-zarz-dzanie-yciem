import 'server-only'
import type { ISODate } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'
import { escapeLike } from '@/lib/tasks/repository'
import type { Txn } from './calculations'
import type { TransactionFilters } from './schemas'

export const TXN_SELECT =
  'id, account_id, transfer_account_id, txn_type, amount_minor, transfer_amount_minor, currency, occurred_on, category_id, merchant, description, tags, recurring_id, source, created_at'

export type TransactionRow = Txn & {
  id: string
  merchant: string | null
  description: string | null
  tags: string[]
  source: string
  created_at: string
}

/** Paginated, filtered transaction list (newest first). */
export async function listTransactions(
  db: DB,
  userId: string,
  filters: TransactionFilters,
  page = 0,
  pageSize = 50,
) {
  let q = db
    .from('transactions')
    .select(TXN_SELECT, { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
  if (filters.from) q = q.gte('occurred_on', filters.from)
  if (filters.to) q = q.lte('occurred_on', filters.to)
  if (filters.account)
    q = q.or(`account_id.eq.${filters.account},transfer_account_id.eq.${filters.account}`)
  if (filters.category) q = q.eq('category_id', filters.category)
  if (filters.type) q = q.eq('txn_type', filters.type)
  if (filters.q) {
    const like = `%${escapeLike(filters.q)}%`
    q = q.or(`merchant.ilike.${like},description.ilike.${like}`)
  }
  const res = await q
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1)
  const rows = unwrap(res, 'load transactions') as unknown as TransactionRow[]
  return { rows, total: res.count ?? rows.length }
}

/** All non-deleted transactions in a date range (minimal columns, for analytics). */
export async function listTransactionsInRange(
  db: DB,
  userId: string,
  from: ISODate | null,
  to: ISODate,
) {
  const out: TransactionRow[] = []
  const pageSize = 1000
  for (let page = 0; page < 50; page++) {
    let q = db
      .from('transactions')
      .select(TXN_SELECT)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .lte('occurred_on', to)
    if (from) q = q.gte('occurred_on', from)
    const rows = unwrap(
      await q
        .order('occurred_on')
        .order('id')
        .range(page * pageSize, page * pageSize + pageSize - 1),
      'load transactions',
    ) as unknown as TransactionRow[]
    out.push(...rows)
    if (rows.length < pageSize) break
  }
  return out
}

export async function listCategories(db: DB, userId: string, includeArchived = false) {
  let q = db.from('transaction_categories').select('*').eq('user_id', userId)
  if (!includeArchived) q = q.is('archived_at', null)
  return unwrap(await q.order('kind').order('position').order('name'), 'load categories')
}

export async function listBudgets(db: DB, userId: string) {
  return unwrap(
    await db
      .from('budgets')
      .select('*, budget_categories(category_id)')
      .eq('user_id', userId)
      .eq('active', true)
      .order('name'),
    'load budgets',
  )
}

export async function listRecurring(db: DB, userId: string) {
  return unwrap(
    await db
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('active', { ascending: false })
      .order('next_date'),
    'load recurring transactions',
  )
}
