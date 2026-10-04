'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GoalFormDialog, type GoalFormAccount } from './goal-form-dialog'
import { useT } from '@/lib/i18n/client'

export function NewGoalButton({
  accounts,
  defaultOpen = false,
  label,
}: {
  accounts: GoalFormAccount[]
  defaultOpen?: boolean
  label?: string
}) {
  const t = useT()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> {label ?? t('New goal')}
      </Button>
      <GoalFormDialog open={open} onOpenChange={setOpen} accounts={accounts} />
    </>
  )
}
