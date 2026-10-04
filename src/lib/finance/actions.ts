'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { DataError, NotFoundError, unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'
import { toJson } from '@/lib/db/types'
import { parseAmountToMinor } from '@/lib/money'
import { nextOccurrenceAfter, parseRepeatRule } from '@/lib/recurrence'
import { getUserContext } from '@/lib/settings/service'
import { getAccountBalances } from './balances'
import {
  accountSchema,
  budgetSchema,
  categorySchema,
  importSchema,
  reconcileSchema,
  recurringSchema,
  transactionSchema,
  updateAccountSchema,
} from './schemas'

/** Parses user text into minor units of the account's currency; rejects bad input. */
function toMinor(
  text: string,
  currency: string,
  field = 'amount',
  { allowZero = false, allowNegative = false } = {},
) {
  const minor = parseAmountToMinor(text, currency)
  if (minor === null) throw new DataError(`Enter a valid ${field}.`)
  if (!allowNegative && minor < 0) throw new DataError(`The ${field} can't be negative.`)
  if (!allowZero && minor === 0) throw new DataError(`The ${field} must be greater than zero.`)
  if (Math.abs(minor) > 1e13) throw new DataError(`The ${field} is too large.`)
  return minor
}

async function getAccount(db: DB, userId: string, id: string) {
  const account = unwrap(
    await db
      .from('accounts')
      .select('id, currency, name')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle(),
    'load the account',
  )
  if (!account) throw new NotFoundError('account')
  return account
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export const createAccount = authedAction(
  accountSchema,
  { name: 'createAccount', failureMessage: "We couldn't create this account. Please try again." },
  async (input, { supabase, user }) => {
    const opening = toMinor(input.opening_balance || '0', input.currency, 'opening balance', {
      allowZero: true,
      allowNegative: true,
    })
    const { count } = await supabase
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const row = unwrap(
      await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: input.name,
          account_type: input.account_type,
          currency: input.currency,
          // Liabilities are stored as negative balances (you owe money).
          opening_balance_minor:
            ['credit_card', 'loan'].includes(input.account_type) && opening > 0
              ? -opening
              : opening,
          institution: input.institution || null,
          color: input.color,
          include_in_net_worth: input.include_in_net_worth,
          position: count ?? 0,
        })
        .select('id')
        .single(),
      'create this account',
    )
    return { id: row.id }
  },
)

export const updateAccount = authedAction(
  updateAccountSchema,
  { name: 'updateAccount' },
  async ({ id, ...input }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('accounts')
        .update({ ...input, institution: input.institution || null })
        .eq('user_id', user.id)
        .eq('id', id),
      'update this account',
    )
  },
)

/** Permanently deletes an account and all of its transactions (confirmed in the UI). */
export const deleteAccount = authedAction(
  idSchema,
  { name: 'deleteAccount' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('accounts').delete().eq('user_id', user.id).eq('id', id),
      'delete this account',
    )
  },
)

/**
 * Reconciliation: records an explicit 'adjustment' transaction for the
 * difference between the tracked and the real balance, so the history explains
 * every change of the balance.
 */
export const reconcileAccount = authedAction(
  reconcileSchema,
  { name: 'reconcileAccount' },
  async ({ account_id, actual_balance, date }, { supabase, user }) => {
    const account = await getAccount(supabase, user.id, account_id)
    const actual = toMinor(actual_balance, account.currency, 'balance', {
      allowZero: true,
      allowNegative: true,
    })
    const balances = await getAccountBalances(supabase, user.id)
    const current = balances.get(account_id)?.balance ?? 0
    const diff = actual - current
    if (diff === 0) return { adjusted: 0 }
    unwrap(
      await supabase.from('transactions').insert({
        user_id: user.id,
        account_id,
        txn_type: 'adjustment',
        amount_minor: diff,
        occurred_on: date,
        description: 'Balance correction',
        source: 'manual',
      }),
      'record the correction',
    )
    return { adjusted: diff }
  },
)

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const createCategory = authedAction(
  categorySchema,
  { name: 'createCategory' },
  async (input, { supabase, user }) => {
    const row = unwrap(
      await supabase
        .from('transaction_categories')
        .insert({ ...input, user_id: user.id })
        .select('id')
        .single(),
      'create this category',
    )
    return { id: row.id }
  },
)

