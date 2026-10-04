'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RoutineFormDialog } from './routine-form-dialog'

export function NewRoutineButton({
  habits,
  weekStartsOn,
}: {
  habits: { id: string; name: string }[]
  weekStartsOn: 0 | 1
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New routine
      </Button>
      <RoutineFormDialog
        open={open}
        onOpenChange={setOpen}
        habits={habits}
        weekStartsOn={weekStartsOn}
      />
    </>
  )
}
