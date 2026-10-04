'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/finances', label: 'Overview' },
  { href: '/finances/transactions', label: 'Transactions' },
  { href: '/finances/accounts', label: 'Accounts' },
  { href: '/finances/budgets', label: 'Budgets' },
  { href: '/finances/recurring', label: 'Recurring' },
  { href: '/finances/analytics', label: 'Analytics' },
  { href: '/finances/categories', label: 'Categories' },
]

export function FinanceNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Finance sections"
      className="-mx-4 mb-6 overflow-x-auto border-b px-4 lg:-mx-0 lg:px-0"
    >
      <ul className="flex gap-1">
        {LINKS.map((l) => {
          const active = l.href === '/finances' ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground hover:text-foreground -mb-px inline-flex h-10 items-center border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap transition-colors',
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