export const updateCategory = authedAction(
  categorySchema.omit({ kind: true }).extend({ id: z.uuid() }),
  { name: 'updateCategory' },
  async ({ id, ...input }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('transaction_categories')
        .update(input)
        .eq('user_id', user.id)
        .eq('id', id),
      'update this category',
    )
  },
)

export const setCategoryArchived = authedAction(
  z.object({ id: z.uuid(), archived: z.boolean() }),
  { name: 'setCategoryArchived' },
  async ({ id, archived }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('transaction_categories')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('user_id', user.id)
        .eq('id', id),
      'update this category',
    )
  },
)

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

async function buildTransaction(db: DB, userId: string, input: z.output<typeof transactionSchema>) {
  const account = await getAccount(db, userId, input.account_id)
  const isAdjustment = input.txn_type === 'adjustment'
  const amount = toMinor(input.amount, account.currency, 'amount', { allowNegative: isAdjustment })
  let transfer_amount_minor: number | null = null
  if (input.txn_type === 'transfer') {
    const dest = await getAccount(db, userId, input.transfer_account_id!)
    transfer_amount_minor =
      dest.currency === account.currency
        ? amount
        : toMinor(input.transfer_amount || '', dest.currency, 'received amount')
  }
  return {
    account_id: input.account_id,
    txn_type: input.txn_type,
    amount_minor: amount,
    occurred_on: input.occurred_on,
    category_id:
      input.txn_type === 'income' || input.txn_type === 'expense'
        ? input.category_id || null
        : null,
    transfer_account_id: input.txn_type === 'transfer' ? input.transfer_account_id! : null,
    transfer_amount_minor,
    merchant: input.merchant || null,
    description: input.description || null,
    tags: input.tags,
  }
}

export const createTransaction = authedAction(
  transactionSchema,
  {
    name: 'createTransaction',
    failureMessage: "We couldn't save this transaction. Please try again.",
  },
  async (input, { supabase, user }) => {
    const values = await buildTransaction(supabase, user.id, input)
    const row = unwrap(
      await supabase
        .from('transactions')
        .insert({ ...values, user_id: user.id, source: 'manual' })
        .select('id')
        .single(),
      'save this transaction',
    )
    // Smart defaults: remember the last account and category.
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('last_used')
      .eq('user_id', user.id)
      .single()
    const lastUsed: Record<string, unknown> = {
      ...((prefs?.last_used as Record<string, unknown>) ?? {}),
      account_id: input.account_id,
    }
    if (values.category_id && input.txn_type === 'expense')
      lastUsed.expense_category_id = values.category_id
    if (values.category_id && input.txn_type === 'income')
      lastUsed.income_category_id = values.category_id
    await supabase
      .from('user_preferences')
      .update({ last_used: toJson(lastUsed) })
      .eq('user_id', user.id)
    return { id: row.id }
  },
)

export const updateTransaction = authedAction(
  transactionSchema.and(z.object({ id: z.uuid() })),
  {
    name: 'updateTransaction',
    failureMessage: "We couldn't save this transaction. Please try again.",
  },
  async (input, { supabase, user }) => {
    const values = await buildTransaction(supabase, user.id, input)
    unwrap(
      await supabase
        .from('transactions')
        .update(values)
        .eq('user_id', user.id)
        .eq('id', input.id)
        .is('deleted_at', null),
      'save this transaction',
    )
    return { id: input.id }
  },
)

/** Soft delete so it can be undone; balances exclude deleted rows immediately. */
export const deleteTransaction = authedAction(
  idSchema,
  { name: 'deleteTransaction' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('id', id),
      'delete this transaction',
    )
  },
)

