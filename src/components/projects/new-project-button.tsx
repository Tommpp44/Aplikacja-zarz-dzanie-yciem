'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProjectFormDialog } from './project-form-dialog'
import { useT } from '@/lib/i18n/client'

export function NewProjectButton({
  goals,
  defaultOpen = false,
}: {
  goals: { id: string; title: string }[]
  defaultOpen?: boolean
}) {
  const t = useT()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> {t('New project')}
      </Button>
      <ProjectFormDialog open={open} onOpenChange={setOpen} goals={goals} />
    </>
  )
}
