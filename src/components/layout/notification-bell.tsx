'use client'

import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getNotifications, markNotificationsRead } from '@/lib/notifications/actions'
import { cn } from '@/lib/utils'

type Item = {
  id: string
  kind: string
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

const SYNC_INTERVAL = 10 * 60 * 1000

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = (sync: boolean) =>
      getNotifications({ sync }).then((r) => {
        if (cancelled || !r.ok) return
        setItems(r.data.items)
        setUnread(r.data.unread)
        if (sync) {
          try {
            sessionStorage.setItem('lifeos-notif-sync', String(Date.now()))
          } catch {
            // storage unavailable
          }
        }
      })
    // Generate due notifications at most every 10 minutes per browser.
    let last = 0
    try {
      last = Number(sessionStorage.getItem('lifeos-notif-sync') ?? 0)
    } catch {
      // storage unavailable
    }
    void load(Date.now() - last > SYNC_INTERVAL)
    const t = setInterval(() => void load(true), SYNC_INTERVAL)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const markAll = async () => {
    setUnread(0)
    setItems((list) => list.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })))
    await markNotificationsRead({})
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
        className="text-muted-foreground hover:bg-accent hover:text-foreground relative flex size-9 items-center justify-center rounded-md"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="bg-destructive tabular absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href ?? '/dashboard'}
                  onClick={() => {
                    setOpen(false)
                    if (!n.read_at) {
                      setUnread((u) => Math.max(0, u - 1))
                      setItems((list) =>
                        list.map((i) =>
                          i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i,
                        ),
                      )
                      void markNotificationsRead({ ids: [n.id] })
                    }
                  }}
                  className={cn(
                    'hover:bg-accent/60 flex gap-2 border-b px-4 py-3 text-sm last:border-0',
                    !n.read_at && 'bg-primary-soft/40',
                  )}
                >
                  {!n.read_at && (
                    <span
                      className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
                      aria-label="Unread"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block font-medium">{n.title}</span>
                    {n.body && (
                      <span className="text-muted-foreground block text-xs">{n.body}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t px-4 py-2 text-right">
          <Link
            href="/settings/notifications"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Notification settings
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
