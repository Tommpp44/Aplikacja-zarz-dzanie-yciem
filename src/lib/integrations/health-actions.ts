'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { WORKOUT_TYPES } from '@/lib/workouts/schemas'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const source = z.enum(['apple_health', 'import'])

export const importActivityDays = authedAction(
  z.object({
    source,
    days: z
      .array(
        z.object({
          date: isoDate,
          steps: z.number().int().min(0).max(200000).nullable(),
          distance_m: z.number().min(0).max(1_000_000).nullable(),
          active_minutes: z.number().int().min(0).max(1440).nullable(),
          calories: z.number().int().min(0).max(20000).nullable(),
        }),
      )
      .max(2000),
  }),
  { name: 'importActivityDays', revalidate: [] },
  async ({ source, days }, { supabase, user }) => {
    if (!days.length) return { imported: 0 }
    unwrap(
      await supabase.from('activity_records').upsert(
        days.map((d) => ({
          user_id: user.id,
          record_date: d.date,
          steps: d.steps,
          distance_m: d.distance_m,
          active_minutes: d.active_minutes,
          calories: d.calories,
          source,
        })),
        { onConflict: 'user_id,record_date,source' },
      ),
      'import activity',
    )
    return { imported: days.length }
  },
)

export const importWorkouts = authedAction(
  z.object({
    source,
    workouts: z
      .array(
        z.object({
          external_id: z.string().min(3).max(200),
          workout_type: z.enum(WORKOUT_TYPES),
          name: z.string().trim().min(1).max(120),
          performed_on: isoDate,
          started_at: z.iso.datetime().nullable(),
          duration_minutes: z.number().int().min(0).max(1440).nullable(),
          distance_m: z.number().min(0).max(1_000_000).nullable(),
          calories: z.number().int().min(0).max(20000).nullable(),
          elevation_m: z.number().min(-1000).max(100000).nullable().optional(),
        }),
      )
      .max(1000),
  }),
  { name: 'importWorkouts' },
  async ({ source, workouts }, { supabase, user }) => {
    if (!workouts.length) return { imported: 0 }
    const { data } = await supabase
      .from('workouts')
      .upsert(
        workouts.map((w) => ({
          user_id: user.id,
          name: w.name,
          workout_type: w.workout_type,
          status: 'completed',
          performed_on: w.performed_on,
          started_at: w.started_at,
          duration_minutes: w.duration_minutes,
          distance_m: w.distance_m,
          calories: w.calories,
          elevation_m: w.elevation_m ?? null,
          source,
          external_id: w.external_id,
        })),
        { onConflict: 'user_id,source,external_id', ignoreDuplicates: true },
      )
      .select('id')
    return { imported: data?.length ?? 0 }
  },
)
