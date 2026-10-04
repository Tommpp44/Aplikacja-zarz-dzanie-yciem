'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'
import { useUIStore } from '@/hooks/use-ui-store'
import { useT } from '@/lib/i18n/client'
import { MORE_ITEMS, NAV_GROUPS, isActivePath, type NavItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { Logo } from './logo'

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const t = useT()
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'text-sidebar-foreground hover:bg-accent hover:text-foreground flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors',
        active && 'bg-accent text-foreground',
      )}
    >
      <Icon
        className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground')}
        aria-hidden
      />
      {t(item.label)}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const t = useT()
  const setCommandOpen = useUIStore((s) => s.setCommandOpen)
  const setCaptureMenuOpen = useUIStore((s) => s.setCaptureMenuOpen)
  return (
    <aside className="border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r lg:flex">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" aria-label={t('LifeOS dashboard')}>
          <Logo />
        </Link>
      </div>
      <div className="flex gap-1.5 px-3 pb-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="bg-card text-muted-foreground hover:text-foreground flex h-8 flex-1 items-center gap-2 rounded-md border px-2 text-[13px] shadow-xs transition-colors"
        >
          <Search className="size-3.5" aria-hidden />
          {t('Search')}
          <Kbd className="ml-auto">⌘K</Kbd>
        </button>
        <button
          onClick={() => setCaptureMenuOpen(true)}
          aria-label={t('Quick capture')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-8 items-center justify-center rounded-md shadow-xs transition-colors"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      <nav aria-label={t('Main')} className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.label ?? i} className="mb-3">
            {group.label && (
              <p className="text-muted-foreground mb-1 px-2 text-[11px] font-medium tracking-wide uppercase">
                {t(group.label)}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
        <div className="mb-3">
          <p className="text-muted-foreground mb-1 px-2 text-[11px] font-medium tracking-wide uppercase">
            {t('More')}
          </p>
          <div className="flex flex-col gap-0.5">
            {MORE_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}
