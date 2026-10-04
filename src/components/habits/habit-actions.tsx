'use client'

import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { deleteHabit, setHabitActive } from '@/lib/habits/actions'
import type { HabitInput } from '@/lib/habits/schemas'
import { HabitFormDialog } from './habit-form-dialog'
import { useT } from '@/lib/i18n/client'

export function HabitActions({
  habit,
  active,
  goals,
  weekStartsOn,
}: {
  habit: HabitInput & { id: string }
  active: boolean
  goals: { id: string; title: string }[]
  weekStartsOn: 0 | 1
}) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [, run] = useServerAction()
  const router = useRouter()
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil /> {t('Edit')}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('More habit actions')}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() =>
              run(() => setHabitActive({ id: habit.id, active: !active }), {
                success: active ? t('Habit archived') : t('Habit restored'),
              })
            }
          >
            {active ? <Archive /> : <ArchiveRestore />} {active ? t('Archive') : t('Restore')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <HabitFormDialog
        open={editing}
        onOpenChange={setEditing}
        habit={habit}
        goals={goals}
        weekStartsOn={weekStartsOn}
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('Delete this habit?')}
        description={t(
          'All of its history will be permanently deleted. Archive it instead to keep your statistics.',
        )}
        onConfirm={() =>
          run(() => deleteHabit({ id: habit.id }), {
            success: t('Habit deleted'),
            onSuccess: () => router.push('/habits'),
          })
        }
      />
    </div>
  )
}
