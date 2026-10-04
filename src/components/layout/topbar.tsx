'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { NotificationBell } from '@/components/layout/notification-bell'
import { useUIStore } from '@/hooks/use-ui-store'
import { useT } from '@/lib/i18n/client'
import type { Accent } from '@/lib/settings/schemas'
import { Logo } from './logo'
import { UserMenu } from './user-menu'

export function Topbar({
  name,
  email,
  accent,
}: {
  name: string
  email: string | null
  accent: Accent
}) {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen)
  const t = useT()
  return (
    <header className="bg-background/90 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4 backdrop-blur lg:px-8">
      <Link href="/dashboard" className="lg:hidden" aria-label={t('LifeOS dashboard')}>
        <Logo />
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => setCommandOpen(true)}
          aria-label={t('Search')}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-md lg:hidden"
        >
          <Search className="size-4" />
        </button>
        <NotificationBell />
        <UserMenu name={name} email={email} accent={accent} />
      </div>
    </header>
  )
}
