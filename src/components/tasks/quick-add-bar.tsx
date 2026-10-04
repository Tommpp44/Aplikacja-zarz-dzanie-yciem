'use client'

import { CalendarClock, Flag, FolderKanban, Plus, Repeat, Tag } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { Spinner } from '@/components/ui/spinner'
import { useServerAction } from '@/hooks/use-server-action'
import type { ISODate } from '@/lib/dates'
import { describeRepeatRule } from '@/lib/recurrence'
import { quickAddTask } from '@/lib/tasks/actions'
import { dueLabel } from '@/lib/tasks/format'
import { parseQuickAdd } from '@/lib/tasks/quick-add'
import { useT } from '@/lib/i18n/client'

/**
 * Quick Add: type naturally ("Buy groceries tomorrow at 18:00 p2 #Home @errands")
 * and see what will be created before pressing Enter.
 */
export function QuickAddBar({
  today,
  projectId,
  goalId,
  parentTaskId,
  defaults,
  placeholder,
  autoFocus,
  onCreated,
}: {
  today: ISODate
  projectId?: string
  goalId?: string
  parentTaskId?: string
  defaults?: { due_date?: string | null; is_someday?: boolean }
  placeholder?: string
  autoFocus?: boolean
  onCreated?: () => void
}) {
  const t = useT()
  const [text, setText] = useState('')
  const [pending, run] = useServerAction()
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => (text.trim() ? parseQuickAdd(text, today) : null), [text, today])

  const submit = () => {
    const value = text.trim()
    if (!value || pending) return
    run(
      () =>
        quickAddTask({
          text: value,
          project_id: projectId,
          goal_id: goalId,
          parent_task_id: parentTaskId,
          defaults,
        }),
      {
        onSuccess: () => {
          setText('')
          onCreated?.()
          inputRef.current?.focus()
        },
      },
    )
  }

  const chips = preview
    ? ([
        preview.due_date && {
          icon: CalendarClock,
          text: dueLabel(preview.due_date, preview.due_time, today),
        },
        preview.repeat_rule && {
          icon: Repeat,
          text: describeRepeatRule(preview.repeat_rule, t.locale),
        },
        preview.priority && { icon: Flag, text: `P${preview.priority}` },
        preview.project_name && { icon: FolderKanban, text: preview.project_name },
        ...preview.tags.map((it) => ({ icon: Tag, text: it })),
      ].filter(Boolean) as { icon: typeof Tag; text: string }[])
    : []

  return (
    <div className="bg-card focus-within:border-ring focus-within:ring-ring/20 rounded-xl border shadow-xs focus-within:ring-2">
      <form
        className="flex items-center gap-2 px-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {pending ? (
          <Spinner className="text-muted-foreground" />
        ) : (
          <Plus className="text-muted-foreground size-4" aria-hidden />
        )}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder ?? t('Add a task — e.g. "Buy groceries tomorrow at 18:00 p2"')}
          aria-label={t('Quick add task')}
          autoFocus={autoFocus}
          maxLength={500}
          className="placeholder:text-muted-foreground h-11 flex-1 bg-transparent text-sm outline-none"
        />
        <Kbd className="hidden sm:inline-flex">↵</Kbd>
      </form>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t px-3 py-2" aria-live="polite">
          {chips.map((chip, i) => {
            const Icon = chip.icon
            return (
              <span
                key={i}
                className="bg-primary-soft text-primary inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs"
              >
                <Icon className="size-3" aria-hidden />
                {chip.text}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
