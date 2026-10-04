'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Plus, Scale, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ColorPicker } from '@/components/shared/color-picker'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { SubmitButton } from '@/components/ui/submit-button'
import { Switch } from '@/components/ui/switch'
import { useServerAction } from '@/hooks/use-server-action'
import type { ISODate } from '@/lib/dates'
import {
  createAccount,
  deleteAccount,
  reconcileAccount,
  updateAccount,
} from '@/lib/finance/actions'
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  accountSchema,
  type AccountInput,
} from '@/lib/finance/schemas'
import { COMMON_CURRENCIES, formatMoney, minorToInput } from '@/lib/money'
import { useT } from '@/lib/i18n/client'

export function NewAccountButton({
  currency,
  defaultOpen = false,
}: {
  currency: string
  defaultOpen?: boolean
}) {
  const t = useT()
  const [open, setOpen] = useState(defaultOpen)
  const [pending, run] = useServerAction()
  const empty: AccountInput = {
    name: '',
    account_type: 'checking',
    currency,
    opening_balance: '0',
    institution: '',
    color: 'blue',
    include_in_net_worth: true,
  }
  const form = useForm<AccountInput>({ resolver: zodResolver(accountSchema), defaultValues: empty })
  useEffect(() => {
    if (open) form.reset(empty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const errors = form.formState.errors
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> {t('New account')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New account')}</DialogTitle>
            <DialogDescription>
              {t(
                "Enter today's balance. From now on the balance is calculated from your transactions.",
              )}
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) =>
              run(() => createAccount(values), {
                success: t('Account created'),
                onSuccess: () => setOpen(false),
                onError: (r) =>
                  Object.entries(r.fieldErrors ?? {}).forEach(([k, m]) =>
                    form.setError(k as keyof AccountInput, { message: m }),
                  ),
              }),
            )}
          >
            <Field label={t('Name')} htmlFor="acc-name" error={errors.name?.message}>
              <Input
                id="acc-name"
                autoFocus
                placeholder={t('Main bank account')}
                {...form.register('name')}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Type')} htmlFor="acc-type">
                <NativeSelect id="acc-type" {...form.register('account_type')}>
                  {ACCOUNT_TYPES.map((it) => (
                    <option key={it} value={it}>
                      {t(ACCOUNT_TYPE_LABELS[it])}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label={t('Currency')} htmlFor="acc-currency" error={errors.currency?.message}>
                <NativeSelect id="acc-currency" {...form.register('currency')}>
                  {[...new Set([currency, ...COMMON_CURRENCIES])].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field
                label={t('Current balance')}
                htmlFor="acc-balance"
                error={errors.opening_balance?.message}
                hint={t('For cards and loans, the amount you owe.')}
              >
                <Input id="acc-balance" inputMode="decimal" {...form.register('opening_balance')} />
              </Field>
              <Field label={t('Institution')} htmlFor="acc-inst" optional>
                <Input id="acc-inst" placeholder={t('mBank')} {...form.register('institution')} />
              </Field>
            </div>
            <Field label={t('Color')}>
              <Controller
                control={form.control}
                name="color"
                render={({ field }) => (
                  <ColorPicker value={field.value ?? 'slate'} onChange={field.onChange} />
                )}
              />
            </Field>
            <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              {t('Include in net worth')}
              <Controller
                control={form.control}
                name="include_in_net_worth"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </label>
            <DialogFooter>
              <SubmitButton pending={pending}>{t('Create account')}</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

type AccountRow = {
  id: string
  name: string
  account_type: string
  currency: string
  institution: string | null
  color: string
  active: boolean
  include_in_net_worth: boolean
  balance_minor: number
}

export function AccountMenu({
  account,
  today,
  transactionCount,
}: {
  account: AccountRow
  today: ISODate
  transactionCount: number
}) {
  const t = useT()
  const [mode, setMode] = useState<'edit' | 'reconcile' | 'delete' | null>(null)
  const [pending, run] = useServerAction()
  const [name, setName] = useState(account.name)
  const [institution, setInstitution] = useState(account.institution ?? '')
  const [include, setInclude] = useState(account.include_in_net_worth)
  const [color, setColor] = useState(account.color)
  const [actual, setActual] = useState(minorToInput(account.balance_minor, account.currency))
  const [confirmText, setConfirmText] = useState('')

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('{name} actions', { name: account.name })}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setMode('edit')}>
            <Pencil /> {t('Edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode('reconcile')}>
            <Scale /> {t('Correct balance')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              run(
                () =>
                  updateAccount({
                    id: account.id,
                    name: account.name,
                    account_type: account.account_type as AccountInput['account_type'],
                    color: account.color as AccountInput['color'] & string,
                    institution: account.institution,
                    include_in_net_worth: account.include_in_net_worth,
                    active: !account.active,
                  }),
                { success: account.active ? t('Account archived') : t('Account restored') },
              )
            }
          >
            {account.active ? <Archive /> : <ArchiveRestore />}{' '}
            {account.active ? t('Archive') : t('Restore')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setMode('delete')}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={mode === 'edit'} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit account')}</DialogTitle>
            <DialogDescription>
              Currency and opening balance are fixed; use “Correct balance” to fix the balance.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field label={t('Name')} htmlFor="edit-acc-name">
              <Input id="edit-acc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t('Institution')} htmlFor="edit-acc-inst" optional>
              <Input
                id="edit-acc-inst"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </Field>
            <Field label={t('Color')}>
              <ColorPicker value={color} onChange={setColor} />
            </Field>
            <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              {t('Include in net worth')}
              <Switch checked={include} onCheckedChange={setInclude} />
            </label>
          </div>
          <DialogFooter>
            <SubmitButton
              type="button"
              pending={pending}
              onClick={() =>
                run(
                  () =>
                    updateAccount({
                      id: account.id,
                      name,
                      institution: institution || null,
                      color: color as AccountInput['color'] & string,
                      include_in_net_worth: include,
                      account_type: account.account_type as AccountInput['account_type'],
                    }),
                  { success: t('Account updated'), onSuccess: () => setMode(null) },
                )
              }
            >
              {t('Save')}
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === 'reconcile'} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Correct balance')}</DialogTitle>
            <DialogDescription>
              {t('Tracked balance:')}{' '}
              <strong>{formatMoney(account.balance_minor, account.currency)}</strong>.{' '}
              {t(
                'Enter the real balance from your bank — we record the difference as a visible correction so your history stays explainable.',
              )}
            </DialogDescription>
          </DialogHeader>
          <Field
            label={t('Actual balance ({currency})', { currency: account.currency })}
            htmlFor="actual-balance"
          >
            <Input
              id="actual-balance"
              inputMode="decimal"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <SubmitButton
              type="button"
              pending={pending}
              onClick={() =>
                run(
                  () =>
                    reconcileAccount({
                      account_id: account.id,
                      actual_balance: actual,
                      date: today,
                    }),
                  {
                    success: (d) =>
                      d.adjusted === 0
                        ? t('Balance already matches')
                        : t('Correction of {amount} recorded', {
                            amount: formatMoney(d.adjusted, account.currency, { signed: true }),
                          }),
                    onSuccess: () => setMode(null),
                  },
                )
              }
            >
              {t('Save correction')}
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={mode === 'delete'}
        onOpenChange={(o) => {
          if (!o) {
            setMode(null)
            setConfirmText('')
          }
        }}
        title={t('Delete “{name}”?', { name: account.name })}
        description={t(
          'This permanently deletes the account and its {n} transaction(s), including transfers to and from it. Consider archiving instead. Type the account name to confirm.',
          { n: transactionCount },
        )}
        confirmLabel={t('Delete account and transactions')}
        confirmDisabled={confirmText !== account.name}
        onConfirm={() =>
          run(() => deleteAccount({ id: account.id }), { success: t('Account deleted') })
        }
      >
        <Input
          aria-label={t('Type the account name to confirm')}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={account.name}
        />
      </ConfirmDialog>
    </>
  )
}
