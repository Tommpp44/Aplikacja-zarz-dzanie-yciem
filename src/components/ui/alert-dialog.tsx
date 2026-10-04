'use client'

import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button'

/**
 * Confirmation for destructive, hard-to-undo operations only (deleting an
 * account, financial data, bulk deletes). Regular deletes use Undo instead.
 */
function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  open,
  onOpenChange,
  children,
  confirmDisabled,
}: {
  trigger?: React.ReactNode
  title: string
  description: React.ReactNode
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  confirmDisabled?: boolean
}) {
  const t = useT()
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 dark:bg-black/60" />
        <AlertDialogPrimitive.Content
          className={cn(
            'bg-popover data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border p-5 shadow-xl',
          )}
        >
          <div className="flex flex-col gap-1.5">
            <AlertDialogPrimitive.Title className="text-base font-semibold">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-muted-foreground text-sm">
              {description}
            </AlertDialogPrimitive.Description>
          </div>
          {children}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel className={buttonVariants({ variant: 'outline' })}>
              {t('Cancel')}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              disabled={confirmDisabled}
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => void onConfirm()}
            >
              {confirmLabel ?? t('Delete')}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export { ConfirmDialog }
