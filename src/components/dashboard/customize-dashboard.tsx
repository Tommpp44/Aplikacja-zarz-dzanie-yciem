'use client'

import { ArrowDown, ArrowUp, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useServerAction } from '@/hooks/use-server-action'
import { updateDashboardLayout } from '@/lib/settings/actions'
import { DASHBOARD_WIDGETS, type DashboardWidget } from '@/lib/settings/schemas'

/** Reorder, hide and show dashboard widgets (stored in user preferences). */
export function CustomizeDashboard({ layout }: { layout: DashboardWidget[] }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(layout)
  const [pending, run] = useServerAction()
  const label = (id: string) => DASHBOARD_WIDGETS.find((w) => w.id === id)
  const move = (index: number, dir: -1 | 1) => {
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(index + dir, 0, item!)
    setItems(next)
  }
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <SlidersHorizontal /> Customize
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Customize dashboard</SheetTitle>
            <SheetDescription>
              Show what matters to you. P0 widgets answer “what now?”, P2 are for deeper insight.
            </SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col gap-1 overflow-y-auto px-5">
            {items.map((w, i) => (
              <li
                key={w.id}
                className="bg-card flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Move ${label(w.id)?.label} up`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Move ${label(w.id)?.label} down`}
                    disabled={i === items.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <span className="flex-1 text-sm font-medium">{label(w.id)?.label}</span>
                <span className="text-muted-foreground text-xs">{label(w.id)?.priority}</span>
                <Switch
                  checked={w.visible}
                  aria-label={`Show ${label(w.id)?.label}`}
                  onCheckedChange={(v) =>
                    setItems(items.map((x) => (x.id === w.id ? { ...x, visible: v } : x)))
                  }
                />
              </li>
            ))}
          </ul>
          <div className="mt-auto flex justify-end gap-2 border-t px-5 py-3">
            <Button variant="ghost" onClick={() => setItems(layout)}>
              Reset
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(() => updateDashboardLayout({ layout: items }), {
                  success: 'Dashboard updated',
                  onSuccess: () => setOpen(false),
                })
              }
            >
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
