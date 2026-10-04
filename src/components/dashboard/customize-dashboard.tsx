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
import { useT } from '@/lib/i18n/client'
import { rememberLastUsed, updateDashboardLayout } from '@/lib/settings/actions'
import { DASHBOARD_WIDGETS, type DashboardWidget, type FinanceRange } from '@/lib/settings/schemas'
import { NativeSelect } from '@/components/ui/native-select'

/** Reorder, hide and show dashboard widgets (stored in user preferences). */
export function CustomizeDashboard({
  layout,
  financeRange,
}: {
  layout: DashboardWidget[]
  financeRange: FinanceRange
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(layout)
  const [range, setRange] = useState<FinanceRange>(financeRange)
  const [pending, run] = useServerAction()
  const widget = (id: string) => DASHBOARD_WIDGETS.find((w) => w.id === id)
  const label = (id: string) => {
    const w = widget(id)
    return w ? { ...w, label: t(w.label) } : undefined
  }
  const move = (index: number, dir: -1 | 1) => {
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(index + dir, 0, item!)
    setItems(next)
  }
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <SlidersHorizontal /> {t('Customize')}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('Customize dashboard')}</SheetTitle>
            <SheetDescription>
              {t(
                'Show what matters to you. P0 widgets answer “what now?”, P2 are for deeper insight.',
              )}
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
                    aria-label={t('Move {name} up', { name: label(w.id)?.label ?? '' })}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('Move {name} down', { name: label(w.id)?.label ?? '' })}
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
                  aria-label={t('Show {name}', { name: label(w.id)?.label ?? '' })}
                  onCheckedChange={(v) =>
                    setItems(items.map((x) => (x.id === w.id ? { ...x, visible: v } : x)))
                  }
                />
              </li>
            ))}
          </ul>
          <label className="bg-card mx-5 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            {t('Finance widget period')}
            <NativeSelect
              aria-label={t('Finance widget period')}
              className="w-40"
              value={range}
              onChange={(e) => setRange(e.target.value as FinanceRange)}
            >
              <option value="month">{t('This month')}</option>
              <option value="quarter">{t('Last 3 months')}</option>
              <option value="year">{t('Year to date')}</option>
            </NativeSelect>
          </label>
          <div className="mt-auto flex justify-end gap-2 border-t px-5 py-3">
            <Button variant="ghost" onClick={() => setItems(layout)}>
              {t('Reset')}
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(
                  async () => {
                    const r = await rememberLastUsed({ finance_range: range })
                    return r.ok ? updateDashboardLayout({ layout: items }) : r
                  },
                  {
                    success: t('Dashboard updated'),
                    onSuccess: () => setOpen(false),
                  },
                )
              }
            >
              {t('Save')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
