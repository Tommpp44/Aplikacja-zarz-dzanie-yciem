'use client'

import { CheckSquare, Dumbbell, Flame, NotebookPen, Wallet } from 'lucide-react'
import { useUIStore, type CaptureKind } from '@/hooks/use-ui-store'

const ACTIONS: { kind: CaptureKind; label: string; icon: typeof Wallet }[] = [
  { kind: 'task', label: 'Task', icon: CheckSquare },
  { kind: 'expense', label: 'Expense', icon: Wallet },
  { kind: 'workout', label: 'Workout', icon: Dumbbell },
  { kind: 'habit', label: 'Habit', icon: Flame },
  { kind: 'note', label: 'Note', icon: NotebookPen },
]

export function QuickActions() {
  const openCapture = useUIStore((s) => s.openCapture)
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick actions">
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
            {a.label}
          </button>
        )
      })}
    </div>
  )
}
