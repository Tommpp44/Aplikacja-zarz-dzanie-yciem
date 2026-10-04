'use client'

import { BarChart3 } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/** Placeholder for charts with nothing to plot, instead of a flat line at zero. */
export function ChartEmpty({ height, label }: { height: number; label: string }) {
  const t = useT()
  return (
    <div
      role="img"
      aria-label={t('{label}: no data yet', { label })}
      style={{ height }}
      className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm"
    >
      <BarChart3 className="size-5" aria-hidden />
      {t('No data for this period yet')}
    </div>
  )
}
