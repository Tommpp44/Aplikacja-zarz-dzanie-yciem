'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftRight, ChevronDown, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { SubmitButton } from '@/components/ui/submit-button'
import { useServerAction } from '@/hooks/use-server-action'
import { parseTransactionText } from '@/lib/ai/parse-transaction'
import { colorClass } from '@/lib/colors'
import type { ISODate } from '@/lib/dates'
import {
  createTransaction,
  deleteTransaction,
  restoreTransaction,
  updateTransaction,
} from '@/lib/finance/actions'
import { transactionSchema, type TransactionInput } from '@/lib/finance/schemas'
import { formatMoney, minorToInput } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { AccountOption, CategoryOption, TransactionLike } from './types'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'

const TYPES = [
  { value: 'expense', label: msg('Expense'), icon: TrendingDown },
  { value: 'income', label: msg('Income'), icon: TrendingUp },
  { value: 'transfer', label: msg('Transfer'), icon: ArrowLeftRight },
] as const

export type TransactionFormProps = {
  accounts: AccountOption[]
  categories: CategoryOption[]
  today: ISODate
  lastUsed?: { account_id?: string; expense_category_id?: string; income_category_id?: string }
  transaction?: TransactionLike
  defaultType?: 'expense' | 'income' | 'transfer'
  onDone?: () => void
}

/**
 * Fast entry: amount → category → save. Everything else has a smart default
 * (today, last used account) and lives under "More details".
 */
