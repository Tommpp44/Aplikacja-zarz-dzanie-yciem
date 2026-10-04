'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProjectFormDialog } from './project-form-dialog'

export function NewProjectButton({
  goals,
  defaultOpen = false,
}: {
  goals: { id: string; title: string }[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New project
      </Button>
      <ProjectFormDialog open={open} onOpenChange={setOpen} goals={goals} />
    </>
  )
}
