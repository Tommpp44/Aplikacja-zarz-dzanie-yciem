'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartEmpty } from './chart-empty'
import { axisProps, CHART, tooltipStyle, makeFormatter, type ChartFormat } from './chart-theme'

export type BarSeries = { key: string; label: string; color?: string }

export function BarsChart({
  data,
  series,
  height = 240,
  format = 'number',
  ariaLabel,
  stacked = false,
}: {
  data: Record<string, string | number>[]
  series: BarSeries[]
  height?: number
  format?: ChartFormat
  ariaLabel: string
  stacked?: boolean
}) {
  const formatValue = makeFormatter(format)
  if (data.every((row) => series.every((sr) => !Number(row[sr.key]))))
    return <ChartEmpty height={height} label={ariaLabel} />
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} minTickGap={12} />
          <YAxis {...axisProps} width={64} tickFormatter={(v: number) => formatValue(v)} />
          <Tooltip {...tooltipStyle} formatter={(v) => formatValue(Number(v))} />
          {series.length > 1 && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          )}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={
                s.color ?? [CHART.primary, CHART.positive, CHART.warning, CHART.negative][i % 4]
              }
              radius={stacked ? 0 : [4, 4, 0, 0]}
              stackId={stacked ? 'a' : undefined}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