export const restoreTransaction = authedAction(
  idSchema,
  { name: 'restoreTransaction' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('transactions')
        .update({ deleted_at: null })
        .eq('user_id', user.id)
        .eq('id', id),
      'restore this transaction',
    )
  },
)

export const importTransactions = authedAction(
  importSchema,
  {
    name: 'importTransactions',
    failureMessage: "We couldn't import this file. Nothing was saved.",
  },
  async ({ account_id, rows }, { supabase, user }) => {
    const account = await getAccount(supabase, user.id, account_id)
    const categories = unwrap(
      await supabase.from('transaction_categories').select('id, name, kind').eq('user_id', user.id),
      'load categories',
    )
    const byName = new Map(categories.map((c) => [`${c.kind}:${c.name.toLowerCase()}`, c.id]))
    const skipped: number[] = []
    const values = rows.flatMap((r, index) => {
      const amount = parseAmountToMinor(r.amount.replace(/^[-+]/, ''), account.currency)
      if (amount === null || amount <= 0) {
        skipped.push(index)
        return []
      }
      const type = r.txn_type ?? 'expense'
      return [
        {
          user_id: user.id,
          account_id,
          txn_type: type,
          amount_minor: amount,
          occurred_on: r.occurred_on,
          category_id: r.category
            ? (byName.get(`${type}:${r.category.toLowerCase()}`) ?? null)
            : null,
          merchant: r.merchant || null,
          description: r.description || null,
          source: 'import' as const,
        },
      ]
    })
    for (let i = 0; i < values.length; i += 500) {
      unwrap(
        await supabase.from('transactions').insert(values.slice(i, i + 500)),
        'import transactions',
      )
    }
    return { imported: values.length, skipped: skipped.length }
  },
)

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

async function setBudgetCategories(
  db: DB,
  userId: string,
  budgetId: string,
  categoryIds: string[],
) {
  unwrap(
    await db.from('budget_categories').delete().eq('user_id', userId).eq('budget_id', budgetId),
    'update budget',
  )
  unwrap(
    await db
      .from('budget_categories')
      .insert(
        categoryIds.map((category_id) => ({ budget_id: budgetId, category_id, user_id: userId })),
      ),
    'update budget',
  )
}

export const createBudget = authedAction(
  budgetSchema,
  { name: 'createBudget' },
  async (input, { supabase, user }) => {
    const { currency } = await getUserContext()
    const amount = toMinor(input.amount, currency, 'budget')
    const row = unwrap(
      await supabase
        .from('budgets')
        .insert({ name: input.name, amount_minor: amount, currency, user_id: user.id })
        .select('id')
        .single(),
      'create this budget',
    )
    await setBudgetCategories(supabase, user.id, row.id, input.category_ids)
    return { id: row.id }
  },
)

export const updateBudget = authedAction(
  budgetSchema.extend({ id: z.uuid() }),
  { name: 'updateBudget' },
  async ({ id, ...input }, { supabase, user }) => {
    const { data: budget } = await supabase
      .from('budgets')
      .select('currency')
      .eq('user_id', user.id)
      .eq('id', id)
      .maybeSingle()
    if (!budget) throw new NotFoundError('budget')
    unwrap(
      await supabase
        .from('budgets')
        .update({
          name: input.name,
          amount_minor: toMinor(input.amount, budget.currency, 'budget'),
        })
        .eq('user_id', user.id)
        .eq('id', id),
      'update this budget',
    )
    await setBudgetCategories(supabase, user.id, id, input.category_ids)
    return { id }
  },
)

export const deleteBudget = authedAction(
  idSchema,
  { name: 'deleteBudget' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('budgets').delete().eq('user_id', user.id).eq('id', id),
      'delete this budget',
    )
  },
)

// ---------------------------------------------------------------------------
// Recurring transactions
// ---------------------------------------------------------------------------

