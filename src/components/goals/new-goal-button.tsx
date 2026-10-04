'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GoalFormDialog, type GoalFormAccount } from './goal-form-dialog'

export function NewGoalButton({
  accounts,
  defaultOpen = false,
  label = 'New goal',
}: {
  accounts: GoalFormAccount[]
  defaultOpen?: boolean
  label?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> {label}
      </Button>
      <GoalFormDialog open={open} onOpenChange={setOpen} accounts={accounts} />
    </>
  )
}
