/**
 * Named colours used for user-chosen entity colours (projects, habits, accounts,
 * categories). Classes are listed literally so Tailwind can detect them.
 */
export const ENTITY_COLORS = [
  'slate',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'emerald',
  'amber',
  'orange',
  'rose',
  'pink',
  'violet',
] as const

export type EntityColor = (typeof ENTITY_COLORS)[number]

const BG: Record<EntityColor, string> = {
  slate: 'bg-slate-400',
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  cyan: 'bg-cyan-500',
  teal: 'bg-teal-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  rose: 'bg-rose-500',
  pink: 'bg-pink-500',
  violet: 'bg-violet-500',
}

const TEXT: Record<EntityColor, string> = {
  slate: 'text-slate-600 dark:text-slate-400',
  indigo: 'text-indigo-700 dark:text-indigo-400',
  blue: 'text-blue-700 dark:text-blue-400',
  cyan: 'text-cyan-700 dark:text-cyan-400',
  teal: 'text-teal-700 dark:text-teal-400',
  emerald: 'text-emerald-700 dark:text-emerald-400',
  amber: 'text-amber-700 dark:text-amber-400',
  orange: 'text-orange-700 dark:text-orange-400',
  rose: 'text-rose-700 dark:text-rose-400',
  pink: 'text-pink-700 dark:text-pink-400',
  violet: 'text-violet-700 dark:text-violet-400',
}

const SOFT: Record<EntityColor, string> = {
  slate: 'bg-slate-100 dark:bg-slate-500/15',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/15',
  blue: 'bg-blue-50 dark:bg-blue-500/15',
  cyan: 'bg-cyan-50 dark:bg-cyan-500/15',
  teal: 'bg-teal-50 dark:bg-teal-500/15',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/15',
  amber: 'bg-amber-50 dark:bg-amber-500/15',
  orange: 'bg-orange-50 dark:bg-orange-500/15',
  rose: 'bg-rose-50 dark:bg-rose-500/15',
  pink: 'bg-pink-50 dark:bg-pink-500/15',
  violet: 'bg-violet-50 dark:bg-violet-500/15',
}

/** Hex values for charts (SVG fills). */
export const COLOR_HEX: Record<EntityColor, string> = {
  slate: '#94a3b8',
  indigo: '#6366f1',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  emerald: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  rose: '#f43f5e',
  pink: '#ec4899',
  violet: '#8b5cf6',
}

export function asEntityColor(color: string | null | undefined): EntityColor {
  return (ENTITY_COLORS as readonly string[]).includes(color ?? '')
    ? (color as EntityColor)
    : 'slate'
}

export function colorClass(color: string | null | undefined, kind: 'bg' | 'text' | 'soft') {
  const c = asEntityColor(color)
  return kind === 'bg' ? BG[c] : kind === 'text' ? TEXT[c] : SOFT[c]
}
