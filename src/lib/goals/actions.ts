'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { getUserContext } from '@/lib/settings/service'
import * as repo from './repository'
import { goalSchema, milestoneSchema, progressUpdateSchema, GOAL_STATUSES } from './schemas'

function normalize(input: z.output<typeof goalSchema>) {
  return {
    ...input,
    description: input.description || null,
    notes: input.notes || null,
    unit: input.unit || null,
    target_value:
      input.target_type === 'boolean'
        ? 1
        : input.target_type === 'percentage'
          ? 100
          : (input.target_value ?? null),
    linked_account_id:
      input.progress_source === 'account' ? (input.linked_account_id ?? null) : null,
  }
}

export const createGoal = authedAction(
  goalSchema,
  { name: 'createGoal', failureMessage: "We couldn't create this goal. Please try again." },
  async (input, { supabase, user }) => {
    const { today } = await getUserContext()
    const goal = await repo.insertGoal(supabase, user.id, {
      ...normalize(input),
      start_date: input.start_date ?? today,
    })
    return { id: goal.id }
  },
)

export const updateGoal = authedAction(
  goalSchema.and(z.object({ id: z.uuid() })),
  { name: 'updateGoal' },
  async (input, { supabase, user }) => {
    const { id, ...rest } = input
    await repo.updateGoal(supabase, user.id, id, normalize(rest as z.output<typeof goalSchema>))
    return { id }
  },
)

export const setGoalStatus = authedAction(
  z.object({ id: z.uuid(), status: z.enum(GOAL_STATUSES) }),
  { name: 'setGoalStatus' },
  async ({ id, status }, { supabase, user }) => {
    await repo.updateGoal(supabase, user.id, id, { status })
  },
)

export const updateGoalProgress = authedAction(
  progressUpdateSchema,
  { name: 'updateGoalProgress' },
  async ({ id, value, note }, { supabase, user }) => {
    await repo.updateGoal(supabase, user.id, id, { current_value: value })
    if (note) {
      // Attach the note to the log row the trigger just created.
      const { data } = await supabase
        .from('goal_progress_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('goal_id', id)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data)
        await supabase
          .from('goal_progress_logs')
          .update({ note })
          .eq('id', data.id)
          .eq('user_id', user.id)
    }
  },
)

export const deleteGoal = authedAction(
  idSchema,
  { name: 'deleteGoal' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('goals').delete().eq('user_id', user.id).eq('id', id),
      'delete this goal',
    )
  },
)

export const addMilestone = authedAction(
  milestoneSchema,
  { name: 'addMilestone' },
  async (input, { supabase, user }) => {
    const { count } = await supabase
      .from('goal_milestones')
      .select('id', { count: 'exact', head: true })
      .eq('goal_id', input.goal_id)
    unwrap(
      await supabase
        .from('goal_milestones')
        .insert({ ...input, user_id: user.id, position: count ?? 0 }),
      'add the milestone',
    )
  },
)

export const toggleMilestone = authedAction(
  z.object({ id: z.uuid(), completed: z.boolean() }),
  { name: 'toggleMilestone' },
  async ({ id, completed }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('goal_milestones')
        .update({ completed_at: completed ? new Date().toISOString() : null })
        .eq('user_id', user.id)
        .eq('id', id),
      'update the milestone',
    )
  },
)

export const deleteMilestone = authedAction(
  idSchema,
  { name: 'deleteMilestone' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('goal_milestones').delete().eq('user_id', user.id).eq('id', id),
      'delete the milestone',
    )
  },
)
