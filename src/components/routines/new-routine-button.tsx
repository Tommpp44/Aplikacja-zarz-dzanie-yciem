'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RoutineFormDialog } from './routine-form-dialog'
import { useT } from '@/lib/i18n/client'

export function NewRoutineButton({
  habits,
  weekStartsOn,
}: {
  habits: { id: string; name: string }[]
  weekStartsOn: 0 | 1
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> {t('New routine')}
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
