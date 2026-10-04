import type { GoalWithProgress } from '@/lib/goals/service'

export const LIFE_AREAS = [
  'finance',
  'career',
  'health',
  'fitness',
  'learning',
  'relationships',
  'travel',
  'lifestyle',
  'personal',
] as const

export type LifeAreaRow = {
  area: (typeof LIFE_AREAS)[number]
  goals: number
  avgProgress: number | null
  behind: number
  habitConsistency: number | null
}

/**
 * Life balance from real data only: progress of goals per area and the
 * consistency of habits linked to those goals. No invented "life score".
 */
export function lifeBalance(
  goals: GoalWithProgress[],
  habits: { goal_id: string | null; consistency: number }[],
): LifeAreaRow[] {
  return LIFE_AREAS.map((area) => {
    const inArea = goals.filter((g) => g.category === area && g.status === 'active')
    const ids = new Set(inArea.map((g) => g.id))
    const linkedHabits = habits.filter((h) => h.goal_id && ids.has(h.goal_id))
    return {
      area,
      goals: inArea.length,
      avgProgress: inArea.length
        ? inArea.reduce((s, g) => s + g.progress.percent, 0) / inArea.length
        : null,
      behind: inArea.filter((g) => g.pace.status === 'behind' || g.pace.status === 'overdue')
        .length,
      habitConsistency: linkedHabits.length
        ? linkedHabits.reduce((s, h) => s + h.consistency, 0) / linkedHabits.length
        : null,
    }
  }).filter((r) => r.goals > 0)
}
