import 'server-only'
import type { ISODate } from '@/lib/dates'
import type { DB } from '@/lib/db/types'
import { getAccountBalancesMajor } from '@/lib/finance/balances'
import {
  computeGoalPace,
  computeGoalProgress,
  type GoalPace,
  type GoalProgress,
} from './calculations'
import * as repo from './repository'

export type GoalWithProgress = Awaited<ReturnType<typeof repo.listGoals>>[number] & {
  progress: GoalProgress
  pace: GoalPace
  linkedTaskCount: number
}

/** Goals with progress computed from their real data source (account, tasks, milestones…). */
export async function listGoalsWithProgress(
  db: DB,
  userId: string,
  today: ISODate,
  statuses?: string[],
) {
  const goals = await repo.listGoals(db, userId, statuses)
  const [tasks, balances] = await Promise.all([
    repo.listGoalTasks(
      db,
      userId,
      goals.map((g) => g.id),
    ),
    goals.some((g) => g.progress_source === 'account')
      ? getAccountBalancesMajor(db, userId)
      : Promise.resolve(new Map<string, number>()),
  ])
  return goals.map((goal): GoalWithProgress => {
    const goalTasks = tasks.filter((t) => t.goal_id === goal.id)
    const progress = computeGoalProgress(goal, {
      accountBalance: goal.linked_account_id ? (balances.get(goal.linked_account_id) ?? 0) : null,
      milestones: goal.milestones,
      tasks: goalTasks,
    })
    return {
      ...goal,
      progress,
      pace: computeGoalPace(goal, progress, today),
      linkedTaskCount: goalTasks.length,
    }
  })
}
