import { z } from 'zod'
import { optionalDate, optionalUuid } from '@/lib/validation'
import { ENTITY_COLORS } from '@/lib/colors'
import { repeatRuleSchema } from '@/lib/recurrence'

export const ACCOUNT_TYPES = [
  'checking',
  'savings',
  'cash',
  'credit_card',
  'investment',
  'loan',
  'other',
] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Bank account',
  savings: 'Savings',
  cash: 'Cash',
  credit_card: 'Credit card',
  investment: 'Investment',
  loan: 'Loan',
  other: 'Other',
}

export const TXN_TYPES = ['expense', 'income', 'transfer', 'adjustment'] as const
export type TransactionType = (typeof TXN_TYPES)[number]

/** Amounts arrive as text ("54,50") and are parsed to minor units on the server. */
const amountText = z.string().trim().min(1, 'Enter an amount').max(30)

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Name the account').max(80),
  account_type: z.enum(ACCOUNT_TYPES),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code'),
  opening_balance: z.string().trim().max(30).default('0'),
  institution: z.string().trim().max(80).nullable().optional(),
  color: z.enum(ENTITY_COLORS).default('slate'),
  include_in_net_worth: z.boolean().default(true),
})
export type AccountInput = z.input<typeof accountSchema>

export const updateAccountSchema = accountSchema
  .omit({ currency: true, opening_balance: true })
  .extend({
    id: z.uuid(),
    active: z.boolean().optional(),
  })

export const reconcileSchema = z.object({
  account_id: z.uuid(),
  actual_balance: amountText,
  date: z.iso.date(),
})

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name the category').max(60),
  kind: z.enum(['expense', 'income']),
  color: z.enum(ENTITY_COLORS).default('slate'),
})

export const transactionSchema = z
  .object({
    txn_type: z.enum(TXN_TYPES),
    amount: amountText,
    /** Destination amount for cross-currency transfers. */
    transfer_amount: z.string().trim().max(30).optional(),
    account_id: z.uuid('Choose an account'),
    transfer_account_id: optionalUuid,
    category_id: optionalUuid,
    occurred_on: z.iso.date(),
    merchant: z.string().trim().max(120).nullable().optional(),
    description: z.string().trim().max(500).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.txn_type === 'transfer' && !v.transfer_account_id)
      ctx.addIssue({
        code: 'custom',
        path: ['transfer_account_id'],
        message: 'Choose the destination account',
      })
    if (v.txn_type === 'transfer' && v.transfer_account_id === v.account_id)
      ctx.addIssue({
        code: 'custom',
        path: ['transfer_account_id'],
        message: 'Choose a different account',
      })
  })
export type TransactionInput = z.input<typeof transactionSchema>

export const budgetSchema = z.object({
  name: z.string().trim().min(1, 'Name the budget').max(80),
  amount: amountText,
  category_ids: z.array(z.uuid()).min(1, 'Pick at least one category').max(50),
})

export const recurringSchema = z
  .object({
    txn_type: z.enum(['expense', 'income', 'transfer']),
    amount: amountText,
    account_id: z.uuid('Choose an account'),
    transfer_account_id: optionalUuid,
    category_id: optionalUuid,
    merchant: z.string().trim().max(120).nullable().optional(),
    description: z.string().trim().max(500).nullable().optional(),
    repeat_rule: repeatRuleSchema,
    next_date: z.iso.date(),
    end_date: optionalDate,
    auto_post: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.txn_type === 'transfer' && !v.transfer_account_id)
      ctx.addIssue({
        code: 'custom',
        path: ['transfer_account_id'],
        message: 'Choose the destination account',
      })
  })
export type RecurringInput = z.input<typeof recurringSchema>

export const importRowSchema = z.object({
  occurred_on: z.iso.date(),
  amount: z.string().max(30),
  txn_type: z.enum(['expense', 'income']).optional(),
  category: z.string().max(60).optional(),
  merchant: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
})
export const importSchema = z.object({
  account_id: z.uuid(),
  rows: z.array(importRowSchema).min(1).max(5000),
})

export const transactionFiltersSchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  account: z.uuid().optional(),
  category: z.uuid().optional(),
  type: z.enum(TXN_TYPES).optional(),
  q: z.string().max(100).optional(),
})
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>
