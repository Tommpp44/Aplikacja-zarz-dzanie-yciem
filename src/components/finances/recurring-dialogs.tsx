'use client'

import { Check, MoreHorizontal, Pause, Pencil, Play, Plus, SkipForward, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { RepeatRulePicker } from '@/components/shared/repeat-rule-picker'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
import { relativeDayLabel, type ISODate } from '@/lib/dates'
import {
  createRecurring,
  deleteRecurring,
  postRecurring,
  setRecurringActive,
  updateRecurring,
} from '@/lib/finance/actions'
import type { RecurringInput } from '@/lib/finance/schemas'
import { minorToInput } from '@/lib/money'
import { describeRepeatRule, parseRepeatRule, type RepeatRule } from '@/lib/recurrence'
import { Money } from './money'
import type { AccountOption, CategoryOption } from './types'

export type RecurringRow = {
  id: string
  txn_type: string
  amount_minor: number
  account_id: string
  transfer_account_id: string | null
  category_id: string | null
  merchant: string | null
  description: string | null
  repeat_rule: unknown
  next_date: string
  end_date: string | null
  auto_post: boolean
  active: boolean
  currency: string
}

function RecurringForm({
  item,
  accounts,
  categories,
  today,
  onDone,
}: {
  item?: RecurringRow
  accounts: AccountOption[]
  categories: CategoryOption[]
  today: ISODate
  onDone: () => void
}) {
  const [values, setValues] = useState({
    txn_type: (item?.txn_type ?? 'expense') as RecurringInput['txn_type'],
    amount: item ? minorToInput(item.amount_minor, item.currency) : '',
    account_id: item?.account_id ?? accounts[0]?.id ?? '',
    transfer_account_id: item?.transfer_account_id ?? '',
    category_id: item?.category_id ?? '',
    merchant: item?.merchant ?? '',
    description: item?.description ?? '',
    next_date: item?.next_date ?? today,
    end_date: item?.end_date ?? '',
    auto_post: item?.auto_post ?? false,
  })
  const [rule, setRule] = useState<RepeatRule | null>(
    parseRepeatRule(item?.repeat_rule) ?? { freq: 'monthly', interval: 1 },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, run] = useServerAction()
  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) =>
    setValues((s) => ({ ...s, [k]: v }))
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!rule) return
        const input: RecurringInput = {
          ...values,
          repeat_rule: rule,
          transfer_account_id:
            values.txn_type === 'transfer' ? values.transfer_account_id || null : null,
          category_id: values.txn_type === 'transfer' ? null : values.category_id || null,
          end_date: values.end_date || null,
        }
        run(() => (item ? updateRecurring({ ...input, id: item.id }) : createRecurring(input)), {
          success: item ? 'Recurring transaction updated' : 'Recurring transaction added',
          onSuccess: onDone,
          onError: (r) => setErrors(r.fieldErrors ?? {}),
        })
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" htmlFor="rec-type">
          <NativeSelect
            id="rec-type"
            value={values.txn_type}
            onChange={(e) => set('txn_type', e.target.value as RecurringInput['txn_type'])}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </NativeSelect>
        </Field>
        <Field label="Amount" htmlFor="rec-amount" error={errors.amount}>
          <Input
            id="rec-amount"
            inputMode="decimal"
            value={values.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
        </Field>
        <Field
          label={values.txn_type === 'transfer' ? 'From' : 'Account'}
          htmlFor="rec-account"
          error={errors.account_id}
        >
          <NativeSelect
            id="rec-account"
            value={values.account_id}
            onChange={(e) => set('account_id', e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {values.txn_type === 'transfer' ? (
          <Field label="To" htmlFor="rec-to" error={errors.transfer_account_id}>
            <NativeSelect
              id="rec-to"
              value={values.transfer_account_id}
              onChange={(e) => set('transfer_account_id', e.target.value)}
            >
              <option value="">Choose…</option>
              {accounts
                .filter((a) => a.id !== values.account_id)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </NativeSelect>
          </Field>
        ) : (
          <Field label="Category" htmlFor="rec-category" optional>
            <NativeSelect
              id="rec-category"
              value={values.category_id}
              onChange={(e) => set('category_id', e.target.value)}
            >
              <option value="">None</option>
              {categories
                .filter((c) => c.kind === values.txn_type && !c.archived_at)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </NativeSelect>
          </Field>
        )}
      </div>
      <Field label="Name / payee" htmlFor="rec-merchant">
        <Input
          id="rec-merchant"
          placeholder="Rent, Salary, Netflix…"
          value={values.merchant}
          onChange={(e) => set('merchant', e.target.value)}
        />
      </Field>
      <Field label="Repeats" htmlFor="rec-rule">
        <RepeatRulePicker id="rec-rule" value={rule} onChange={setRule} allowNone={false} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Next date" htmlFor="rec-next" error={errors.next_date}>
          <Input
            id="rec-next"
            type="date"
            value={values.next_date}
            onChange={(e) => set('next_date', e.target.value)}
          />
        </Field>
        <Field label="Ends" htmlFor="rec-end" optional>
          <Input
            id="rec-end"
            type="date"
            value={values.end_date}
            onChange={(e) => set('end_date', e.target.value)}
          />
        </Field>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
        <span>
          Record automatically
          <span className="text-muted-foreground block text-xs">
            Otherwise you confirm each occurrence with one click.
          </span>
        </span>
        <Switch checked={values.auto_post} onCheckedChange={(v) => set('auto_post', v)} />
      </label>
      <DialogFooter>
        <SubmitButton pending={pending}>{item ? 'Save' : 'Add'}</SubmitButton>
      </DialogFooter>
    </form>
  )
}

export function NewRecurringButton(props: {
  accounts: AccountOption[]
  categories: CategoryOption[]
  today: ISODate
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={props.accounts.length === 0}>
        <Plus /> New recurring
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New recurring transaction</DialogTitle>
            <DialogDescription>Rent, salary, subscriptions, loan payments…</DialogDescription>
          </DialogHeader>
          {open && <RecurringForm {...props} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function RecurringItem({
  item,
  accounts,
  categories,
  today,
}: {
  item: RecurringRow
  accounts: AccountOption[]
  categories: CategoryOption[]
  today: ISODate
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, run] = useServerAction()
  const due = item.active && item.next_date <= today
  const account = accounts.find((a) => a.id === item.account_id)
  const category = categories.find((c) => c.id === item.category_id)
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {item.merchant || item.description || category?.name || 'Recurring'}
          {!item.active && <Badge variant="secondary">Paused</Badge>}
          {item.auto_post && item.active && <Badge variant="outline">Auto</Badge>}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {describeRepeatRule(parseRepeatRule(item.repeat_rule))} · {account?.name}
          {item.active && ` · next ${relativeDayLabel(item.next_date, today).toLowerCase()}`}
        </p>
      </div>
      <Money
        minor={item.txn_type === 'income' ? item.amount_minor : -item.amount_minor}
        currency={item.currency}
        signed
        className={`text-sm font-medium ${item.txn_type === 'income' ? 'text-success' : ''}`}
      />
      {due && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(() => postRecurring({ id: item.id, skip: false }), { success: 'Recorded' })
          }
        >
          <Check /> Record
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Recurring actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          {item.active && (
            <DropdownMenuItem
              onSelect={() =>
                run(() => postRecurring({ id: item.id, skip: true }), {
                  success: 'Next occurrence skipped',
                })
              }
            >
              <SkipForward /> Skip next
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() =>
              run(() => setRecurringActive({ id: item.id, active: !item.active }), {
                success: item.active ? 'Paused' : 'Resumed',
              })
            }
          >
            {item.active ? <Pause /> : <Play />} {item.active ? 'Pause' : 'Resume'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit recurring transaction</DialogTitle>
            <DialogDescription className="sr-only">Change schedule or amount.</DialogDescription>
          </DialogHeader>
          {editing && (
            <RecurringForm
              item={item}
              accounts={accounts}
              categories={categories}
              today={today}
              onDone={() => setEditing(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this recurring transaction?"
        description="Transactions already recorded are kept."
        onConfirm={() => run(() => deleteRecurring({ id: item.id }), { success: 'Deleted' })}
      />
    </li>
  )
}
