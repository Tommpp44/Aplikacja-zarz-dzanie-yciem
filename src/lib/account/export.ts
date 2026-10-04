import 'server-only'
import type { DB, TableName } from '@/lib/db/types'

/** Every user-owned table included in a GDPR export. */
export const EXPORT_TABLES: TableName[] = [
  'profiles',
  'user_preferences',
  'life_areas',
  'tags',
  'accounts',
  'transaction_categories',
  'transactions',
  'budgets',
  'budget_categories',
  'recurring_transactions',
  'goals',
  'goal_milestones',
  'goal_progress_logs',
  'projects',
  'tasks',
  'task_tags',
  'task_dependencies',
  'task_attachments',
  'habits',
  'habit_logs',
  'routines',
  'routine_items',
  'routine_runs',
  'calendar_events',
  'exercises',
  'workout_templates',
  'workout_template_exercises',
  'training_plans',
  'training_plan_sessions',
  'workouts',
  'workout_exercises',
  'workout_sets',
  'activity_records',
  'notes',
  'note_links',
  'note_tags',
  'journal_entries',
  'shopping_lists',
  'shopping_items',
  'notifications',
  'daily_reviews',
  'weekly_reviews',
  'monthly_reviews',
  'integrations',
  'audit_log',
]

/** Collects all of a user's data (through RLS, so only their rows). */
export async function exportUserData(db: DB, userId: string) {
  const out: Record<string, unknown[]> = {}
  for (const table of EXPORT_TABLES) {
    const rows: unknown[] = []
    const column = table === 'profiles' ? 'id' : 'user_id'
    for (let page = 0; page < 200; page++) {
      // Dynamic table name: typed as one concrete table for the query builder.
      const { data, error } = await db
        .from(table as 'tasks')
        .select('*')
        .eq(column as 'user_id', userId)
        .range(page * 1000, page * 1000 + 999)
      if (error) throw error
      rows.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }
    out[table] = rows
  }
  return { format: 'lifeos-export', version: 1, exported_at: new Date().toISOString(), data: out }
}
