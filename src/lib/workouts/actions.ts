'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { DataError, NotFoundError, unwrap } from '@/lib/db/errors'
import { toJson } from '@/lib/db/types'
import { getUserContext } from '@/lib/settings/service'
import { displayToKg, displayToMeters, type Units } from '@/lib/units'
import {
  activitySchema,
  exerciseSchema,
  planSchema,
  setSchema,
  startWorkoutSchema,
  templateSchema,
  updateSetSchema,
  WORKOUT_TYPE_LABELS,
  workoutSchema,
} from './schemas'

async function units(): Promise<Units> {
  const { prefs } = await getUserContext()
  return prefs.units === 'imperial' ? 'imperial' : 'metric'
}

function workoutValues(input: z.output<typeof workoutSchema>, u: Units) {
  return {
    name: input.name,
    workout_type: input.workout_type,
    performed_on: input.performed_on,
    status: input.status,
    duration_minutes: input.duration_minutes ?? null,
    distance_m: input.distance ? Math.round(displayToMeters(input.distance, u) * 10) / 10 : null,
    calories: input.calories ?? null,
    elevation_m: input.elevation_m ?? null,
    avg_heart_rate: input.avg_heart_rate ?? null,
    notes: input.notes || null,
    goal_id: input.goal_id || null,
  }
}

export const createWorkout = authedAction(
  workoutSchema,
  { name: 'createWorkout', failureMessage: "We couldn't save this workout. Please try again." },
  async (input, { supabase, user }) => {
    const row = unwrap(
      await supabase
        .from('workouts')
        .insert({ ...workoutValues(input, await units()), user_id: user.id })
        .select('id')
        .single(),
      'save this workout',
    )
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('last_used')
      .eq('user_id', user.id)
      .single()
    await supabase
      .from('user_preferences')
      .update({
        last_used: toJson({
          ...((prefs?.last_used as object | null) ?? {}),
          workout_type: input.workout_type,
        }),
      })
      .eq('user_id', user.id)
    return { id: row.id }
  },
)

export const updateWorkout = authedAction(
  workoutSchema.extend({ id: z.uuid() }),
  { name: 'updateWorkout' },
  async ({ id, ...input }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('workouts')
        .update(workoutValues(input, await units()))
        .eq('user_id', user.id)
        .eq('id', id),
      'update this workout',
    )
    return { id }
  },
)

export const deleteWorkout = authedAction(
  idSchema,
  { name: 'deleteWorkout' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('workouts').delete().eq('user_id', user.id).eq('id', id),
      'delete this workout',
    )
  },
)

/** Starts a live session (optionally from a template or a planned session). Date defaults to today. */
export const startWorkout = authedAction(
  startWorkoutSchema,
  { name: 'startWorkout' },
  async (input, { supabase, user }) => {
    const { today } = await getUserContext()
    let name = input.name || WORKOUT_TYPE_LABELS[input.workout_type]
    let templateId = input.template_id || null
    let goalId: string | null = null
    if (input.plan_session_id) {
      const { data: session } = await supabase
        .from('training_plan_sessions')
        .select('title, template_id, plan:training_plans(goal_id)')
        .eq('user_id', user.id)
        .eq('id', input.plan_session_id)
        .maybeSingle()
      if (session) {
        name = session.title
        templateId = templateId ?? session.template_id
        goalId = session.plan?.goal_id ?? null
      }
    }
    const template = templateId
      ? unwrap(
          await supabase
            .from('workout_templates')
            .select(
              'name, workout_type, exercises:workout_template_exercises(exercise_id, position, target_sets, target_reps, target_weight_kg)',
            )
            .eq('user_id', user.id)
            .eq('id', templateId)
            .maybeSingle(),
          'load the template',
        )
      : null
    const workout = unwrap(
      await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: template && !input.name && !input.plan_session_id ? template.name : name,
          workout_type: (template?.workout_type as typeof input.workout_type) ?? input.workout_type,
          status: 'in_progress',
          performed_on: today,
          started_at: new Date().toISOString(),
          template_id: templateId,
          plan_session_id: input.plan_session_id || null,
          goal_id: goalId,
        })
        .select('id')
        .single(),
      'start the workout',
    )
    for (const te of [...(template?.exercises ?? [])].sort((a, b) => a.position - b.position)) {
      const we = unwrap(
        await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workout.id,
            user_id: user.id,
            exercise_id: te.exercise_id,
            position: te.position,
          })
          .select('id')
          .single(),
        'add exercises',
      )
      const sets = Array.from({ length: te.target_sets ?? 3 }, (_, i) => ({
        workout_exercise_id: we.id,
        user_id: user.id,
        set_number: i + 1,
        weight_kg: te.target_weight_kg,
        reps: te.target_reps,
        completed: false,
      }))
      if (sets.length) unwrap(await supabase.from('workout_sets').insert(sets), 'add sets')
    }
    return { id: workout.id }
  },
)

