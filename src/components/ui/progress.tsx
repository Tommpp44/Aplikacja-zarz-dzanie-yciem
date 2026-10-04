import * as React from 'react'
import { clamp, cn } from '@/lib/utils'

type ProgressProps = React.ComponentProps<'div'> & {
  value: number
  tone?: 'primary' | 'success' | 'warning' | 'destructive'
  label?: string
}

const toneClass = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

function Progress({ value, tone = 'primary', label, className, ...props }: ProgressProps) {
  const v = clamp(Number.isFinite(value) ? value : 0, 0, 100)
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={label}
      className={cn('bg-muted h-1.5 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', toneClass[tone])}
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

export { Progress }
