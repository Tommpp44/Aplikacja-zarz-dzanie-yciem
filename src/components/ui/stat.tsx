import * as React from 'react'
import { cn } from '@/lib/utils'

/** KPI: prominent number with label and optional context line. */
function Stat({
  label,
  value,
  hint,
  tone,
  className,
  size = 'md',
}: {
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: 'positive' | 'negative' | 'warning'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5', className)}>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <span
        className={cn(
          'tabular truncate font-semibold tracking-tight',
          size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base',
          tone === 'positive' && 'text-success',
          tone === 'negative' && 'text-destructive',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value}
      </span>
      {hint && <span className="text-muted-foreground truncate text-xs">{hint}</span>}
    </div>
  )
}

export { Stat }
