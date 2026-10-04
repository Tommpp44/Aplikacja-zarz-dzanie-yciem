'use client'

import { LogOut, Monitor, Moon, Settings, Sun, User } from 'lucide-react'
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
        aria-label="Account menu"
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
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => changeTheme('light')}>
          <Sun /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => changeTheme('dark')}>
          <Moon /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => changeTheme('system')}>
          <Monitor /> System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            navigator.serviceWorker?.controller?.postMessage('clear-user-cache')
            startTransition(() => signOut())
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