export const finishWorkout = authedAction(
  idSchema,
  { name: 'finishWorkout' },
  async ({ id }, { supabase, user }) => {
    const w = unwrap(
      await supabase
        .from('workouts')
        .select('started_at, duration_minutes')
        .eq('user_id', user.id)
        .eq('id', id)
        .maybeSingle(),
      'load the workout',
    )
    if (!w) throw new NotFoundError('workout')
    const ended = new Date()
    const duration =
      w.duration_minutes ??
      (w.started_at
        ? Math.max(
            1,
            Math.min(
              1440,
              Math.round((ended.getTime() - new Date(w.started_at).getTime()) / 60000),
            ),
          )
        : null)
    // Drop sets that were planned but never performed.
    const { data: exercises } = await supabase
      .from('workout_exercises')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', id)
    if (exercises?.length) {
      await supabase
        .from('workout_sets')
        .delete()
        .eq('user_id', user.id)
        .eq('completed', false)
        .in(
          'workout_exercise_id',
          exercises.map((e) => e.id),
        )
    }
    unwrap(
      await supabase
        .from('workouts')
        .update({ status: 'completed', ended_at: ended.toISOString(), duration_minutes: duration })
        .eq('user_id', user.id)
        .eq('id', id),
      'finish the workout',
    )
  },
)

export const addExerciseToWorkout = authedAction(
  z.object({ workout_id: z.uuid(), exercise_id: z.uuid() }),
  { name: 'addExerciseToWorkout' },
  async ({ workout_id, exercise_id }, { supabase, user }) => {
    const { count } = await supabase
      .from('workout_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('workout_id', workout_id)
    const we = unwrap(
      await supabase
        .from('workout_exercises')
        .insert({ workout_id, exercise_id, user_id: user.id, position: count ?? 0 })
        .select('id')
        .single(),
      'add the exercise',
    )
    unwrap(
      await supabase
        .from('workout_sets')
        .insert({ workout_exercise_id: we.id, user_id: user.id, set_number: 1, completed: false }),
      'add a set',
    )
  },
)

export const removeWorkoutExercise = authedAction(
  idSchema,
  { name: 'removeWorkoutExercise' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('workout_exercises').delete().eq('user_id', user.id).eq('id', id),
      'remove the exercise',
    )
  },
)

/** Adds a set, pre-filled from the previous set (fast logging). */
export const addSet = authedAction(
  z.object({ workout_exercise_id: z.uuid() }),
  { name: 'addSet' },
  async ({ workout_exercise_id }, { supabase, user }) => {
    const { data: last } = await supabase
      .from('workout_sets')
      .select('set_number, weight_kg, reps')
      .eq('user_id', user.id)
      .eq('workout_exercise_id', workout_exercise_id)
      .order('set_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    unwrap(
      await supabase.from('workout_sets').insert({
        workout_exercise_id,
        user_id: user.id,
        set_number: (last?.set_number ?? 0) + 1,
        weight_kg: last?.weight_kg ?? null,
        reps: last?.reps ?? null,
        completed: false,
      }),
      'add a set',
    )
  },
)

export const updateSet = authedAction(
  updateSetSchema,
  { name: 'updateSet', revalidate: [] },
  async ({ id, weight, ...rest }, { supabase, user }) => {
    const u = await units()
    unwrap(
      await supabase
        .from('workout_sets')
        .update({
          ...rest,
          ...(weight !== undefined
            ? { weight_kg: weight === null ? null : Math.round(displayToKg(weight, u) * 100) / 100 }
            : {}),
        })
        .eq('user_id', user.id)
        .eq('id', id),
      'save the set',
    )
  },
)

export const deleteSet = authedAction(
  idSchema,
  { name: 'deleteSet' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('workout_sets').delete().eq('user_id', user.id).eq('id', id),
      'delete the set',
    )
  },
)

export const logSet = authedAction(
  setSchema,
  { name: 'logSet' },
  async ({ weight, workout_exercise_id, ...rest }, { supabase, user }) => {
    const u = await units()
    const { count } = await supabase
      .from('workout_sets')
      .select('id', { count: 'exact', head: true })
      .eq('workout_exercise_id', workout_exercise_id)
    unwrap(
      await supabase.from('workout_sets').insert({
        ...rest,
        workout_exercise_id,
        user_id: user.id,
        set_number: (count ?? 0) + 1,
        weight_kg: weight ? displayToKg(weight, u) : null,
      }),
      'save the set',
    )
  },
)

export const createExercise = authedAction(
  exerciseSchema,
  { name: 'createExercise' },
  async (input, { supabase, user }) => {
    const row = unwrap(
      await supabase
        .from('exercises')
        .insert({
          ...input,
          muscle_group: input.muscle_group || null,
          equipment: input.equipment || null,
          user_id: user.id,
        })
        .select('id')
        .single(),
      'create this exercise',
    )
    return { id: row.id }
  },
)

