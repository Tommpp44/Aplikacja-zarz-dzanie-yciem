'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

/** Charts are lazy-loaded so Recharts never blocks the first render. */
const loading = () => <Skeleton className="h-[220px] w-full rounded-lg" />

export const TrendChart = dynamic(() => import('./line-chart').then((m) => m.TrendChart), {
  ssr: false,
  loading,
})
export const BarsChart = dynamic(() => import('./bar-chart').then((m) => m.BarsChart), {
  ssr: false,
  loading,
})
export const DonutChart = dynamic(() => import('./donut-chart').then((m) => m.DonutChart), {
  ssr: false,
  loading,
})
