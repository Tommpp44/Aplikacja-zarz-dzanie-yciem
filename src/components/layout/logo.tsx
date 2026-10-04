import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span
        aria-hidden
        className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      </span>
      {withText && <span>LifeOS</span>}
    </span>
  )
}
