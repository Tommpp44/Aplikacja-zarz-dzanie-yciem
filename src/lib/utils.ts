import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Percentage (0–100) of part/total, safe for total = 0. */
export function percent(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0
  return clamp((part / total) * 100, 0, 100)
}

export function sum(values: readonly number[]) {
  return values.reduce((acc, v) => acc + v, 0)
}

export function groupBy<T, K extends string | number>(items: readonly T[], key: (item: T) => K) {
  const out = {} as Record<K, T[]>
  for (const item of items) {
    const k = key(item)
    ;(out[k] ??= []).push(item)
  }
  return out
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}
