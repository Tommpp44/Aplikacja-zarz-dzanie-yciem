'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TransactionForm, type TransactionFormProps } from './transaction-form'
import { useT } from '@/lib/i18n/client'

export function TransactionDialog({
  open,
  onOpenChange,
  ...props
}: TransactionFormProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {props.transaction ? t('Edit transaction') : t('New transaction')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('Record income, an expense or a transfer.')}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function AddTransactionButton({
  label,
  variant,
  size,
  ...props
}: TransactionFormProps & {
  label?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} variant={variant} size={size}>
        <Plus /> {label ?? t('Add transaction')}
      </Button>
      <TransactionDialog open={open} onOpenChange={setOpen} {...props} />
    </>
  )
}
