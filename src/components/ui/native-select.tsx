import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Native <select> styled to match inputs. Native selects are fully accessible,
 * keyboard friendly and use the platform picker on mobile.
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className={cn('relative', className)}>
      <select
        data-slot="select"
        className={cn(
          'border-input bg-card h-9 w-full appearance-none rounded-md border py-1 pr-8 pl-3 text-sm shadow-xs transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive focus-visible:ring-2',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
      />
    </div>
  )
}

export { NativeSelect }
