'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { tooltipStyle, makeFormatter, type ChartFormat } from './chart-theme'

export function DonutChart({
  data,
  height = 200,
  format = 'number',
  ariaLabel,
}: {
  data: { label: string; value: number; color: string }[]
  height?: number
  format?: ChartFormat
  ariaLabel: string
}) {
  const formatValue = makeFormatter(format)
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={1.5}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v) => formatValue(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
