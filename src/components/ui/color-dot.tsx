import { cn } from '@/lib/utils'
import { colorClass } from '@/lib/colors'

function ColorDot({ color, className }: { color: string | null | undefined; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        colorClass(color, 'bg'),
        className,
      )}
    />
  )
}

export { ColorDot }
