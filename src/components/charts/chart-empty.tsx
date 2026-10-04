import { BarChart3 } from 'lucide-react'

/** Placeholder for charts with nothing to plot, instead of a flat line at zero. */
export function ChartEmpty({ height, label }: { height: number; label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label}: no data yet`}
      style={{ height }}
      className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm"
    >
      <BarChart3 className="size-5" aria-hidden />
      No data for this period yet
    </div>
  )
}
