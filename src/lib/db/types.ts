import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from './database.types'

export type { Database, Json } from './database.types'

export type DB = SupabaseClient<Database>

type PublicSchema = Database['public']
export type TableName = keyof PublicSchema['Tables']
export type Row<T extends TableName> = PublicSchema['Tables'][T]['Row']
export type InsertRow<T extends TableName> = PublicSchema['Tables'][T]['Insert']
export type UpdateRow<T extends TableName> = PublicSchema['Tables'][T]['Update']
export type ViewRow<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row']

/** Narrows a JSON-serialisable value for jsonb columns. */
export function toJson(value: unknown): NonNullable<Json> {
  return value as NonNullable<Json>
}
