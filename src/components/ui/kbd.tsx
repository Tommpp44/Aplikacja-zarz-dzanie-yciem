import { cn } from '@/lib/utils'

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'bg-muted text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded border px-1 font-sans text-[11px] font-medium select-none',
        className,
      )}
      {...props}
    />
  )
}

export { Kbd }
