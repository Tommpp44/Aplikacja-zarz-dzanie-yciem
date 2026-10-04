import type { LucideIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

/** Friendly empty state: what is missing, why it matters, and the next action. */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed text-center',
        compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-12',
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            'bg-muted text-muted-foreground flex items-center justify-center rounded-full',
            compact ? 'size-9' : 'size-11',
          )}
        >
          <Icon className={compact ? 'size-4' : 'size-5'} aria-hidden />
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-muted-foreground text-[13px]">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
