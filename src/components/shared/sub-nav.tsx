'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/** Secondary navigation tabs within a module. Detail pages (e.g. /workouts/[id]) hide it. */
export function SubNav({
  links,
  label,
  hideOnDetail = true,
}: {
  links: { href: string; label: string; exact?: boolean }[]
  label: string
  hideOnDetail?: boolean
}) {
  const pathname = usePathname()
  const isKnown = links.some((l) => pathname === l.href)
  if (hideOnDetail && !isKnown) return null
  return (
    <nav aria-label={label} className="-mx-4 mb-6 overflow-x-auto border-b px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-1">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground hover:text-foreground -mb-px inline-flex h-10 items-center border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap',
                  active && 'border-primary text-foreground',
                )}
              >
                {l.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