async function buildRecurring(db: DB, userId: string, input: z.output<typeof recurringSchema>) {
  const account = await getAccount(db, userId, input.account_id)
  if (input.txn_type === 'transfer') await getAccount(db, userId, input.transfer_account_id!)
  return {
    txn_type: input.txn_type,
    amount_minor: toMinor(input.amount, account.currency),
    account_id: input.account_id,
    transfer_account_id: input.txn_type === 'transfer' ? input.transfer_account_id! : null,
    category_id: input.txn_type === 'transfer' ? null : input.category_id || null,
    merchant: input.merchant || null,
    description: input.description || null,
    repeat_rule: toJson(input.repeat_rule),
    next_date: input.next_date,
    end_date: input.end_date || null,
    auto_post: input.auto_post,
  }
}

export const createRecurring = authedAction(
  recurringSchema,
  { name: 'createRecurring' },
  async (input, { supabase, user }) => {
    const values = await buildRecurring(supabase, user.id, input)
    const row = unwrap(
      await supabase
        .from('recurring_transactions')
        .insert({ ...values, user_id: user.id })
        .select('id')
        .single(),
      'save this recurring transaction',
    )
    return { id: row.id }
  },
)

export const updateRecurring = authedAction(
  recurringSchema.and(z.object({ id: z.uuid() })),
  { name: 'updateRecurring' },
  async (input, { supabase, user }) => {
    const values = await buildRecurring(supabase, user.id, input)
    unwrap(
      await supabase
        .from('recurring_transactions')
        .update(values)
        .eq('user_id', user.id)
        .eq('id', input.id),
      'update this recurring transaction',
    )
    return { id: input.id }
  },
)

export const setRecurringActive = authedAction(
  z.object({ id: z.uuid(), active: z.boolean() }),
  { name: 'setRecurringActive' },
  async ({ id, active }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('recurring_transactions')
        .update({ active })
        .eq('user_id', user.id)
        .eq('id', id),
      'update this recurring transaction',
    )
  },
)

export const deleteRecurring = authedAction(
  idSchema,
  { name: 'deleteRecurring' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('recurring_transactions').delete().eq('user_id', user.id).eq('id', id),
      'delete this recurring transaction',
    )
  },
)

/**
 * Records the next due occurrence as a real transaction (or skips it) and
 * advances next_date. Posting is always an explicit user action unless the item
 * is marked auto_post (handled by the scheduled job).
 */
export const postRecurring = authedAction(
  z.object({ id: z.uuid(), skip: z.boolean().default(false) }),
  { name: 'postRecurring' },
  async ({ id, skip }, { supabase, user }) => {
    const item = unwrap(
      await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', id)
        .maybeSingle(),
      'load the recurring transaction',
    )
    if (!item) throw new NotFoundError('recurring transaction')
    const rule = parseRepeatRule(item.repeat_rule)
    if (!rule) throw new DataError('This recurring transaction has an invalid schedule.')
    if (!skip) {
      unwrap(
        await supabase.from('transactions').insert({
          user_id: user.id,
          account_id: item.account_id,
          txn_type: item.txn_type,
          amount_minor: item.amount_minor,
          transfer_account_id: item.transfer_account_id,
          transfer_amount_minor: item.txn_type === 'transfer' ? item.amount_minor : null,
          category_id: item.category_id,
          merchant: item.merchant,
          description: item.description,
          occurred_on: item.next_date,
          recurring_id: item.id,
          source: 'recurring',
        }),
        'record this transaction',
      )
    }
    const next = nextOccurrenceAfter(rule, item.next_date, item.next_date)
    const ended = !next || (item.end_date !== null && next > item.end_date)
    unwrap(
      await supabase
        .from('recurring_transactions')
        .update(ended ? { active: false } : { next_date: next })
        .eq('user_id', user.id)
        .eq('id', id),
      'update the schedule',
    )
    return { next: ended ? null : next }
  },
)
