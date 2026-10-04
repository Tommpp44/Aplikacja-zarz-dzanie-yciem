import type { PostgrestError } from '@supabase/supabase-js'

/** Thrown by repositories; carries a safe, human-readable message for the UI. */
export class DataError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly cause_?: unknown,
  ) {
    super(message)
    this.name = 'DataError'
  }
}

export class NotFoundError extends DataError {
  constructor(entity: string) {
    super(`This ${entity} no longer exists.`, 'not_found')
  }
}

const FRIENDLY: Record<string, string> = {
  '23505': 'An item with the same name already exists.',
  '23503': 'This item is linked to something that no longer exists.',
  '23514': 'Some values are not valid.',
  '42501': 'You do not have permission to do that.',
  PGRST116: 'This item no longer exists.',
}

type Result = { data: unknown; error: PostgrestError | null }
type Success<R extends Result> = [Extract<R, { error: null }>] extends [never]
  ? R['data']
  : Extract<R, { error: null }>['data']

/** Unwraps a Supabase response, converting database errors into DataError. */
export function unwrap<R extends Result>(result: R, context: string): Success<R> {
  if (result.error) {
    const friendly = FRIENDLY[result.error.code] ?? `We couldn't ${context}. Please try again.`
    throw new DataError(friendly, result.error.code, result.error)
  }
  return result.data as Success<R>
}
