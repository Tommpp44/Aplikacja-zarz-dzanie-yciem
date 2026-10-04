'use client'

import { CheckSquare, Dumbbell, Flame, NotebookPen, Wallet } from 'lucide-react'
import { useUIStore, type CaptureKind } from '@/hooks/use-ui-store'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'

const ACTIONS: { kind: CaptureKind; label: string; icon: typeof Wallet }[] = [
  { kind: 'task', label: msg('Task'), icon: CheckSquare },
  { kind: 'expense', label: msg('Expense'), icon: Wallet },
  { kind: 'workout', label: msg('Workout'), icon: Dumbbell },
  { kind: 'habit', label: msg('Habit'), icon: Flame },
  { kind: 'note', label: msg('Note'), icon: NotebookPen },
]

export function QuickActions() {
  const openCapture = useUIStore((s) => s.openCapture)
  const t = useT()
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('Quick actions')}>
      {ACTIONS.map((a) => {
        const Icon = a.icon
        return (
          <button
            key={a.kind}
            type="button"
            onClick={() => openCapture(a.kind)}
            className="bg-card hover:border-primary/40 hover:bg-accent inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium shadow-xs transition-colors"
          >
            <span className="text-primary">+</span>
            <Icon className="text-muted-foreground size-4" aria-hidden />
            {t(a.label)}
          </button>
        )
      })}
    </div>
  )
}
