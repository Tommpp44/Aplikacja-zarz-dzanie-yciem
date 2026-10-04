import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-card placeholder:text-muted-foreground flex min-h-20 w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
