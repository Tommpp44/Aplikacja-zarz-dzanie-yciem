'use client'

import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BudgetRow } from '@/components/finances/budget-row'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SubmitButton } from '@/components/ui/submit-button'
import { useServerAction } from '@/hooks/use-server-action'
import { createBudget, deleteBudget, updateBudget } from '@/lib/finance/actions'
import { minorToInput } from '@/lib/money'
import type { CategoryOption } from './types'
import { useT } from '@/lib/i18n/client'

type Budget = {
  id: string
  name: string
  amount_minor: number
  currency: string
  categoryIds: string[]
}

function BudgetForm({
  budget,
  categories,
  onDone,
}: {
  budget?: Budget
  categories: CategoryOption[]
  onDone: () => void
}) {
  const t = useT()
  const [name, setName] = useState(budget?.name ?? '')
  const [amount, setAmount] = useState(
    budget ? minorToInput(budget.amount_minor, budget.currency) : '',
  )
  const [selected, setSelected] = useState<string[]>(budget?.categoryIds ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, run] = useServerAction()
  const expenseCategories = categories.filter((c) => c.kind === 'expense' && !c.archived_at)
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const input = {
          name:
            name ||
            expenseCategories
              .filter((c) => selected.includes(c.id))
              .map((c) => c.name)
              .join(', '),
          amount,
          category_ids: selected,
        }
        run(() => (budget ? updateBudget({ ...input, id: budget.id }) : createBudget(input)), {
          success: budget ? t('Budget updated') : t('Budget created'),
          onSuccess: onDone,
          onError: (r) => setErrors(r.fieldErrors ?? {}),
        })
      }}
    >
      <Field label={t('Categories')} error={errors.category_ids}>
        <div className="grid grid-cols-2 gap-2">
          {expenseCategories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(c.id)}
                onCheckedChange={(v) =>
                  setSelected((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))
                }
              />
              {c.name}
            </label>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('Monthly limit')} htmlFor="budget-amount" error={errors.amount}>
          <Input
            id="budget-amount"
            inputMode="decimal"
            placeholder="800"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label={t('Name')} htmlFor="budget-name" optional error={errors.name}>
          <Input
            id="budget-name"
            placeholder={t('Food')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      </div>
      <DialogFooter>
        <SubmitButton pending={pending}>{budget ? t('Save') : t('Create budget')}</SubmitButton>
      </DialogFooter>
    </form>
  )
}

export function NewBudgetButton({ categories }: { categories: CategoryOption[] }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> {t('New budget')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New monthly budget')}</DialogTitle>
            <DialogDescription>
              {t('Track spending in one or more categories against a monthly limit.')}
            </DialogDescription>
          </DialogHeader>
          {open && <BudgetForm categories={categories} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function BudgetCard({
  budget,
  categories,
  status,
}: {
  budget: Budget
  categories: CategoryOption[]
  status: {
    limit: number
    spent: number
    remaining: number
    percent: number
    status: 'ok' | 'warning' | 'over'
  }
}) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [, run] = useServerAction()
  const names = categories.filter((c) => budget.categoryIds.includes(c.id)).map((c) => c.name)
  return (
    <li className="bg-card flex gap-3 rounded-xl border p-4">
      <div className="min-w-0 flex-1">
        <BudgetRow name={budget.name} currency={budget.currency} {...status} />
        <p className="text-muted-foreground mt-1 truncate text-xs">{names.join(' · ')}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('{name} actions', { name: budget.name })}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> {t('Edit')}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit budget')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('Change the limit or categories.')}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <BudgetForm budget={budget} categories={categories} onDone={() => setEditing(false)} />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('Delete this budget?')}
        description={t('Your transactions are not affected.')}
        onConfirm={() =>
          run(() => deleteBudget({ id: budget.id }), { success: t('Budget deleted') })
        }
      />
    </li>
  )
}
