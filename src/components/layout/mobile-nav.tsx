'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Home, Menu, Plus, Sun } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useUIStore } from '@/hooks/use-ui-store'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'
import { ALL_NAV_ITEMS, isActivePath } from '@/lib/navigation'
import { cn } from '@/lib/utils'

/** Bottom navigation for phones: Home · Today · Add · Calendar · More. */
export function MobileNav() {
  const pathname = usePathname()
  const t = useT()
  const [moreOpen, setMoreOpen] = useState(false)
  const setCaptureMenuOpen = useUIStore((s) => s.setCaptureMenuOpen)

  const tab = (href: string, label: string, Icon: typeof Home) => {
    const active = isActivePath(pathname, href)
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'text-muted-foreground flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
          active && 'text-primary',
        )}
      >
        <Icon className="size-5" aria-hidden />
        {t(label)}
      </Link>
    )
  }

  return (
    <>
      <nav
        aria-label={t('Mobile navigation')}
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {tab('/dashboard', msg('Home'), Home)}
        {tab('/today', msg('Today'), Sun)}
        <button
          onClick={() => setCaptureMenuOpen(true)}
          className="text-muted-foreground flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium"
          aria-label={t('Add')}
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full shadow">
            <Plus className="size-5" aria-hidden />
          </span>
          {t('Add')}
        </button>
        {tab('/calendar', msg('Calendar'), CalendarDays)}
        <button
          onClick={() => setMoreOpen(true)}
          className="text-muted-foreground flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
        >
          <Menu className="size-5" aria-hidden />
          {t('More')}
        </button>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t('All sections')}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 overflow-y-auto px-4 pb-6">
            {ALL_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'bg-card flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium',
                    active && 'border-primary text-primary',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {t(item.label)}
                </Link>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
