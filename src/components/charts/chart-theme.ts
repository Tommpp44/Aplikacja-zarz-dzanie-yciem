/** Shared chart styling: reads CSS variables so charts follow light/dark mode. */
export const CHART = {
  primary: 'var(--chart-1)',
  positive: 'var(--chart-2)',
  warning: 'var(--chart-3)',
  negative: 'var(--chart-4)',
  neutral: 'var(--chart-5)',
  grid: 'var(--chart-grid)',
  axis: 'var(--muted-foreground)',
}

export const axisProps = {
  stroke: CHART.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const

export const tooltipStyle = {
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--popover-foreground)',
    boxShadow: '0 4px 16px rgb(0 0 0 / 0.08)',
  },
  labelStyle: { color: 'var(--muted-foreground)', marginBottom: 4 },
  itemStyle: { color: 'var(--popover-foreground)' },
  cursor: { fill: 'var(--accent)', opacity: 0.5 },
} as const

/** Serializable value format so server components can render charts. */
export type ChartFormat = 'number' | 'percent' | 'minutes' | `money:${string}` | `unit:${string}`

export function makeFormatter(format: ChartFormat = 'number') {
  const nf = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 })
  if (format === 'percent') return (v: number) => `${Math.round(v)}%`
  if (format === 'minutes')
    return (v: number) => (v >= 60 ? `${nf.format(v / 60)} h` : `${Math.round(v)} min`)
  if (format.startsWith('money:')) {
    const currency = format.slice(6)
    const money = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    })
    return (v: number) => money.format(v)
  }
  if (format.startsWith('unit:')) {
    const unit = format.slice(5)
    return (v: number) => `${nf.format(v)} ${unit}`
  }
  return (v: number) => nf.format(v)
}
