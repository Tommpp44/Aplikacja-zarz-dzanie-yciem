'use client'

import { Keyboard, LogOut, Monitor, Moon, Settings, Sun, User } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/auth/actions'
import { useT } from '@/lib/i18n/client'
import { updateAppearance } from '@/lib/settings/actions'
import type { Accent } from '@/lib/settings/schemas'

export function UserMenu({
  name,
  email,
  accent,
}: {
  name: string
  email: string | null
  accent: Accent
}) {
  const { setTheme } = useTheme()
  const t = useT()
  const [, startTransition] = useTransition()
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const changeTheme = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme)
    startTransition(async () => {
      await updateAppearance({ theme, accent })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('Account menu')}
        className="bg-primary-soft text-primary focus-visible:ring-ring flex size-8 items-center justify-center rounded-full text-xs font-semibold outline-none focus-visible:ring-2"
      >
        {initials || <User className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-foreground truncate text-sm font-medium">{name}</span>
          {email && <span className="truncate font-normal">{email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> {t('Settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event('lifeos:shortcuts'))}>
          <Keyboard /> {t('Keyboard shortcuts')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('Theme')}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => changeTheme('light')}>
          <Sun /> {t('Light')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => changeTheme('dark')}>
          <Moon /> {t('Dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => changeTheme('system')}>
          <Monitor /> {t('System')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            navigator.serviceWorker?.controller?.postMessage('clear-user-cache')
            startTransition(() => signOut())
          }}
        >
          <LogOut /> {t('Sign out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
