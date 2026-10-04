import 'server-only'
import { unwrap } from '@/lib/db/errors'
import type { DB } from '@/lib/db/types'
import { escapeLike } from '@/lib/tasks/repository'
import type { NoteEntityType } from './schemas'

export const NOTE_SELECT =
  'id, title, content_text, pinned, updated_at, created_at, note_tags(tag:tags(id, name)), note_links(id, entity_type, entity_id)'

export async function listNotes(
  db: DB,
  userId: string,
  opts: { search?: string; tagId?: string; archived?: boolean; limit?: number } = {},
) {
  let q = db.from('notes').select(NOTE_SELECT).eq('user_id', userId)
  q = opts.archived ? q.not('archived_at', 'is', null) : q.is('archived_at', null)
  if (opts.search) {
    const s = `%${escapeLike(opts.search)}%`
    q = q.or(`title.ilike.${s},content_text.ilike.${s}`)
  }
  const rows = unwrap(
    await q
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(opts.limit ?? 100),
    'load notes',
  )
  return opts.tagId ? rows.filter((n) => n.note_tags.some((t) => t.tag?.id === opts.tagId)) : rows
}

export async function getNote(db: DB, userId: string, id: string) {
  return unwrap(
    await db
      .from('notes')
      .select('*, note_tags(tag:tags(id, name)), note_links(id, entity_type, entity_id)')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle(),
    'load the note',
  )
}

export async function listNotesForEntity(
  db: DB,
  userId: string,
  type: NoteEntityType,
  entityId: string,
) {
  const links = unwrap(
    await db
      .from('note_links')
      .select('note:notes(id, title, content_text, updated_at, archived_at)')
      .eq('user_id', userId)
      .eq('entity_type', type)
      .eq('entity_id', entityId),
    'load linked notes',
  )
  return links
    .map((l) => l.note)
    .filter((n): n is NonNullable<typeof n> => Boolean(n) && !n!.archived_at)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** Resolves display names for linked entities (one query per entity type). */
export async function resolveEntityNames(
  db: DB,
  userId: string,
  links: { entity_type: string; entity_id: string }[],
) {
  const names = new Map<string, string>()
  const byType = new Map<string, string[]>()
  for (const l of links)
    byType.set(l.entity_type, [...(byType.get(l.entity_type) ?? []), l.entity_id])
  const lookups: [string, string, string][] = [
    ['project', 'projects', 'name'],
    ['goal', 'goals', 'title'],
    ['workout', 'workouts', 'name'],
    ['task', 'tasks', 'title'],
    ['habit', 'habits', 'name'],
    ['event', 'calendar_events', 'title'],
    ['account', 'accounts', 'name'],
    ['transaction', 'transactions', 'merchant'],
    ['journal_entry', 'journal_entries', 'entry_date'],
  ]
  await Promise.all(
    lookups.map(async ([type, table, column]) => {
      const ids = byType.get(type)
      if (!ids?.length) return
      const { data } = await db
        .from(table as 'projects')
        .select(`id, ${column}`)
        .eq('user_id', userId)
        .in('id', ids)
      for (const row of (data ?? []) as unknown as Record<string, string>[]) {
        names.set(`${type}:${row.id}`, row[column] || ENTITY_FALLBACK[type] || type)
      }
    }),
  )
  return names
}

const ENTITY_FALLBACK: Record<string, string> = {
  transaction: 'Transaction',
  journal_entry: 'Journal entry',
}
