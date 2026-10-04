'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { safeTimeZone, todayISO } from '@/lib/dates'
import { unwrap } from '@/lib/db/errors'
import { toJson } from '@/lib/db/types'
import { isLocale } from '@/lib/i18n/config'
import { INTERESTS } from '@/lib/settings/schemas'
import { buildStarterPlan, STARTER_PACKS } from './starter'

/** Creates the selected starter content so a new account never starts empty. */
export const applyStarterPacks = authedAction(
  z.object({
    packs: z.array(z.enum(STARTER_PACKS)).max(STARTER_PACKS.length),
    interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length),
  }),
  { name: 'applyStarterPacks' },
  async ({ packs, interests }, { supabase, user }) => {
    if (packs.length === 0) return { created: 0 }
    const prefs = unwrap(
      await supabase
        .from('user_preferences')
        .select('timezone, currency, language, week_start')
        .eq('user_id', user.id)
        .single(),
      'load your preferences',
    )
    const today = todayISO(safeTimeZone(prefs.timezone))
    const plan = buildStarterPlan({
      packs,
      interests,
      today,
      currency: prefs.currency,
      locale: isLocale(prefs.language) ? prefs.language : 'en',
      weekStartsOn: prefs.week_start === 0 ? 0 : 1,
    })
    let created = 0

    let goalId: string | null = null
    if (plan.goal) {
      const goal = unwrap(
        await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            title: plan.goal.title,
            category: plan.goal.category,
            target_type: 'numeric',
            progress_source: 'manual',
            target_value: plan.goal.target_value,
            unit: plan.goal.unit,
            start_date: today,
            deadline: plan.goal.deadline,
          })
          .select('id')
          .single(),
        'create your first goal',
      )
      goalId = goal.id
      created++
    }

    const habitIds = new Map<string, string>()
    for (const [position, h] of plan.habits.entries()) {
      const habit = unwrap(
        await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            name: h.name,
            habit_type: h.habit_type,
            target: h.target,
            color: h.color,
            start_date: today,
            position,
            goal_id: h.linkToGoal ? goalId : null,
          })
          .select('id')
          .single(),
        'create starter habits',
      )
      habitIds.set(h.key, habit.id)
      created++
    }

    if (plan.routine) {
      const routine = unwrap(
        await supabase
          .from('routines')
          .insert({
            user_id: user.id,
            name: plan.routine.name,
            routine_type: 'morning',
            start_time: plan.routine.start_time,
          })
          .select('id')
          .single(),
        'create a morning routine',
      )
      unwrap(
        await supabase.from('routine_items').insert(
          plan.routine.items.map((item, position) => ({
            user_id: user.id,
            routine_id: routine.id,
            title: item.title,
            duration_minutes: item.duration_minutes,
            position,
            habit_id: item.habit ? (habitIds.get(item.habit) ?? null) : null,
          })),
        ),
        'create routine steps',
      )
      created++
    }

    if (plan.tasks.length) {
      unwrap(
        await supabase.from('tasks').insert(
          plan.tasks.map((task) => ({
            user_id: user.id,
            title: task.title,
            priority: task.priority,
            due_date: task.due_date,
            status: 'todo',
            repeat_rule: task.repeat_rule ? toJson(task.repeat_rule) : null,
          })),
        ),
        'create starter tasks',
      )
      created += plan.tasks.length
    }
    return { created }
  },
)
