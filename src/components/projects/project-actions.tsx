'use client'

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useServerAction } from '@/hooks/use-server-action'
import { deleteProject } from '@/lib/projects/actions'
import type { ProjectInput } from '@/lib/projects/schemas'
import { ProjectFormDialog } from './project-form-dialog'

export function ProjectActions({
  project,
  goals,
  taskCount,
}: {
  project: ProjectInput & { id: string }
  goals: { id: string; title: string }[]
  taskCount: number
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [, run] = useServerAction()
  const router = useRouter()
  return (
    <>
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil /> Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More project actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={project} goals={goals} />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this project?"
        description={`Its ${taskCount} task(s) are kept and moved out of the project. This cannot be undone.`}
        onConfirm={() =>
          run(() => deleteProject({ id: project.id }), {
            success: 'Project deleted',
            onSuccess: () => router.push('/projects'),
          })
        }
      />
    </>
  )
}
