import Link from 'next/link'
import * as React from 'react'
import { cn } from '@/lib/utils'

/** Link-based segmented control for URL-driven views (shareable, back-button friendly). */
function SegmentedLinks({
  items,
  active,
  className,
  label,
}: {
  items: { value: string; label: React.ReactNode; href: string; count?: number }[]
  active: string
  className?: string
  label: string
}) {
  return (
    <nav aria-label={label} className={cn('-mx-1 overflow-x-auto px-1', className)}>
      <div className="bg-muted inline-flex h-9 items-center gap-0.5 rounded-lg p-[3px]">
        {items.map((item) => {
          const isActive = item.value === active
          return (
            <Link
              key={item.value}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'text-muted-foreground hover:text-foreground inline-flex h-full items-center gap-1.5 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors',
                isActive && 'bg-card text-foreground shadow-xs',
              )}
            >
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span className="tabular text-muted-foreground text-xs">{item.count}</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export { SegmentedLinks }
