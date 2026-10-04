'use client'

import { Crosshair, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useServerAction } from '@/hooks/use-server-action'
import type { ISODate } from '@/lib/dates'
import { setFocus } from '@/lib/settings/actions'
import { cn } from '@/lib/utils'

/** "Today's focus": one sentence that answers "what matters most today?". */
export function FocusEditor({
  focus,
  today,
  size = 'md',
}: {
  focus: string | null
  today: ISODate
  size?: 'md' | 'lg'
}) {
  const [editing, setEditing] = useState(!focus)
  const [value, setValue] = useState(focus ?? '')
  const [pending, run] = useServerAction()
  if (!editing && focus) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex w-full items-start gap-3 text-left"
        aria-label="Edit today's focus"
      >
        <Crosshair className="text-primary mt-1 size-4 shrink-0" aria-hidden />
        <span
          className={cn(
            'flex-1 font-medium text-balance',
            size === 'lg' ? 'text-2xl tracking-tight' : 'text-base',
          )}
        >
          “{focus}”
        </span>
        <Pencil
          className="text-muted-foreground mt-1 size-3.5 opacity-0 group-hover:opacity-100"
          aria-hidden
        />
      </button>
    )
  }
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => setFocus({ text: value, date: today }), {
          onSuccess: () => setEditing(!value.trim()),
        })
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What is the one thing that matters most today?"
        aria-label="Today's focus"
        maxLength={200}
      />
      <Button type="submit" disabled={pending}>
        Set focus
      </Button>
    </form>
  )
}