export function TransactionForm({
  accounts,
  categories,
  today,
  lastUsed,
  transaction,
  defaultType = 'expense',
  onDone,
}: TransactionFormProps) {
  const t = useT()
  const [pending, run] = useServerAction()
  const [more, setMore] = useState(Boolean(transaction?.description || transaction?.tags?.length))
  const [nl, setNl] = useState('')
  const defaultAccount =
    accounts.find((a) => a.id === lastUsed?.account_id)?.id ?? accounts[0]?.id ?? ''

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          txn_type: transaction.txn_type as TransactionInput['txn_type'],
          amount: minorToInput(transaction.amount_minor, transaction.currency),
          transfer_amount: transaction.transfer_amount_minor
            ? minorToInput(
                transaction.transfer_amount_minor,
                accounts.find((a) => a.id === transaction.transfer_account_id)?.currency,
              )
            : '',
          account_id: transaction.account_id,
          transfer_account_id: transaction.transfer_account_id,
          category_id: transaction.category_id ?? null,
          occurred_on: transaction.occurred_on,
          merchant: transaction.merchant ?? '',
          description: transaction.description ?? '',
          tags: transaction.tags ?? [],
        }
      : {
          txn_type: defaultType,
          amount: '',
          account_id: defaultAccount,
          transfer_account_id: null,
          category_id:
            defaultType === 'income'
              ? (lastUsed?.income_category_id ?? null)
              : defaultType === 'expense'
                ? (lastUsed?.expense_category_id ?? null)
                : null,
          occurred_on: today,
          merchant: '',
          description: '',
          tags: [],
        },
  })
  const type = useWatch({ control: form.control, name: 'txn_type' })
  const accountId = useWatch({ control: form.control, name: 'account_id' })
  const transferTo = useWatch({ control: form.control, name: 'transfer_account_id' })
  const categoryId = useWatch({ control: form.control, name: 'category_id' })
  const account = accounts.find((a) => a.id === accountId)
  const destination = accounts.find((a) => a.id === transferTo)
  const crossCurrency =
    type === 'transfer' && destination && account && destination.currency !== account.currency
  const visibleCategories = useMemo(
    () => categories.filter((c) => c.kind === type && !c.archived_at),
    [categories, type],
  )
  const errors = form.formState.errors

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm">
        <p className="text-muted-foreground">
          {t('Add your first account to start recording transactions.')}
        </p>
        <Button asChild>
          <Link href="/finances/accounts?new=1" onClick={onDone}>
            {t('Add account')}
          </Link>
        </Button>
      </div>
    )
  }

  const applyNaturalLanguage = () => {
    const parsed = parseTransactionText(nl, today)
    form.setValue('txn_type', parsed.txn_type)
    if (parsed.amount) form.setValue('amount', parsed.amount)
    if (parsed.merchant) form.setValue('merchant', parsed.merchant)
    if (parsed.occurred_on) form.setValue('occurred_on', parsed.occurred_on)
    const cat = categories.find(
      (c) =>
        c.kind === parsed.txn_type && c.name.toLowerCase() === parsed.categoryName?.toLowerCase(),
    )
    form.setValue('category_id', cat?.id ?? null)
    if (parsed.currency) {
      const match = accounts.find((a) => a.currency === parsed.currency)
      if (match && account?.currency !== parsed.currency) form.setValue('account_id', match.id)
    }
    setNl('')
  }

  const submit = form.handleSubmit((values) => {
    const clean: TransactionInput = {
      ...values,
      transfer_account_id: values.txn_type === 'transfer' ? values.transfer_account_id : null,
      category_id:
        values.txn_type === 'income' || values.txn_type === 'expense'
          ? values.category_id || null
          : null,
      merchant: values.merchant || null,
      description: values.description || null,
    }
    if (transaction) {
      run(() => updateTransaction({ ...clean, id: transaction.id }), {
        success: t('Transaction updated'),
        onSuccess: () => onDone?.(),
      })
    } else {
      run(() => createTransaction(clean), {
        success: t('Transaction saved'),
        onSuccess: (data) => {
          onDone?.()
          form.reset({ ...clean, amount: '', merchant: '', description: '', tags: [] })
          void data
        },
        onError: (r) =>
          Object.entries(r.fieldErrors ?? {}).forEach(([k, m]) =>
            form.setError(k as keyof TransactionInput, { message: m }),
          ),
      })
    }
  })

  const remove = () => {
    if (!transaction) return
    const id = transaction.id
    run(() => deleteTransaction({ id }), {
      success: t('Transaction deleted'),
      undo: { action: () => restoreTransaction({ id }) },
      onSuccess: () => onDone?.(),
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {!transaction && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3">
          <Sparkles className="text-primary size-4 shrink-0" aria-hidden />
          <input
            value={nl}
            onChange={(e) => setNl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (nl.trim()) applyNaturalLanguage()
              }
            }}
            placeholder='Or type it: "Spent 54 PLN on groceries at Lidl"'
            aria-label={t('Describe the transaction in words')}
            className="placeholder:text-muted-foreground h-9 flex-1 bg-transparent text-sm outline-none"
          />
          {nl && (
            <Button type="button" size="sm" variant="ghost" onClick={applyNaturalLanguage}>
              {t('Fill')}
            </Button>
          )}
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={t('Type')}
        className="bg-muted grid grid-cols-3 gap-1 rounded-lg p-1"
      >
        {TYPES.map((it) => {
          const Icon = it.icon
          const active = type === it.value
          return (
            <button
              key={it.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                form.setValue('txn_type', it.value)
                form.setValue(
                  'category_id',
                  it.value === 'expense'
                    ? (lastUsed?.expense_category_id ?? null)
                    : it.value === 'income'
                      ? (lastUsed?.income_category_id ?? null)
                      : null,
                )
              }}
              className={cn(
                'text-muted-foreground flex h-8 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium',
                active && 'bg-card text-foreground shadow-xs',
              )}
            >
              <Icon className="size-3.5" /> {t(it.label)}
            </button>
          )
        })}
      </div>
      {type === 'adjustment' && (
        <p className="text-muted-foreground text-xs">{t('Balance correction (signed amount).')}</p>
      )}

      <Field
        label={`Amount${account ? ` (${account.currency})` : ''}`}
        htmlFor="txn-amount"
        error={errors.amount?.message}
      >
        <Input
          id="txn-amount"
          inputMode="decimal"
          autoFocus={!transaction}
          placeholder="0,00"
          className="tabular h-12 text-2xl font-semibold"
          autoComplete="off"
          {...form.register('amount')}
        />
      </Field>

      {(type === 'expense' || type === 'income') && (
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium">{t('Category')}</legend>
          <div className="flex flex-wrap gap-1.5">
            {visibleCategories.map((c) => {
              const active = categoryId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => form.setValue('category_id', active ? null : c.id)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'bg-card hover:bg-accent',
                  )}
                >
                  <span
                    className={cn('size-1.5 rounded-full', colorClass(c.color, 'bg'))}
                    aria-hidden
                  />
                  {c.name}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={type === 'transfer' ? t('From account') : t('Account')}
          htmlFor="txn-account"
          error={errors.account_id?.message}
        >
          <NativeSelect id="txn-account" {...form.register('account_id')}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {type === 'transfer' ? (
          <Field
            label={t('To account')}
            htmlFor="txn-to"
            error={errors.transfer_account_id?.message}
          >
            <NativeSelect id="txn-to" {...form.register('transfer_account_id')}>
              <option value="">{t('Choose…')}</option>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </NativeSelect>
          </Field>
        ) : (
          <Field label={t('Date')} htmlFor="txn-date" error={errors.occurred_on?.message}>
            <Input id="txn-date" type="date" {...form.register('occurred_on')} />
          </Field>
        )}
      </div>
      {crossCurrency && (
        <Field
          label={`Received (${destination.currency})`}
          htmlFor="txn-received"
          hint={t('Amount credited to the destination account.')}
        >
          <Input id="txn-received" inputMode="decimal" {...form.register('transfer_amount')} />
        </Field>
      )}
      {type === 'transfer' && (
        <Field label={t('Date')} htmlFor="txn-date-t">
          <Input id="txn-date-t" type="date" {...form.register('occurred_on')} />
        </Field>
      )}
      {type !== 'transfer' && (
        <Field
          label={type === 'income' ? t('From (payer)') : t('Merchant')}
          htmlFor="txn-merchant"
          optional
        >
          <Input
            id="txn-merchant"
            placeholder={type === 'income' ? t('Employer') : t('Lidl')}
            {...form.register('merchant')}
          />
        </Field>
      )}

      <button
        type="button"
        onClick={() => setMore((m) => !m)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 self-start text-xs font-medium"
        aria-expanded={more}
      >
        <ChevronDown className={cn('size-3.5 transition-transform', more && 'rotate-180')} />{' '}
        {t('More')}
        details
      </button>
      {more && (
        <div className="flex flex-col gap-3">
          <Field label={t('Description')} htmlFor="txn-description" optional>
            <Input id="txn-description" {...form.register('description')} />
          </Field>
          <Field label={t('Tags')} htmlFor="txn-tags" hint={t('Comma separated')} optional>
            <Input
              id="txn-tags"
              defaultValue={transaction?.tags?.join(', ')}
              onChange={(e) =>
                form.setValue(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((it) => it.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        {transaction ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={remove}
            disabled={pending}
          >
            {t('Delete')}
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">
            {account ? t('Balance updates instantly') : ''}
          </span>
        )}
        <SubmitButton pending={pending}>
          {transaction ? t('Save') : type === 'transfer' ? t('Save transfer') : `Save ${type}`}
        </SubmitButton>
      </div>
      {transaction?.source && transaction.source !== 'manual' && (
        <p className="text-muted-foreground text-xs">
          {t('Source: {source}', { source: transaction.source })}
          {transaction.txn_type === 'transfer' && destination
            ? ` · ${formatMoney(transaction.amount_minor, transaction.currency)} → ${destination.name}`
            : ''}
        </p>
      )}
    </form>
  )
}
