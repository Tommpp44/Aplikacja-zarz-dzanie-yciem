'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SETTINGS_SECTIONS } from '@/lib/settings/sections'
import { cn } from '@/lib/utils'

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex gap-1 md:flex-col">
        {SETTINGS_SECTIONS.map((s) => {
          const href = `/settings/${s.id}`
          const active = pathname === href
          return (
            <li key={s.id}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground hover:bg-accent hover:text-foreground block rounded-md px-3 py-1.5 text-sm whitespace-nowrap',
                  active && 'bg-accent text-foreground font-medium',
                )}
              >
                {s.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
