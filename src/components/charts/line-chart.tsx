'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartEmpty } from './chart-empty'
import { CHART, axisProps, tooltipStyle, makeFormatter, type ChartFormat } from './chart-theme'

export type LinePoint = { label: string; value: number; [key: string]: string | number }

/** Minimal area/line chart used for trends (goal progress, net worth, habits). */
export function TrendChart({
  data,
  height = 220,
  color = CHART.primary,
  format = 'number',
  referenceKey,
  ariaLabel,
}: {
  data: LinePoint[]
  height?: number
  color?: string
  format?: ChartFormat
  referenceKey?: string
  ariaLabel: string
}) {
  const id = `grad-${ariaLabel.replace(/\W/g, '')}`
  const formatValue = makeFormatter(format)
  if (data.every((p) => !p.value)) return <ChartEmpty height={height} label={ariaLabel} />
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} width={64} tickFormatter={(v: number) => formatValue(v)} />
          <Tooltip {...tooltipStyle} formatter={(v) => formatValue(Number(v))} />
          {referenceKey && (
            <Area
              type="monotone"
              dataKey={referenceKey}
              stroke={CHART.axis}
              strokeDasharray="4 4"
              fill="none"
              dot={false}
              name="Plan"
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
            name="Value"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