export const deleteExercise = authedAction(
  idSchema,
  { name: 'deleteExercise' },
  async ({ id }, { supabase, user }) => {
    const { count } = await supabase
      .from('workout_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('exercise_id', id)
    if (count) throw new DataError('This exercise is used in your workouts and cannot be deleted.')
    unwrap(
      await supabase.from('exercises').delete().eq('user_id', user.id).eq('id', id),
      'delete this exercise',
    )
  },
)

export const createTemplate = authedAction(
  templateSchema,
  { name: 'createTemplate' },
  async ({ exercises, ...input }, { supabase, user }) => {
    const u = await units()
    const row = unwrap(
      await supabase
        .from('workout_templates')
        .insert({ ...input, description: input.description || null, user_id: user.id })
        .select('id')
        .single(),
      'create this template',
    )
    if (exercises.length) {
      unwrap(
        await supabase.from('workout_template_exercises').insert(
          exercises.map((e, position) => ({
            template_id: row.id,
            user_id: user.id,
            exercise_id: e.exercise_id,
            position,
            target_sets: e.target_sets ?? null,
            target_reps: e.target_reps ?? null,
            target_weight_kg: e.target_weight ? displayToKg(e.target_weight, u) : null,
          })),
        ),
        'save template exercises',
      )
    }
    return { id: row.id }
  },
)

/** Saves a finished session as a reusable template. */
export const saveWorkoutAsTemplate = authedAction(
  z.object({ id: z.uuid(), name: z.string().trim().min(1).max(120) }),
  { name: 'saveWorkoutAsTemplate' },
  async ({ id, name }, { supabase, user }) => {
    const w = unwrap(
      await supabase
        .from('workouts')
        .select(
          'workout_type, exercises:workout_exercises(exercise_id, position, sets:workout_sets(weight_kg, reps))',
        )
        .eq('user_id', user.id)
        .eq('id', id)
        .maybeSingle(),
      'load the workout',
    )
    if (!w) throw new NotFoundError('workout')
    const tpl = unwrap(
      await supabase
        .from('workout_templates')
        .insert({ name, workout_type: w.workout_type, user_id: user.id })
        .select('id')
        .single(),
      'save the template',
    )
    if (w.exercises.length) {
      unwrap(
        await supabase.from('workout_template_exercises').insert(
          w.exercises.map((e) => {
            const top = [...e.sets].sort(
              (a, b) => Number(b.weight_kg ?? 0) - Number(a.weight_kg ?? 0),
            )[0]
            return {
              template_id: tpl.id,
              user_id: user.id,
              exercise_id: e.exercise_id,
              position: e.position,
              target_sets: Math.max(1, e.sets.length),
              target_reps: top?.reps ?? null,
              target_weight_kg: top?.weight_kg ?? null,
            }
          }),
        ),
        'save the template',
      )
    }
    return { id: tpl.id }
  },
)

export const deleteTemplate = authedAction(
  idSchema,
  { name: 'deleteTemplate' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('workout_templates').delete().eq('user_id', user.id).eq('id', id),
      'delete this template',
    )
  },
)

export const createPlan = authedAction(
  planSchema,
  { name: 'createPlan' },
  async ({ sessions, ...input }, { supabase, user }) => {
    const plan = unwrap(
      await supabase
        .from('training_plans')
        .insert({
          ...input,
          description: input.description || null,
          goal_id: input.goal_id || null,
          user_id: user.id,
        })
        .select('id')
        .single(),
      'create this plan',
    )
    if (sessions.length) {
      unwrap(
        await supabase.from('training_plan_sessions').insert(
          sessions.map((s) => ({
            ...s,
            week: s.week ?? null,
            template_id: s.template_id || null,
            notes: s.notes || null,
            plan_id: plan.id,
            user_id: user.id,
          })),
        ),
        'save plan sessions',
      )
    }
    return { id: plan.id }
  },
)

export const setPlanActive = authedAction(
  z.object({ id: z.uuid(), active: z.boolean() }),
  { name: 'setPlanActive' },
  async ({ id, active }, { supabase, user }) => {
    unwrap(
      await supabase.from('training_plans').update({ active }).eq('user_id', user.id).eq('id', id),
      'update the plan',
    )
  },
)

export const deletePlan = authedAction(
  idSchema,
  { name: 'deletePlan' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('training_plans').delete().eq('user_id', user.id).eq('id', id),
      'delete the plan',
    )
  },
)

export const logActivity = authedAction(
  activitySchema,
  { name: 'logActivity' },
  async ({ distance, ...input }, { supabase, user }) => {
    const u = await units()
    unwrap(
      await supabase.from('activity_records').upsert(
        {
          ...input,
          distance_m: distance ? Math.round(displayToMeters(distance, u)) : null,
          user_id: user.id,
          source: 'manual',
        },
        { onConflict: 'user_id,record_date,source' },
      ),
      'save activity',
    )
  },
)
